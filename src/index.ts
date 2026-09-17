import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { dedupeArticlesByUrl } from "./dedupe.js";
import { fetchArticles } from "./fetchFeed.js";
import { buildReport } from "./report.js";
import { SOURCES } from "./sources.js";
import { addAiSummaries } from "./summarize.js";
import type { Article } from "./types.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}`;
}

async function main(): Promise<void> {
  const windowEnd = new Date();
  const windowStart = new Date(windowEnd.getTime() - ONE_DAY_MS);

  const results = await Promise.allSettled(
    SOURCES.map((source) => fetchArticles(source))
  );

  const allArticles: Article[] = [];
  results.forEach((result, index) => {
    const source = SOURCES[index];
    if (result.status === "fulfilled") {
      allArticles.push(...result.value);
      console.log(`[OK] ${source.name}: 抓取到 ${result.value.length} 篇`);
    } else {
      console.warn(
        `[WARN] ${source.name} 抓取失败，已跳过: ${result.reason}`
      );
    }
  });

  const recentArticles = allArticles.filter(
    (article) =>
      article.publishedAt >= windowStart && article.publishedAt <= windowEnd
  );

  const dedupedArticles = dedupeArticlesByUrl(recentArticles);
  const duplicateCount = recentArticles.length - dedupedArticles.length;
  if (duplicateCount > 0) {
    console.log(`[OK] 按 URL 去重，移除了 ${duplicateCount} 篇重复文章`);
  }

  await addAiSummaries(dedupedArticles);

  const report = buildReport(dedupedArticles, windowStart, windowEnd);

  const outputDir = path.join(process.cwd(), "output");
  await mkdir(outputDir, { recursive: true });
  const outputPath = path.join(
    outputDir,
    `daily-report-${formatDate(windowEnd)}.md`
  );
  await writeFile(outputPath, report, "utf-8");

  console.log(
    `\n共收录 ${dedupedArticles.length} 篇（最近 24 小时），已写入 ${outputPath}`
  );
}

main()
  .catch((error) => {
    console.error("脚本执行失败:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0);
  });
