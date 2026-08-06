import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider, Language } from "@/contexts/LanguageContext";
import { HelmetProvider } from "react-helmet-async";
import BackToTop from "@/components/BackToTop";
import { Analytics } from "@/components/Analytics";
import { lazy, Suspense } from "react";

// Powered by General Agentics
// Lazy load route components for better code splitting
const Home = lazy(() => import("./pages/Home"));
const Auth = lazy(() => import("./pages/Auth"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const About = lazy(() => import("./pages/About"));
const Philanthropy = lazy(() => import("./pages/Philanthropy"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const RootRedirect = () => {
  let lang: Language = "en";
  try {
    const stored = localStorage.getItem("foihk-language");
    if (stored === "en" || stored === "zh-hk" || stored === "zh-cn") {
      lang = stored as Language;
    }
  } catch {
    // Browser storage may be unavailable in privacy-restricted contexts.
  }
  return <Navigate to={`/${lang}`} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageProvider>
            <Analytics />
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>}>
              <Routes>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/:lang">
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                  <Route path="philanthropy" element={<Philanthropy />} />
                  <Route path="contact" element={<Contact />} />
                  <Route path="faq" element={<FAQ />} />
                  <Route path="articles/:category" element={<Articles />} />
                  <Route path="articles/:category/:articleKey" element={<ArticleDetail />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
                <Route path="/admin-login" element={<Auth />} />
                <Route path="/admin" element={<Auth />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BackToTop />
            </Suspense>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
