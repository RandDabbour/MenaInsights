import { Shield, Target, Globe, BookOpen } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useSiteContent } from "../../content/siteContent";

const VALUE_ICONS = [Shield, Target, Globe, BookOpen];

export function About() {
  const { siteContent } = useSiteContent();
  const about = siteContent.pages.about;

  return (
    <div className="bg-white">
      <section className="relative h-72 flex items-end overflow-hidden">
        <ImageWithFallback src={about.heroImage} alt={about.heroAlt} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2740] via-[#1a2740]/60 to-transparent" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pb-10 w-full">
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide mb-2">{about.eyebrow}</p>
          <h1 className="text-4xl font-bold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>{about.title}</h1>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid lg:grid-cols-5 gap-16">
          <div className="lg:col-span-3">
            <h2 className="text-2xl font-bold text-[#1a2740] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>{about.introTitle}</h2>
            <div className="space-y-5 text-gray-600 leading-relaxed">
              {about.introParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
              <h3 className="text-lg font-bold text-[#1a2740] mb-6">{about.atGlanceTitle}</h3>
              <div className="space-y-6">
                {about.atGlanceItems.map((item) => (
                  <div key={item.label}>
                    <div className="text-3xl font-bold text-[#1a2740]">{item.value}</div>
                    <div className="text-sm text-gray-600">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{about.valuesIntro.eyebrow}</p>
            <h2 className="text-3xl font-bold text-[#1a2740]" style={{ fontFamily: "'Playfair Display', serif" }}>{about.valuesIntro.title}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {about.values.map((value, index) => {
              const Icon = VALUE_ICONS[index % VALUE_ICONS.length];
              return (
                <div key={value.title} className="bg-white rounded-xl border border-gray-200 p-6">
                  <Icon className="w-8 h-8 text-[#1a2740] mb-4" />
                  <h3 className="text-[#1a2740] font-semibold mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-[#1a2740] font-semibold mb-4">{about.regionFocusTitle}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {about.regionFocusItems.map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="text-blue-600 mt-0.5">•</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-[#1a2740] font-semibold mb-4">{about.thematicTitle}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {about.thematicItems.map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="text-blue-600 mt-0.5">•</span>{item}</li>
              ))}
            </ul>
          </div>
          <div className="border border-gray-200 rounded-xl p-6">
            <h3 className="text-[#1a2740] font-semibold mb-4">{about.methodologyTitle}</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {about.methodologyItems.map((item) => (
                <li key={item} className="flex items-start gap-2"><span className="text-blue-600 mt-0.5">•</span>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-[#1a2740]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>{about.cta.title}</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">{about.cta.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/request-analysis" className="inline-flex items-center justify-center bg-white text-[#1a2740] px-7 py-3 rounded-lg font-semibold text-[15px] hover:bg-gray-100 transition-colors">{about.cta.primaryLabel}</Link>
            <Link to="/contact" className="inline-flex items-center justify-center px-7 py-3 rounded-lg font-medium text-[15px] border border-gray-600 text-gray-300 hover:bg-white/5 transition-colors">{about.cta.secondaryLabel}</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
