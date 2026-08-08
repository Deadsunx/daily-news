# Daily News

A static news site that publishes a fresh edition every morning from the
`news-YYYY-MM-DD.json` files your Claude scheduled task drops into this folder.
No server, no database, no framework — just HTML/JS built by a tiny Node script
and hosted free on GitHub Pages.

## How it works

```
Claude task (00:00)                 GitHub                          Visitor
─────────────────                   ──────                          ───────
writes news-<date>.json  ─┐
writes news-<date>.md     ├─► publish.ps1 ─► git push ─► GitHub Action:
                          ┘                                node scripts/build.mjs
                                                           → dist/ (index.html,
                                                             manifest.json, *.json)
                                                           → deploy to Pages ──────► sees the
                                                                                     new edition
```

- **`scripts/build.mjs`** scans every `news-*.json`, writes `manifest.json`
  (the index of all editions), and assembles `dist/` for deployment.
- **`index.html`** is the whole front end. It fetches `manifest.json`, shows the
  latest edition, and lets you browse the archive (deep-linkable via `#YYYY-MM-DD`).
- **`.github/workflows/deploy.yml`** builds and deploys to GitHub Pages on every
  push, plus a daily `00:15 UTC` cron as a safety net.
- **`scripts/publish.ps1`** commits + pushes the day's files (your Claude task calls it).

## Data format

Each day needs `news-YYYY-MM-DD.json`:

```json
{
  "date": "2026-08-08",
  "generated_at": "2026-08-08T07:45:00Z",
  "stories": [
    {
      "id": 1,
      "title": "...",
      "summary": "...",
      "category": "AI & Tech",
      "source": "TechCrunch",
      "url": "https://...",
      "published": "2026-08-06"
    }
  ]
}
```

Only `title` is strictly required per story; everything else degrades gracefully.
The matching `.md` file is optional — if present, it's linked as a "plain text edition".

## One-time GitHub setup

1. Create the repo and push (needs the [`gh`](https://cli.github.com) CLI, already installed):
   ```bash
   gh repo create daily-news --public --source=. --remote=origin --push
   ```
2. In the repo: **Settings → Pages → Build and deployment → Source = GitHub Actions**.
3. The first deploy runs automatically. Your site is at
   `https://<your-username>.github.io/daily-news/`.

## Wire the daily auto-publish

Add this one line to the **end** of your existing Claude scheduled task (the one
that writes the news files), so it pushes right after writing them:

```
powershell -ExecutionPolicy Bypass -File "C:\Users\oumar\Desktop\News\scripts\publish.ps1"
```

That commits the new `news-<date>.json`/`.md`, pushes, and the GitHub Action
rebuilds + redeploys the site within a minute or two.

## Local preview

```bash
node scripts/build.mjs      # build dist/
node scripts/serve.mjs      # serve at http://localhost:4178
```

(Open the built `dist/`, not `index.html` directly — the browser blocks `fetch`
from `file://`.)

## Adding a day by hand

Drop a `news-YYYY-MM-DD.json` in this folder and run `scripts/publish.ps1`
(or `git add . && git commit -m "news" && git push`). The archive updates itself.
