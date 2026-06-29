import { Clock, Microscope, CreditCard, MapPin, Globe, Timer } from "lucide-react";
import { useSiteData } from "../context/DataContext";

const iconMap: Record<string, any> = {
  Clock, Microscope, CreditCard, MapPin, Globe, Timer
};

export function WhyChooseUs() {
  const { whyChooseUs } = useSiteData();

  return (
    <section className="py-20 bg-gradient-to-br from-slate-900 to-[#0f3a6b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center bg-white/10 text-blue-200 text-sm px-4 py-1.5 rounded-full font-medium mb-4">
            {whyChooseUs.badge}
          </div>
          <h2 className="text-3xl lg:text-4xl text-white mb-4">{whyChooseUs.heading}</h2>
          <p className="text-blue-200 text-base">
            {whyChooseUs.description}
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {whyChooseUs.reasons.map(({ icon, title, description, color, bg }) => {
            const Icon = iconMap[icon];
            return (
              <div
                key={title}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  {Icon && <Icon className={`w-6 h-6 ${color}`} />}
                </div>
                <h3 className="text-white font-semibold text-base mb-2">{title}</h3>
                <p className="text-blue-200 text-sm leading-relaxed">{description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
