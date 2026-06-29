"""
test_scraper.py
Quick smoke test for the Playwright primary scraper.

Run inside the Docker container:
    docker-compose exec api python test_scraper.py

Or locally (with venv active):
    python test_scraper.py
"""
import asyncio
import logging

logging.basicConfig(level=logging.DEBUG, format="%(levelname)s | %(name)s | %(message)s")

from app.services.scraper import LeadFilterEngine, PlaywrightMapsScraper


async def test(niche: str = "dental clinic", location: str = "Amman, Jordan") -> None:
    engine  = LeadFilterEngine()
    passed  = 0
    rejected = 0

    print(f"\n{'='*55}")
    print(f"  Scraping: {niche!r} in {location!r}")
    print(f"{'='*55}\n")

    scraper = PlaywrightMapsScraper(headless=True)
    async for lead in scraper.search_businesses(niche, location):
        result = engine.is_qualified(lead)
        status = "✅ QUALIFIED" if result.qualified else "❌ REJECTED"
        print(f"{status}  {lead.business_name}")
        print(f"         rating={lead.google_rating}  reviews={lead.review_count}  "
              f"has_website={lead.has_website}  phone={lead.phone or 'N/A'}")
        print(f"         reason: {result.reason}\n")

        if result.qualified:
            passed += 1
        else:
            rejected += 1

    print(f"{'='*55}")
    print(f"  Total qualified : {passed}")
    print(f"  Total rejected  : {rejected}")
    print(f"{'='*55}\n")


if __name__ == "__main__":
    asyncio.run(test())
