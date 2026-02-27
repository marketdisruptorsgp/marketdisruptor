import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { getCanonicalPublishedUrl, isLegacyHost } from "@/lib/publicUrl";

if (typeof window !== "undefined" && isLegacyHost(window.location.hostname)) {
  const targetUrl = `${getCanonicalPublishedUrl()}${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (window.location.href !== targetUrl) {
    window.location.replace(targetUrl);
  }
}

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

