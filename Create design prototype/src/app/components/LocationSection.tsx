import { useState } from "react";
import { MapPin, Phone, Clock, Navigation, MessageCircle } from "lucide-react";
import { useSiteData } from "../context/DataContext";

export function LocationSection() {
  const [active, setActive] = useState("amman");
  const { locations, global } = useSiteData();
  const current = locations.branches.find((b) => b.id === active)!;

  return (
    <section id="contact" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center bg-[#0d9b8d]/10 text-[#0d9b8d] text-sm px-4 py-1.5 rounded-full font-medium mb-4">
            <MapPin className="w-4 h-4 mr-1.5" />
            {locations.badge}
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 mb-4">{locations.heading}</h2>
          <p className="text-slate-600 text-base">
            {locations.description}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
            {locations.branches.map((b) => (
              <button
                key={b.id}
                onClick={() => setActive(b.id)}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  active === b.id
                    ? "bg-white text-[#1a6eb5] shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Map — 3/5 */}
          <div className="lg:col-span-3 rounded-2xl overflow-hidden shadow-lg bg-slate-100 h-80 lg:h-auto min-h-[320px] relative">
            {/* Map placeholder with styling matching Google Maps */}
            <div className="w-full h-full bg-[#e8edf0] flex flex-col items-center justify-center">
              <div className="text-center p-6">
                <MapPin className="w-12 h-12 text-[#1a6eb5] mx-auto mb-3" />
                <p className="text-slate-700 font-semibold text-lg mb-1">{current.label}</p>
                <p className="text-slate-500 text-sm mb-1">{current.address}</p>
                <p className="text-slate-400 text-xs italic mb-4">{current.landmark}</p>
                <a
                  href={`https://www.google.com/maps/search/${encodeURIComponent(current.address + ", Jordan")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-[#1a6eb5] text-white text-sm px-5 py-2.5 rounded-xl hover:bg-[#155da0] transition-colors font-semibold"
                >
                  <Navigation className="w-4 h-4" />
                  {locations.buttons.directions}
                </a>
              </div>
              {/* Grid lines to mimic map look */}
              <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: "linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)",
                  backgroundSize: "40px 40px"
                }}
              />
            </div>
          </div>

          {/* Branch Details — 2/5 */}
          <div className="lg:col-span-2 bg-slate-50 rounded-2xl border border-slate-100 p-6 space-y-5">
            <div>
              <h3 className="text-slate-900 font-bold text-lg mb-1">{current.label}</h3>
              <p className="text-slate-600 text-sm">{current.address}</p>
              <p className="text-slate-400 text-sm mt-0.5">{current.addressAr}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-slate-600 text-sm">{current.landmark}</p>
              </div>

              <a
                href={`tel:${current.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-3 group"
              >
                <Phone className="w-4 h-4 text-[#1a6eb5] shrink-0" />
                <span className="text-slate-700 font-medium text-sm group-hover:text-[#1a6eb5] transition-colors">
                  {current.phone}
                </span>
              </a>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="space-y-0.5">
                  {current.hours.map((h) => (
                    <div key={h.day} className="text-sm">
                      <span className="text-slate-500">{h.day}: </span>
                      <span className="text-slate-800 font-medium">{h.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <a
                href={`https://www.google.com/maps/search/${encodeURIComponent(current.address + ", Jordan")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#1a6eb5] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#155da0] transition-colors"
              >
                <Navigation className="w-4 h-4" />
                {locations.buttons.directions}
              </a>
              <a
                href={global.contact.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1db954] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {locations.buttons.whatsapp}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
