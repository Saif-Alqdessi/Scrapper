import { MessageCircle, CalendarCheck, ShieldCheck, MapPin, Clock, Stethoscope } from "lucide-react";
import { useSiteData } from "../context/DataContext";

const iconMap: Record<string, any> = {
  Clock, MapPin, ShieldCheck, Stethoscope
};

export function HeroSection() {
  const { hero, global } = useSiteData();

  return (
    <section
      id="home"
      className="relative pt-16 lg:pt-18 min-h-screen flex items-center bg-gradient-to-br from-[#eef5fd] via-white to-[#f0faf9]"
    >
      {/* Decorative background circles */}
      <div className="absolute top-20 right-0 w-96 h-96 rounded-full bg-[#1a6eb5]/5 -translate-y-10 translate-x-20 pointer-events-none" />
      <div className="absolute bottom-10 left-0 w-64 h-64 rounded-full bg-[#0d9b8d]/5 translate-y-10 -translate-x-16 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column — Content */}
          <div className="space-y-6">
            {/* Arabic accent */}
            <div className="inline-flex items-center gap-2 bg-[#1a6eb5]/10 text-[#1a6eb5] text-sm px-4 py-1.5 rounded-full font-medium">
              <span>{hero.badge.ar}</span>
              <span className="text-slate-400">·</span>
              <span>{hero.badge.en}</span>
            </div>

            <h1 className="text-4xl lg:text-5xl xl:text-6xl text-slate-900 leading-[1.1]">
              {hero.headline.line1}<br />
              <span className="text-[#1a6eb5]">{hero.headline.highlight}</span><br />
              {hero.headline.line2}
            </h1>

            <p className="text-lg text-slate-600 max-w-lg leading-relaxed" dangerouslySetInnerHTML={{ __html: hero.description.replace('8 medical departments', '<strong className="text-slate-800">8 medical departments</strong>') }} />

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 bg-[#1a6eb5] hover:bg-[#155da0] text-white px-7 py-3.5 rounded-xl transition-all duration-200 font-semibold shadow-lg shadow-[#1a6eb5]/20 hover:shadow-[#1a6eb5]/30 hover:-translate-y-0.5"
              >
                <CalendarCheck className="w-5 h-5" />
                {hero.buttons.primary}
              </a>
              <a
                href={global.contact.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white px-7 py-3.5 rounded-xl transition-all duration-200 font-semibold hover:-translate-y-0.5"
              >
                <MessageCircle className="w-5 h-5" />
                {hero.buttons.secondary}
              </a>
            </div>

            {/* Trust Badge Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {hero.trustBadges.map(({ icon, label }) => {
                const Icon = iconMap[icon];
                return (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-1.5 bg-white rounded-xl p-3 shadow-sm border border-slate-100 text-center"
                  >
                    {Icon && <Icon className="w-5 h-5 text-[#1a6eb5]" />}
                    <span className="text-xs text-slate-600 leading-tight font-medium">{label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column — Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl aspect-[4/5] lg:aspect-[3/4] max-w-md mx-auto lg:max-w-none">
              <img
                src={hero.image}
                alt="Doctor consulting patient"
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a6eb5]/30 to-transparent" />
            </div>

            {/* Floating card — stat */}
            <div className="absolute -bottom-5 -left-5 bg-white rounded-xl shadow-xl p-4 flex items-center gap-3 border border-slate-100">
              <div className="w-10 h-10 bg-[#0d9b8d]/10 rounded-full flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-[#0d9b8d]" />
              </div>
              <div>
                <div className="text-slate-900 font-bold text-lg leading-none">{hero.stats.patients.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{hero.stats.patients.label}</div>
              </div>
            </div>

            {/* Floating card — rating */}
            <div className="absolute -top-4 -right-4 bg-white rounded-xl shadow-xl p-4 border border-slate-100">
              <div className="text-xs text-slate-500 mb-1">{hero.stats.reviews.label}</div>
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-slate-800 font-bold text-sm mt-0.5">{hero.stats.reviews.score} <span className="text-slate-400 font-normal">{hero.stats.reviews.count}</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
