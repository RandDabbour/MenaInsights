import { useSiteContent } from "../../content/siteContent";

export function Privacy() {
  const { siteContent } = useSiteContent();
  const content = siteContent.pages.privacy;

  return (
    <div className="bg-white">
      <section className="bg-[#1a2740] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide mb-3">{content.eyebrow}</p>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {content.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">{content.description}</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 lg:px-8">
        <div className="space-y-8 text-gray-700 leading-relaxed">
          {content.sections.map((section) => (
            <div key={section.title}>
              <h2 className="text-xl font-semibold text-[#1a2740] mb-3">{section.title}</h2>
              <p>{section.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
