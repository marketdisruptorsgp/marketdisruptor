import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTopProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return <>{children}</>;
}
