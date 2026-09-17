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
export ANTHROPIC_API_KEY=your-api-key
npm run scrape
```

生成的日报位于 `output/daily-report-YYYY-MM-DD.md`，按发布时间倒序排列，每篇文章包含
标题、链接、发布时间、来源和一句话摘要，开头附带统计信息（收录篇数、来源数）。

单个源抓取失败不会中断脚本，会在控制台打印警告并跳过该源。

## AI 摘要

每篇文章的摘要由 Claude API（`claude-opus-5`）根据标题 + 描述生成一句话中文总结。需要
设置环境变量 `ANTHROPIC_API_KEY`；未设置或调用失败时，会自动回退到从描述截取的摘要，
不影响日报生成。

在 GitHub Actions 里运行时，把 API key 存到仓库的 `Settings → Secrets and variables →
Actions` 下，命名为 `ANTHROPIC_API_KEY`，workflow 会自动读取。
