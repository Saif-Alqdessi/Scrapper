# Master Integration Roadmap
## From Two Separate Folders to a Live, End-to-End Product

> **Status**: Pipeline stable. Frontend complete. Backend generating leads and wa.me links.
> **Goal**: Integrate backend + website_template, host on a VPS, go live.
> **Architecture decision**: Dynamic SSR bridge (Next.js fetches from FastAPI at request time).

---

## Phase 0: Quick Win — Fix the Missing WA AR Button (Do This First)

This is a 20-minute fix before anything else. The backend already generates the Arabic
wa.me link via `build_message_ar()`. It just isn't being saved or surfaced yet.

### Step 1: Add `wame_link_ar` column to the leads table

```python
# alembic/versions/add_wame_link_ar.py
def upgrade():
    op.add_column('leads', sa.Column('wame_link_ar', sa.String(), nullable=True))

def downgrade():
    op.drop_column('leads', 'wame_link_ar')
```

Run: `alembic upgrade head`

### Step 2: Save both links in the wame_link_generator node

```python
# app/services/agents/pipeline.py  (in your wame_link_generator function)
async def wame_link_generator(state: AgentState) -> AgentState:
    lead        = state["lead"]
    preview_url = f"https://preview.yourdomain.com/{lead['slug']}"
    generator   = WaMeLinkGenerator()

    msg_en = generator.build_message_en(lead, preview_url)
    msg_ar = generator.build_message_ar(lead, preview_url)

    wame_en = generator.generate(lead["phone"], msg_en)
    wame_ar = generator.generate(lead["phone"], msg_ar)

    # Save both to DB immediately
    async with get_async_session() as db:
        lead_obj = await db.get(Lead, lead["id"])
        lead_obj.wame_link    = wame_en   # EN link (already working ✅)
        lead_obj.wame_link_ar = wame_ar   # AR link (new ✅)
        await db.commit()

    return {**state, "wame_link_en": wame_en, "wame_link_ar": wame_ar}
```

### Step 3: Expose both links in the Leads API response

```python
# app/schemas/lead.py
class LeadResponse(BaseModel):
    id:             UUID
    business_name:  str
    status:         LeadStatus
    preview_url:    str | None
    wame_link:      str | None    # EN (existing)
    wame_link_ar:   str | None    # AR (new)
    google_rating:  float
    review_count:   int
    # ... other fields
```

### Step 4: Add the WA AR button to your dashboard frontend

In your leads table component, next to the existing "WA EN" button:

```tsx
// In your leads table row component
<div className="flex gap-2">
  <a
    href={lead.wame_link}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => markLeadAsSent(lead.id)}
    className="btn-whatsapp"
  >
    WA EN
  </a>
  {lead.wame_link_ar && (
    <a
      href={lead.wame_link_ar}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => markLeadAsSent(lead.id)}
      className="btn-whatsapp-ar"
      dir="rtl"
    >
      WA AR واتساب
    </a>
  )}
</div>
```

---

## Phase 1: Project Consolidation — Monorepo Structure

Merge both project folders under a single root. This simplifies Docker Compose,
shared environment variables, and deployment scripts.

```
/leadforge                          ← Git root
  ├── backend/                      ← Your existing FastAPI project
  │   ├── app/
  │   │   ├── main.py
  │   │   ├── api/
  │   │   ├── services/
  │   │   ├── workers/
  │   │   └── models/
  │   ├── alembic/
  │   ├── requirements.txt
  │   └── Dockerfile
  │
  ├── frontend/                     ← Your existing website_template
  │   ├── app/
  │   │   ├── [slug]/               ← Dynamic preview route
  │   │   │   └── page.tsx          ← Fetches from FastAPI
  │   │   └── admin/                ← Admin dashboard routes
  │   │       ├── page.tsx          ← Campaign list
  │   │       ├── leads/page.tsx    ← Lead table
  │   │       └── campaigns/page.tsx
  │   ├── components/
  │   ├── public/
  │   ├── package.json
  │   └── Dockerfile
  │
  ├── nginx/
  │   ├── nginx.conf                ← Reverse proxy config
  │   └── conf.d/
  │       └── leadforge.conf
  │
  ├── docker-compose.yml            ← Orchestrates all 6 services
  ├── docker-compose.prod.yml       ← Production overrides
  ├── .env.example
  └── .gitignore
```

---

## Phase 2: Integration Bridge — How Frontend Consumes Backend Data

This is the most critical architectural decision. The pattern is:

```
Business Owner Browser
       │
       │ GET https://preview.yourdomain.com/al-noor-clinic-amman
       ▼
   Next.js (port 3000)
   app/[slug]/page.tsx
       │
       │ GET http://backend:8000/api/v1/preview/al-noor-clinic-amman?lang=en
       │ (internal Docker network — no internet hop, instant)
       ▼
   FastAPI
   Returns: full JSON payload from page_payloads table
       │
       ▼
   Next.js renders the page using your existing JSON-driven template
   Returns: fully server-rendered HTML to the browser
```

### The Preview Route (Next.js)

```tsx
// frontend/app/[slug]/page.tsx

import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string };
  searchParams: { lang?: string };
}

async function getPagePayload(slug: string, lang: string) {
  // Uses internal Docker hostname "backend" — not the public URL
  const apiUrl = process.env.BACKEND_INTERNAL_URL ?? 'http://backend:8000';
  
  const res = await fetch(
    `${apiUrl}/api/v1/preview/${slug}?lang=${lang}`,
    {
      // No caching — always fresh data
      // For performance, you can add: next: { revalidate: 60 }
      cache: 'no-store',
    }
  );
  
  if (!res.ok) return null;
  return res.json();
}

export default async function PreviewPage({ params, searchParams }: PageProps) {
  const lang = searchParams.lang ?? 'en';
  const payload = await getPagePayload(params.slug, lang);

  if (!payload) notFound();

  // Your existing template components consume the payload
  // The _meta.direction field controls LTR/RTL switching
  return (
    <html lang={lang} dir={payload._meta.direction}>
      <head>
        <title>{payload.meta.title}</title>
        <meta name="description" content={payload.meta.description} />
      </head>
      <body>
        {/* Your existing JSON-driven template renders here */}
        <LandingPageTemplate payload={payload} />
      </body>
    </html>
  );
}

// Generate SEO metadata dynamically
export async function generateMetadata({ params, searchParams }: PageProps) {
  const lang = searchParams.lang ?? 'en';
  const payload = await getPagePayload(params.slug, lang);
  if (!payload) return {};
  return {
    title: payload.meta.title,
    description: payload.meta.description,
  };
}
```

### Language Toggle (for business owner to switch EN ↔ AR)

Add a small language toggle button to the preview page. Clicking it simply
changes `?lang=en` to `?lang=ar` in the URL. Next.js re-fetches from the API
with the new language parameter and renders the RTL version. No separate page
needed — your existing LTR/RTL switching handles it automatically.

```tsx
// components/LanguageToggle.tsx
'use client';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

export function LanguageToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get('lang') ?? 'en';
  
  const toggle = () => {
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    router.push(`${pathname}?lang=${newLang}`);
  };

  return (
    <button onClick={toggle} className="lang-toggle">
      {currentLang === 'en' ? 'العربية' : 'English'}
    </button>
  );
}
```

---

## Phase 3: Docker Configuration

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim

WORKDIR /app

# Install Playwright dependencies (for the Chromium scraper)
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN playwright install chromium --with-deps

COPY . .

# Default command (overridden by docker-compose for the worker)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

Add to `next.config.ts`:

```typescript
const nextConfig = {
  output: 'standalone',   // Required for the multi-stage Docker build
  // Allow Next.js to fetch from the internal backend hostname
  async rewrites() {
    return [];
  },
};
export default nextConfig;
```

### Docker Compose (Full Production Configuration)

```yaml
# docker-compose.yml
version: '3.9'

services:

  # ── Reverse Proxy ──────────────────────────────────────────
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot_certs:/etc/letsencrypt:ro
      - certbot_www:/var/www/certbot:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

  # ── FastAPI Backend ────────────────────────────────────────
  backend:
    build: ./backend
    env_file: .env
    environment:
      - DATABASE_URL=postgresql+asyncpg://admin:${POSTGRES_PASSWORD}@postgres:5432/leadforge
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped
    # Not exposed publicly — Nginx proxies to it

  # ── Celery Worker ──────────────────────────────────────────
  worker:
    build: ./backend
    command: celery -A app.workers.celery_app worker --loglevel=info --concurrency=2
    env_file: .env
    environment:
      - DATABASE_URL=postgresql+asyncpg://admin:${POSTGRES_PASSWORD}@postgres:5432/leadforge
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - backend
      - redis
    restart: unless-stopped

  # ── Next.js Frontend ───────────────────────────────────────
  frontend:
    build: ./frontend
    environment:
      - BACKEND_INTERNAL_URL=http://backend:8000   # Internal Docker hostname
      - NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com  # Public (for client-side)
    depends_on:
      - backend
    restart: unless-stopped

  # ── Redis (Queue + Cache) ──────────────────────────────────
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  # ── PostgreSQL ─────────────────────────────────────────────
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB:       leadforge
      POSTGRES_USER:     admin
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin -d leadforge"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # ── Certbot (SSL — run once, then comment out) ─────────────
  certbot:
    image: certbot/certbot
    volumes:
      - certbot_certs:/etc/letsencrypt
      - certbot_www:/var/www/certbot
    command: >
      certonly --webroot --webroot-path=/var/www/certbot
      --email you@example.com --agree-tos --no-eff-email
      -d yourdomain.com -d api.yourdomain.com -d preview.yourdomain.com

volumes:
  pg_data:
  redis_data:
  certbot_certs:
  certbot_www:
```

---

## Phase 4: Nginx Configuration

```nginx
# nginx/conf.d/leadforge.conf

# Admin dashboard + preview pages
server {
    listen 443 ssl;
    server_name preview.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass         http://frontend:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Backend API (for any public-facing webhooks or direct API access)
server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass       http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# Redirect HTTP → HTTPS
server {
    listen 80;
    server_name _;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}
```

**Subdomain strategy:**

| Subdomain                        | Points To     | Purpose                              |
|----------------------------------|---------------|--------------------------------------|
| `preview.yourdomain.com`         | Next.js :3000 | Business owner sees their preview    |
| `preview.yourdomain.com/admin`   | Next.js :3000 | Your private admin dashboard         |
| `api.yourdomain.com`             | FastAPI :8000 | Internal + webhook API               |

---

## Phase 5: VPS Setup — Step by Step

### Recommended VPS Providers (sorted by value)

| Provider      | Spec              | Cost      | Best For              |
|---------------|-------------------|-----------|---------------------- |
| **Hetzner**   | 2 vCPU, 2GB RAM   | €4.51/mo  | Best bang for euro ✅ |
| **Contabo**   | 4 vCPU, 4GB RAM   | €5.99/mo  | More RAM for Playwright|
| DigitalOcean  | 1 vCPU, 2GB RAM   | $6.00/mo  | Great docs, easy DNS  |
| Vultr         | 1 vCPU, 2GB RAM   | $6.00/mo  | Good global coverage  |

**Recommendation: Hetzner CX22 (2 vCPU, 4GB RAM, €4.51/mo)** — Playwright/Chromium
needs the memory headroom. 2GB is borderline; 4GB is comfortable.

### Initial VPS Setup Commands

```bash
# 1. SSH into your fresh VPS
ssh root@your.vps.ip

# 2. Create a non-root user
adduser deploy
usermod -aG sudo deploy
su - deploy

# 3. Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker deploy

# 4. Install Docker Compose
sudo apt-get install docker-compose-plugin

# 5. Clone your monorepo
git clone https://github.com/yourname/leadforge.git
cd leadforge

# 6. Create .env from example
cp .env.example .env
nano .env   # Fill in all API keys

# 7. Run database migrations
docker compose run --rm backend alembic upgrade head

# 8. Get SSL certificate (do this BEFORE starting nginx with SSL)
docker compose run --rm certbot

# 9. Start all services
docker compose up -d

# 10. Verify everything is running
docker compose ps
docker compose logs backend --tail=50
```

### Environment Variables (`.env`)

```bash
# Database
POSTGRES_PASSWORD=generate_a_strong_random_password_here

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
GOOGLE_AI_API_KEY=AIza...        # AI Studio key (free, no billing needed)

# Scraping (no Google Places API needed — Playwright handles it)
# Optional: add SerpAPI key here if you want as additional enrichment
# SERPAPI_KEY=...

# App config
SECRET_KEY=generate_another_random_string_here
FRONTEND_URL=https://preview.yourdomain.com
BACKEND_INTERNAL_URL=http://backend:8000
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com

# Preview URL base (injected into wa.me links)
PREVIEW_BASE_URL=https://preview.yourdomain.com
```

---

## Phase 6: The Final Preview URL Strategy

Since the business owner receives a wa.me link with a preview URL embedded in it,
the URL format matters for professionalism.

**Option A (Recommended for launch): Subdomain + slug**
```
https://preview.yourdomain.com/al-noor-clinic-amman
```

**Option B: Niche subfolder**
```
https://yourdomain.com/clinics/al-noor-amman
```

**Option C (Long-term): Custom domain per client after closing)**
```
https://al-noor-clinic.com    ← You register this for $10/year after closing the deal
```

For launch, go with Option A. After a deal is closed, you can point a real domain
to the same Next.js page (`CNAME preview.yourdomain.com`) — no rebuild needed.

### Update the wa.me message generator to use the live preview URL:

```python
# app/services/whatsapp.py
import os

PREVIEW_BASE_URL = os.getenv("PREVIEW_BASE_URL", "https://preview.yourdomain.com")

def build_message_en(self, lead: dict, slug: str) -> str:
    preview_url = f"{PREVIEW_BASE_URL}/{slug}"
    return f"""Hi {lead['business_name']} team! 👋

I came across your business on Google — {lead['review_count']} reviews \
with a {lead['google_rating']}-star average is genuinely impressive.

I put together a quick website concept to show what your online presence could look like:

🔗 {preview_url}

Happy to refine it or hand it over completely — no pressure.

Worth a look? 🙂"""
```

---

## Phase 7: Go-Live Checklist

### Pre-Launch (Local Testing)

- [ ] `docker compose up` runs without errors locally
- [ ] `GET /api/v1/leads` returns data
- [ ] `GET /preview/{slug}?lang=en` returns correct JSON payload
- [ ] `GET /preview/{slug}?lang=ar` returns correct Arabic JSON payload
- [ ] `preview.localhost:3000/{slug}` renders the landing page (EN)
- [ ] `preview.localhost:3000/{slug}?lang=ar` renders RTL Arabic version
- [ ] WA EN button opens correct WhatsApp link
- [ ] WA AR button opens correct Arabic WhatsApp link (NEW)
- [ ] Lead status changes to `outreach_sent` after clicking either WA button
- [ ] Alembic migration ran (wame_link_ar column exists)

### VPS Launch

- [ ] VPS provisioned (Hetzner CX22 or equivalent)
- [ ] Docker + Docker Compose installed
- [ ] `.env` populated with all API keys
- [ ] DNS A records pointing to VPS IP:
  - `preview.yourdomain.com → VPS_IP`
  - `api.yourdomain.com → VPS_IP`
- [ ] SSL certificate obtained via Certbot
- [ ] `docker compose up -d` — all 6 services running
- [ ] `docker compose ps` shows all services as "Up"
- [ ] `https://preview.yourdomain.com/{real_slug}` loads over HTTPS ✅
- [ ] Database backed up (set up daily `pg_dump` cron)

### First Live Outreach Campaign

- [ ] Run campaign: 1 niche, 1 city, 30-50 leads
- [ ] Review 5-10 generated pages before sending any
- [ ] Send WA messages manually for first 10 leads
- [ ] Mark each as `outreach_sent` in dashboard
- [ ] Monitor replies for 48 hours
- [ ] Follow-up sequence: Day 3 if no reply

---

## Appendix: Deployment Sequence Diagram

```
Local dev: docker compose up (all services on localhost)
                │
                ▼
VPS: git pull → docker compose up -d
                │
                ├── nginx (SSL termination, routing)
                ├── backend (FastAPI :8000)
                ├── worker (Celery, Playwright)
                ├── frontend (Next.js :3000)
                ├── redis (:6379)
                └── postgres (:5432)
                         │
Admin opens: https://preview.yourdomain.com/admin
                         │
Admin starts campaign → Celery scrapes → AI generates
                         │
Lead READY → Admin sees wa.me links (EN + AR)
                         │
Admin clicks WA AR → WhatsApp Web → sends
                         │
Business owner opens: https://preview.yourdomain.com/{slug}?lang=ar
                         │
Next.js SSR → fetches from backend:8000 → renders RTL Arabic page
                         │
                    🎯 First client impressed → deal closed
```

---

*Integration Roadmap v1.0 — Monorepo + Dynamic SSR + Single VPS Docker Compose*
*Estimated time to go-live from this document: 1-2 focused days*
