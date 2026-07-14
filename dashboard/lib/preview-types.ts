/**
 * dashboard/lib/preview-types.ts
 * TypeScript interfaces exactly mirroring the assembled JSON payload
 * produced by backend/app/services/assembler.py
 */

export interface PayloadMeta {
  title:       string;
  description: string;
}

export interface CtaButton {
  label:  string;
  action: "call" | "whatsapp" | "scroll";
}

export interface PayloadHero {
  headline:      string;
  subheadline:   string;
  cta_primary:   CtaButton;
  cta_secondary: CtaButton;
  phone:         string | null;
}

export interface PayloadService {
  title:       string;
  description: string;
  icon:        string; // Lucide icon name
}

export interface PayloadAbout {
  headline: string;
  body:     string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface PayloadSocialProof {
  headline:     string;
  stats:        Stat[];
  maps_url:     string | null;
  google_rating: number | null;
  review_count:  number | null;
}

export interface PayloadCtaSection {
  headline:     string;
  body:         string;
  button_label: string;
  phone:        string | null;
}

export interface PayloadContact {
  headline: string;
  tagline:  string;
  phone:    string | null;
  address:  string | null;
  maps_url: string | null;
}

export interface PayloadFooter {
  tagline: string;
}

export interface PayloadBusiness {
  name:            string | null;
  niche:           string | null;
  location:        string | null;
  phone:           string | null;
  address:         string | null;
  google_rating:   number | null;
  review_count:    number | null;
  maps_url:        string | null;
  photo_reference: string | null;
}

export interface PagePayload {
  _meta: {
    slug:      string;
    lang:      "en" | "ar";
    direction: "ltr" | "rtl";
    generated: string;
    version:   number;
  };
  meta:         PayloadMeta;
  hero:         PayloadHero;
  services:     PayloadService[];
  about:        PayloadAbout;
  social_proof: PayloadSocialProof;
  cta_section:  PayloadCtaSection;
  contact:      PayloadContact;
  footer:       PayloadFooter;
  business:     PayloadBusiness;
}
