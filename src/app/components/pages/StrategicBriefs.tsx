import { FileText, Clock, Target, TrendingUp, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useSiteContent } from "../../content/siteContent";

const BRIEF_ICONS = [Clock, Target, TrendingUp, FileText];

export function StrategicBriefs() {
  const { siteContent } = useSiteContent();
  const content = siteContent.pages.strategicBriefs;
  const showPricing = content.showPricing === true;
  const hiddenPricingLabel = content.priceHiddenLabel || "Quoted per request";

  return (
    <div className="bg-white">
      <section className="bg-[#1a2740] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide mb-3">{content.eyebrow}</p>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{content.title}</h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">{content.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {content.briefTypes.map((type, idx) => {
            const Icon = BRIEF_ICONS[idx % BRIEF_ICONS.length];
            return (
              <div key={type.title} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all">
                <Icon className="w-8 h-8 text-[#1a2740] mb-4" />
                <h3 className="text-[#1a2740] font-semibold mb-2">{type.title}</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{type.description}</p>
                <div className="pt-4 border-t border-gray-100 space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Turnaround</span><span className="text-[#1a2740] font-medium">{type.turnaround}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">{showPricing ? "Starting at" : "Pricing"}</span><span className="text-[#1a2740] font-medium">{showPricing ? type.price : hiddenPricingLabel}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{content.includes.eyebrow}</p>
            <h2 className="text-3xl font-bold text-[#1a2740]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {content.includes.title}
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl">
            {content.includes.items.map((item) => (
              <div key={item.title} className="bg-white border border-gray-200 rounded-xl p-5">
                <h4 className="text-[#1a2740] font-semibold text-sm mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="max-w-2xl mb-12">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{content.sampleWork.eyebrow}</p>
          <h2 className="text-3xl font-bold text-[#1a2740]" style={{ fontFamily: "'Playfair Display', serif" }}>{content.sampleWork.title}</h2>
        </div>
        <div className="space-y-4">
          {content.sampleWork.items.map((brief) => (
            <div key={brief.title} className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{brief.category}</span>
                    <span className="text-xs text-gray-500">{brief.pages}</span>
                  </div>
                  <h3 className="text-[#1a2740] font-semibold mb-1">{brief.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{brief.excerpt}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#1a2740]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {content.cta.title}
          </h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">{content.cta.description}</p>
          <Link
            to="/request-analysis"
            className="inline-flex items-center justify-center bg-white text-[#1a2740] px-7 py-3 rounded-lg font-semibold text-[15px] hover:bg-gray-100 transition-colors"
          >
            {content.cta.label} <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>
    </div>
  );
}
