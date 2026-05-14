import { Outlet } from "react-router";
import { Header } from "./layout/Header";
import { Footer } from "./layout/Footer";
import { SiteContentProvider } from "../content/siteContent";

export function Root() {
  return (
    <SiteContentProvider>
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SiteContentProvider>
  );
}
