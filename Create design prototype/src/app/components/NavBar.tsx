import { useState, useEffect } from "react";
import { Phone, MessageCircle, Menu, X, Heart } from "lucide-react";
import { useSiteData } from "../context/DataContext";

export function NavBar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { nav, global, locale, setLocale } = useSiteData();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-white/95 backdrop-blur-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <a href="#" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#1a6eb5] flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <div className="leading-tight">
              <div className="text-[#1a6eb5] font-semibold text-base tracking-tight">{global.clinicName}</div>
              <div className="text-slate-400 text-[10px] tracking-wide">{global.clinicNameAr}</div>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {nav.links.map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-slate-600 hover:text-[#1a6eb5] text-sm transition-colors duration-200 font-medium"
              >
                {link}
              </a>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === "en" ? "ar" : "en")}
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
            >
              {locale === "en" ? "عربي" : "EN"}
            </button>
            <a
              href={global.contact.phoneLink}
              className="flex items-center gap-1.5 text-sm text-slate-700 hover:text-[#1a6eb5] transition-colors font-medium"
            >
              <Phone className="w-4 h-4" />
              <span>{global.contact.phone}</span>
            </a>
            <a
              href={global.contact.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 bg-[#25D366] hover:bg-[#1db954] text-white text-sm px-3 py-2 rounded-lg transition-colors font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{nav.whatsappText}</span>
            </a>
            <a
              href="#contact"
              className="bg-[#1a6eb5] hover:bg-[#155da0] text-white text-sm px-4 py-2 rounded-lg transition-colors font-semibold"
            >
              {nav.bookText}
            </a>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-slate-600 hover:text-[#1a6eb5]"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-4 space-y-3">
          {nav.links.map((link) => (
            <a
              key={link}
              href={`#${link.toLowerCase()}`}
              className="block text-slate-600 hover:text-[#1a6eb5] text-sm font-medium py-1"
              onClick={() => setMenuOpen(false)}
            >
              {link}
            </a>
          ))}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <button
              onClick={() => {
                setLocale(locale === "en" ? "ar" : "en");
                setMenuOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 text-sm px-4 py-2.5 rounded-lg font-bold"
            >
              {locale === "en" ? "التبديل للعربية" : "Switch to English"}
            </button>
            <a
              href={global.contact.phoneLink}
              className="flex items-center gap-2 text-sm text-slate-700 font-medium"
            >
              <Phone className="w-4 h-4" />
              {global.contact.phone}
            </a>
            <a
              href={global.contact.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm px-4 py-2.5 rounded-lg font-medium"
            >
              <MessageCircle className="w-4 h-4" />
              {nav.whatsappUsText}
            </a>
            <a
              href="#contact"
              className="block text-center bg-[#1a6eb5] text-white text-sm px-4 py-2.5 rounded-lg font-semibold"
              onClick={() => setMenuOpen(false)}
            >
              {nav.bookText}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
