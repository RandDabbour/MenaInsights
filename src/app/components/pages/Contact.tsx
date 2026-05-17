import { Mail, Clock, Linkedin, Globe, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { useSiteContent } from "../../content/siteContent";

export function Contact() {
  const { siteContent } = useSiteContent();
  const content = siteContent.pages.contact;
  const footer = siteContent.footer;
  const fallbackChannels = [
    {
      label: content.emailLabel,
      value: footer.social.email,
      href: `mailto:${footer.social.email}`,
      type: "email",
      visible: true,
    },
    {
      label: content.linkedinLabel,
      value: content.linkedinCta,
      href: footer.social.linkedinUrl,
      type: "linkedin",
      visible: true,
    },
  ];
  const channels = Array.isArray(content.channels) && content.channels.length ? content.channels : fallbackChannels;
  const visibleChannels = channels.filter((channel) => channel?.visible !== false);
  const [formData, setFormData] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const getChannelIcon = (type: string) => {
    const normalized = String(type || "").trim().toLowerCase();
    if (normalized === "email") {
      return Mail;
    }
    if (normalized === "linkedin") {
      return Linkedin;
    }
    if (normalized === "phone" || normalized === "whatsapp" || normalized === "telegram") {
      return Phone;
    }
    if (normalized === "chat" || normalized === "message") {
      return MessageCircle;
    }
    return Globe;
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setSubmitted(true); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (submitted) {
    return (
      <div className="bg-white min-h-[80vh] flex items-center justify-center">
        <div className="mx-auto max-w-md px-6 text-center">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a2740] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{content.submittedTitle}</h1>
          <p className="text-gray-600 leading-relaxed">{content.submittedDescription}</p>
        </div>
      </div>
    );
  }

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent hover:border-gray-300 transition-colors";

  return (
    <div className="bg-white">
      <section className="bg-[#1a2740] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide mb-3">{content.header.eyebrow}</p>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{content.header.title}</h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">{content.header.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-12">
          <div>
            <h2 className="text-lg font-bold text-[#1a2740] mb-6">{content.infoTitle}</h2>
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              {content.channelsTitle || "Communication Channels"}
            </p>
            <div className="space-y-6">
              {visibleChannels.map((channel, index) => {
                const Icon = getChannelIcon(channel.type || "");
                const href = String(channel.href || "").trim();
                const linkText = String(channel.value || href || "").trim();
                const isExternal = href.startsWith("http://") || href.startsWith("https://");

                return (
                  <div className="flex gap-4" key={`${channel.label}-${channel.href}-${index}`}>
                    <Icon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#1a2740] mb-0.5">{channel.label}</h4>
                      {href ? (
                        <a
                          href={href}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noreferrer" : undefined}
                          className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          {linkText || href}
                        </a>
                      ) : (
                        <p className="text-sm text-gray-600">{linkText}</p>
                      )}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-4">
                <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-[#1a2740] mb-0.5">{content.responseLabel}</h4>
                  <p className="text-sm text-gray-600">{content.responseText}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-xl">
              <h4 className="text-sm font-semibold text-[#1a2740] mb-2">{content.sidebarCard.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{content.sidebarCard.description}</p>
              <Link
                to="/request-analysis"
                className="block text-center bg-[#1a2740] text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243352] transition-colors"
              >
                {content.sidebarCard.cta}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="border border-gray-200 rounded-xl p-8">
              <h3 className="text-lg font-bold text-[#1a2740] mb-6">{content.formTitle}</h3>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm text-gray-700 mb-1.5">{content.fields.name}</label>
                    <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm text-gray-700 mb-1.5">{content.fields.email}</label>
                    <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm text-gray-700 mb-1.5">{content.fields.subject}</label>
                  <select id="subject" name="subject" required value={formData.subject} onChange={handleChange} className={inputClass}>
                    {content.subjectOptions.map((option) => (
                      <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm text-gray-700 mb-1.5">{content.fields.message}</label>
                  <textarea id="message" name="message" required rows={5} value={formData.message} onChange={handleChange} className={inputClass + " resize-none"} placeholder={content.messagePlaceholder} />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <p className="text-xs text-gray-500">{content.requiredLabel}</p>
                  <button type="submit" className="bg-[#1a2740] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-[#243352] transition-colors">
                    {content.submitLabel}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
