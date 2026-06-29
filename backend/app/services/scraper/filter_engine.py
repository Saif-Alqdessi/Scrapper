"""
app/services/scraper/filter_engine.py  — v3 (Zero-API-Cost architecture)
Golden Filter: 5 gates, all must pass.

v3 change: Added stellar_rating_bypass gate.
  Google's Arabic list-view omits the review count span for some businesses.
  playwright_scraper defaults those to review_count=0.  A clinic with a
  stellar rating (≥ 4.5) appearing on page-1 of Maps is treated as legitimate
  even when the count is absent from the DOM.
"""
import logging
from app.schemas.lead import FilterResult, RawLeadData

log = logging.getLogger(__name__)


class LeadFilterEngine:
    def __init__(
        self,
        min_rating: float = 4.0,
        min_reviews: int = 15,
        max_reviews: int = 500,
        require_phone: bool = True,
        stellar_rating_bypass: float = 4.5,
    ) -> None:
        self.min_rating            = min_rating
        self.min_reviews           = min_reviews
        self.max_reviews           = max_reviews
        self.require_phone         = require_phone
        self.stellar_rating_bypass = stellar_rating_bypass

    def is_qualified(self, lead: RawLeadData) -> FilterResult:
        name = lead.business_name

        # ── Gate 1: Rating ────────────────────────────────────────────────────
        if lead.google_rating is None:
            return FilterResult(qualified=False, reason="No rating data", lead_name=name)
        if lead.google_rating < self.min_rating:
            return FilterResult(
                qualified=False,
                reason=f"Rating {lead.google_rating:.1f} < {self.min_rating}",
                lead_name=name,
            )

        # ── Gate 2: Review count ──────────────────────────────────────────────
        # review_count == 0 means the count was absent from Google's list-view
        # DOM, NOT that the business literally has zero reviews.  Google's
        # Arabic UI omits this element for some listings.  We apply a bypass:
        # if the rating is stellar (≥ stellar_rating_bypass) we trust the Maps
        # ranking and let the lead through.  If the count IS present (> 0),
        # normal min/max bounds apply.
        if lead.review_count is None:
            # Defensive — playwright_scraper always defaults to 0, but other
            # scrapers in the 3-layer stack might not.
            return FilterResult(qualified=False, reason="No review count", lead_name=name)

        if lead.review_count == 0:
            if lead.google_rating >= self.stellar_rating_bypass:
                # Bypass: stellar rating compensates for hidden review count.
                bypass_reason = (
                    f"Passed: stellar rating ({lead.google_rating:.1f}★) "
                    f"compensates for hidden review count "
                    f"(Google list-view omission — not literally 0 reviews)"
                )
                log.info("Lead passed via stellar bypass", extra={"business": name, "rating": lead.google_rating})
                qualified_reason = bypass_reason
            else:
                return FilterResult(
                    qualified=False,
                    reason=(
                        f"Review count hidden by Google UI and rating "
                        f"{lead.google_rating:.1f}★ < {self.stellar_rating_bypass}★ "
                        f"stellar bypass threshold"
                    ),
                    lead_name=name,
                )
        else:
            # Normal path: review count is known and present.
            if lead.review_count < self.min_reviews:
                return FilterResult(
                    qualified=False,
                    reason=f"{lead.review_count} reviews < {self.min_reviews}",
                    lead_name=name,
                )
            if lead.review_count > self.max_reviews:
                return FilterResult(
                    qualified=False,
                    reason=f"{lead.review_count} reviews > {self.max_reviews} (likely a chain)",
                    lead_name=name,
                )
            qualified_reason = (
                f"Qualified: {lead.google_rating:.1f}★, "
                f"{lead.review_count} reviews, no website"
            )

        # ── Gate 3: No existing website ───────────────────────────────────────
        if lead.has_website:
            return FilterResult(qualified=False, reason="Already has website", lead_name=name)

        # ── Gate 4: Phone present (required for wa.me link) ───────────────────
        if self.require_phone and not lead.phone:
            return FilterResult(
                qualified=False,
                reason="No phone — cannot generate wa.me link",
                lead_name=name,
            )

        log.info("Lead qualified", extra={"business": name})
        return FilterResult(qualified=True, reason=qualified_reason, lead_name=name)

    def filter_many(self, leads: list[RawLeadData]) -> tuple[list[RawLeadData], list[FilterResult]]:
        qualified, results = [], []
        for lead in leads:
            r = self.is_qualified(lead)
            results.append(r)
            if r.qualified:
                qualified.append(lead)
            else:
                log.debug("Rejected", extra={"business": lead.business_name, "reason": r.reason})
        log.info("Batch filter", extra={"total": len(leads), "qualified": len(qualified)})
        return qualified, results
