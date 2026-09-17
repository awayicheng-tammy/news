# news

AI 新闻 RSS 聚合日报生成器。抓取最近 24 小时内的 AI 相关文章，生成 Markdown 日报到
`output/` 目录。

## 数据源

- TechCrunch AI — `https://techcrunch.com/category/artificial-intelligence/feed/`
- The Verge AI — `https://www.theverge.com/rss/ai-artificial-intelligence/index.xml`
- Hacker News "AI" 搜索前 30 条 — `https://hnrss.org/newest?q=AI&count=30`

## 使用方法

```bash
npm install
npm run scrape
```

生成的日报位于 `output/daily-report-YYYY-MM-DD.md`，按发布时间倒序排列，每篇文章包含
标题、链接、发布时间、来源和一句话摘要，开头附带统计信息（收录篇数、来源数）。

单个源抓取失败不会中断脚本，会在控制台打印警告并跳过该源。
