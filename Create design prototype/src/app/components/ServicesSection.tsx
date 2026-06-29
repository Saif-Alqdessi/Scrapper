import { Heart, Baby, Bone, Flower2, Smile, Brain, Eye, Activity, Pill, ArrowRight } from "lucide-react";
import { useSiteData } from "../context/DataContext";

const iconMap: Record<string, any> = {
  Heart, Baby, Bone, Flower2, Smile, Brain, Eye, Activity, Pill
};

export function ServicesSection() {
  const { services } = useSiteData();

  return (
    <section id="services" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-[#1a6eb5]/10 text-[#1a6eb5] text-sm px-4 py-1.5 rounded-full font-medium mb-4">
            {services.badge}
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 mb-4">{services.heading}</h2>
          <p className="text-slate-600 text-base">
            {services.description}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.items.map(({ icon, name, description }) => {
            const Icon = iconMap[icon];
            return (
              <div
                key={name}
                className="group bg-white rounded-2xl p-6 border border-slate-100 hover:border-[#1a6eb5]/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className="w-12 h-12 bg-[#1a6eb5]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1a6eb5] transition-colors duration-200">
                  {Icon && <Icon className="w-6 h-6 text-[#1a6eb5] group-hover:text-white transition-colors duration-200" />}
                </div>
                <h3 className="text-slate-900 font-semibold text-base mb-2">{name}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{description}</p>
                <a
                  href="#contact"
                  className="inline-flex items-center gap-1 text-[#1a6eb5] text-sm font-medium hover:gap-2 transition-all duration-150"
                >
                  {services.bookText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-10">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-[#1a6eb5] font-semibold hover:underline underline-offset-4"
          >
            {services.viewAllText}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
