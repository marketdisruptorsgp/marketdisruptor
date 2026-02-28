// Silent analytics tracker — zero UI footprint, async batching
// Loaded once in App.tsx, invisible to users

const BATCH_INTERVAL = 5000; // flush every 5s
const MAX_BATCH = 50;
const SESSION_KEY = "md_ax_sid";
const VISITOR_KEY = "md_ax_vid";

interface AnalyticsEvent {
  session_id: string;
  event_type: string;
  element_id?: string;
  section_id?: string;
  page_path?: string;
  timestamp: string;
  time_on_section_ms?: number;
  scroll_percent?: number;
  device_type?: string;
  viewport_width?: number;
  viewport_height?: number;
  metadata?: Record<string, unknown>;
}

let queue: AnalyticsEvent[] = [];
let sessionId = "";
let deviceType = "";
let isReturning = false;
let pageEnteredAt = 0;
let currentPath = "";
let sectionTimers: Record<string, number> = {};
let lastClickTime = 0;
let lastClickTarget = "";
let clickBurstCount = 0;
let maxScroll = 0;
let initialized = false;
let flushTimer: ReturnType<typeof setInterval> | null = null;

function getDeviceType(): string {
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function hashUA(): string {
  const ua = navigator.userAgent;
  let h = 0;
  for (let i = 0; i < ua.length; i++) {
    h = ((h << 5) - h + ua.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36);
}

function push(event: Omit<AnalyticsEvent, "session_id" | "timestamp" | "device_type" | "viewport_width" | "viewport_height">) {
  queue.push({
    ...event,
    session_id: sessionId,
    timestamp: new Date().toISOString(),
    device_type: deviceType,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
  });
  if (queue.length >= MAX_BATCH) flush();
}

function getIngestUrl(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  if (projectId) return `https://${projectId}.supabase.co/functions/v1/ingest-analytics`;
  const url = import.meta.env.VITE_SUPABASE_URL;
  return url ? `${url}/functions/v1/ingest-analytics` : "";
}

async function flush() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, MAX_BATCH);
  const url = getIngestUrl();
  if (!url) return;

  try {
    const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(anonKey ? { apikey: anonKey } : {}),
      },
      body: JSON.stringify({
        events: batch,
        session: {
          session_id: sessionId,
          device_type: deviceType,
          viewport_width: window.innerWidth,
          viewport_height: window.innerHeight,
          user_agent_hash: hashUA(),
          is_returning: isReturning,
          referrer: document.referrer?.slice(0, 500) || null,
          landing_page: currentPath,
          page_count: 1,
          total_duration_ms: Date.now() - pageEnteredAt,
        },
      }),
      keepalive: true,
    });
  } catch {
    // Silent fail — don't impact UX
  }
}

// --- Tracking handlers ---

function getSectionId(el: Element | null): string | null {
  let node = el;
  while (node) {
    if (node instanceof HTMLElement) {
      const id = node.getAttribute("data-section") || node.id;
      if (id) return id;
    }
    node = node.parentElement;
  }
  return null;
}

function getElementId(el: Element): string {
  if (el.id) return el.id;
  const tag = el.tagName.toLowerCase();
  const text = (el as HTMLElement).innerText?.slice(0, 40) || "";
  const classes = el.className?.toString?.()?.split?.(" ")?.slice(0, 2)?.join(".") || "";
  return `${tag}${classes ? "." + classes : ""}${text ? `[${text}]` : ""}`;
}

function onClickCapture(e: MouseEvent) {
  const target = e.target as Element;
  if (!target) return;

  const now = Date.now();
  const elemId = getElementId(target);
  const sectionId = getSectionId(target);

  // Rage click detection: 3+ clicks on same target within 1.5s
  if (elemId === lastClickTarget && now - lastClickTime < 1500) {
    clickBurstCount++;
    if (clickBurstCount >= 3) {
      push({ event_type: "rage_click", element_id: elemId, section_id: sectionId || undefined, page_path: currentPath });
      clickBurstCount = 0;
    }
  } else {
    clickBurstCount = 1;
  }

  lastClickTarget = elemId;
  lastClickTime = now;

  // Dead click detection: click on non-interactive elements
  const interactive = target.closest("a, button, input, select, textarea, [role='button'], [onclick], [tabindex]");
  if (!interactive) {
    push({ event_type: "dead_click", element_id: elemId, section_id: sectionId || undefined, page_path: currentPath });
  } else {
    push({ event_type: "click", element_id: elemId, section_id: sectionId || undefined, page_path: currentPath });
  }
}

function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
  if (percent > maxScroll) maxScroll = percent;
}

function onFocusCapture(e: FocusEvent) {
  const target = e.target as Element;
  if (!target || !target.matches("input, textarea, select")) return;
  push({
    event_type: "focus",
    element_id: getElementId(target),
    section_id: getSectionId(target) || undefined,
    page_path: currentPath,
  });
}

function onFormSubmit(e: Event) {
  const form = e.target as HTMLFormElement;
  push({
    event_type: "convert",
    element_id: form.id || form.action || "form",
    section_id: getSectionId(form) || undefined,
    page_path: currentPath,
  });
}

function trackPageView() {
  const newPath = window.location.pathname;
  if (currentPath && currentPath !== newPath) {
    // Track section time on old page
    push({
      event_type: "scroll",
      page_path: currentPath,
      scroll_percent: maxScroll,
      time_on_section_ms: Date.now() - pageEnteredAt,
    });

    push({
      event_type: "navigation",
      page_path: newPath,
      metadata: { from: currentPath },
    });
  }

  currentPath = newPath;
  pageEnteredAt = Date.now();
  maxScroll = 0;

  push({ event_type: "view", page_path: currentPath });
}

function observeSections() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).getAttribute("data-section") || entry.target.id;
        if (!id) return;

        if (entry.isIntersecting) {
          sectionTimers[id] = Date.now();
          push({ event_type: "view", section_id: id, page_path: currentPath });
        } else if (sectionTimers[id]) {
          push({
            event_type: "scroll",
            section_id: id,
            page_path: currentPath,
            time_on_section_ms: Date.now() - sectionTimers[id],
          });
          delete sectionTimers[id];
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll("[data-section], section[id], main > div[id]").forEach((el) => {
    observer.observe(el);
  });

  // Re-observe on DOM changes
  const mutObserver = new MutationObserver(() => {
    document.querySelectorAll("[data-section], section[id], main > div[id]").forEach((el) => {
      observer.observe(el);
    });
  });
  mutObserver.observe(document.body, { childList: true, subtree: true });
}

function onVisibilityChange() {
  if (document.visibilityState === "hidden") {
    // Flush on tab hide
    push({
      event_type: "scroll",
      page_path: currentPath,
      scroll_percent: maxScroll,
      time_on_section_ms: Date.now() - pageEnteredAt,
    });
    flush();
  }
}

// Hesitation detection: user hovers on a CTA for >3s without clicking
function onMouseOver(e: MouseEvent) {
  const target = e.target as Element;
  if (!target) return;
  const cta = target.closest("a, button, [role='button']");
  if (!cta) return;

  const elemId = getElementId(cta);
  const timer = setTimeout(() => {
    push({
      event_type: "hesitation",
      element_id: elemId,
      section_id: getSectionId(cta) || undefined,
      page_path: currentPath,
    });
  }, 3000);

  const cancel = () => {
    clearTimeout(timer);
    cta.removeEventListener("mouseleave", cancel);
    cta.removeEventListener("click", cancel);
  };
  cta.addEventListener("mouseleave", cancel, { once: true });
  cta.addEventListener("click", cancel, { once: true });
}

// Form abandon detection
function trackFormAbandons() {
  let activeInput: Element | null = null;

  document.addEventListener("focusin", (e) => {
    const target = e.target as Element;
    if (target?.matches("input, textarea, select")) {
      activeInput = target;
    }
  });

  document.addEventListener("focusout", (e) => {
    const target = e.target as Element;
    if (target?.matches("input, textarea, select") && target === activeInput) {
      // Check if the new focus is outside the form
      setTimeout(() => {
        const form = target.closest("form");
        if (form && !form.contains(document.activeElement)) {
          push({
            event_type: "abandon",
            element_id: getElementId(target),
            section_id: getSectionId(target) || undefined,
            page_path: currentPath,
          });
        }
        activeInput = null;
      }, 200);
    }
  });
}

// --- Self-diagnostic: capture JS errors, unhandled rejections, API failures ---

function initDiagnostics() {
  // JS errors
  window.addEventListener("error", (e) => {
    push({
      event_type: "js_error",
      page_path: currentPath,
      metadata: {
        message: e.message?.slice(0, 500),
        source: e.filename?.slice(0, 200),
        line: e.lineno,
        col: e.colno,
        severity: "critical",
      },
    });
  });

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", (e) => {
    const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
    push({
      event_type: "js_error",
      page_path: currentPath,
      metadata: {
        message: reason?.slice(0, 500),
        type: "unhandled_rejection",
        severity: "critical",
      },
    });
  });

  // Intercept fetch to detect API failures
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const url = typeof args[0] === "string" ? args[0] : (args[0] as Request)?.url || "";
    const start = Date.now();
    try {
      const res = await originalFetch.apply(this, args);
      const duration = Date.now() - start;

      // Log failed API calls (4xx/5xx) but skip analytics ingestion to avoid loops
      if (!res.ok && !url.includes("ingest-analytics")) {
        push({
          event_type: "api_failure",
          page_path: currentPath,
          metadata: {
            url: url.slice(0, 300),
            status: res.status,
            statusText: res.statusText,
            duration_ms: duration,
            severity: res.status >= 500 ? "critical" : "medium",
          },
        });
      }

      // Log slow requests (>5s)
      if (duration > 5000 && !url.includes("ingest-analytics")) {
        push({
          event_type: "slow_request",
          page_path: currentPath,
          metadata: {
            url: url.slice(0, 300),
            duration_ms: duration,
            status: res.status,
            severity: duration > 15000 ? "critical" : "medium",
          },
        });
      }

      return res;
    } catch (err) {
      if (!url.includes("ingest-analytics")) {
        push({
          event_type: "api_failure",
          page_path: currentPath,
          metadata: {
            url: url.slice(0, 300),
            error: err instanceof Error ? err.message.slice(0, 300) : "Network error",
            severity: "critical",
          },
        });
      }
      throw err;
    }
  };

  // Console error interception (captures React render errors surfaced via console.error)
  const origConsoleError = console.error;
  console.error = function (...args) {
    origConsoleError.apply(console, args);
    const msg = args.map((a) => (typeof a === "string" ? a : "")).join(" ");
    // Only capture React-style or meaningful errors, skip noise
    if (
      msg.includes("Uncaught") ||
      msg.includes("Error:") ||
      msg.includes("Cannot read prop") ||
      msg.includes("is not a function") ||
      msg.includes("undefined is not") ||
      msg.includes("ChunkLoadError")
    ) {
      push({
        event_type: "render_error",
        page_path: currentPath,
        metadata: {
          message: msg.slice(0, 500),
          severity: "critical",
        },
      });
    }
  };
}

export function initAnalyticsTracker() {
  if (initialized) return;
  // Don't track on admin pages
  if (window.location.pathname.startsWith("/admin")) return;
  initialized = true;

  // Session management
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = genId();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  sessionId = sid;

  // Returning visitor detection
  const vid = localStorage.getItem(VISITOR_KEY);
  if (vid) {
    isReturning = true;
  } else {
    localStorage.setItem(VISITOR_KEY, genId());
  }

  deviceType = getDeviceType();

  // Attach listeners
  document.addEventListener("click", onClickCapture, true);
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("focusin", onFocusCapture, true);
  document.addEventListener("submit", onFormSubmit, true);
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("mouseover", onMouseOver, { passive: true });

  trackFormAbandons();
  initDiagnostics();

  // Track initial page view
  trackPageView();

  // Watch for SPA navigation
  const origPush = history.pushState;
  const origReplace = history.replaceState;
  history.pushState = function (...args) {
    origPush.apply(this, args);
    setTimeout(trackPageView, 50);
  };
  history.replaceState = function (...args) {
    origReplace.apply(this, args);
    setTimeout(trackPageView, 50);
  };
  window.addEventListener("popstate", () => setTimeout(trackPageView, 50));

  // Section observation
  setTimeout(observeSections, 1000);

  // Periodic flush
  flushTimer = setInterval(flush, BATCH_INTERVAL);

  // Flush on unload
  window.addEventListener("beforeunload", () => {
    push({
      event_type: "scroll",
      page_path: currentPath,
      scroll_percent: maxScroll,
      time_on_section_ms: Date.now() - pageEnteredAt,
    });
    flush();
  });
}
