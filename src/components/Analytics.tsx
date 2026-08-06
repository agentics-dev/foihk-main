import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

type AnalyticsWindow = Window & {
  dataLayer?: unknown[][];
  gtag?: (...args: unknown[]) => void;
};

const AI_REFERRERS = [
  { source: "chatgpt", domains: ["chatgpt.com", "chat.openai.com"] },
  { source: "perplexity", domains: ["perplexity.ai"] },
  { source: "claude", domains: ["claude.ai"] },
  { source: "copilot", domains: ["copilot.microsoft.com", "copilot.cloud.microsoft"] },
  { source: "gemini", domains: ["gemini.google.com"] },
] as const;

const matchesDomain = (hostname: string, domain: string) =>
  hostname === domain || hostname.endsWith(`.${domain}`);

const classifyReferral = () => {
  if (!document.referrer) {
    return { trafficSourceType: "direct", aiReferralSource: "not_applicable", referralHostname: "direct" };
  }

  try {
    const hostname = new URL(document.referrer).hostname.toLowerCase();
    const aiReferrer = AI_REFERRERS.find(({ domains }) =>
      domains.some((domain) => matchesDomain(hostname, domain)),
    );

    return {
      trafficSourceType: aiReferrer ? "ai_referral" : "referral",
      aiReferralSource: aiReferrer?.source ?? "not_applicable",
      referralHostname: hostname,
    };
  } catch {
    return { trafficSourceType: "unknown", aiReferralSource: "not_applicable", referralHostname: "unknown" };
  }
};

const markAiReferralReported = () => {
  const key = "foihk-ai-referral-reported";
  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "true");
    return true;
  } catch {
    return true;
  }
};

export const Analytics = () => {
  const location = useLocation();
  const previousPage = useRef(document.referrer || undefined);

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
      analyticsWindow.gtag("config", measurementId, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
    }

    const referral = classifyReferral();
    analyticsWindow.gtag?.("event", "page_view", {
      page_location: window.location.href,
      page_path: `${location.pathname}${location.search}`,
      page_title: document.title,
      page_referrer: previousPage.current,
      traffic_source_type: referral.trafficSourceType,
      ai_referral_source: referral.aiReferralSource,
      referral_hostname: referral.referralHostname,
    });

    if (referral.trafficSourceType === "ai_referral" && markAiReferralReported()) {
      analyticsWindow.gtag?.("event", "ai_referral_landing", {
        ai_referral_source: referral.aiReferralSource,
        referral_hostname: referral.referralHostname,
        landing_page: `${location.pathname}${location.search}`,
        site_language: location.pathname.split("/")[1] || "unknown",
      });
    }

    previousPage.current = window.location.href;
  }, [location.pathname, location.search]);

  return null;
};
