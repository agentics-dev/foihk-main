import { Link as RouterLink, LinkProps } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import React from "react";

export const LocalizedLink = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, ...props }, ref) => {
    const { language } = useLanguage();
    
    let path = typeof to === "string" ? to : to.pathname || "";
    
    // Add language prefix for root-relative public paths
    if (path.startsWith("/") && !path.startsWith("/admin")) {
      // Avoid double prefixing if it already has one
      if (!path.startsWith(`/${language}`) && !path.startsWith("/en") && !path.startsWith("/zh-hk") && !path.startsWith("/zh-cn")) {
        path = `/${language}${path === "/" ? "" : path}`;
      }
    }
    
    return <RouterLink ref={ref} to={path} {...props} />;
  }
);
LocalizedLink.displayName = "LocalizedLink";
