# dsh-tradingboat

**English** | [中文](README.zh.md)

A full-screen market **quote watch** panel for DeepSeek Harness (DSH). Watch **domestic futures, overseas futures, global indices, forex and stocks (A-share + US)** in one place, organised into your own groups, with multi-source quotes and an inline K-line chart. An optional floating pill lets you glance at the market from anywhere.

![Combined market and news layout](docs/optimized-combined.png)

![News reading layout](docs/optimized-news.png)

Previews render the actual components with isolated sample data; no credentials or paid feed content are included.

## Features

- **Full-screen terminal panel** — left watchlist with collapsible, reorderable groups; right detail pane with quote stats and a candlestick chart. Also registers a left-navigation entry.
- **Your own groups** — create / rename / reorder / delete groups, move any instrument into any group. Five default groups are seeded on first run: 国内期货 / 外盘期货 / 全球股指 / 外汇 / 股票.
- **Multi-market** — 国内期货 (SHFE/DCE/CZCE/INE/GFEX/CFFEX), 外盘期货 (COMEX/NYMEX/CBOT/ICE), 全球股指, 外汇, A股 + 美股, all mixed in one list.
- **Multi-source, no API key** — a host-side adapter fans out to Sina / Tencent / Yahoo with automatic fallback (see below).
- **K-line chart** — pure-SVG candlesticks (no external CDN, no CSP issues) with MA5/10/20 and a volume histogram; intervals: 5m / 15m / 60m / daily. Domestic futures K-line comes from Sina, everything else from Yahoo.
- **Colour scheme** — auto (domestic red-up/green-down, overseas green-up/red-down), or force 红涨绿跌 / 绿涨红跌.
- **Optional floating pill** — a bottom-right pill shows up/down counts and quick quotes for the first group; toggle it in settings.
- **Settings** — pill on/off, colour scheme, refresh interval (3/5/10/30s), list density.
- **Host-side persistence** — watchlist and settings live in `~/.dsh/dsh-tradingboat/data.json` (atomic writes + timestamped backups + `.bak` fallback). Not in localStorage, so it survives port changes.

## Data sources (all free, no key)

| Asset | Primary | Fallback | K-line |
|---|---|---|---|
| 国内期货 / 股指国债期货 | Sina `hq.sinajs.cn` `nf_<code>0` (one batch request) | Eastmoney | Sina `InnerFuturesNewService` (daily + 5/15/30/60m) |
| 外盘期货 | Sina `hf_XX` | **Yahoo `<SYM>=F`** | Yahoo chart |
| 全球股指 | Sina `int_xxx` | Yahoo `^XXX` / Eastmoney `100.XXX` | Yahoo chart |
| 外汇 | Sina `fx_sXXX` | **Yahoo `XXX=X`** | Yahoo chart |
| A股 | Tencent `qt.gtimg.cn` | Sina / Yahoo | Yahoo chart |
| 美股 | Sina `gb_xxx` | **Yahoo** | Yahoo chart |
| 股票搜索 | Tencent smartbox (A股/美股 name + code) | — | — |

> A whole watchlist of mixed instruments is fetched with **one** Sina batch request; only symbols Sina can't serve (a few overseas futures, extra indices) fall through to Yahoo per-symbol.

## Install

Published as a DSH bundle. Pick one:

```bash
# A) straight from this repo (local clone)
dsh plugin --profile desktop add file:E:/path/to/dsh-tradingboat

# B) via install script (copies files + registers dependency + enables the loader row, with backups)
pwsh -File .\install.ps1
```

Then **refresh the Web GUI (Ctrl+R)** to load the browser half. If the host half does not reload automatically, toggle its row in the profile `cordis.patch.yml` (remove + re-add) or restart the desktop app once.

## Usage

- Click **交易之舟** in the left navigation to open the panel.
- Click any row to load its K-line on the right; switch intervals with the tabs.
- **＋ 添加** searches by Chinese name or code (期货/指数/外汇 via the built-in catalog, 股票 via smartbox) or lets you enter a code manually with a market selector.
- Group header hover shows: move up/down, rename, add-to-group, delete.
- **⚙** opens settings.

### Instrument code formats

| Market | Example code |
|---|---|
| 国内期货 | `RB0` `AU0` `IF0` `M0` (main-continuous, suffix `0`) |
| 外盘期货 | `CL=F` `GC=F` `ES=F` `ZC=F` |
| 全球股指 | `^GSPC` `^DJI` `^IXIC` `^HSI` `^N225` |
| 外汇 | `USDCNY=X` `EURUSD=X` `DX-Y.NYB` |
| A股 | `600519` `000001` (or `sh600519`) |
| 美股 | `AAPL` `NVDA` |

## How it works

- **Host half** (`lib/main.js`): Cordis plugin. Registers `/api/dsh-tradingboat/*` routes (`state`, `quotes`, `kline`, `search`, `news`), owns the persistence files, and does all upstream fetching (quote + news parsers, `AbortSignal` timeouts, background polling).
- **Browser half** (`lib/client.js`): lazy CJS module for DSH's `__ModuleLoader__`. Registers a `main` keyed panel, a `sidebar.panellist` entry, and a `shell.overlay` pill. Renders with React, chart is hand-drawn SVG.

## Trading Info Center (news feeds)

Below the chart, the detail pane hosts a **Trading Info Center** that merges three feeds into one timeline:

| Source | How it is fetched | What you need |
|---|---|---|
| X (Twitter) | FxTwitter public mirror `/2/profile/{name}/statuses` | the blogger's screenName |
| Weibo | `weibo.com/ajax/statuses/mymblog` | Weibo UID + login Cookie (SUB/SUBP) |
| Zsxq (知识星球) | `api.zsxq.com/v2/groups/{id}/topics` | groupId + Cookie (zsxq_access_token) |

- Open **资讯源设置** to configure and enable feeds, and test the connection. Cookies remain in local configuration and are sent only to the corresponding platform for authenticated requests, never to news mirrors or logs.
- Switch between **Market + News / Market only / News only**. News-only fills the right pane and pauses chart requests. In the combined view, drag the divider to resize the dock or double-click to reset its height.
- Date-grouped cards, source filters, author/body search, all/unread/favorite filters, expandable long posts, read-state toggles, copy, and original links.
- Background polling (X 5 min / Weibo 3 min / Zsxq 10 min). Manual refresh reports fetched/new counts and failures.
- Expired cookies surface a clear message (Weibo 432 / Zsxq 401).
- Read-only, personal use; respect the platform terms for paid Zsxq content.

- Focus mode hides the watchlist; name/code search also reveals matches in collapsed groups. Compact density applies to both quotes and news.
- Background transparency ranges from 0–80% with four presets. Layout, focus and transparency preferences are stored for the current browser origin; a changed port may require selecting them again.
- Mark-current-results-read affects only loaded unread entries matching the active filters. The current API returns at most 300 entries, not the entire history. Manual quote refresh also reloads the chart.

## Disclaimer

Public market data from Sina / Tencent / Yahoo / Eastmoney, for personal study and research only — **not investment advice**. Interfaces may change or rate-limit; the plugin falls back between sources but cannot guarantee data accuracy. Read-only: it never places orders.

## License

MIT © 2026 gary
