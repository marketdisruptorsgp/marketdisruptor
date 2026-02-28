const CANONICAL_PUBLISHED_URL = "https://productideas.lovable.app";

const LEGACY_HOSTS = new Set([
  "marketdisruptor.sgpcapital.com",
  "www.marketdisruptor.sgpcapital.com",
]);

function trimTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function getPublicBaseUrl(): string {
  const envUrl = import.meta.env.VITE_PUBLIC_APP_URL as string | undefined;
  if (envUrl?.trim()) return trimTrailingSlash(envUrl.trim());

  if (typeof window === "undefined") return CANONICAL_PUBLISHED_URL;

  const { origin, hostname } = window.location;

  if (LEGACY_HOSTS.has(hostname)) return CANONICAL_PUBLISHED_URL;

  return trimTrailingSlash(origin);
}

export function buildPublicUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicBaseUrl()}${normalizedPath}`;
}

export function redirectLegacyHostToCanonical(): void {
  if (typeof window === "undefined") return;

  const { hostname, pathname, search, hash } = window.location;
  if (!LEGACY_HOSTS.has(hostname)) return;

  const target = `${CANONICAL_PUBLISHED_URL}${pathname}${search}${hash}`;
  if (window.location.href !== target) {
    window.location.replace(target);
  }
}
