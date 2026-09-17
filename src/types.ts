export interface Article {
  title: string;
  link: string;
  publishedAt: Date;
  source: string;
  /** Full plain-text description, used as input for AI summarization. */
  description: string;
  /** Truncated-description fallback; replaced with an AI summary when available. */
  summary: string;
}
