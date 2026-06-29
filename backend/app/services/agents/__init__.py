"""
app/services/agents/__init__.py
Agent package — exposes the public pipeline entry point.
"""
from app.services.agents.pipeline import run_lead_through_agents

__all__ = ["run_lead_through_agents"]
