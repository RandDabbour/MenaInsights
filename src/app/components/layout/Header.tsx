import { Link, useLocation, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { useSiteContent } from "../../content/siteContent";

export function Header({ preview = false }: { preview?: boolean }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandVisible, setBrandVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { siteContent } = useSiteContent();
  const headerContent = siteContent.header;

  const navigation = headerContent.navigation.filter((item) => item?.visible !== false);

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }

    return location.pathname === href;
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setBrandVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    setSearchOpen(false);
    setSearchQuery("");
  }, [location.pathname]);

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/insights?q=${encodeURIComponent(q)}` : "/insights");
    setSearchOpen(false);
  };

  const brandLines = [
    {
      text: headerContent.brandLines[0] || "",
      className:
        "text-[0.66rem] font-medium uppercase tracking-[0.26em] text-white/74 sm:text-[0.72rem]",
    },
    {
      text: headerContent.brandLines[1] || "",
      className:
        "text-[1.3rem] font-semibold uppercase leading-[0.9] tracking-[0.01em] text-[#d4af37] sm:text-[1.7rem]",
    },
    {
      text: headerContent.brandLines[2] || "",
      className:
        "text-[1.15rem] font-semibold uppercase leading-[0.92] tracking-[0.01em] text-[#dbe5f5] sm:text-[1.5rem]",
    },
  ];

  return (
    <header
      className={`${preview ? "relative z-10" : "sticky top-0 z-50"} border-b border-white/10 bg-[#111a34] text-white shadow-[0_18px_60px_rgba(8,13,27,0.35)]`}
    >
      <nav className="relative mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
        <div className="relative flex h-[88px] items-center justify-between gap-6">
          <Link to="/" className="relative flex h-full items-center pl-4 pr-4 lg:pl-10">
            <div
              aria-hidden="true"
              className="absolute inset-x-0 top-5 -bottom-[30px] rounded-b-[100px] bg-[#111a34]"
            />
            <div className="relative leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              {brandLines.map((line, index) => (
                <span
                  key={line.text}
                  className={`block transform-gpu transition-all duration-[800ms] ease-out will-change-transform ${
                    brandVisible ? "translate-y-0 opacity-100" : "-translate-y-12 opacity-0"
                  } ${line.className}`}
                  style={{ transitionDelay: `${index * 140}ms` }}
                >
                  {line.text}
                </span>
              ))}
            </div>
          </Link>

          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`border-b-2 px-3 py-2 text-[15px] font-medium transition-colors ${
                  isActive(item.href)
                    ? "border-white text-white"
                    : "border-transparent text-white/78 hover:text-white"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="relative flex items-center gap-2">
            <Link
              to="/request-analysis"
              className="hidden lg:inline-flex items-center justify-center rounded-lg bg-[#d4af37] px-4 py-2 text-[13px] font-semibold text-[#111a34] transition-colors hover:bg-[#e1be4f]"
            >
              {headerContent.ctaText}
            </Link>
            <button
              type="button"
              onClick={() => setSearchOpen((previous) => !previous)}
              aria-label={headerContent.searchAriaLabel}
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-white/15 text-white/85 transition-colors hover:border-white/30 hover:text-white lg:inline-flex"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-full border border-white/15 p-2 text-white transition-colors hover:border-white/30 hover:bg-white/5 lg:hidden"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {searchOpen ? (
              <form
                onSubmit={submitSearch}
                className="absolute right-0 top-[calc(100%+8px)] hidden w-[320px] items-center gap-2 rounded-xl border border-white/15 bg-[#0f1830] p-2 shadow-2xl lg:flex"
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search insights..."
                  className="h-10 w-full rounded-lg border border-white/15 bg-white/5 px-3 text-sm text-white placeholder:text-white/55 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/60"
                />
                <button
                  type="submit"
                  className="h-10 shrink-0 rounded-lg bg-[#d4af37] px-3 text-xs font-semibold text-[#111a34] hover:bg-[#e1be4f]"
                >
                  Go
                </button>
              </form>
            ) : null}
          </div>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="border-t border-white/10 bg-[#111a34] lg:hidden">
          <div className="space-y-1 px-6 py-4">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-white/10 text-white"
                    : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/request-analysis"
              className="mt-3 block rounded-lg border border-white/15 px-4 py-2.5 text-center text-[14px] font-medium text-white"
              onClick={() => setMobileMenuOpen(false)}
            >
              {headerContent.ctaText}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
