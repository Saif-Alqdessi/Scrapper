import { Users, UserCheck, Building2, ThumbsUp } from "lucide-react";
import { useSiteData } from "../context/DataContext";

const iconMap: Record<string, any> = {
  Users, UserCheck, Building2, ThumbsUp
};

export function SocialProofBar() {
  const { socialProof } = useSiteData();

  return (
    <section className="bg-[#1a6eb5] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[#ffffff20]">
          {socialProof.stats.map(({ icon, value, label }) => {
            const Icon = iconMap[icon];
            return (
              <div key={value} className="flex flex-col items-center text-center px-4 py-2">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-3">
                  {Icon && <Icon className="w-6 h-6 text-white" />}
                </div>
                <div className="text-white font-bold text-3xl mb-1">{value}</div>
                <div className="text-blue-100 text-sm whitespace-pre-line leading-snug">{label}</div>
              </div>
            );
          })}
        </div>
        <p className="text-center text-blue-100 text-sm mt-8 border-t border-white/10 pt-6">
          {socialProof.footerText}
        </p>
      </div>
    </section>
  );
}
