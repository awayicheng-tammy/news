import Parser from "rss-parser";
import type { FeedSource } from "./sources.js";
import type { Article } from "./types.js";

const parser = new Parser({
  timeout: 20000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; RssArticleScraper/1.0; +https://github.com)",
  },
});

const SUMMARY_MAX_LENGTH = 100;

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * hnrss.org descriptions are just link boilerplate ("Article URL: ...
 * Comments URL: ... Points: N # Comments: N"), never real article text.
 * Strip it so it doesn't leak into summaries as raw URLs.
 */
function stripHnBoilerplate(text: string): string {
  return text
    .replace(/Article URL:\s*\S+/gi, "")
    .replace(/Comments URL:\s*\S+/gi, "")
    .replace(/Points:\s*\d+/gi, "")
    .replace(/#?\s*Comments:\s*\d+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSummary(text: string): string {
  if (text.length <= SUMMARY_MAX_LENGTH) return text;
  return `${text.slice(0, SUMMARY_MAX_LENGTH)}…`;
}

export async function fetchArticles(source: FeedSource): Promise<Article[]> {
  const feed = await parser.parseURL(source.url);

  const articles: Article[] = [];
  for (const item of feed.items ?? []) {
    const link = item.link?.trim();
    const title = item.title?.trim();
    const dateStr = item.isoDate ?? item.pubDate;

    if (!link || !title || !dateStr) continue;

    const publishedAt = new Date(dateStr);
    if (Number.isNaN(publishedAt.getTime())) continue;

    const rawDescription = stripHtml(
      item.contentSnippet ?? item.content ?? item.summary ?? ""
    );
    const description = stripHnBoilerplate(rawDescription) || title;
    const summary = buildSummary(description);

    articles.push({
      title,
      link,
      publishedAt,
      source: source.name,
      description,
      summary,
    });
  }

  return articles;
}
