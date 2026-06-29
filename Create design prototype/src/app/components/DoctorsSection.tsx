import { CalendarCheck, ArrowRight, Globe } from "lucide-react";
import { useSiteData } from "../context/DataContext";

export function DoctorsSection() {
  const { doctors } = useSiteData();

  return (
    <section id="doctors" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 bg-[#0d9b8d]/10 text-[#0d9b8d] text-sm px-4 py-1.5 rounded-full font-medium mb-4">
            {doctors.badge}
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 mb-4">{doctors.heading}</h2>
          <p className="text-slate-600 text-base">
            {doctors.description}
          </p>
        </div>

        {/* Doctor Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {doctors.list.map((doc) => (
            <div
              key={doc.name}
              className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200"
            >
              {/* Photo */}
              <div className="aspect-[3/4] overflow-hidden bg-slate-100 relative">
                <img
                  src={doc.image}
                  alt={doc.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                />
                {/* Specialty badge */}
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#1a6eb5] text-xs font-semibold px-2.5 py-1 rounded-full">
                  {doc.specialty}
                </div>
              </div>

              {/* Info */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-slate-900 font-bold text-base">{doc.name}</h3>
                  <p className="text-[#1a6eb5] text-sm">{doc.title}</p>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {doc.experience}
                  </div>
                  <div className="text-xs text-slate-500 leading-snug pl-5">{doc.education}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {doc.languages}
                  </div>
                </div>
                <a
                  href="#contact"
                  className="flex items-center justify-center gap-2 w-full bg-[#1a6eb5] hover:bg-[#155da0] text-white text-sm py-2.5 rounded-xl transition-colors font-semibold"
                >
                  {doctors.bookPrefix} {doc.name.split(" ")[1]}
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-[#1a6eb5] font-semibold hover:underline underline-offset-4"
          >
            {doctors.viewAllText}
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
