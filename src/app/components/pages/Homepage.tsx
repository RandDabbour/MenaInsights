import { Link } from "react-router";
import { ArrowRight, BarChart3, FileText, TrendingUp, Globe2 } from "lucide-react";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useSiteContent } from "../../content/siteContent";
import heroScene from "../../../imports/image copy.png";

const SERVICE_ICONS = [BarChart3, FileText, TrendingUp, Globe2];

export function Homepage() {
  const { siteContent } = useSiteContent();
  const homepage = siteContent.pages.homepage;
  const showReportPrices = homepage.reportsIntro.showPrices !== false;
  const heroOverlay = homepage.heroOverlay || {};
  const heroShowText = heroOverlay.showText === true;
  const heroTitle = String(heroOverlay.title || "").trim();
  const heroSubtitle = String(heroOverlay.subtitle || "").trim();
  const rawHeroOpacity = Number(heroOverlay.imageOpacity);
  const heroImageOpacity = Number.isFinite(rawHeroOpacity)
    ? Math.max(0, Math.min(100, rawHeroOpacity))
    : 100;

  const services = homepage.services.map((service, index) => ({
    ...service,
    icon: SERVICE_ICONS[index % SERVICE_ICONS.length],
  }));

  return (
    <div className="bg-white">
      <section className="bg-[#efe7df]">
        <div className="relative mx-auto max-w-[1536px]">
          <ImageWithFallback
            src={homepage.heroImage || heroScene}
            alt={homepage.heroAlt}
            className="block w-full h-auto"
            style={{ opacity: heroImageOpacity / 100 }}
          />
          {heroShowText && (heroTitle || heroSubtitle) ? (
            <div className="pointer-events-none absolute inset-0 flex items-start justify-center px-6 pt-10 text-center sm:pt-14">
              <div className="max-w-3xl rounded-2xl bg-[#111a34]/45 px-5 py-4 backdrop-blur-[2px]">
                {heroTitle ? (
                  <h1
                    className="text-2xl font-semibold text-white sm:text-4xl"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {heroTitle}
                  </h1>
                ) : null}
                {heroSubtitle ? <p className="mt-2 text-sm text-white/90 sm:text-base">{heroSubtitle}</p> : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{homepage.servicesIntro.eyebrow}</p>
            <h2 className="text-3xl font-bold text-[#1a2740] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
              {homepage.servicesIntro.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">{homepage.servicesIntro.description}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, idx) => (
              <Link
                key={`${service.title}-${idx}`}
                to="/request-analysis"
                className="group relative p-6 rounded-2xl border border-gray-200 hover:border-[#1a2740]/20 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300"
              >
                <div className="w-11 h-11 rounded-xl bg-[#1a2740] flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <service.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-[#1a2740] font-semibold mb-2 group-hover:text-blue-700 transition-colors">{service.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.description}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[#1a2740]/75">Inquire for proposal</span>
                  <span className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                    {service.cta} <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 bg-gray-50/70">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{homepage.reportsIntro.eyebrow}</p>
              <h2 className="text-3xl font-bold text-[#1a2740]" style={{ fontFamily: "'Playfair Display', serif" }}>
                {homepage.reportsIntro.title}
              </h2>
              <p className="text-gray-500 mt-3 max-w-lg">{homepage.reportsIntro.description}</p>
            </div>
            <Link to="/services" className="hidden sm:flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#1a2740] group transition-colors">
              {homepage.reportsIntro.viewAllLabel}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {homepage.reports.map((item, idx) => (
              <article key={`${item.title}-${idx}`} className="group bg-white rounded-2xl overflow-hidden border border-gray-200/80 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg text-[11px] font-semibold text-[#1a2740] uppercase tracking-wide">
                      {item.category}
                    </span>
                  </div>
                  {showReportPrices ? (
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 bg-[#1a2740]/90 backdrop-blur-sm rounded-lg text-[11px] font-semibold text-white">
                        {item.price}
                      </span>
                    </div>
                  ) : null}
                </div>
                <div className="p-6">
                  <h3 className="text-[#1a2740] font-semibold leading-snug mb-3 group-hover:text-blue-700 transition-colors">{item.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{item.date}</span>
                    <Link to="/request-analysis" className="text-xs font-semibold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                      {item.cta} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <div className="sm:hidden mt-8 text-center">
            <Link to="/services" className="text-sm font-medium text-blue-600">{homepage.reportsIntro.viewAllLabel} →</Link>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{homepage.coverage.eyebrow}</p>
              <h2 className="text-3xl font-bold text-[#1a2740] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
                {homepage.coverage.title}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">{homepage.coverage.description}</p>
              <p className="text-gray-500 text-sm leading-relaxed mb-8">{homepage.coverage.secondary}</p>
              <div className="flex flex-wrap gap-2 mb-8">
                {homepage.coverage.regions.map((region) => (
                  <span key={region} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-[#1a2740] hover:text-white transition-colors duration-200 cursor-default">
                    {region}
                  </span>
                ))}
              </div>
              <Link
                to="/request-analysis"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {homepage.coverage.cta} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl overflow-hidden h-48">
                <ImageWithFallback src={homepage.coverage.gallery[0]?.src || ""} alt={homepage.coverage.gallery[0]?.alt || ""} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden h-48">
                <ImageWithFallback src={homepage.coverage.gallery[1]?.src || ""} alt={homepage.coverage.gallery[1]?.alt || ""} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="rounded-2xl overflow-hidden h-52 col-span-2">
                <ImageWithFallback src={homepage.coverage.gallery[2]?.src || ""} alt={homepage.coverage.gallery[2]?.alt || ""} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative py-28 overflow-hidden bg-[#1a2740]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-30%] left-[50%] w-[600px] h-[600px] bg-blue-600/[0.06] rounded-full blur-[100px]" />
        </div>
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        <div className="relative mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
            {homepage.cta.title}
          </h2>
          <p className="text-gray-400 text-lg mb-4 max-w-xl mx-auto leading-relaxed">{homepage.cta.description}</p>
          <p className="text-gray-500 text-sm mb-10">{homepage.cta.note}</p>
          <div className="flex flex-col sm:flex-row gap-3.5 justify-center">
            <Link to="/request-analysis" className="inline-flex items-center justify-center bg-white text-[#1a2740] px-7 py-3.5 rounded-xl font-semibold text-[15px] hover:bg-gray-100 transition-colors shadow-lg shadow-black/20">
              {homepage.cta.primaryLabel} <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link to="/services" className="inline-flex items-center justify-center px-7 py-3.5 rounded-xl font-medium text-[15px] border border-white/15 text-gray-300 hover:bg-white/[0.05] transition-colors">
              {homepage.cta.secondaryLabel}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
