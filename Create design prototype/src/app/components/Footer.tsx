import { Heart, Facebook, Instagram, MessageCircle, Phone, Mail, MapPin } from "lucide-react";
import { useSiteData } from "../context/DataContext";

export function Footer() {
  const { footer, global, locations } = useSiteData();

  return (
    <footer className="bg-slate-900 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Logo + Tagline */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-lg bg-[#1a6eb5] flex items-center justify-center">
                <Heart className="w-5 h-5 text-white fill-white" />
              </div>
              <div>
                <div className="text-white font-semibold text-base">{global.clinicName}</div>
                <div className="text-slate-400 text-[10px]">{global.clinicNameAr}</div>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              {footer.description} {global.foundedYear}.
            </p>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href={global.contact.facebook}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 bg-[#1877F2] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <Facebook className="w-4 h-4 text-white" />
              </a>
              <a
                href={global.contact.instagram}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
                style={{ background: "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)" }}
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>
              <a
                href={global.contact.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 bg-[#25D366] rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity"
              >
                <MessageCircle className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{footer.quickLinksHeading}</h4>
            <ul className="space-y-2.5">
              {footer.quickLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-slate-400 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Branch Addresses */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{footer.branchesHeading}</h4>
            <ul className="space-y-4">
              {locations.branches.map((b) => (
                <li key={b.id} className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#1a6eb5] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-white text-sm font-medium">{b.label.replace(' Branch', '')}</div>
                    <div className="text-slate-400 text-xs leading-snug">{b.address}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-4">{footer.contactHeading}</h4>
            <ul className="space-y-3">
              <li>
                <a href={global.contact.phoneLink} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                  <Phone className="w-4 h-4" />
                  {global.contact.phone}
                </a>
              </li>
              <li>
                <a href={global.contact.whatsappLink} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  {global.contact.whatsapp}
                </a>
              </li>
              <li>
                <a href={global.contact.emailLink} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
                  <Mail className="w-4 h-4" />
                  {global.contact.email}
                </a>
              </li>
            </ul>

            {/* Accreditation */}
            <div className="mt-6 bg-white/5 border border-white/10 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">{footer.accreditation.title}</p>
              <p className="text-white text-xs font-semibold">{footer.accreditation.regNo}</p>
              <p className="text-slate-500 text-[10px] mt-0.5">{footer.accreditation.member}</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} {footer.copyright}
          </p>
          <p className="text-slate-600 text-xs">
            {footer.servedAreas}
          </p>
        </div>
      </div>
    </footer>
  );
}
