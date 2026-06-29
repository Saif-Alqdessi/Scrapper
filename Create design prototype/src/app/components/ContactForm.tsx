import { useState } from "react";
import { Phone, MessageCircle, Mail, Clock, Send, CheckCircle } from "lucide-react";
import { useSiteData } from "../context/DataContext";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "+962",
    email: "",
    branch: "",
    department: "",
    message: "",
    contactMethod: "phone",
  });

  const { contactForm, global } = useSiteData();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white rounded-2xl p-12 border border-slate-100 shadow-sm">
            <CheckCircle className="w-16 h-16 text-[#0d9b8d] mx-auto mb-4" />
            <h3 className="text-2xl text-slate-900 font-bold mb-3">{contactForm.successMessage.heading}</h3>
            <p className="text-slate-600">
              {contactForm.successMessage.text}
            </p>
            <button
              onClick={() => setSubmitted(false)}
              className="mt-6 bg-[#1a6eb5] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#155da0] transition-colors"
            >
              {contactForm.successMessage.buttonText}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="contact" className="py-20 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center bg-[#1a6eb5]/10 text-[#1a6eb5] text-sm px-4 py-1.5 rounded-full font-medium mb-4">
            <Mail className="w-4 h-4 mr-1.5" />
            {contactForm.badge}
          </div>
          <h2 className="text-3xl lg:text-4xl text-slate-900 mb-4">{contactForm.heading}</h2>
          <p className="text-slate-600 text-base">
            {contactForm.description}
            <br />
            {contactForm.descriptionAr}
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-10 items-start">
          {/* Form — 2/3 */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {contactForm.formFields.nameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder={contactForm.formFields.namePlaceholder}
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/30 focus:border-[#1a6eb5] transition"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {contactForm.formFields.phoneLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/30 focus:border-[#1a6eb5] transition"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {contactForm.formFields.emailLabel} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={contactForm.formFields.emailPlaceholder}
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/30 focus:border-[#1a6eb5] transition"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-5">
                {/* Branch */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {contactForm.formFields.branchLabel}
                  </label>
                  <select
                    name="branch"
                    value={form.branch}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/30 focus:border-[#1a6eb5] transition bg-white"
                  >
                    <option value="">{contactForm.formFields.branchPlaceholder}</option>
                    {contactForm.formFields.branches.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                {/* Department */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    {contactForm.formFields.departmentLabel}
                  </label>
                  <select
                    name="department"
                    value={form.department}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/30 focus:border-[#1a6eb5] transition bg-white"
                  >
                    <option value="">{contactForm.formFields.departmentPlaceholder}</option>
                    {contactForm.formFields.departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {contactForm.formFields.messageLabel}
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder={contactForm.formFields.messagePlaceholder}
                  value={form.message}
                  onChange={handleChange}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1a6eb5]/30 focus:border-[#1a6eb5] transition resize-none"
                />
              </div>

              {/* Preferred Contact Method */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {contactForm.formFields.methodLabel}
                </label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(contactForm.formFields.methods).map(([method, label]) => (
                    <label
                      key={method}
                      className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        form.contactMethod === method
                          ? "bg-[#1a6eb5] border-[#1a6eb5] text-white"
                          : "bg-white border-slate-200 text-slate-600 hover:border-[#1a6eb5]/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="contactMethod"
                        value={method}
                        checked={form.contactMethod === method}
                        onChange={handleChange}
                        className="hidden"
                      />
                      {method === "phone" ? <Phone className="w-4 h-4" /> : method === "whatsapp" ? <MessageCircle className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-[#1a6eb5] hover:bg-[#155da0] text-white py-3.5 rounded-xl font-semibold transition-colors shadow-lg shadow-[#1a6eb5]/20 text-sm"
              >
                <Send className="w-4 h-4" />
                {contactForm.formFields.submitText}
              </button>
              <p className="text-center text-slate-400 text-xs">
                {contactForm.formFields.privacyText}
              </p>
            </form>
          </div>

          {/* Contact Info Sidebar — 1/3 */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-slate-900 font-semibold text-base mb-5">{contactForm.sidebar.heading}</h3>
              <div className="space-y-4">
                <a
                  href={global.contact.phoneLink}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 bg-[#1a6eb5]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5 text-[#1a6eb5]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">{contactForm.sidebar.mainPhoneLabel}</div>
                    <div className="text-slate-800 font-semibold text-sm group-hover:text-[#1a6eb5] transition-colors">{global.contact.phone}</div>
                  </div>
                </a>

                <a
                  href={global.contact.whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 bg-[#25D366]/10 rounded-xl flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5 text-[#25D366]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">{contactForm.sidebar.whatsappLabel}</div>
                    <div className="text-slate-800 font-semibold text-sm group-hover:text-[#25D366] transition-colors">{global.contact.whatsapp}</div>
                  </div>
                </a>

                <a
                  href={global.contact.emailLink}
                  className="flex items-start gap-3 group"
                >
                  <div className="w-10 h-10 bg-[#0d9b8d]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5 text-[#0d9b8d]" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">{contactForm.sidebar.emailLabel}</div>
                    <div className="text-slate-800 font-semibold text-sm group-hover:text-[#0d9b8d] transition-colors">{global.contact.email}</div>
                  </div>
                </a>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-0.5">{contactForm.sidebar.responseTimeLabel}</div>
                    <div className="text-slate-800 font-semibold text-sm">{contactForm.sidebar.responseTimeValue}</div>
                    <div className="text-slate-400 text-xs">{contactForm.sidebar.responseTimeSub}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a6eb5] to-[#0d9b8d] rounded-2xl p-6 text-white">
              <p className="font-semibold mb-1">{contactForm.sidebar.whatsappPromo.heading}</p>
              <p className="text-blue-100 text-sm mb-4">
                {contactForm.sidebar.whatsappPromo.text}
              </p>
              <a
                href={global.contact.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1db954] text-white py-2.5 rounded-xl font-semibold text-sm transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                {contactForm.sidebar.whatsappPromo.buttonText}
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
