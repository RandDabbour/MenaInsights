import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useSiteContent } from "../../content/siteContent";

export function MediaLandscapes() {
  const { siteContent } = useSiteContent();
  const content = siteContent.pages.mediaLandscapes;

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
          {content.regions.map((region, idx) => (
            <div key={`${region.name}-${idx}`} className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300">
              {region.image ? (
                <div className="h-40 overflow-hidden">
                  <ImageWithFallback src={region.image} alt={region.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              ) : null}
              <div className="p-6">
                <h3 className="text-[#1a2740] font-semibold mb-2">{region.name}</h3>
                <p className="text-sm text-gray-600 mb-4 leading-relaxed">{region.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {region.countries.map((country) => (
                    <span key={country} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{country}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">{content.reportContents.eyebrow}</p>
              <h2 className="text-3xl font-bold text-[#1a2740] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
                {content.reportContents.title}
              </h2>
              <div className="space-y-5">
                {content.reportContents.items.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#1a2740] text-white flex items-center justify-center flex-shrink-0 text-xs mt-0.5">✓</div>
                    <div>
                      <h4 className="text-[#1a2740] font-semibold text-sm mb-0.5">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-8">
              <h3 className="text-lg font-bold text-[#1a2740] mb-3">{content.requestCard.title}</h3>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">{content.requestCard.description}</p>
              <div className="space-y-3 mb-6 text-sm">
                {content.requestCard.pricingRows.map((row) => (
                  <div key={row.label} className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="text-[#1a2740] font-medium">{row.value}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/request-analysis"
                className="block text-center bg-[#1a2740] text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-[#243352] transition-colors"
              >
                {content.requestCard.cta}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
