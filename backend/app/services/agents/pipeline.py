"""
app/services/agents/pipeline.py
LangGraph Multi-Agent Pipeline — Phase 5 (Roadmap §5.2).

Graph topology (from roadmap):
  analyst → [copy_en ‖ copy_ar] → validator → (retry? → copy_en) → wame_gen → assembler → END

Entry point: run_lead_through_agents(lead_id) — called by Celery run_ai_pipeline task.

Fixes applied (2026-05-22):
  1. Event-loop isolation: uses make_task_engine() instead of get_async_session() so
     the asyncpg connection pool is bound to the current asyncio.run() loop, not the
     FastAPI startup loop.  This eliminates 'Future attached to a different loop'.

  2. Groq 429 rate-limit: a module-level asyncio.Semaphore(GROQ_MAX_CONCURRENT) caps
     how many Groq calls execute simultaneously across all parallel copywriter nodes.
     groq_call_with_backoff() wraps every client.chat.completions.create() call with
     up to GROQ_MAX_RETRIES retries using full jitter exponential back-off, so a
     transient 429 pauses and retries rather than crashing the pipeline.

  3. LangGraph InvalidUpdateError (fixed in copywriter_en/ar): parallel nodes now
     return only their own key.  Documented here for cross-reference.
"""
import asyncio
import logging
import operator
from typing import Annotated, TypedDict

from langgraph.graph import END, StateGraph

from app.services.agents.analyst import analyst_agent
from app.services.agents.copywriter_ar import copywriter_ar_agent
from app.services.agents.copywriter_en import copywriter_en_agent
from app.services.agents.validator import validator_agent
from app.services.agents.groq_utils import groq_call_with_backoff  # noqa: F401
from app.services.whatsapp import wame_link_generator
from app.services.assembler import payload_assembler

log = logging.getLogger(__name__)


# ── Agent State ───────────────────────────────────────────────────────────────

class AgentState(TypedDict):
    # ── Input ──────────────────────────────────────────
    lead:              dict   # Full lead data dict loaded from DB

    # ── Intermediate ───────────────────────────────────
    analysis:          dict   # Analyst agent output
    copy_en:           dict   # English copywriter output
    copy_ar:           dict   # Arabic copywriter output
    validation_result: dict   # Validator QA output
    retry_count:       int    # Guards against infinite retry loops

    # ── Output ────────────────────────────────────────
    wame_link_en:      str
    wame_link_ar:      str
    final_payload_en:  dict
    final_payload_ar:  dict
    errors:            Annotated[list, operator.add]   # Accumulates across nodes


# ── Routing ───────────────────────────────────────────────────────────────────

def route_after_validation(state: AgentState) -> str:
    """
    Decides whether to retry copywriting or proceed to wa.me generation.
    Max 2 retries enforced by retry_count to prevent infinite loops.
    """
    v = state.get("validation_result", {})
    if v.get("passed") or state.get("retry_count", 0) >= 2:
        return "proceed"
    return "retry"


# ── Graph Builder ─────────────────────────────────────────────────────────────

def build_agent_graph() -> StateGraph:
    """
    Builds and compiles the LangGraph StateGraph.
    Called once at module level — reused across all Celery task invocations.
    """
    graph = StateGraph(AgentState)

    # Register nodes
    graph.add_node("analyst",      analyst_agent)
    graph.add_node("node_copy_en", copywriter_en_agent)
    graph.add_node("node_copy_ar", copywriter_ar_agent)
    graph.add_node("validator",    validator_agent)
    graph.add_node("wame_gen",     wame_link_generator)
    graph.add_node("assembler",    payload_assembler)

    # Entry point
    graph.set_entry_point("analyst")

    # analyst → both copywriters in parallel
    graph.add_edge("analyst",      "node_copy_en")
    graph.add_edge("analyst",      "node_copy_ar")

    # Both copywriters feed into validator (validator waits for both)
    graph.add_edge("node_copy_en", "validator")
    graph.add_edge("node_copy_ar", "validator")

    # Validator → conditional: retry copywriting or proceed
    graph.add_conditional_edges(
        "validator",
        route_after_validation,
        {
            "retry":   "node_copy_en",
            "proceed": "wame_gen",
        },
    )

    graph.add_edge("wame_gen",  "assembler")
    graph.add_edge("assembler", END)

    return graph.compile()


# Module-level compiled graph — built once, reused across tasks
_agent_graph = None


def get_agent_graph():
    global _agent_graph
    if _agent_graph is None:
        _agent_graph = build_agent_graph()
    return _agent_graph


# ── Public Entry Point (called by Celery) ─────────────────────────────────────

async def run_lead_through_agents(lead_id: str) -> dict:
    """
    Loads the lead from DB, runs the full LangGraph pipeline, returns final state.
    Called by the run_ai_pipeline Celery task (inside asyncio.run()).

    Uses make_task_engine() — a fresh SQLAlchemy engine bound to the current
    asyncio.run() event loop — to avoid 'Future attached to a different loop'.
    """
    from app.database import make_task_engine
    from app.models.lead import Lead, LeadStatus

    # ── Load lead from DB ─────────────────────────────────────────────────────
    async with make_task_engine() as SessionLocal:
        async with SessionLocal() as db:
            lead_obj = await db.get(Lead, lead_id)
            if not lead_obj:
                log.error("run_lead_through_agents: lead not found", extra={"lead_id": lead_id})
                return {}

            # Stamp as AI_PROCESSING
            lead_obj.status = LeadStatus.AI_PROCESSING
            await db.commit()

            # Serialize to dict for LangGraph state
            lead_dict = {
                "id":             str(lead_obj.id),
                "business_name":  lead_obj.business_name,
                "niche":          lead_obj.niche,
                "location":       lead_obj.location,
                "address":        lead_obj.address,
                "phone":          lead_obj.phone,
                "google_rating":  lead_obj.google_rating,
                "review_count":   lead_obj.review_count,
                "has_website":    lead_obj.has_website,
                "maps_url":       lead_obj.maps_url,
                "photo_reference": lead_obj.photo_reference,
                "top_reviews":    lead_obj.top_reviews or [],
                "slug":           lead_obj.slug,
            }
    # DB session and engine disposed here — before entering LangGraph

    # ── Run LangGraph pipeline ────────────────────────────────────────────────
    initial_state: AgentState = {
        "lead":              lead_dict,
        "analysis":          {},
        "copy_en":           {},
        "copy_ar":           {},
        "validation_result": {},
        "retry_count":       0,
        "wame_link_en":      "",
        "wame_link_ar":      "",
        "final_payload_en":  {},
        "final_payload_ar":  {},
        "errors":            [],
    }

    log.info(
        "LangGraph pipeline starting",
        extra={"lead_id": lead_id, "business": lead_dict["business_name"]},
    )

    graph       = get_agent_graph()
    final_state = await graph.ainvoke(initial_state)

    log.info(
        "LangGraph pipeline complete",
        extra={"lead_id": lead_id, "errors": final_state.get("errors", [])},
    )

    return final_state
