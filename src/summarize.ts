import type { Article } from "./types.js";

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const MODEL = "deepseek-chat";
const CONCURRENCY = 5;

const SYSTEM_PROMPT =
  "你是新闻摘要助手。根据给定的文章标题和描述，用中文写一句话摘要（不超过 60 字），" +
  "只输出摘要本身，不要加前缀、引号或其他说明文字。";

interface DeepSeekResponse {
  choices?: { message?: { content?: string } }[];
}

async function summarizeOne(apiKey: string, article: Article): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `标题: ${article.title}\n描述: ${article.description || "(无)"}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as DeepSeekResponse;
  return data.choices?.[0]?.message?.content?.trim() ?? "";
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
 * AI-generated one-sentence summary from DeepSeek. Mutates and returns the
 * same array. Falls back to the existing `summary` for any article whose
 * API call fails, so one error doesn't drop the whole run.
 */
export async function addAiSummaries(articles: Article[]): Promise<Article[]> {
  if (articles.length === 0) return articles;

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    console.warn(
      "[WARN] 未设置 DEEPSEEK_API_KEY，跳过 AI 摘要，使用截取摘要作为回退"
    );
    return articles;
  }

  await mapWithConcurrency(articles, CONCURRENCY, async (article) => {
    try {
      const aiSummary = await summarizeOne(apiKey, article);
      if (aiSummary) article.summary = aiSummary;
    } catch (error) {
      console.warn(
        `[WARN] "${article.title}" 的 AI 摘要生成失败，已回退到截取摘要: ${error}`
      );
    }
  });

  return articles;
}
