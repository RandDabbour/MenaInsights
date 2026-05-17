import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { Homepage } from "./components/pages/Homepage";
import { Insights } from "./components/pages/Insights";
import { MediaLandscapes } from "./components/pages/MediaLandscapes";
import { Profiles } from "./components/pages/Profiles";
import { StrategicBriefs } from "./components/pages/StrategicBriefs";
import { Services } from "./components/pages/Services";
import { RequestAnalysis } from "./components/pages/RequestAnalysis";
import { About } from "./components/pages/About";
import { Contact } from "./components/pages/Contact";
import { Privacy } from "./components/pages/Privacy";
import { Terms } from "./components/pages/Terms";
import { PaymentPolicy } from "./components/pages/PaymentPolicy";
import { RequestPortal } from "./components/pages/RequestPortal";
import { AdminPortal } from "./components/pages/AdminPortal";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Homepage },
      { path: "insights", Component: Insights },
      { path: "media-landscapes", Component: MediaLandscapes },
      { path: "profiles", Component: Profiles },
      { path: "strategic-briefs", Component: StrategicBriefs },
      { path: "services", Component: Services },
      { path: "request-analysis", Component: RequestAnalysis },
      { path: "request/:token", Component: RequestPortal },
      { path: "admin", Component: AdminPortal },
      { path: "about", Component: About },
      { path: "contact", Component: Contact },
      { path: "privacy", Component: Privacy },
      { path: "terms", Component: Terms },
      { path: "payment-policy", Component: PaymentPolicy },
    ],
  },
]);
