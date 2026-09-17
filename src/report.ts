import type { Article } from "./types.js";

function formatDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function buildReport(
  articles: Article[],
  windowStart: Date,
  windowEnd: Date
): string {
  const sorted = [...articles].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()
  );

  const sourceCount = new Set(sorted.map((a) => a.source)).size;

  const lines: string[] = [];
  lines.push(`# AI 新闻日报 - ${formatDateTime(windowEnd).slice(0, 10)}`);
  lines.push("");
  lines.push(`- 生成时间: ${formatDateTime(new Date())}`);
  lines.push(
    `- 覆盖范围: 最近 24 小时（${formatDateTime(windowStart)} ~ ${formatDateTime(
      windowEnd
    )}）`
  );
  lines.push(`- 统计: 共收录 ${sorted.length} 篇，来自 ${sourceCount} 个源`);
  lines.push("");

  if (sorted.length === 0) {
    lines.push("最近 24 小时内没有抓取到符合条件的文章。");
    lines.push("");
    return lines.join("\n");
  }

  for (const article of sorted) {
    lines.push(`## [${article.title}](${article.link})`);
    lines.push("");
    lines.push(`- 来源: ${article.source}`);
    lines.push(`- 发布时间: ${formatDateTime(article.publishedAt)}`);
    if (article.summary) {
      lines.push(`- 摘要: ${article.summary}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}
