import os
import httpx
import asyncio

async def test():
    key = os.getenv("GOOGLE_PLACES_API_KEY")
    if not key:
        print("❌ Error: GOOGLE_PLACES_API_KEY is empty or not found in .env!")
        return
    
    print(f"🔑 Key loaded successfully. Starts with: {key[:12]}...")
    url = f"https://maps.googleapis.com/maps/api/geocode/json?address=Amman,Jordan&key={key}"
    
    async with httpx.AsyncClient() as client:
        print("📡 Sending request to Google Geocoding API...")
        response = await client.get(url)
        print("-" * 40)
        print("🔍 Raw Response from Google:")
        print(response.json())
        print("-" * 40)

asyncio.run(test())