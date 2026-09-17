import type { Article } from "./types.js";

/**
 * Canonicalizes a URL for comparison: drops the fragment and a trailing
 * slash so cosmetic differences (e.g. a tracking anchor, or a source
 * linking to "/path" vs "/path/") don't cause the same article to be
 * treated as distinct.
 */
function normalizeUrl(link: string): string {
  try {
    const url = new URL(link);
    url.hash = "";
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return `${url.origin}${url.pathname}${url.search}`;
  } catch {
    return link.trim();
  }
}

/** Removes articles that share the same URL, keeping the first occurrence. */
export function dedupeArticlesByUrl(articles: Article[]): Article[] {
  const seen = new Set<string>();
  const result: Article[] = [];

  for (const article of articles) {
    const key = normalizeUrl(article.link);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(article);
  }

  return result;
}
