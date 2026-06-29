import { ExternalLink } from "lucide-react";
import { useSiteData } from "../context/DataContext";

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(count)].map((_, i) => (
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  const { testimonials } = useSiteData();

  return (
    <section className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center bg-yellow-100 text-yellow-700 text-sm px-4 py-1.5 rounded-full font-medium mb-4">
            {testimonials.badge}
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 mb-4">{testimonials.heading}</h2>
          <p className="text-slate-600 text-base">
            {testimonials.description}
          </p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {testimonials.list.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col"
            >
              <StarRating count={t.rating} />
              <p className="text-slate-600 text-sm leading-relaxed mt-4 flex-1">"{t.text}"</p>
              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-slate-900 font-semibold text-sm">{t.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5">{t.location}</div>
                </div>
                <span className="bg-[#1a6eb5]/10 text-[#1a6eb5] text-xs font-medium px-2.5 py-1 rounded-full">
                  {t.department}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Google Reviews Badge */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-6 py-4 shadow-sm">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <div>
              <div className="flex items-center gap-2">
                <StarRating count={5} />
                <span className="text-slate-800 font-bold text-sm">{testimonials.googleBadge.rating}</span>
              </div>
              <div className="text-slate-500 text-xs mt-0.5">{testimonials.googleBadge.reviewsText}</div>
            </div>
          </div>
          <a
            href={testimonials.googleBadge.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-[#1a6eb5] text-sm font-medium hover:underline underline-offset-4"
          >
            {testimonials.googleBadge.linkText}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
