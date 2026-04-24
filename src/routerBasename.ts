/**
 * React Router `basename` from Vite's `import.meta.env.BASE_URL` (mirrors `base` in vite.config).
 */
export function routerBasenameFromBaseUrl(baseUrl: string): string | undefined {
  const trimmed = baseUrl.replace(/\/$/, "");
  if (!trimmed || trimmed === "." || trimmed === "/") {
    return undefined;
  }
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
