import Anthropic from "@anthropic-ai/sdk";
import type { Article } from "./types.js";

const MODEL = "claude-opus-5";
const CONCURRENCY = 5;

const SYSTEM_PROMPT =
  "你是新闻摘要助手。根据给定的文章标题和描述，用中文写一句话摘要（不超过 60 字），" +
  "只输出摘要本身，不要加前缀、引号或其他说明文字。";

async function summarizeOne(client: Anthropic, article: Article): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `标题: ${article.title}\n描述: ${article.description || "(无)"}`,
      },
    ],
  });

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === "text"
  );
  return textBlock?.text.trim() ?? "";
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
}

/**
 * Replaces each article's truncated-description `summary` with an
 * AI-generated one-sentence summary. Mutates and returns the same array.
 * Falls back to the existing `summary` for any article whose API call
 * fails, so one error doesn't drop the whole run.
 */
export async function addAiSummaries(articles: Article[]): Promise<Article[]> {
  if (articles.length === 0) return articles;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(
      "[WARN] 未设置 ANTHROPIC_API_KEY，跳过 AI 摘要，使用截取摘要作为回退"
    );
    return articles;
  }

  const client = new Anthropic({ apiKey });

  await mapWithConcurrency(articles, CONCURRENCY, async (article) => {
    try {
      const aiSummary = await summarizeOne(client, article);
      if (aiSummary) article.summary = aiSummary;
    } catch (error) {
      console.warn(
        `[WARN] "${article.title}" 的 AI 摘要生成失败，已回退到截取摘要: ${error}`
      );
    }
  });

  return articles;
}
