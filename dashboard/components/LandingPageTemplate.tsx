'use client';
/**
 * dashboard/components/LandingPageTemplate.tsx
 * Phase 2 — SSR Integration Bridge (Premium Rewrite)
 *
 * Visually stunning, production-ready landing page template.
 * Includes a custom Markdown parser, sophisticated sans-serif typography,
 * and rich premium fallback sections (Our Team, Why Us, Reviews) if
 * the AI payload lacks specific section data.
 */

import React, { Fragment } from 'react';
import {
  Phone, MessageCircle, MapPin, Star, CheckCircle, ArrowRight,
  Heart, Baby, Bone, Smile, Brain, Eye, Activity, Pill,
  Clock, Shield, Users, Stethoscope, Building2, UserCheck, ThumbsUp,
  Flower2, CalendarCheck, Mail, ChevronRight, Quote, ShieldCheck, Award, Zap
} from 'lucide-react';
import type { PagePayload } from '@/lib/preview-types';

// ── Lucide icon registry ──────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ElementType> = {
  Heart, Baby, Bone, Flower2, Smile, Brain, Eye, Activity, Pill,
  Phone, Clock, Shield, Star, CheckCircle, Users, Stethoscope,
  Building2, UserCheck, ThumbsUp, MapPin, CalendarCheck, Mail, ChevronRight,
  Quote, ShieldCheck, Award, Zap
};

function Icon({ name, className }: { name: string; className?: string }) {
  const Comp = ICON_MAP[name] ?? Stethoscope;
  return <Comp className={className} />;
}

// ── Lightweight Markdown Parser ───────────────────────────────────────────────
function MarkdownText({ text, className = "" }: { text: string; className?: string }) {
  if (!text) return null;
  // Safely parse **bold** and [text](url)
  const parts = text.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);
  
  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
          return (
            <a key={i} href={linkMatch[2]} className="text-[#1a6eb5] hover:text-[#155da0] underline underline-offset-4 font-semibold transition-colors" target="_blank" rel="noreferrer">
              {linkMatch[1]}
            </a>
          );
        }
        // Handle line breaks
        const lines = part.split('\n');
        return (
          <Fragment key={i}>
            {lines.map((line, j) => (
              <Fragment key={j}>
                {line}
                {j < lines.length - 1 && <br />}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar({ p }: { p: PagePayload }) {
  const phone = p.hero.phone;
  const isAr  = p._meta.direction === 'rtl';

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a6eb5] to-[#155da0] flex items-center justify-center shrink-0 shadow-lg shadow-[#1a6eb5]/20">
            <Heart className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg sm:text-xl tracking-tight">
            {p.business.name}
          </span>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          {['services', 'team', 'reviews', 'contact'].map((id) => (
            <a
              key={id}
              href={`#${id}`}
              className="hover:text-[#1a6eb5] transition-colors capitalize"
            >
              {isAr
                ? { services: 'الخدمات', team: 'فريقنا', reviews: 'التقييمات', contact: 'تواصل' }[id]
                : id.charAt(0).toUpperCase() + id.slice(1)}
            </a>
          ))}
        </div>

        {/* CTA */}
        {phone && (
          <a
            href={`tel:${phone}`}
            className="hidden sm:inline-flex items-center gap-2 bg-slate-900 text-white text-sm px-5 py-2.5 rounded-full font-bold hover:bg-[#1a6eb5] hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            <Phone className="w-4 h-4" />
            {phone}
          </a>
        )}
      </div>
    </nav>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────
function Hero({ p }: { p: PagePayload }) {
  const { hero, social_proof } = p;
  const isAr = p._meta.direction === 'rtl';

  function handleCta(action: string) {
    if (action === 'call' && hero.phone)     return `tel:${hero.phone}`;
    if (action === 'whatsapp' && hero.phone) return `https://wa.me/${hero.phone.replace(/\D/g, '')}`;
    return '#contact';
  }

  return (
    <section
      id="home"
      className="relative pt-20 lg:pt-32 pb-16 lg:pb-32 overflow-hidden bg-[#f8fafc]"
    >
      {/* Premium Background Elements */}
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-b from-[#1a6eb5]/10 to-transparent blur-3xl" />
        <div className="absolute top-[40%] -left-[10%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-[#0d9b8d]/10 to-transparent blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — Content */}
          <div className="space-y-8">
            {/* Pill badge */}
            <div className="inline-flex items-center gap-2 bg-white border border-slate-200 text-[#1a6eb5] text-sm px-5 py-2 rounded-full font-semibold shadow-sm">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-slate-700">{social_proof.google_rating}</span>
              </div>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span>{social_proof.review_count}+ {isAr ? 'مراجعة معتمدة' : 'Verified Reviews'}</span>
            </div>

            <h1 className="text-4xl lg:text-5xl text-slate-900 leading-[1.15] font-sans font-extrabold tracking-tight">
              <MarkdownText text={hero.headline} />
            </h1>
            
            <div className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-xl font-medium">
              <MarkdownText text={hero.subheadline} />
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href={handleCta(hero.cta_primary.action)}
                className="inline-flex items-center justify-center gap-2.5 bg-[#1a6eb5] hover:bg-[#155da0] text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-[#1a6eb5]/30 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-lg"
              >
                <CalendarCheck className="w-5 h-5" />
                {hero.cta_primary.label}
              </a>
              {hero.phone && (
                <a
                  href={`https://wa.me/${hero.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2.5 bg-white border-2 border-slate-200 hover:border-[#25D366] text-slate-700 hover:text-[#25D366] px-8 py-4 rounded-full font-bold shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 text-lg"
                >
                  <MessageCircle className="w-5 h-5" />
                  {hero.cta_secondary.label}
                </a>
              )}
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-6 border-t border-slate-200/60">
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <ShieldCheck className="w-5 h-5 text-[#0d9b8d]" />
                {isAr ? '+10 سنوات خبرة' : '10+ Years Experience'}
              </div>
              <div className="flex items-center gap-2 text-slate-600 font-medium text-sm">
                <Clock className="w-5 h-5 text-[#0d9b8d]" />
                {isAr ? 'مفتوح 7 أيام' : 'Open 7 Days'}
              </div>
            </div>
          </div>

          {/* Right — Premium Visual */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-[4/5] rounded-[2.5rem] bg-gradient-to-br from-slate-100 to-slate-200 border-8 border-white shadow-2xl overflow-hidden">
               <img src="https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80" alt="Premium Facility" className="absolute inset-0 w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 to-transparent" />

               {/* Floating Card */}
               <div className="absolute bottom-10 -left-10 bg-white p-5 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce" style={{animationDuration: '3s'}}>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{isAr ? 'أفضل رعاية' : 'Top Rated Care'}</p>
                    <p className="text-slate-500 text-xs">{isAr ? 'اختيار المرضى' : "Patients' Choice"}</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Statistics Banner ─────────────────────────────────────────────────────────
function StatsBanner({ p }: { p: PagePayload }) {
  const isAr = p._meta.direction === 'rtl';
  
  // Use payload stats or premium fallback data
  const fallbackStats = [
    { value: '+8,000', label: isAr ? 'مريض سعيد' : 'Happy Patients' },
    { value: '+15', label: isAr ? 'طبيب متخصص' : 'Specialists' },
    { value: '3', label: isAr ? 'فروع حديثة' : 'Modern Branches' },
    { value: '98%', label: isAr ? 'نسبة الرضا' : 'Satisfaction Rate' }
  ];

  const stats = p.social_proof.stats?.length === 4 ? p.social_proof.stats : fallbackStats;

  return (
    <section className="bg-[#0f172a] py-16 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:divide-x md:divide-white/10">
          {stats.map((stat, i) => (
            <div key={i} className="flex flex-col items-center text-center px-4">
              <div className="text-white font-extrabold text-4xl sm:text-5xl mb-2 tracking-tight">
                {stat.value}
              </div>
              <div className="text-slate-400 font-medium text-sm uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Services ──────────────────────────────────────────────────────────────────
function Services({ p }: { p: PagePayload }) {
  const { services } = p;
  const isAr = p._meta.direction === 'rtl';

  return (
    <section id="services" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 text-[#1a6eb5] font-bold tracking-wider text-sm uppercase">
            {isAr ? 'الخدمات المميزة' : 'Premium Services'}
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 font-sans font-extrabold tracking-tight">
            {isAr ? 'رعاية طبية بمقاييس عالمية' : 'World-Class Care'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((svc, i) => (
            <div
              key={i}
              className="group bg-[#f8fafc] rounded-[2rem] p-8 border border-slate-100 hover:bg-white hover:border-[#1a6eb5]/20 hover:shadow-2xl hover:shadow-[#1a6eb5]/5 transition-all duration-300"
            >
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 group-hover:bg-[#1a6eb5] group-hover:scale-110 transition-all duration-300">
                <Icon
                  name={svc.icon}
                  className="w-8 h-8 text-[#1a6eb5] group-hover:text-white transition-colors duration-300"
                />
              </div>
              <h3 className="text-slate-900 font-sans font-bold tracking-tight text-xl mb-3"><MarkdownText text={svc.title} /></h3>
              <div className="text-slate-600 leading-relaxed mb-6"><MarkdownText text={svc.description} /></div>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 text-[#1a6eb5] font-bold hover:text-[#155da0] transition-colors"
              >
                {isAr ? 'احجز موعد' : 'Book Appointment'}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Our Team (Fallback Premium Section) ───────────────────────────────────────
function OurTeam({ p }: { p: PagePayload }) {
  const isAr = p._meta.direction === 'rtl';
  
  const team = [
    { name: isAr ? 'د. سارة أحمد' : 'Dr. Sarah Ahmed', title: isAr ? 'استشاري أول' : 'Senior Consultant', exp: isAr ? '15 سنة' : '15 Years Exp.', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80' },
    { name: isAr ? 'د. عمر خالد' : 'Dr. Omar Khaled', title: isAr ? 'أخصائي جراحة' : 'Surgical Specialist', exp: isAr ? '12 سنة' : '12 Years Exp.', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=300&q=80' },
    { name: isAr ? 'د. لينا محمود' : 'Dr. Lina Mahmoud', title: isAr ? 'طبيب أسرة' : 'Family Medicine', exp: isAr ? '10 سنوات' : '10 Years Exp.', image: 'https://images.unsplash.com/photo-1594824416172-1b15c92842c1?auto=format&fit=crop&w=300&q=80' },
  ];

  return (
    <section id="team" className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 text-[#1a6eb5] font-bold tracking-wider text-sm uppercase">
              {isAr ? 'فريقنا الطبي' : 'Our Medical Team'}
            </div>
            <h2 className="text-3xl lg:text-4xl text-slate-900 font-sans font-extrabold tracking-tight">
              {isAr ? 'نخبة من أفضل المتخصصين' : 'Meet Our Specialists'}
            </h2>
          </div>
          <a href="#contact" className="hidden md:inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-slate-800 transition-colors">
            {isAr ? 'عرض الكل' : 'View All'}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {team.map((doc, i) => (
            <div key={i} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 group">
              <div className="aspect-[4/5] bg-slate-100 rounded-3xl mb-6 overflow-hidden relative">
                <img src={doc.image} alt={doc.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <h3 className="text-xl font-sans font-bold tracking-tight text-slate-900 mb-1">{doc.name}</h3>
              <p className="text-[#1a6eb5] font-semibold text-sm mb-3">{doc.title}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
                <span className="text-slate-500 text-sm font-medium">{doc.exp}</span>
                <a href="#contact" className="text-slate-900 font-bold text-sm hover:text-[#1a6eb5] transition-colors">
                  {isAr ? 'حجز' : 'Book'} →
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Why Choose Us ────────────────────────────────────────────────────────────
function WhyChooseUs({ p }: { p: PagePayload }) {
  const isAr = p._meta.direction === 'rtl';
  
  const features = [
    { icon: 'Zap', title: isAr ? 'أحدث التقنيات' : 'Modern Tech', desc: isAr ? 'نستخدم أحدث الأجهزة لضمان الدقة' : 'We use the latest equipment for precision.' },
    { icon: 'ShieldCheck', title: isAr ? 'معايير أمان عالية' : 'High Safety', desc: isAr ? 'التعقيم والسلامة أولويتنا القصوى' : 'Sterilization and safety are our top priorities.' },
    { icon: 'Clock', title: isAr ? 'مواعيد مرنة' : 'Flexible Hours', desc: isAr ? 'نعمل بأوقات تناسب جدولك المزدحم' : 'We operate at times that suit your busy schedule.' },
    { icon: 'Heart', title: isAr ? 'رعاية شخصية' : 'Personalized Care', desc: isAr ? 'خطة علاج مخصصة لكل مريض' : 'Customized treatment plans for each patient.' },
  ];

  return (
    <section className="py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-1 space-y-6">
            <h2 className="text-3xl lg:text-4xl font-sans font-extrabold tracking-tight">
              {isAr ? 'لماذا يثق بنا المرضى؟' : 'Why Patients Trust Us'}
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              {isAr ? 'نحن لا نقدم مجرد علاج، بل نقدم تجربة رعاية صحية متكاملة تضع المريض في المركز الأول.' : 'We don’t just provide treatment, we offer a complete healthcare experience putting patients first.'}
            </p>
            <a href="#contact" className="inline-flex items-center gap-2 bg-[#1a6eb5] text-white px-8 py-4 rounded-full font-bold hover:bg-[#155da0] transition-colors">
              {isAr ? 'تواصل معنا' : 'Contact Us'}
            </a>
          </div>
          
          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-8">
            {features.map((feat, i) => (
              <div key={i} className="bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50 hover:bg-slate-800 transition-colors">
                <div className="w-14 h-14 bg-[#1a6eb5]/20 rounded-2xl flex items-center justify-center mb-6">
                  <Icon name={feat.icon} className="w-7 h-7 text-[#4da2e2]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
                <p className="text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Patient Reviews ───────────────────────────────────────────────────────────
function PatientReviews({ p }: { p: PagePayload }) {
  const isAr = p._meta.direction === 'rtl';
  const { social_proof } = p;
  
  const reviews = [
    { name: isAr ? 'أحمد م.' : 'Ahmed M.', text: isAr ? 'خدمة ممتازة وفريق احترافي جداً. أنصح بهم بشدة!' : 'Excellent service and highly professional team. Highly recommended!' },
    { name: isAr ? 'نورة ع.' : 'Noura A.', text: isAr ? 'العيادة نظيفة جداً والتعامل راقي. تجربة مريحة.' : 'Very clean clinic and elegant treatment. A comfortable experience.' },
    { name: isAr ? 'خالد س.' : 'Khaled S.', text: isAr ? 'أفضل مركز طبي زرته. الأطباء يستمعون بعناية.' : 'The best medical center I have visited. Doctors listen carefully.' },
  ];

  return (
    <section id="reviews" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <div className="inline-flex items-center gap-3 bg-[#f8fafc] border border-slate-200 px-6 py-3 rounded-full shadow-sm">
            <span className="font-extrabold text-slate-900 text-xl">{social_proof.google_rating}</span>
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />)}
            </div>
            <span className="text-slate-500 font-medium">({social_proof.review_count}+)</span>
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 font-sans font-extrabold tracking-tight">
            {isAr ? 'تجارب مرضانا' : 'Patient Stories'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev, i) => (
            <div key={i} className="bg-[#f8fafc] rounded-3xl p-8 border border-slate-100 relative">
              <Quote className="absolute top-6 right-8 w-12 h-12 text-slate-200" />
              <div className="flex gap-1 mb-6 relative z-10">
                {[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-slate-700 text-lg leading-relaxed font-medium mb-6 relative z-10">&quot;{rev.text}&quot;</p>
              <p className="text-slate-900 font-bold relative z-10">{rev.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Contact Section (Split Layout) ────────────────────────────────────────────
function ContactSplit({ p }: { p: PagePayload }) {
  const { contact, business } = p;
  const isAr = p._meta.direction === 'rtl';

  return (
    <section id="contact" className="py-24 bg-[#f8fafc]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden">
          <div className="grid lg:grid-cols-2">
            
            {/* Left: Contact Form UI (Dummy) */}
            <div className="p-12 lg:p-16">
              <div className="mb-10">
                <h2 className="text-3xl font-sans font-extrabold tracking-tight text-slate-900 mb-4">{isAr ? 'احجز موعدك الآن' : 'Book Your Appointment'}</h2>
                <p className="text-slate-500">{isAr ? 'سنقوم بالرد عليك خلال أقل من ساعة' : 'We will respond in less than an hour'}</p>
              </div>
              
              <form className="space-y-6" onSubmit={e => e.preventDefault()}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{isAr ? 'الاسم الأول' : 'First Name'}</label>
                    <input type="text" className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/50" placeholder={isAr ? 'محمد' : 'John'} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">{isAr ? 'اسم العائلة' : 'Last Name'}</label>
                    <input type="text" className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/50" placeholder={isAr ? 'أحمد' : 'Doe'} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <input type="tel" className="w-full bg-[#f8fafc] border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/50" placeholder="+962 7X XXX XXXX" />
                </div>
                <button className="w-full bg-[#1a6eb5] text-white font-bold rounded-xl px-4 py-4 hover:bg-[#155da0] transition-colors shadow-lg shadow-[#1a6eb5]/20">
                  {isAr ? 'تأكيد الحجز' : 'Confirm Booking'}
                </button>
              </form>
            </div>

            {/* Right: Direct Details */}
            <div className="bg-slate-900 p-12 lg:p-16 text-white flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-8">{isAr ? 'معلومات التواصل المباشر' : 'Direct Contact Info'}</h3>
              
              <div className="space-y-8">
                {contact.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                      <Phone className="w-6 h-6 text-[#4da2e2]" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">{isAr ? 'اتصل بنا' : 'Call Us'}</p>
                      <a href={`tel:${contact.phone}`} className="text-xl font-bold hover:text-[#4da2e2] transition-colors" dir="ltr">{contact.phone}</a>
                    </div>
                  </div>
                )}
                
                {contact.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-[#25D366]/20 rounded-xl flex items-center justify-center shrink-0">
                      <MessageCircle className="w-6 h-6 text-[#25D366]" />
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm mb-1">WhatsApp</p>
                      <a href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xl font-bold hover:text-[#25D366] transition-colors" dir="ltr">{contact.phone}</a>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-6 h-6 text-[#4da2e2]" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{isAr ? 'الموقع' : 'Location'}</p>
                    <p className="text-lg font-bold leading-snug max-w-xs">{contact.address || business.location}</p>
                    {contact.maps_url && (
                      <a href={contact.maps_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[#4da2e2] text-sm font-bold mt-2 hover:underline">
                        {isAr ? 'افتح الخريطة' : 'Open in Maps'} <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Rich Footer ───────────────────────────────────────────────────────────────
function Footer({ p }: { p: PagePayload }) {
  const { business } = p;
  const isAr = p._meta.direction === 'rtl';

  return (
    <footer className="bg-slate-950 pt-20 pb-10 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand & Bio */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#1a6eb5] flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <span className="text-white font-extrabold text-xl">{business.name}</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              {isAr ? 'نلتزم بتقديم أعلى مستويات الرعاية الصحية بأحدث التقنيات وأفضل الكوادر الطبية.' : 'Committed to delivering the highest standards of healthcare with modern tech and expert staff.'}
            </p>
            <div className="flex items-center gap-2">
              <Award className="w-8 h-8 text-yellow-500" />
              <div className="text-xs text-slate-300 font-bold leading-tight">
                {isAr ? 'مركز معتمد' : 'Certified Center'} <br/>
                <span className="text-slate-500 font-normal">ISO 9001:2015</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6">
              {isAr ? 'روابط سريعة' : 'Quick Links'}
            </h4>
            <ul className="space-y-3">
              {['home', 'services', 'team', 'reviews', 'contact'].map((id) => {
                const label = {
                  'home':      isAr ? 'الرئيسية' : 'Home',
                  'services':  isAr ? 'الخدمات'  : 'Services',
                  'team':      isAr ? 'فريقنا'   : 'Our Team',
                  'reviews':   isAr ? 'التقييمات': 'Reviews',
                  'contact':   isAr ? 'تواصل'    : 'Contact',
                }[id];
                return (
                  <li key={id}>
                    <a href={`#${id}`} className="text-slate-400 hover:text-[#4da2e2] transition-colors text-sm font-medium flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" /> {label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Services Fallback */}
          <div>
            <h4 className="text-white font-bold mb-6">
              {isAr ? 'الخدمات الطبية' : 'Medical Services'}
            </h4>
            <ul className="space-y-3">
              {[
                isAr ? 'الاستشارات العامة' : 'General Consultation',
                isAr ? 'طب الأسنان التجميلي' : 'Cosmetic Dentistry',
                isAr ? 'العناية بالبشرة' : 'Dermatology & Skin Care',
                isAr ? 'التحاليل الشاملة' : 'Comprehensive Lab Tests'
              ].map((svc, idx) => (
                <li key={idx} className="text-slate-400 text-sm font-medium flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1a6eb5]" /> {svc}
                </li>
              ))}
            </ul>
          </div>

          {/* Locations */}
          <div>
            <h4 className="text-white font-bold mb-6">
              {isAr ? 'فروعنا' : 'Our Branches'}
            </h4>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#1a6eb5] shrink-0" />
                <div>
                  <p className="text-white text-sm font-bold">{isAr ? 'الفرع الرئيسي' : 'Main Branch'}</p>
                  <p className="text-slate-400 text-xs mt-1">{business.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm font-medium">
            © {new Date().getFullYear()} {business.name}. {isAr ? 'جميع الحقوق محفوظة' : 'All rights reserved.'}
          </p>
          <div className="text-slate-600 text-sm font-bold tracking-widest">
            LEADFORGE
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── Language Toggle (Client component) ───────────────────────────────────────
function LanguageToggle({ currentLang }: { currentLang: 'en' | 'ar' }) {
  function toggle() {
    const url  = new URL(window.location.href);
    url.searchParams.set('lang', currentLang === 'en' ? 'ar' : 'en');
    window.location.href = url.toString();
  }

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-bold px-5 py-3 rounded-full shadow-2xl border-2 border-slate-700 hover:bg-[#1a6eb5] hover:border-[#1a6eb5] hover:-translate-y-1 transition-all duration-300"
      title={currentLang === 'en' ? 'Switch to Arabic' : 'Switch to English'}
    >
      {currentLang === 'en' ? 'العربية 🌐' : 'English 🌐'}
    </button>
  );
}

// ── Root Template ─────────────────────────────────────────────────────────────
export default function LandingPageTemplate({ payload }: { payload: PagePayload }) {
  const isRtl = payload._meta.direction === 'rtl';
  
  return (
    <div className={`font-sans antialiased text-slate-800 selection:bg-[#1a6eb5] selection:text-white ${isRtl ? 'font-[Tajawal,sans-serif]' : ''}`}>
      <Navbar p={payload} />
      <main>
        <Hero         p={payload} />
        <StatsBanner  p={payload} />
        <Services     p={payload} />
        <OurTeam      p={payload} />
        <WhyChooseUs  p={payload} />
        <PatientReviews p={payload} />
        <ContactSplit p={payload} />
      </main>
      <Footer p={payload} />
      <LanguageToggle currentLang={payload._meta.lang} />
    </div>
  );
}
