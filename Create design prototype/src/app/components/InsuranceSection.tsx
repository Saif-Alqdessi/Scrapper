import { MessageCircle, ShieldCheck } from "lucide-react";
import { useSiteData } from "../context/DataContext";

export function InsuranceSection() {
  const { insurance, global } = useSiteData();

  return (
    <section id="insurance" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center bg-green-100 text-green-700 text-sm px-4 py-1.5 rounded-full font-medium mb-4">
            <ShieldCheck className="w-4 h-4 mr-1.5" />
            {insurance.badge}
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 mb-4">{insurance.heading}</h2>
          <p className="text-slate-600 text-base">
            {insurance.description}
          </p>
        </div>

        {/* Insurance Logo Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
          {insurance.insurers.map((ins) => (
            <div
              key={ins.abbr}
              className="flex flex-col items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl py-5 px-3 transition-colors"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: ins.color }}
              >
                {ins.abbr}
              </div>
              <div className="text-center">
                <div className="text-slate-800 text-xs font-semibold leading-snug">{ins.name}</div>
                <div className="text-slate-400 text-[10px] mt-0.5">{ins.note}</div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Strip */}
        <div className="bg-gradient-to-r from-[#eef5fd] to-[#f0faf9] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#1a6eb5]/10">
          <div>
            <p className="text-slate-800 font-semibold text-lg mb-1">{insurance.cta.heading}</p>
            <p className="text-slate-500 text-sm">{insurance.cta.subheading}</p>
          </div>
          <a
            href={global.contact.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            {insurance.cta.buttonText}
          </a>
        </div>
      </div>
    </section>
  );
}
