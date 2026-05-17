import { Search, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useSiteContent } from "../../content/siteContent";

export function Insights() {
  const { siteContent } = useSiteContent();
  const insightsContent = siteContent.pages.insights;
  const categoryOptions = insightsContent.categories.includes("All")
    ? insightsContent.categories
    : ["All", ...insightsContent.categories];
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  useEffect(() => {
    const q = String(searchParams.get("q") || "").trim();
    if (q) {
      setSearchQuery(q);
      return;
    }
    setSearchQuery("");
  }, [searchParams]);

  useEffect(() => {
    if (!categoryOptions.includes(selectedCategory)) {
      setSelectedCategory("All");
    }
  }, [categoryOptions, selectedCategory]);

  const filteredInsights = insightsContent.items.filter((insight) => {
    const matchesCategory = selectedCategory === "All" || insight.category === selectedCategory;
    const matchesSearch =
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white">
      <section className="bg-[#1a2740] text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <p className="text-blue-300 text-sm font-medium uppercase tracking-wide mb-3">{insightsContent.eyebrow}</p>
          <h1 className="text-4xl font-bold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            {insightsContent.title}
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">{insightsContent.description}</p>
        </div>
      </section>

      <section className="border-b border-gray-200 bg-white sticky top-16 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={insightsContent.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0">
              {categoryOptions.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? "bg-[#1a2740] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredInsights.map((insight, idx) => (
            <article key={`${insight.title}-${idx}`} className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300">
              <div className="relative h-44 overflow-hidden">
                <ImageWithFallback
                  src={insight.image}
                  alt={insight.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-md text-xs font-medium text-[#1a2740]">
                    {insight.category}
                  </span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs text-gray-500">{insight.date}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">{insight.readTime}</span>
                </div>
                <h3 className="text-[#1a2740] font-semibold leading-snug mb-2 group-hover:text-blue-700 transition-colors">
                  {insight.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">{insight.excerpt}</p>
                <Link
                  to={insight.href?.trim() || "/contact"}
                  className="inline-flex text-sm font-medium text-blue-600 items-center gap-1 group-hover:gap-2 transition-all"
                >
                  {insightsContent.readMoreLabel} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {filteredInsights.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500">{insightsContent.noResultsLabel}</p>
          </div>
        )}
      </section>
    </div>
  );
}
