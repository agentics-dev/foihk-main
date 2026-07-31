import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    
    // Use matchMedia change event instead of direct width check to avoid forced reflows
    mql.addEventListener("change", onChange);
    
    // Initial check using requestAnimationFrame to avoid forced reflow during render
    const checkInitial = () => {
      requestAnimationFrame(() => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      });
    };
    checkInitial();
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
