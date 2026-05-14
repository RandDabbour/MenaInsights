import { User, Building2, Radio, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useSiteContent } from "../../content/siteContent";

const PROFILE_ICONS = [Building2, User, Radio];

export function Profiles() {
  const { siteContent } = useSiteContent();
  const content = siteContent.pages.profiles;

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
        <div className="grid md:grid-cols-3 gap-6">
          {content.profileTypes.map((type, idx) => {
            const Icon = PROFILE_ICONS[idx % PROFILE_ICONS.length];
            return (
              <div key={type.title} className="border border-gray-200 rounded-xl p-6">
                <Icon className="w-8 h-8 text-[#1a2740] mb-4" />
                <h3 className="text-[#1a2740] font-semibold mb-2">{type.title}</h3>
                <p className="text-sm text-gray-600 mb-5 leading-relaxed">{type.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {type.examples.map((example) => (
                    <span key={example} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{example}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{content.sampleWork.eyebrow}</p>
            <h2 className="text-3xl font-bold text-[#1a2740]" style={{ fontFamily: "'Playfair Display', serif" }}>
              {content.sampleWork.title}
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {content.sampleWork.items.map((profile) => (
              <div key={profile.name} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">{profile.type}</span>
                  <span className="text-xs text-gray-500">{profile.region}</span>
                </div>
                <h3 className="text-[#1a2740] font-semibold mb-2">{profile.name}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{profile.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-2xl font-bold text-[#1a2740] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {content.cta.title}
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">{content.cta.description}</p>
            <div className="space-y-3 text-sm mb-8">
              {content.cta.pricingRows.map((row) => (
                <div key={row.label} className="flex justify-between border-b border-gray-100 pb-2">
                  <span className="text-gray-600">{row.label}</span>
                  <span className="text-[#1a2740] font-medium">{row.value}</span>
                </div>
              ))}
            </div>
            <Link
              to="/request-analysis"
              className="inline-flex items-center justify-center bg-[#1a2740] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#243352] transition-colors"
            >
              {content.cta.ctaLabel} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-8">
            <h3 className="text-lg font-bold text-[#1a2740] mb-4">{content.includes.title}</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              {content.includes.items.map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="text-blue-600 mt-0.5">✓</span>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
