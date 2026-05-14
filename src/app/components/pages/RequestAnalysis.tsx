import { useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useSiteContent } from "../../content/siteContent";

export function RequestAnalysis() {
  const { siteContent } = useSiteContent();
  const content = siteContent.pages.requestAnalysis;
  const [formData, setFormData] = useState({
    name: "", email: "", organization: "", service: "", region: "", topic: "", urgency: "", description: "", budget: ""
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [accessLink, setAccessLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit request");
      }
      setAccessLink(payload.accessLink || "");
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (submitted) {
    return (
      <div className="bg-white min-h-[80vh] flex items-center justify-center">
        <div className="mx-auto max-w-xl px-6 text-center">
          <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-[#1a2740] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>{content.submittedTitle}</h1>
          <p className="text-gray-600 mb-8 leading-relaxed">{content.submittedDescription}</p>
          {accessLink ? (
            <div className="mb-8">
              <a
                href={accessLink}
                className="inline-flex items-center justify-center rounded-lg bg-[#111a34] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1a2b52]"
              >
                {content.openPortalLabel}
              </a>
              <p className="mt-2 text-xs text-gray-500 break-all">{accessLink}</p>
            </div>
          ) : null}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-left text-sm">
            <h3 className="text-[#1a2740] font-semibold mb-3">{content.nextTitle}</h3>
            <ol className="space-y-2 text-gray-600">
              {content.nextSteps.map((step, index) => (
                <li key={step} className="flex gap-2"><span className="text-blue-600 font-medium">{index + 1}.</span>{step}</li>
              ))}
            </ol>
          </div>
          <div className="mt-6">
            <Link to="/" className="text-sm font-medium text-blue-700 hover:text-blue-800">
              {content.backHomeLabel}
            </Link>
          </div>
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

      <section className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-[#1a2740] mb-4">{content.contactTitle}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm text-gray-700 mb-1.5">{content.labels.fullName}</label>
                <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className={inputClass} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm text-gray-700 mb-1.5">{content.labels.email}</label>
                <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label htmlFor="organization" className="block text-sm text-gray-700 mb-1.5">{content.labels.organization}</label>
                <input type="text" id="organization" name="organization" value={formData.organization} onChange={handleChange} className={inputClass} />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-lg font-bold text-[#1a2740] mb-4">{content.projectTitle}</h2>
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="service" className="block text-sm text-gray-700 mb-1.5">{content.labels.service}</label>
                  <select id="service" name="service" required value={formData.service} onChange={handleChange} className={inputClass}>
                    {content.serviceOptions.map((option) => (
                      <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="urgency" className="block text-sm text-gray-700 mb-1.5">{content.labels.timeline}</label>
                  <select id="urgency" name="urgency" required value={formData.urgency} onChange={handleChange} className={inputClass}>
                    {content.urgencyOptions.map((option) => (
                      <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="region" className="block text-sm text-gray-700 mb-1.5">{content.labels.region}</label>
                <input type="text" id="region" name="region" required placeholder={content.placeholders.region} value={formData.region} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="topic" className="block text-sm text-gray-700 mb-1.5">{content.labels.topic}</label>
                <input type="text" id="topic" name="topic" required placeholder={content.placeholders.topic} value={formData.topic} onChange={handleChange} className={inputClass} />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm text-gray-700 mb-1.5">{content.labels.description}</label>
                <textarea id="description" name="description" required rows={5} placeholder={content.placeholders.description} value={formData.description} onChange={handleChange} className={inputClass + " resize-none"} />
              </div>

              <div>
                <label htmlFor="budget" className="block text-sm text-gray-700 mb-1.5">{content.labels.budget}</label>
                <select id="budget" name="budget" value={formData.budget} onChange={handleChange} className={inputClass}>
                  {content.budgetOptions.map((option) => (
                    <option key={`${option.value}-${option.label}`} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <p className="text-xs text-gray-500">{content.requiredText}</p>
            <button
              type="submit"
              disabled={submitting}
              className="group bg-[#1a2740] text-white px-6 py-3 rounded-lg font-medium text-sm hover:bg-[#243352] transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              {submitting ? content.submittingLabel : content.submitLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
        </form>
      </section>
    </div>
  );
}
