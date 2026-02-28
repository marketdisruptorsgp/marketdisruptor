import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

const SW_RESET_KEY = "md_sw_reset_v3";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      if (!localStorage.getItem(SW_RESET_KEY)) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));

        if ("caches" in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }

        localStorage.setItem(SW_RESET_KEY, "1");
      }

      await navigator.serviceWorker.register("/sw.js");
    } catch {
      // no-op
    }
  });
}
