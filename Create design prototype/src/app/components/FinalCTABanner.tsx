import { CalendarCheck, Phone } from "lucide-react";
import { useSiteData } from "../context/DataContext";

export function FinalCTABanner() {
  const { finalCta, global } = useSiteData();

  return (
    <section className="py-20 bg-gradient-to-br from-[#1a6eb5] via-[#1562a8] to-[#0d9b8d] relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 translate-x-16 -translate-y-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white/5 -translate-x-10 translate-y-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center bg-white/10 text-white/90 text-sm px-4 py-1.5 rounded-full font-medium mb-6">
          {finalCta.badge}
        </div>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white mb-4">
          {finalCta.heading}
        </h2>
        <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
          {finalCta.description}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 bg-white text-[#1a6eb5] px-8 py-4 rounded-xl font-bold text-base hover:bg-blue-50 transition-colors shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200"
          >
            <CalendarCheck className="w-5 h-5" />
            {finalCta.buttons.primary}
          </a>
          <a
            href={global.contact.phoneLink}
            className="inline-flex items-center gap-2 border-2 border-white/50 hover:border-white text-white px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 hover:-translate-y-0.5"
          >
            <Phone className="w-5 h-5" />
            {finalCta.buttons.secondary}
          </a>
        </div>
      </div>
    </section>
  );
}
