/**
 * dashboard/app/[slug]/page.tsx
 * Phase 2 — SSR Integration Bridge (Master_Integration_Roadmap.md §2)
 *
 * Dynamic preview route. For every slug (e.g. /al-noor-clinic-amman):
 *  1. Next.js SSR calls the FastAPI backend on the internal Docker network.
 *  2. FastAPI returns the assembled JSON payload from page_payloads table.
 *  3. Next.js renders the page fully server-side and returns HTML.
 *
 * The business owner NEVER touches the API — they only see a fast, rendered page.
 *
 * URL patterns:
 *   /al-noor-clinic-amman          → English (default)
 *   /al-noor-clinic-amman?lang=ar  → Arabic (RTL)
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import type { PagePayload } from '@/lib/preview-types';
import LandingPageTemplate from '@/components/LandingPageTemplate';

// ── Internal API helper ───────────────────────────────────────────────────────
// Uses BACKEND_INTERNAL_URL (http://api:8000 inside Docker, http://localhost:8000 in dev)
// This runs on the Next.js *server* — never exposed to the browser.

async function getPayload(slug: string, lang: string): Promise<PagePayload | null> {
  const base = process.env.BACKEND_INTERNAL_URL ?? 'http://localhost:8000';
  const url  = `${base}/api/v1/preview/${encodeURIComponent(slug)}?lang=${lang}`;

  try {
    const res = await fetch(url, {
      // no-store: always serve fresh data (suitable for outreach previews).
      // For a performance boost after go-live, switch to: next: { revalidate: 60 }
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json() as Promise<PagePayload>;
  } catch {
    // Backend unreachable (e.g. during local dev without Docker)
    return null;
  }
}

// ── Page Props ────────────────────────────────────────────────────────────────
interface PageProps {
  params:       Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

// ── Dynamic SEO Metadata ──────────────────────────────────────────────────────
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang = 'en' } = await searchParams;

  const payload = await getPayload(slug, lang);
  if (!payload) {
    return {
      title: 'Page Not Found',
      description: 'This preview is not available.',
    };
  }

  return {
    title:       payload.meta.title,
    description: payload.meta.description,
    openGraph: {
      title:       payload.meta.title,
      description: payload.meta.description,
      type:        'website',
    },
  };
}

// ── Page Component ────────────────────────────────────────────────────────────
export default async function PreviewPage({ params, searchParams }: PageProps) {
  const { slug }     = await params;
  const { lang = 'en' } = await searchParams;

  // Sanitize lang — only 'en' or 'ar' are valid
  const safeLang = lang === 'ar' ? 'ar' : 'en';

  const payload = await getPayload(slug, safeLang);

  // FastAPI returned 404 (pipeline not complete) or backend unreachable
  if (!payload) notFound();

  return (
    <html lang={safeLang} dir={payload._meta.direction}>
      <head>
        <title>{payload.meta.title}</title>
        <meta name="description" content={payload.meta.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Tajawal font for Arabic RTL pages */}
        {safeLang === 'ar' && (
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap"
          />
        )}
      </head>
      <body>
        <LandingPageTemplate payload={payload} />
      </body>
    </html>
  );
}
