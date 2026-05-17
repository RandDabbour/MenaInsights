import { Link } from "react-router";
import { Linkedin, Twitter, Mail } from "lucide-react";
import { useSiteContent } from "../../content/siteContent";

export function Footer() {
  const { siteContent } = useSiteContent();
  const footerContent = siteContent.footer;
  const servicesLinks = footerContent.servicesLinks.filter((item) => item?.visible !== false);
  const resourcesLinks = footerContent.resourcesLinks.filter((item) => item?.visible !== false);
  const connectLinks = footerContent.connectLinks.filter((item) => item?.visible !== false);

  return (
    <footer className="bg-[#111a34] border-t border-white/10">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                <span className="text-white text-[11px] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>{footerContent.brandShort}</span>
              </div>
              <span className="text-white text-sm font-semibold tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{footerContent.brandName}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {footerContent.description}
            </p>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{footerContent.servicesTitle}</h3>
            <ul className="space-y-3 text-sm">
              {servicesLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-gray-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{footerContent.resourcesTitle}</h3>
            <ul className="space-y-3 text-sm">
              {resourcesLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-gray-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4 text-sm">{footerContent.connectTitle}</h3>
            <ul className="space-y-3 text-sm mb-6">
              {connectLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.href} className="text-gray-400 hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <a href={footerContent.social.linkedinUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href={footerContent.social.twitterUrl} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <Twitter className="w-4 h-4" />
              </a>
              <a href={`mailto:${footerContent.social.email}`} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">{footerContent.copyright}</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-300 transition-colors">{footerContent.privacyLabel}</Link>
            <Link to="/terms" className="hover:text-gray-300 transition-colors">{footerContent.termsLabel}</Link>
            <Link to="/payment-policy" className="hover:text-gray-300 transition-colors">
              {footerContent.paymentPolicyLabel || "Payment & Refund Policy"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
