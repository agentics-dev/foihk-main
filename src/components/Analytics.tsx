import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

const AI_REFERRERS = [
  "chatgpt.com",
  "perplexity.ai",
  "gemini.google.com",
  "claude.ai",
  "copilot.microsoft.com",
];

const classifyReferral = () => {
  if (!document.referrer) return "direct";
  try {
    const hostname = new URL(document.referrer).hostname;
    return AI_REFERRERS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
      ? "ai_referral"
      : "referral";
  } catch {
    return "unknown";
  }
};

export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID;
    const analyticsEnabled = import.meta.env.VITE_ENABLE_ANALYTICS === "true";
    if (!analyticsEnabled || !/^G-[A-Z0-9]+$/.test(measurementId || "")) return;

    const analyticsWindow = window as AnalyticsWindow;
    if (!document.querySelector(`script[data-foihk-ga="${measurementId}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
      script.dataset.foihkGa = measurementId;
      document.head.appendChild(script);

      analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
      analyticsWindow.gtag = (...args: unknown[]) => analyticsWindow.dataLayer?.push(args);
      analyticsWindow.gtag("js", new Date());
      analyticsWindow.gtag("config", measurementId, { send_page_view: false });
    }

    analyticsWindow.gtag?.("event", "page_view", {
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
      traffic_source_type: classifyReferral(),
    });
  }, [location.pathname, location.search]);

  return null;
};
