/**
 * dsh-tradingboat — host half.
 *
 * A multi-market quote/watchlist backend for the browser half. Provides:
 *   - persistent watchlist state (groups + items) + settings in
 *     `<DSH_HOME>/dsh-tradingboat/data.json`
 *   - a multi-source quote adapter (Sina batch / Tencent A-share / Yahoo fallback)
 *   - K-line fetching (Sina domestic futures, Yahoo for the rest)
 *   - stock symbol search (Tencent smartbox)
 *
 * Browser API (all POST, relative paths):
 *   /api/dsh-tradingboat/state   { op: 'get' | 'save' | 'reset', state? }
 *   /api/dsh-tradingboat/quotes  { items: [{ id, mkt, code, name? }] }
 *   /api/dsh-tradingboat/kline   { mkt, code, interval }
 *   /api/dsh-tradingboat/search  { q }
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { randomUUID } from 'node:crypto'

export const name = 'dsh-tradingboat'

const MAX_GROUPS = 30
const MAX_ITEMS_PER_GROUP = 200
const MAX_ITEMS = 800
const MAX_NAME = 60
const BACKUP_KEEP = 20

const MARKETS = new Set(['futcn', 'futgl', 'index', 'fx', 'cnstock', 'usstock'])

// Sina hf_ *外盘期货* code map (verified working codes; unknown -> Yahoo).
// Unknown/empty ones just fall through to Yahoo automatically.
const HF_MAP = {
  'CL=F': 'CL', 'GC=F': 'GC', 'SI=F': 'SI', 'HG=F': 'HG', 'NG=F': 'NG',
  'ZC=F': 'C', 'ZS=F': 'S', 'ZW=F': 'W', 'CT=F': 'CT', 'KC=F': 'KC',
  'ES=F': 'ES', 'NQ=F': 'NQ', 'YM=F': 'YM', 'CC=F': 'CC', 'OJ=F': 'OJ',
}
// Sina int_ *global index* code map.
const INT_MAP = {
  '^GSPC': 'sp500', '^DJI': 'dji', '^IXIC': 'nasdaq', '^HSI': 'hangseng', '^N225': 'nikkei',
}

// Default FX watchlist (also used by the v1->v2 migration for existing users).
const DEFAULT_FX = [
  ['USDCNY=X', '美元/人民币'], ['EURUSD=X', '欧元/美元'], ['USDJPY=X', '美元/日元'],
  ['GBPUSD=X', '英镑/美元'], ['AUDUSD=X', '澳元/美元'], ['USDCHF=X', '美元/瑞郎'],
  ['USDCAD=X', '美元/加元'], ['NZDUSD=X', '纽元/美元'], ['DX-Y.NYB', '美元指数'],
  ['EURJPY=X', '欧元/日元'], ['GBPJPY=X', '英镑/日元'], ['AUDJPY=X', '澳元/日元'],
  ['NZDJPY=X', '纽元/日元'], ['CADJPY=X', '加元/日元'], ['CHFJPY=X', '瑞郎/日元'],
  ['EURGBP=X', '欧元/英镑'], ['EURCHF=X', '欧元/瑞郎'], ['GBPCHF=X', '英镑/瑞郎'],
  ['AUDNZD=X', '澳元/纽元'], ['USDHKD=X', '美元/港元'], ['USDSGD=X', '美元/新加坡元'],
]

const STATE_VERSION = 2

const DEFAULT_SETTINGS = {
  pillEnabled: true,
  upColor: 'auto',       // auto | red | green
  refreshMs: 5000,
  density: 'comfortable',
}

function defaultGroups() {
  return [
    { id: 'g-futcn', name: '国内期货', collapsed: false, items: [
      ['futcn', 'RB0', '螺纹钢'], ['futcn', 'HC0', '热卷'], ['futcn', 'CU0', '铜'],
      ['futcn', 'AU0', '黄金'], ['futcn', 'AG0', '白银'], ['futcn', 'SC0', '原油'],
      ['futcn', 'M0', '豆粕'], ['futcn', 'I0', '铁矿石'], ['futcn', 'J0', '焦炭'],
      ['futcn', 'TA0', 'PTA'], ['futcn', 'MA0', '甲醇'], ['futcn', 'SR0', '白糖'],
    ].map(([mkt, code, name], i) => ({ id: `${mkt}-${code}-${i}`, mkt, code, name })) },
    { id: 'g-futgl', name: '外盘期货', collapsed: false, items: [
      ['futgl', 'CL=F', 'WTI 原油'], ['futgl', 'GC=F', 'COMEX 黄金'], ['futgl', 'SI=F', 'COMEX 白银'],
      ['futgl', 'HG=F', 'COMEX 铜'], ['futgl', 'NG=F', '天然气'], ['futgl', 'ES=F', '标普500 期货'],
      ['futgl', 'NQ=F', '纳指100 期货'], ['futgl', 'ZC=F', '玉米'], ['futgl', 'ZS=F', '大豆'],
      ['futgl', 'KC=F', '咖啡'],
    ].map(([mkt, code, name], i) => ({ id: `${mkt}-${i}`, mkt, code, name })) },
    { id: 'g-index', name: '全球股指', collapsed: false, items: [
      ['index', '^GSPC', '标普500'], ['index', '^DJI', '道琼斯'], ['index', '^IXIC', '纳斯达克'],
      ['index', '^HSI', '恒生指数'], ['index', '^N225', '日经225'], ['index', '^FTSE', '英国富时100'],
      ['index', '^GDAXI', '德国DAX'],
    ].map(([mkt, code, name], i) => ({ id: `${mkt}-${i}`, mkt, code, name })) },
    { id: 'g-fx', name: '外汇', collapsed: false, items:
      DEFAULT_FX.map(([code, name], i) => ({ id: `fx-${i}`, mkt: 'fx', code, name })) },
    { id: 'g-stock', name: '股票', collapsed: false, items: [
      ['cnstock', '600519', '贵州茅台'], ['cnstock', '000001', '平安银行'], ['cnstock', '300750', '宁德时代'],
      ['usstock', 'AAPL', '苹果'], ['usstock', 'NVDA', '英伟达'], ['usstock', 'TSLA', '特斯拉'],
    ].map(([mkt, code, name], i) => ({ id: `${mkt}-${i}`, mkt, code, name })) },
  ]
}

// ---------------------------------------------------------------------------
// persistence
// ---------------------------------------------------------------------------

function dataDir() {
  const home = process.env.DSH_HOME || path.join(os.homedir(), '.dsh')
  return path.join(home, 'dsh-tradingboat')
}
function dataFile() { return path.join(dataDir(), 'data.json') }

function pad2(n) { return n < 10 ? '0' + n : String(n) }
function stamp() {
  const d = new Date()
  return d.getFullYear() + pad2(d.getMonth() + 1) + pad2(d.getDate()) + '-' + pad2(d.getHours()) + pad2(d.getMinutes()) + pad2(d.getSeconds())
}

function asString(v, max) {
  if (typeof v !== 'string') return ''
  const s = v.trim()
  return s.length > max ? s.slice(0, max) : s
}
function asId(v) { return asString(v, 80) }

function normalizeItem(raw, index) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const mkt = asString(raw.mkt, 20)
  if (!MARKETS.has(mkt)) return null
  const code = asString(raw.code, 32)
  if (code === '') return null
  const name = asString(raw.name, MAX_NAME)
  return {
    id: asId(raw.id) || `${mkt}-${code}-${index}`,
    mkt,
    code,
    name: name || code,
  }
}

function normalizeGroup(raw, gi) {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const items = []
  const seen = new Set()
  if (Array.isArray(raw.items)) {
    for (let i = 0; i < raw.items.length && items.length < MAX_ITEMS_PER_GROUP; i++) {
      const item = normalizeItem(raw.items[i], i)
      if (item === null || seen.has(item.id)) continue
      seen.add(item.id)
      items.push(item)
    }
  }
  return {
    id: asId(raw.id) || `g-${gi}`,
    name: asString(raw.name, 40) || `分组 ${gi + 1}`,
    collapsed: raw.collapsed === true,
    items,
  }
}

function normalizeSettings(raw) {
  const s = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {}
  let refreshMs = Number(s.refreshMs)
  if (!Number.isFinite(refreshMs)) refreshMs = DEFAULT_SETTINGS.refreshMs
  refreshMs = Math.max(2000, Math.min(120000, Math.floor(refreshMs)))
  return {
    pillEnabled: s.pillEnabled !== false,
    upColor: s.upColor === 'red' || s.upColor === 'green' ? s.upColor : 'auto',
    refreshMs,
    density: s.density === 'compact' ? 'compact' : 'comfortable',
  }
}

function normalizeState(raw) {
  const groups = []
  const seenGroups = new Set()
  let total = 0
  if (raw && Array.isArray(raw.groups)) {
    for (let i = 0; i < raw.groups.length && groups.length < MAX_GROUPS; i++) {
      const g = normalizeGroup(raw.groups[i], i)
      if (g === null || seenGroups.has(g.id)) continue
      // clamp total items
      if (total + g.items.length > MAX_ITEMS) {
        g.items = g.items.slice(0, Math.max(0, MAX_ITEMS - total))
      }
      total += g.items.length
      seenGroups.add(g.id)
      groups.push(g)
    }
  }
  ensureDefaultFx(groups)
  return { version: STATE_VERSION, groups, settings: normalizeSettings(raw && raw.settings) }
}

/** v1 -> v2: append missing default FX pairs (JPY crosses etc.) to the 外汇 group. */
function ensureDefaultFx(groups) {
  const g = groups.find((x) => x.id === 'g-fx') || groups.find((x) => x.name === '外汇')
  if (!g) return
  const have = new Set(g.items.map((it) => String(it.code).toUpperCase()))
  let changed = false
  for (const [code, name] of DEFAULT_FX) {
    if (have.has(code.toUpperCase())) continue
    g.items.push({ id: `fx-${code}`, mkt: 'fx', code, name })
    have.add(code.toUpperCase())
    changed = true
  }
  if (changed && g.collapsed) g.collapsed = false
}

let ioChain = Promise.resolve()
function withLock(fn) {
  const run = ioChain.then(fn, fn)
  ioChain = run.then(() => undefined, () => undefined)
  return run
}

async function backupCurrent(file) {
  try {
    const st = await fs.stat(file)
    if (!st.size) return
    await fs.copyFile(file, `${file}.bak`)
    const dir = path.join(dataDir(), 'backups')
    await fs.mkdir(dir, { recursive: true })
    await fs.copyFile(file, path.join(dir, `data-${stamp()}.json`))
    const names = (await fs.readdir(dir)).filter((n) => /^data-\d{8}-\d{6}\.json$/.test(n)).sort()
    while (names.length > BACKUP_KEEP) {
      try { await fs.unlink(path.join(dir, names.shift())) } catch {}
    }
  } catch (e) {
    if (e && e.code === 'ENOENT') return
  }
}

async function readState() {
  try {
    const text = await fs.readFile(dataFile(), 'utf8')
    const raw = JSON.parse(text)
    const rawVersion = raw && typeof raw.version === 'number' ? raw.version : 1
    const parsed = normalizeState(raw)
    if (parsed.groups.length === 0) return normalizeState({ groups: defaultGroups(), settings: parsed.settings })
    if (rawVersion < STATE_VERSION) {
      // persist the one-time migration so deleted pairs don't keep coming back
      try { await writeState(parsed) } catch {}
    }
    return parsed
  } catch (e) {
    if (e && e.code !== 'ENOENT') {
      try { process.emitWarning(`[dsh-tradingboat] read state failed: ${String(e)}`) } catch {}
    }
    // fall back to .bak if the primary is corrupt
    try {
      const text = await fs.readFile(dataFile() + '.bak', 'utf8')
      const parsed = normalizeState(JSON.parse(text))
      if (parsed.groups.length > 0) return parsed
    } catch {}
    return normalizeState({ groups: defaultGroups() })
  }
}

async function writeState(state) {
  const file = dataFile()
  await fs.mkdir(path.dirname(file), { recursive: true })
  await backupCurrent(file)
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, JSON.stringify(state, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

// ---------------------------------------------------------------------------
// source helpers
// ---------------------------------------------------------------------------

let gbkDecoder = null
function decodeGbk(buf) {
  try {
    if (!gbkDecoder) gbkDecoder = new TextDecoder('gbk')
    return gbkDecoder.decode(buf)
  } catch {
    return Buffer.from(buf).toString('latin1')
  }
}

function num(v) {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function sinaCodeFor(item) {
  const c = String(item.code || '').toUpperCase()
  if (c === '') return null
  switch (item.mkt) {
    case 'futcn': return 'nf_' + c
    case 'futgl': return HF_MAP[c] ? 'hf_' + HF_MAP[c] : null
    case 'index': return INT_MAP[c] ? 'int_' + INT_MAP[c] : null
    case 'fx': return 'fx_s' + c.replace(/=X$/, '').toLowerCase()
    case 'usstock': return 'gb_' + c.toLowerCase()
    default: return null
  }
}

function tencentCodeFor(item) {
  let c = String(item.code || '').trim()
  if (/^(sh|sz|bj)\d{6}$/i.test(c)) return c.toLowerCase()
  if (/^\d{6}$/.test(c)) {
    if (c[0] === '6') return 'sh' + c
    if (c[0] === '0' || c[0] === '3') return 'sz' + c
    if (c[0] === '4' || c[0] === '8') return 'bj' + c
  }
  return null
}

function yahooSymbolFor(item) {
  const c = String(item.code || '').trim()
  if (item.mkt === 'cnstock') {
    if (/^\d{6}$/.test(c)) {
      if (c[0] === '6') return c + '.SS'
      if (c[0] === '0' || c[0] === '3') return c + '.SZ'
    }
    return null
  }
  return c
}

// ---------------------------------------------------------------------------
// Sina parsing
// ---------------------------------------------------------------------------

async function fetchSinaBatch(symbols) {
  const out = {}
  if (symbols.length === 0) return out
  try {
    const res = await fetch('https://hq.sinajs.cn/list=' + symbols.join(','), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        Referer: 'https://finance.sina.com.cn/',
      },
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return out
    const text = decodeGbk(await res.arrayBuffer())
    for (const m of text.matchAll(/var hq_str_([a-zA-Z0-9_]+)="([^"]*)"/g)) {
      out[m[1]] = m[2]
    }
  } catch { /* fall through, empty -> yahoo */ }
  return out
}

function parseSinaItem(item, line) {
  if (!line || line.trim() === '') return null
  const f = line.split(',')
  const base = { id: item.id, ok: true, source: 'sina', market: item.mkt, code: item.code, cur: '' }
  try {
    if (item.mkt === 'futcn') {
      const price = num(f[8]) ?? num(f[5])
      const prev = num(f[10]) ?? num(f[5])
      if (price === null) return null
      return { ...base, name: f[0] || item.name, price, prevClose: prev, open: num(f[2]), high: num(f[3]), low: num(f[4]), volume: num(f[14]), oi: num(f[13]), change: prev !== null ? price - prev : null, changePct: prev ? (price - prev) / prev * 100 : null, time: (f[17] || '') + ' ' + fmtSinaTime(f[1]) }
    }
    if (item.mkt === 'futgl') {
      const price = num(f[0])
      const prev = num(f[7])
      if (price === null) return null
      return { ...base, name: f[13] || item.name, price, prevClose: prev, open: num(f[8]), high: num(f[4]), low: num(f[5]), change: prev !== null ? price - prev : null, changePct: prev ? (price - prev) / prev * 100 : null, time: (f[12] || '') + ' ' + (f[6] || '') }
    }
    if (item.mkt === 'index') {
      const price = num(f[1])
      if (price === null) return null
      const change = num(f[2])
      const pct = num(f[3])
      return { ...base, name: f[0] || item.name, price, prevClose: price !== null && change !== null ? price - change : null, change, changePct: pct, time: '' }
    }
    if (item.mkt === 'fx') {
      const price = num(f[8]) ?? num(f[1])
      const prev = num(f[3])
      if (price === null) return null
      return { ...base, name: f[9] || item.name, price, prevClose: prev, open: num(f[5]), high: num(f[6]), low: num(f[7]), change: num(f[11]) ?? (prev !== null ? price - prev : null), changePct: num(f[10]), time: '' }
    }
    if (item.mkt === 'usstock') {
      const price = num(f[1])
      if (price === null) return null
      const change = num(f[4])
      return { ...base, cur: 'USD', name: f[0] || item.name, price, prevClose: change !== null ? price - change : null, open: num(f[5]), high: num(f[6]), low: num(f[7]), volume: num(f[10]), change, changePct: num(f[2]), time: f[3] || '' }
    }
  } catch { return null }
  return null
}

function fmtSinaTime(t) {
  const s = String(t || '').padStart(6, '0')
  return s.slice(0, 2) + ':' + s.slice(2, 4) + ':' + s.slice(4, 6)
}

// ---------------------------------------------------------------------------
// Tencent parsing (A-share)
// ---------------------------------------------------------------------------

async function fetchTencentBatch(codes) {
  const out = {}
  if (codes.length === 0) return out
  try {
    const res = await fetch('https://qt.gtimg.cn/q=' + codes.join(','), {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      signal: AbortSignal.timeout(9000),
    })
    if (!res.ok) return out
    const text = decodeGbk(await res.arrayBuffer())
    for (const m of text.matchAll(/v_([a-z0-9]+)="([^"]*)"/gi)) {
      out[m[1].toLowerCase()] = m[2]
    }
  } catch {}
  return out
}

function parseTencentItem(item, line) {
  if (!line || line.trim() === '') return null
  const f = line.split('~')
  const price = num(f[3])
  if (price === null || price === 0) return null
  const prev = num(f[4])
  return {
    id: item.id, ok: true, source: 'tencent', market: item.mkt, code: item.code, cur: 'CNY',
    name: f[1] || item.name, price, prevClose: prev, open: num(f[5]),
    change: num(f[31]) ?? (prev !== null ? price - prev : null),
    changePct: num(f[32]) ?? (prev ? (price - prev) / prev * 100 : null),
    high: num(f[33]), low: num(f[34]), volume: num(f[6]), time: f[30] || '',
  }
}

// ---------------------------------------------------------------------------
// Yahoo
// ---------------------------------------------------------------------------

const YAHOO_UA = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36' }

async function fetchYahooChart(symbol, interval, range, timeout = 9000) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=false`
  const res = await fetch(url, { headers: YAHOO_UA, signal: AbortSignal.timeout(timeout) })
  if (!res.ok) throw new Error('yahoo HTTP ' + res.status)
  const j = await res.json()
  const result = j && j.chart && j.chart.result && j.chart.result[0]
  if (!result) throw new Error('yahoo empty')
  return result
}

async function fetchYahooQuote(item) {
  const sym = yahooSymbolFor(item)
  if (!sym) return null
  try {
    const result = await fetchYahooChart(sym, '1d', '5d')
    const m = result.meta || {}
    const q = result.indicators && result.indicators.quote && result.indicators.quote[0] || {}
    const price = num(m.regularMarketPrice)
    if (price === null) return null
    const prev = num(m.chartPreviousClose) ?? num(m.previousClose)
    const lastOf = (arr) => { if (!Array.isArray(arr)) return null; for (let i = arr.length - 1; i >= 0; i--) { const v = num(arr[i]); if (v !== null) return v } return null }
    return {
      id: item.id, ok: true, source: 'yahoo', market: item.mkt, code: item.code,
      name: item.name || m.symbol, shortName: m.shortName || '', cur: m.currency || '',
      price, prevClose: prev,
      change: prev !== null ? price - prev : num(m.regularMarketChange),
      changePct: prev !== null ? (price - prev) / prev * 100 : num(m.regularMarketChangePercent),
      open: lastOf(q.open), high: lastOf(q.high), low: lastOf(q.low), volume: lastOf(q.volume),
      time: m.regularMarketTime ? m.regularMarketTime * 1000 : 0,
    }
  } catch { return null }
}

// ---------------------------------------------------------------------------
// quote orchestration
// ---------------------------------------------------------------------------

async function fetchQuotes(items) {
  const result = {}
  const sinaList = []
  const tencentList = []
  const yahooList = []
  for (const it of items) {
    if (it.mkt === 'cnstock') {
      const tc = tencentCodeFor(it)
      if (tc) tencentList.push({ it, tc }); else yahooList.push(it)
    } else {
      const sc = sinaCodeFor(it)
      if (sc) sinaList.push({ it, sc }); else yahooList.push(it)
    }
  }

  if (sinaList.length > 0) {
    const map = await fetchSinaBatch(sinaList.map((x) => x.sc))
    for (const { it, sc } of sinaList) {
      const q = parseSinaItem(it, map[sc])
      if (q) result[it.id] = q; else yahooList.push(it)
    }
  }

  if (tencentList.length > 0) {
    const map = await fetchTencentBatch(tencentList.map((x) => x.tc))
    for (const { it, tc } of tencentList) {
      const q = parseTencentItem(it, map[tc])
      if (q) result[it.id] = q; else yahooList.push(it)
    }
  }

  if (yahooList.length > 0) {
    const settled = await Promise.all(yahooList.map((it) => fetchYahooQuote(it)))
    for (const q of settled) if (q) result[q.id] = q
  }

  // Fill any market/name gaps so the UI always has something to show.
  for (const it of items) {
    if (!result[it.id]) {
      result[it.id] = { id: it.id, ok: false, market: it.mkt, code: it.code, name: it.name, error: 'no-data' }
    }
  }
  return result
}

// ---------------------------------------------------------------------------
// K-line
// ---------------------------------------------------------------------------

function stripJsonpArray(text) {
  const start = text.indexOf('='); if (start < 0) return null
  const lb = text.indexOf('[', start); const rb = text.lastIndexOf(']')
  if (lb < 0 || rb < 0) return null
  try { return JSON.parse(text.slice(lb, rb + 1)) } catch { return null }
}

async function sinaFuturesKline(code, interval) {
  const sym = String(code || '').toUpperCase()
  let url, kind
  if (interval === '1d' || interval === '1w') {
    kind = 'day'; url = `https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20_${sym}=/InnerFuturesNewService.getDailyKLine?symbol=${encodeURIComponent(sym)}`
  } else {
    const t = /^(5|15|30|60)m$/.exec(interval) ? RegExp.$1 : '5'
    kind = 'min'; url = `https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20_${sym}=/InnerFuturesNewService.getFewMinLine?symbol=${encodeURIComponent(sym)}&type=${t}`
  }
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://finance.sina.com.cn/' }, signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error('sina kline HTTP ' + res.status)
  const text = await res.text()
  const arr = stripJsonpArray(text)
  if (!Array.isArray(arr)) throw new Error('sina kline parse')
  const candles = arr.map((r) => ({
    t: r.d, o: num(r.o), h: num(r.h), l: num(r.l), c: num(r.c), v: num(r.v),
  })).filter((c) => c.c !== null)
  const limit = kind === 'day' ? 400 : 500
  return candles.slice(-limit)
}

async function yahooKline(mkt, code, interval) {
  const item = { mkt, code }
  const sym = yahooSymbolFor(item)
  if (!sym) throw new Error('no symbol')
  const map = {
    '1d': ['1d', '2y'], '1w': ['1wk', '5y'],
    '60m': ['60m', '3mo'], '30m': ['30m', '3mo'], '15m': ['15m', '1mo'], '5m': ['5m', '5d'],
  }
  const [yi, yr] = map[interval] || map['1d']
  const result = await fetchYahooChart(sym, yi, yr, 12000)
  const ts = result.timestamp || []
  const q = (result.indicators && result.indicators.quote && result.indicators.quote[0]) || {}
  const candles = []
  for (let i = 0; i < ts.length; i++) {
    const c = num(q.close && q.close[i])
    if (c === null) continue
    candles.push({
      t: ts[i] * 1000,
      o: num(q.open && q.open[i]), h: num(q.high && q.high[i]), l: num(q.low && q.low[i]),
      c, v: num(q.volume && q.volume[i]),
    })
  }
  return candles.slice(-500)
}

// ---------------------------------------------------------------------------
// search (stocks via Tencent smartbox; catalog handled on the client)
// ---------------------------------------------------------------------------

async function searchStocks(q) {
  try {
    const res = await fetch('https://smartbox.gtimg.cn/s3/?t=all&q=' + encodeURIComponent(q), {
      headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(7000),
    })
    if (!res.ok) return []
    const raw = await res.text()
    const m = /v_hint="([^"]*)"/.exec(raw)
    if (!m || m[1] === 'N') return []
    let decoded = m[1]
    try { decoded = JSON.parse('"' + m[1].replace(/"/g, '\\"') + '"') } catch {}
    const results = []
    for (const entry of decoded.split('^')) {
      const p = entry.split('~')
      if (p.length < 3) continue
      const mk = p[0], code = p[1], nm = p[2]
      if (mk === 'sh' || mk === 'sz' || mk === 'bj') {
        results.push({ mkt: 'cnstock', code, name: nm })
      } else if (mk === 'us') {
        results.push({ mkt: 'usstock', code: String(code).split('.')[0].toUpperCase(), name: nm })
      }
      if (results.length >= 12) break
    }
    return results
  } catch { return [] }
}

// ---------------------------------------------------------------------------
// 交易资讯中心 (news center): X / Weibo / Zsxq
// ---------------------------------------------------------------------------

const NEWS_MAX = 600
const NEWS_SOURCES = ['x', 'weibo', 'zsxq']

function newsFile() { return path.join(dataDir(), 'news.json') }

function clampNum(v, def, min, max) {
  const n = Number(v)
  if (!Number.isFinite(n)) return def
  return Math.max(min, Math.min(max, Math.floor(n)))
}

function normalizeNewsConfig(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const src = s.sources && typeof s.sources === 'object' ? s.sources : {}
  const c = s.credentials && typeof s.credentials === 'object' ? s.credentials : {}
  const p = s.pollMinutes && typeof s.pollMinutes === 'object' ? s.pollMinutes : {}
  const gx = src.x && typeof src.x === 'object' ? src.x : {}
  const gw = src.weibo && typeof src.weibo === 'object' ? src.weibo : {}
  const gz = src.zsxq && typeof src.zsxq === 'object' ? src.zsxq : {}
  return {
    version: 1,
    sources: {
      x: { enabled: gx.enabled !== false, screenName: asString(gx.screenName, 40) },
      weibo: { enabled: gw.enabled === true, uid: asString(gw.uid, 30) },
      zsxq: { enabled: gz.enabled === true, groupId: asString(gz.groupId, 30) },
    },
    credentials: {
      weiboCookie: asString(c.weiboCookie, 4000),
      zsxqCookie: asString(c.zsxqCookie, 4000),
    },
    pollMinutes: {
      x: clampNum(p.x, 5, 1, 120),
      weibo: clampNum(p.weibo, 3, 1, 120),
      zsxq: clampNum(p.zsxq, 10, 1, 120),
    },
  }
}

// Credentials never leave the host — expose only "is it set?" to the browser.
function publicNewsConfig(cfg) {
  return {
    sources: cfg.sources,
    pollMinutes: cfg.pollMinutes,
    credentials: {
      weiboCookieSet: Boolean(cfg.credentials.weiboCookie),
      zsxqCookieSet: Boolean(cfg.credentials.zsxqCookie),
    },
  }
}

function normNewsItem(raw) {
  if (!raw || typeof raw !== 'object') return null
  const source = String(raw.source || '')
  if (NEWS_SOURCES.indexOf(source) < 0) return null
  const id = asString(raw.id, 80)
  if (id === '') return null
  const media = Array.isArray(raw.media) ? raw.media.filter((u) => typeof u === 'string' && /^https?:/i.test(u)).slice(0, 9) : []
  return {
    id,
    source,
    author: asString(raw.author, 80) || source,
    avatar: asString(raw.avatar, 500),
    createdAt: typeof raw.createdAt === 'number' && raw.createdAt > 0 ? raw.createdAt : Date.now(),
    text: asString(raw.text, 4000),
    media,
    url: asString(raw.url, 800),
    stats: {
      like: Number(raw.stats && raw.stats.like) || 0,
      comment: Number(raw.stats && raw.stats.comment) || 0,
      repost: Number(raw.stats && raw.stats.repost) || 0,
    },
    read: raw.read === true,
    fav: raw.fav === true,
  }
}

async function readNews() {
  try {
    const text = await fs.readFile(newsFile(), 'utf8')
    const raw = JSON.parse(text)
    const config = normalizeNewsConfig(raw.config)
    const items = Array.isArray(raw.items) ? raw.items.map(normNewsItem).filter(Boolean).slice(0, NEWS_MAX) : []
    return { config, items, updatedAt: Number(raw.updatedAt) || 0 }
  } catch (e) {
    if (e && e.code !== 'ENOENT') { try { process.emitWarning(`[dsh-tradingboat] read news failed: ${String(e)}`) } catch {} }
    return { config: normalizeNewsConfig(null), items: [], updatedAt: 0 }
  }
}

async function writeNews(state) {
  const file = newsFile()
  await fs.mkdir(path.dirname(file), { recursive: true })
  try { const st = await fs.stat(file); if (st.size) await fs.copyFile(file, file + '.bak') } catch {}
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, JSON.stringify({ version: 1, config: state.config, items: state.items, updatedAt: state.updatedAt }, null, 2), 'utf8')
  await fs.rename(tmp, file)
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+\n/g, '\n')
    .trim()
}

function parseWeiboTime(s) {
  if (!s) return Date.now()
  const direct = Date.parse(s)
  if (!Number.isNaN(direct)) return direct
  const now = Date.now()
  if (/刚刚/.test(s)) return now
  let m = /^(\d+)\s*分钟前/.exec(s); if (m) return now - Number(m[1]) * 60000
  m = /^(\d+)\s*小时前/.exec(s); if (m) return now - Number(m[1]) * 3600000
  m = /^昨天\s*(\d{1,2}):(\d{2})/.exec(s)
  if (m) { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(Number(m[1]), Number(m[2]), 0, 0); return d.getTime() }
  return now
}

async function fetchXNews(screenName) {
  if (!screenName) throw new Error('未配置 X 博主名（screenName）')
  const url = 'https://api.fxtwitter.com/2/profile/' + encodeURIComponent(screenName) + '/statuses?count=20'
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, signal: AbortSignal.timeout(12000) })
  if (!res.ok) throw new Error('FxTwitter HTTP ' + res.status)
  const j = await res.json()
  const results = Array.isArray(j.results) ? j.results : []
  const out = []
  for (const it of results) {
    if (it.type && it.type !== 'status') continue
    const id = String(it.id || '')
    if (!id) continue
    const media = []
    try {
      if (it.media) {
        ;(it.media.photos || []).forEach((p) => media.push(p.url))
        ;(it.media.videos || []).forEach((v) => media.push(v.thumbnail_url || v.url))
      }
    } catch {}
    const author = it.author || {}
    out.push({
      id: 'x:' + id,
      source: 'x',
      author: String(author.name || author.screen_name || screenName),
      avatar: String(author.avatar_url || author.profile_image_url || ''),
      createdAt: it.created_timestamp ? it.created_timestamp * 1000 : (it.created_at ? Date.parse(it.created_at) : Date.now()) || Date.now(),
      text: String(it.text || '').slice(0, 4000),
      media: media.filter(Boolean).slice(0, 9),
      url: String(it.url || ('https://x.com/' + screenName + '/status/' + id)),
      stats: { like: num(it.likes) || 0, comment: num(it.replies) || 0, repost: num(it.reposts) || 0 },
    })
  }
  return out
}

async function fetchWeiboNews(uid, cookie) {
  if (!uid) throw new Error('未配置微博 UID')
  if (!cookie) throw new Error('未配置微博 Cookie（需登录后的 SUB/SUBP）')
  const url = 'https://weibo.com/ajax/statuses/mymblog?uid=' + encodeURIComponent(uid) + '&page=1&feature=0'
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      Cookie: cookie,
      Referer: 'https://weibo.com/u/' + uid,
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json, text/plain, */*',
    },
    signal: AbortSignal.timeout(12000),
  })
  const text = await res.text()
  let j = null
  try { j = JSON.parse(text) } catch {
    if (res.status === 432 || /Sina Visitor System/i.test(text)) throw new Error('微博拒绝访问（432/游客验证）：Cookie 无效或已过期')
    throw new Error('微博返回非 JSON（HTTP ' + res.status + '）：Cookie 可能失效')
  }
  if (!j || j.ok !== 1 || !j.data) throw new Error('微博接口异常：Cookie 可能失效或账号无权限')
  const list = Array.isArray(j.data.list) ? j.data.list : []
  const out = []
  for (const m of list) {
    const id = String(m.idstr || m.id || m.mblogid || '')
    if (!id) continue
    const pics = []
    if (m.pic_infos && typeof m.pic_infos === 'object') {
      Object.keys(m.pic_infos).forEach((k) => {
        const p = m.pic_infos[k] || {}
        pics.push((p.largest && p.largest.url) || (p.bmiddle && p.bmiddle.url) || p.url)
      })
    } else if (Array.isArray(m.pic_ids)) {
      m.pic_ids.forEach((pid) => pics.push('https://wx1.sinaimg.cn/large/' + pid + '.jpg'))
    }
    out.push({
      id: 'weibo:' + id,
      source: 'weibo',
      author: String((m.user && m.user.screen_name) || ('UID ' + uid)),
      avatar: String((m.user && (m.user.profile_image_url || m.user.avatar_hd)) || ''),
      createdAt: parseWeiboTime(m.created_at),
      text: stripHtml(m.text_raw || m.text || '').slice(0, 4000),
      media: pics.filter(Boolean).slice(0, 9),
      url: m.mblogid ? ('https://m.weibo.cn/detail/' + m.mblogid) : ('https://weibo.com/' + uid + '/' + id),
      stats: { like: num(m.attitudes_count) || 0, comment: num(m.comments_count) || 0, repost: num(m.reposts_count) || 0 },
    })
  }
  return out
}

async function fetchZsxqNews(groupId, cookie) {
  if (!groupId) throw new Error('未配置知识星球 groupId')
  if (!cookie) throw new Error('未配置知识星球 Cookie（zsxq_access_token）')
  const url = 'https://api.zsxq.com/v2/groups/' + encodeURIComponent(groupId) + '/topics?scope=all&count=20'
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
      Cookie: cookie,
      'x-version': '2.55.0',
      'x-request-id': randomUUID(),
      Accept: 'application/json',
      Origin: 'https://wx.zsxq.com',
      Referer: 'https://wx.zsxq.com/',
    },
    signal: AbortSignal.timeout(12000),
  })
  const text = await res.text()
  let j = null
  try { j = JSON.parse(text) } catch { throw new Error('星球返回非 JSON（HTTP ' + res.status + '）：Cookie 可能失效') }
  if (!j || j.succeeded !== true || !j.resp_data) throw new Error('星球接口异常：' + (j && (j.error || j.info) || 'Cookie 失效（Unauthorized）'))
  const topics = Array.isArray(j.resp_data.topics) ? j.resp_data.topics : []
  const out = []
  for (const tp of topics) {
    const id = String(tp.topic_id || '')
    if (!id) continue
    const talk = tp.talk || {}
    const owner = talk.owner || {}
    const images = Array.isArray(talk.images) ? talk.images.map((im) => (im.large && im.large.url) || (im.thumbnail && im.thumbnail.url)).filter(Boolean) : []
    out.push({
      id: 'zsxq:' + id,
      source: 'zsxq',
      author: String(owner.name || '星球'),
      avatar: String(owner.avatar_url || ''),
      createdAt: Date.parse(tp.create_time) || Date.now(),
      text: String(talk.text || '').slice(0, 4000),
      media: images.slice(0, 9),
      url: 'https://wx.zsxq.com/dweb2/index/topic_detail/' + id,
      stats: { like: num(tp.likes_count) || 0, comment: num(tp.comments_count) || 0, repost: 0 },
    })
  }
  return out
}

function mergeNews(existing, incoming) {
  const seen = new Set(existing.map((it) => it.id))
  const add = []
  for (const it of incoming) {
    if (!seen.has(it.id)) { seen.add(it.id); add.push(it) }
  }
  const merged = add.concat(existing).sort((a, b) => b.createdAt - a.createdAt).slice(0, NEWS_MAX)
  return { merged, added: add.length }
}

async function refreshNewsSource(source) {
  return withLock(async () => {
    const st = await readNews()
    const cfg = st.config
    try {
      let incoming = []
      if (source === 'x') {
        if (cfg.sources.x.enabled !== true || !cfg.sources.x.screenName) return { source, skipped: true }
        incoming = await fetchXNews(cfg.sources.x.screenName)
      } else if (source === 'weibo') {
        if (cfg.sources.weibo.enabled !== true || !cfg.sources.weibo.uid) return { source, skipped: true }
        incoming = await fetchWeiboNews(cfg.sources.weibo.uid, cfg.credentials.weiboCookie)
      } else if (source === 'zsxq') {
        if (cfg.sources.zsxq.enabled !== true || !cfg.sources.zsxq.groupId) return { source, skipped: true }
        incoming = await fetchZsxqNews(cfg.sources.zsxq.groupId, cfg.credentials.zsxqCookie)
      } else {
        return { source, error: 'unknown source' }
      }
      const { merged, added } = mergeNews(st.items, incoming)
      await writeNews({ config: cfg, items: merged, updatedAt: Date.now() })
      return { source, added, total: merged.length, fetched: incoming.length }
    } catch (e) {
      return { source, error: String((e && e.message) || e) }
    }
  })
}

async function handleNews(request) {
  let body = null
  try { body = await request.json() } catch { body = null }
  const op = body && typeof body === 'object' ? body.op : 'getConfig'
  try {
    if (op === 'getConfig') {
      const st = await withLock(readNews)
      return json({ ok: true, config: publicNewsConfig(st.config), updatedAt: st.updatedAt })
    }
    if (op === 'saveConfig') {
      const incoming = normalizeNewsConfig(body && body.config)
      const saved = await withLock(async () => {
        const st = await readNews()
        const next = normalizeNewsConfig({
          sources: incoming.sources,
          pollMinutes: incoming.pollMinutes,
          credentials: {
            weiboCookie: incoming.credentials.weiboCookie || st.config.credentials.weiboCookie,
            zsxqCookie: incoming.credentials.zsxqCookie || st.config.credentials.zsxqCookie,
          },
        })
        await writeNews({ config: next, items: st.items, updatedAt: st.updatedAt })
        return next
      })
      return json({ ok: true, config: publicNewsConfig(saved) })
    }
    if (op === 'clearCookie') {
      const which = String(body && body.which || '')
      const saved = await withLock(async () => {
        const st = await readNews()
        const cred = { ...st.config.credentials }
        if (which === 'weibo') cred.weiboCookie = ''
        if (which === 'zsxq') cred.zsxqCookie = ''
        const next = normalizeNewsConfig({ ...st.config, credentials: cred })
        await writeNews({ config: next, items: st.items, updatedAt: st.updatedAt })
        return next
      })
      return json({ ok: true, config: publicNewsConfig(saved) })
    }
    if (op === 'list') {
      const st = await withLock(readNews)
      const source = body && body.source && body.source !== 'all' ? String(body.source) : ''
      let items = st.items
      if (source) items = items.filter((it) => it.source === source)
      const unread = { all: 0, x: 0, weibo: 0, zsxq: 0 }
      st.items.forEach((it) => { if (!it.read) { unread.all++; if (unread[it.source] !== undefined) unread[it.source]++ } })
      return json({ ok: true, items: items.slice(0, 300), unread, updatedAt: st.updatedAt })
    }
    if (op === 'refresh') {
      const source = body && body.source ? String(body.source) : ''
      const list = source && source !== 'all' ? [source] : NEWS_SOURCES.slice()
      const results = []
      for (const s of list) results.push(await refreshNewsSource(s))
      return json({ ok: true, results })
    }
    if (op === 'mark') {
      const ids = Array.isArray(body && body.ids) ? body.ids.map((x) => String(x)).slice(0, 500) : []
      const idset = new Set(ids)
      const read = body && typeof body.read === 'boolean' ? body.read : undefined
      const fav = body && typeof body.fav === 'boolean' ? body.fav : undefined
      const st = await withLock(async () => {
        const cur = await readNews()
        cur.items = cur.items.map((it) => {
          if (!idset.has(it.id)) return it
          return { ...it, read: read === undefined ? it.read : read, fav: fav === undefined ? it.fav : fav }
        })
        await writeNews({ config: cur.config, items: cur.items, updatedAt: cur.updatedAt })
        return cur
      })
      return json({ ok: true, items: st.items.length })
    }
    if (op === 'test') {
      const source = String(body && body.source || '')
      const st = await withLock(readNews)
      const cfg = st.config
      const cookie = String(body && body.cookie || '')
      try {
        let items = []
        if (source === 'x') items = await fetchXNews(String(body && body.screenName || cfg.sources.x.screenName))
        else if (source === 'weibo') items = await fetchWeiboNews(String(body && body.uid || cfg.sources.weibo.uid), cookie || cfg.credentials.weiboCookie)
        else if (source === 'zsxq') items = await fetchZsxqNews(String(body && body.groupId || cfg.sources.zsxq.groupId), cookie || cfg.credentials.zsxqCookie)
        else return json({ ok: false, error: 'unknown source' })
        return json({ ok: true, count: items.length, sample: items.slice(0, 2).map((it) => ({ author: it.author, text: it.text.slice(0, 120), createdAt: it.createdAt })) })
      } catch (e) {
        return json({ ok: false, error: String((e && e.message) || e) })
      }
    }
    return json({ ok: false, error: 'unknown op' })
  } catch (e) {
    return json({ ok: false, error: { code: 'dsh-tradingboat/news', message: String(e) } })
  }
}

// ---------------------------------------------------------------------------
// routes
// ---------------------------------------------------------------------------

function json(payload) {
  return new Response(JSON.stringify(payload), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  })
}

async function handleState(request) {
  let body = null
  try { body = await request.json() } catch { body = null }
  const op = body && typeof body === 'object' ? body.op : 'get'
  try {
    if (op === 'save' && body && body.state) {
      const state = normalizeState(body.state)
      const saved = await withLock(async () => { await writeState(state); return state })
      return json({ ok: true, value: saved })
    }
    if (op === 'reset') {
      const state = normalizeState({ groups: defaultGroups(), settings: body && body.settings })
      const saved = await withLock(async () => { await writeState(state); return state })
      return json({ ok: true, value: saved })
    }
    const state = await withLock(readState)
    return json({ ok: true, value: state })
  } catch (e) {
    return json({ ok: false, error: { code: 'dsh-tradingboat/io', message: String(e) } })
  }
}

async function handleQuotes(request) {
  let body = null
  try { body = await request.json() } catch { body = null }
  try {
    let items = []
    if (body && Array.isArray(body.items)) {
      items = body.items
        .map((raw, i) => normalizeItem(raw, i))
        .filter(Boolean)
        .slice(0, MAX_ITEMS)
    } else {
      const state = await withLock(readState)
      for (const g of state.groups) items.push(...g.items)
    }
    const quotes = await fetchQuotes(items)
    return json({ ok: true, ts: Date.now(), quotes })
  } catch (e) {
    return json({ ok: false, error: { code: 'dsh-tradingboat/quotes', message: String(e) } })
  }
}

async function handleKline(request) {
  let body = null
  try { body = await request.json() } catch { body = null }
  try {
    const mkt = String(body && body.mkt || '')
    const code = String(body && body.code || '')
    let interval = String(body && body.interval || '1d')
    if (!MARKETS.has(mkt) || code === '') return json({ ok: false, error: { code: 'bad-args' } })
    if (!/^(1d|1w|60m|30m|15m|5m)$/.test(interval)) interval = '1d'
    const candles = mkt === 'futcn' ? await sinaFuturesKline(code, interval) : await yahooKline(mkt, code, interval)
    return json({ ok: true, mkt, code, interval, candles })
  } catch (e) {
    return json({ ok: false, error: { code: 'dsh-tradingboat/kline', message: String(e) } })
  }
}

async function handleSearch(request) {
  let body = null
  try { body = await request.json() } catch { body = null }
  try {
    const q = asString(body && body.q, 40)
    if (q === '') return json({ ok: true, results: [] })
    const results = await searchStocks(q)
    return json({ ok: true, results })
  } catch (e) {
    return json({ ok: false, error: { code: 'dsh-tradingboat/search', message: String(e) } })
  }
}

export function apply(ctx) {
  try { ctx.logger?.info?.('[dsh-tradingboat] host active v0.1.1 (news)') } catch {}
  ctx.inject(['connection'], (scope) => {
    let connection
    try { connection = scope.get('connection') } catch { connection = undefined }
    const register = connection && connection.fetch && typeof connection.fetch.register === 'function'
      ? connection.fetch.register.bind(connection.fetch)
      : undefined
    if (!register) {
      try { ctx.logger?.warn?.('[dsh-tradingboat] connection.fetch.register unavailable') } catch {}
      return
    }
    const routes = [
      ['/api/dsh-tradingboat/state', handleState, 'dsh-tradingboat: state route'],
      ['/api/dsh-tradingboat/quotes', handleQuotes, 'dsh-tradingboat: quotes route'],
      ['/api/dsh-tradingboat/kline', handleKline, 'dsh-tradingboat: kline route'],
      ['/api/dsh-tradingboat/search', handleSearch, 'dsh-tradingboat: search route'],
      ['/api/dsh-tradingboat/news', handleNews, 'dsh-tradingboat: news route'],
    ]
    for (const [p, handler, label] of routes) {
      scope.effect(() => register({ path: p, methods: ['POST'], requestBody: 'buffered', fetch: handler }), label)
    }
  })

  // Background news poller (runs only while DSH is alive).
  ctx.effect(() => {
    let stopped = false
    const last = {}
    async function tick() {
      if (stopped) return
      let cfg
      try { cfg = (await readNews()).config } catch { return }
      const now = Date.now()
      for (const s of NEWS_SOURCES) {
        const conf = cfg.sources[s]
        if (!conf || !conf.enabled) continue
        if (s === 'x' && !conf.screenName) continue
        if (s === 'weibo' && (!conf.uid || !cfg.credentials.weiboCookie)) continue
        if (s === 'zsxq' && (!conf.groupId || !cfg.credentials.zsxqCookie)) continue
        const interval = (cfg.pollMinutes[s] || 5) * 60000
        if (last[s] && now - last[s] < interval) continue
        last[s] = now
        try { await refreshNewsSource(s) } catch {}
      }
    }
    const first = setTimeout(() => { tick().catch(() => {}) }, 15000)
    const timer = setInterval(() => { tick().catch(() => {}) }, 60000)
    return () => { stopped = true; clearTimeout(first); clearInterval(timer) }
  }, 'dsh-tradingboat: news scheduler')
}
