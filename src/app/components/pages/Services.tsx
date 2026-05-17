import { Link } from "react-router";
import { BarChart3, FileText, TrendingUp, Globe2, Users, Database, ArrowRight } from "lucide-react";
import { useSiteContent } from "../../content/siteContent";

const CARD_ICONS = [BarChart3, FileText, TrendingUp, Globe2, Users, Database];

export function Services() {
  const { siteContent } = useSiteContent();
  const content = siteContent.pages.services;
  const showPricing = content.showPricing === true;
  const hiddenPricingLabel = content.priceHiddenLabel || "Quote provided after your request";

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
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {content.cards.map((service, idx) => {
            const Icon = CARD_ICONS[idx % CARD_ICONS.length];
            return (
              <div key={service.title} className="group border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-300">
                <Icon className="w-8 h-8 text-[#1a2740] mb-4" />
                <h3 className="text-[#1a2740] font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{service.description}</p>

                <ul className="space-y-1.5 mb-6">
                  {service.features.map((feature) => (
                    <li key={feature} className="text-sm text-gray-500 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-sm font-medium text-[#1a2740]">{showPricing ? service.pricing : hiddenPricingLabel}</span>
                  <Link to="/request-analysis" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    {content.cardCtaLabel} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{content.process.eyebrow}</p>
            <h2 className="text-3xl font-bold text-[#1a2740]" style={{ fontFamily: "'Playfair Display', serif" }}>{content.process.title}</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {content.process.steps.map((item) => (
              <div key={item.step}>
                <div className="w-10 h-10 bg-[#1a2740] text-white rounded-lg flex items-center justify-center font-semibold text-sm mb-4">
                  {item.step}
                </div>
                <h4 className="text-[#1a2740] font-semibold mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
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
