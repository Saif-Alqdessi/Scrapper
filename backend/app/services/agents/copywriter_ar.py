"""
app/services/agents/copywriter_ar.py
Arabic Copywriter Agent — Groq (llama-3.1-8b-instant).

Model switched from llama-3.3-70b-versatile (100K TPD — exhausted on free tier)
to llama-3.1-8b-instant (no daily token limit, 6000 TPM, JSON-mode supported).
"""
import json
import logging

from groq import AsyncGroq

from app.config import settings
from app.services.agents.copywriter_en import FRONTEND_JSON_SCHEMA  # Reuse schema
from app.services.agents.groq_utils import groq_call_with_backoff

log    = logging.getLogger(__name__)
client = AsyncGroq(api_key=settings.GROQ_API_KEY)


async def copywriter_ar_agent(state: dict) -> dict:
    lead     = state["lead"]
    analysis = state["analysis"]

    prompt = f"""أنت كاتب إعلانات محترف متخصص في صفحات الهبوط للأعمال التجارية المحلية في العالم العربي.
اكتب نصوصاً احترافية ومقنعة باللغة العربية الفصحى المبسطة، ملائمة للسياق المحلي.

معلومات العمل التجاري:
- الاسم: {lead["business_name"]}
- النوع: {lead["niche"]}
- الموقع: {lead["location"]}
- التقييم: {lead["google_rating"]} نجوم من {lead["review_count"]} تقييم حقيقي

تحليل العمل التجاري:
{json.dumps(analysis, indent=2, ensure_ascii=False)}

القواعد:
1. كل النصوص يجب أن تكون عربية فصيحة مبسطة (ليست عامية)
2. العنوان الرئيسي: 5-7 كلمات، قوية ومباشرة
3. اذكر الموقع ({lead["location"]}) بشكل طبيعي في قسم "من نحن"
4. أسماء الخدمات: واضحة وعملية
5. أسماء الأيقونات: استخدم نفس أسماء Lucide icons بالإنجليزية (heart, star, shield, etc.)
6. أرجع JSON صحيحاً فقط بدون أي شرح أو markdown، يتطابق مع هذا الهيكل تماماً:

{FRONTEND_JSON_SCHEMA}"""

    response = await groq_call_with_backoff(
        client,
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.4,
        max_tokens=1200,
        response_format={"type": "json_object"},
    )

    raw     = response.choices[0].message.content.strip()
    copy_ar = json.loads(raw)

    log.debug("AR copywriter complete", extra={"lead": lead["business_name"]})
    # Return ONLY copy_ar — same reason as copywriter_en: parallel nodes must not
    # spread the full state or LangGraph raises InvalidUpdateError on shared keys.
    return {"copy_ar": copy_ar}
