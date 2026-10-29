/**
 * dsh-tradingboat — browser half.
 *
 * Registers:
 *   - a `main` keyed panel: the full-screen watch terminal (left watchlist with
 *     user-defined groups, right detail pane with an SVG K-line chart),
 *   - a `sidebar.panellist` row for the left navigation entry,
 *   - a `shell.overlay` floating pill (optional, toggled in settings).
 *
 * All data comes from the host half over POST /api/dsh-tradingboat/*.
 */
;(function () {
  var MODULE_ID = 'dsh-tradingboat'
  var loader = typeof window !== 'undefined' ? window.__ModuleLoader__ : undefined
  if (!loader || typeof loader.load !== 'function') return

  loader.load({
    id: MODULE_ID,
    factory: function (require) {
      var module = { exports: {} }
      var React = require('react')
      var h = React.createElement
      var NS = 'dsh-tradingboat'

      // ------------------------------------------------------------------
      // locale
      // ------------------------------------------------------------------
      var ZH = { 'nav.title': '交易之舟', 'page.title': '交易之舟' }
      var EN = { 'nav.title': 'Trading Boat', 'page.title': 'Trading Boat' }

      // ------------------------------------------------------------------
      // market meta + catalog
      // ------------------------------------------------------------------
      var MARKETS = {
        futcn: { label: '国内期货', short: '国期', color: '#f0a020', up: 'red' },
        futgl: { label: '外盘期货', short: '外期', color: '#7a6cff', up: 'green' },
        index: { label: '全球股指', short: '股指', color: '#4d8dff', up: 'green' },
        fx: { label: '外汇', short: '外汇', color: '#17c1a0', up: 'green' },
        cnstock: { label: 'A股', short: 'A股', color: '#ff6b6b', up: 'red' },
        usstock: { label: '美股', short: '美股', color: '#3ba7ff', up: 'green' },
      }

      var CATALOG = {
        futcn: [
          ['RB0', '螺纹钢'], ['HC0', '热卷'], ['CU0', '铜'], ['AL0', '铝'], ['ZN0', '锌'], ['NI0', '镍'],
          ['PB0', '铅'], ['SN0', '锡'], ['AU0', '黄金'], ['AG0', '白银'], ['RU0', '橡胶'], ['BU0', '沥青'],
          ['FU0', '燃油'], ['SP0', '纸浆'], ['SS0', '不锈钢'], ['SC0', '原油'], ['LU0', '低硫燃料油'],
          ['NR0', '20号胶'], ['BC0', '国际铜'], ['M0', '豆粕'], ['Y0', '豆油'], ['P0', '棕榈油'],
          ['C0', '玉米'], ['CS0', '淀粉'], ['A0', '豆一'], ['B0', '豆二'], ['JD0', '鸡蛋'], ['L0', '塑料'],
          ['V0', 'PVC'], ['PP0', '聚丙烯'], ['EG0', '乙二醇'], ['EB0', '苯乙烯'], ['J0', '焦炭'],
          ['JM0', '焦煤'], ['I0', '铁矿石'], ['LH0', '生猪'], ['TA0', 'PTA'], ['MA0', '甲醇'],
          ['SR0', '白糖'], ['CF0', '棉花'], ['CY0', '棉纱'], ['FG0', '玻璃'], ['SA0', '纯碱'],
          ['ZC0', '动力煤'], ['RM0', '菜粕'], ['OI0', '菜油'], ['AP0', '苹果'], ['CJ0', '红枣'],
          ['UR0', '尿素'], ['SF0', '硅铁'], ['SM0', '锰硅'], ['PF0', '短纤'], ['PK0', '花生'],
          ['SH0', '烧碱'], ['PX0', '对二甲苯'], ['IF0', '沪深300'], ['IC0', '中证500'], ['IH0', '上证50'],
          ['IM0', '中证1000'], ['T0', '十年国债'], ['TF0', '五年国债'], ['TS0', '二年国债'], ['TL0', '三十年国债'],
        ],
        futgl: [
          ['CL=F', 'WTI原油'], ['BZ=F', '布伦特原油'], ['GC=F', 'COMEX黄金'], ['SI=F', 'COMEX白银'],
          ['HG=F', 'COMEX铜'], ['PL=F', '铂金'], ['PA=F', '钯金'], ['NG=F', '天然气'], ['HO=F', '取暖油'],
          ['RB=F', 'RBOB汽油'], ['ZC=F', 'CBOT玉米'], ['ZS=F', 'CBOT大豆'], ['ZW=F', 'CBOT小麦'],
          ['ZM=F', '豆粕'], ['ZL=F', '豆油'], ['KC=F', '咖啡'], ['SB=F', '11号糖'], ['CC=F', '可可'],
          ['CT=F', '棉花'], ['OJ=F', '橙汁'], ['LE=F', '活牛'], ['HE=F', '瘦肉猪'], ['ES=F', '标普500期货'],
          ['NQ=F', '纳指100期货'], ['YM=F', '道指期货'], ['RTY=F', '罗素2000期货'],
        ],
        index: [
          ['^GSPC', '标普500'], ['^DJI', '道琼斯'], ['^IXIC', '纳斯达克综合'], ['^NDX', '纳斯达克100'],
          ['^RUT', '罗素2000'], ['^VIX', 'VIX波动率'], ['^N225', '日经225'], ['^HSI', '恒生指数'],
          ['^FTSE', '英国富时100'], ['^GDAXI', '德国DAX'], ['^FCHI', '法国CAC40'], ['^STOXX50E', '欧洲斯托克50'],
          ['^BSESN', '印度SENSEX'], ['^AXJO', '澳洲ASX200'], ['^KS11', '韩国KOSPI'], ['^TWII', '台湾加权'],
          ['^SSEC', '上证指数'],
        ],
        fx: [
          ['USDCNY=X', '美元/人民币'], ['EURUSD=X', '欧元/美元'], ['USDJPY=X', '美元/日元'], ['GBPUSD=X', '英镑/美元'],
          ['AUDUSD=X', '澳元/美元'], ['USDCHF=X', '美元/瑞郎'], ['USDCAD=X', '美元/加元'], ['NZDUSD=X', '纽元/美元'],
          ['USDHKD=X', '美元/港元'], ['USDSGD=X', '美元/新加坡元'], ['DX-Y.NYB', '美元指数'],
          ['EURJPY=X', '欧元/日元'], ['GBPJPY=X', '英镑/日元'], ['AUDJPY=X', '澳元/日元'], ['NZDJPY=X', '纽元/日元'],
          ['CADJPY=X', '加元/日元'], ['CHFJPY=X', '瑞郎/日元'],
          ['EURGBP=X', '欧元/英镑'], ['EURCHF=X', '欧元/瑞郎'], ['EURAUD=X', '欧元/澳元'], ['EURCAD=X', '欧元/加元'], ['EURNZD=X', '欧元/纽元'],
          ['GBPCHF=X', '英镑/瑞郎'], ['GBPAUD=X', '英镑/澳元'], ['GBPCAD=X', '英镑/加元'], ['GBPNZD=X', '英镑/纽元'],
          ['AUDCAD=X', '澳元/加元'], ['AUDCHF=X', '澳元/瑞郎'], ['AUDNZD=X', '澳元/纽元'],
          ['CADCHF=X', '加元/瑞郎'], ['NZDCAD=X', '纽元/加元'], ['NZDCHF=X', '纽元/瑞郎'],
          ['USDTHB=X', '美元/泰铢'], ['USDKRW=X', '美元/韩元'], ['USDTWD=X', '美元/新台币'], ['USDINR=X', '美元/印度卢比'],
          ['USDZAR=X', '美元/南非兰特'], ['USDTRY=X', '美元/土耳其里拉'], ['USDMXN=X', '美元/墨西哥比索'],
          ['USDBRL=X', '美元/巴西雷亚尔'], ['USDRUB=X', '美元/俄罗斯卢布'],
        ],
      }
      function catalogList(mkt) {
        return (CATALOG[mkt] || []).map(function (p) { return { mkt: mkt, code: p[0], name: p[1] } })
      }

      var DEFAULT_SETTINGS = { pillEnabled: true, upColor: 'auto', refreshMs: 5000, density: 'comfortable' }

      // shared settings store so the floating pill reacts to panel changes
      var settingsStore = { value: Object.assign({}, DEFAULT_SETTINGS), subs: [] }
      function getSettings() { return settingsStore.value }
      function setSettingsValue(next) {
        if (!next) return
        if (JSON.stringify(next) === JSON.stringify(settingsStore.value)) return
        settingsStore.value = Object.assign({}, DEFAULT_SETTINGS, next)
        settingsStore.subs.slice().forEach(function (cb) { try { cb() } catch (e) {} })
      }
      function subscribeSettings(cb) { settingsStore.subs.push(cb); return function () { var i = settingsStore.subs.indexOf(cb); if (i >= 0) settingsStore.subs.splice(i, 1) } }

      // ------------------------------------------------------------------
      // helpers
      // ------------------------------------------------------------------
      function upBaseFor(item, settings) {
        var s = settings || getSettings()
        if (s.upColor === 'red') return 'red'
        if (s.upColor === 'green') return 'green'
        var meta = MARKETS[item && item.mkt]
        return meta ? meta.up : 'green'
      }
      function pctClass(pct, base) {
        if (pct === null || pct === undefined || !isFinite(pct)) return 'wq-pct-flat'
        if (pct > 0) return base === 'red' ? 'wq-pct-up-red' : 'wq-pct-up-green'
        if (pct < 0) return base === 'red' ? 'wq-pct-down-red' : 'wq-pct-down-green'
        return 'wq-pct-flat'
      }
      function chgColor(pct, base) {
        if (pct === null || pct === undefined || !isFinite(pct) || pct === 0) return 'var(--dsw-alias-label-secondary,#9aa0aa)'
        var up = pct > 0
        if (base === 'red') return up ? '#ff4d4f' : '#17c964'
        return up ? '#17c964' : '#ff4d4f'
      }
      function fmtPct(n) {
        if (n === null || n === undefined || !isFinite(n)) return '—'
        return (n > 0 ? '+' : '') + n.toFixed(2) + '%'
      }
      function fmtNum(n, d) {
        if (n === null || n === undefined || !isFinite(n)) return '—'
        d = (d === undefined) ? 2 : d
        try { return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) } catch (e) { return n.toFixed(d) }
      }
      function priceDigits(item, price) {
        if (!item) return 2
        if (item.mkt === 'fx') return 4
        if (item.mkt === 'futcn') return (price !== null && Math.abs(price) < 1000) ? 1 : 0
        if (item.mkt === 'index') return 2
        return 2
      }
      function fmtVolume(v) {
        if (v === null || v === undefined || !isFinite(v)) return '—'
        if (v >= 1e8) return (v / 1e8).toFixed(2) + '亿'
        if (v >= 1e4) return (v / 1e4).toFixed(2) + '万'
        return String(Math.round(v))
      }
      function candleLabel(t2, interval) {
        if (typeof t2 === 'number') { var d = new Date(t2); return pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()) + (interval !== '1d' && interval !== '1w' ? ' ' + pad2(d.getHours()) + ':' + pad2(d.getMinutes()) : '') }
        var s = String(t2)
        var m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s)
        if (m) return m[2] + '-' + m[3] + (m[4] && interval !== '1d' && interval !== '1w' ? ' ' + m[4] + ':' + m[5] : '')
        return s
      }
      function pad2(n) { return n < 10 ? '0' + n : String(n) }
      function timeLabel(ts) {
        if (!ts) return '—'
        var d = new Date(ts)
        if (isNaN(d.getTime())) return '—'
        return pad2(d.getHours()) + ':' + pad2(d.getMinutes()) + ':' + pad2(d.getSeconds())
      }
      function newId(mkt, code) { return 'x-' + mkt + '-' + code + '-' + Math.random().toString(36).slice(2, 8) }

      function autoGroupId(mkt, groups) {
        var want = mkt === 'cnstock' || mkt === 'usstock' ? 'g-stock' : 'g-' + mkt
        for (var i = 0; i < groups.length; i++) if (groups[i].id === want) return want
        for (var j = 0; j < groups.length; j++) { if (groups[j].name && groups[j].name.indexOf(MARKETS[mkt] ? MARKETS[mkt].label : '') >= 0) return groups[j].id }
        return groups.length ? groups[0].id : ''
      }

      // ------------------------------------------------------------------
      // styles
      // ------------------------------------------------------------------
      function injectStyles() {
        if (typeof document === 'undefined') return
        var marker = 'dsh-tradingboat/styles'
        if (document.querySelector('style[data-plugin-css="' + marker + '"]') !== null) return
        var el = document.createElement('style')
        el.dataset.plugin = 'dsh-tradingboat'
        el.dataset.pluginCss = marker
        el.textContent = [
          '.wq-page{position:relative;box-sizing:border-box;height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base,#16181d);color:var(--dsw-alias-label-primary,#e6e6e6);font-size:13px;line-height:1.5;overflow:hidden;container:wq/inline-size}',
          '.wq-topbar{flex:none;display:flex;align-items:center;gap:10px;padding:13px 18px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}',
          '.wq-title{font-size:16px;font-weight:600;display:flex;align-items:center;gap:8px}',
          '.wq-summary{font-size:12px;color:var(--dsw-alias-label-secondary,#9aa0aa);font-variant-numeric:tabular-nums}',
          '.wq-up{color:#ff4d4f}.wq-down{color:#17c964}',
          '.wq-spacer{flex:1}',
          '.wq-btn{font:inherit;font-size:12px;cursor:pointer;color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.05));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:8px;padding:6px 12px;transition:background .15s}',
          '.wq-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.09))}',
          '.wq-btn.primary,.wq-btn.primary:hover{background:#3b6ff5;color:#fff;border-color:transparent}',
          '.wq-btn.primary:hover{filter:brightness(1.08)}',
          '.wq-dot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-success-primary,#17c964);display:inline-block;flex:none}',
          '.wq-dot.spin{background:var(--dsw-alias-brand-primary,#4d8dff);animation:wq-spin 1s linear infinite}',
          '@keyframes wq-spin{0%{opacity:.2}50%{opacity:1}100%{opacity:.2}}',
          '.wq-body{flex:1;min-height:0;display:flex}',
          '.wq-left{width:360px;flex:none;min-height:0;display:flex;flex-direction:column;border-right:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}',
          '.wq-groups{flex:1;min-height:0;overflow-y:auto;padding:8px 8px 40px}',
          '.wq-group{margin-bottom:4px}',
          '.wq-ghead{display:flex;align-items:center;gap:6px;padding:6px 8px;cursor:pointer;border-radius:6px}',
          '.wq-ghead:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.05))}',
          '.wq-ghead:hover .wq-gops{opacity:1}',
          '.wq-caret{width:12px;text-align:center;font-size:10px;color:var(--dsw-alias-label-tertiary,#7c828c)}',
          '.wq-gname{flex:1;font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary,#9aa0aa);letter-spacing:.03em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.wq-gcount{font-size:11px;color:var(--dsw-alias-label-tertiary,#7c828c);font-variant-numeric:tabular-nums}',
          '.wq-gops{display:flex;gap:1px;opacity:0;transition:opacity .15s}',
          '.wq-iconbtn{border:0;background:transparent;color:var(--dsw-alias-label-tertiary,#7c828c);cursor:pointer;font-size:11px;padding:1px 4px;border-radius:4px;line-height:1.4}',
          '.wq-iconbtn:hover{color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.09))}',
          '.wq-rows{display:flex;flex-direction:column;gap:2px;margin-top:2px}',
          '.wq-row{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;text-align:left;font:inherit;cursor:pointer;background:transparent;border:1px solid transparent;border-radius:7px;padding:6px 8px;color:inherit}',
          '.wq-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.05))}',
          '.wq-row.is-sel{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 16%,transparent);border-color:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 42%,transparent)}',
          '.wq-mkbar{width:3px;height:22px;border-radius:2px;flex:none}',
          '.wq-rowmain{flex:1;min-width:0;display:flex;flex-direction:column}',
          '.wq-rname{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.wq-rcode{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#7c828c);font-variant-numeric:tabular-nums}',
          '.wq-rprice{font-size:13px;font-variant-numeric:tabular-nums;text-align:right;min-width:66px}',
          '.wq-rpct{font-size:12px;font-variant-numeric:tabular-nums;text-align:right;min-width:64px;border-radius:5px;padding:2px 6px;font-weight:600}',
          '.wq-pct-up-red{color:#ff4d4f;background:rgba(255,77,79,.13)}',
          '.wq-pct-down-red{color:#17c964;background:rgba(23,201,100,.13)}',
          '.wq-pct-up-green{color:#17c964;background:rgba(23,201,100,.13)}',
          '.wq-pct-down-green{color:#ff4d4f;background:rgba(255,77,79,.13)}',
          '.wq-pct-flat{color:var(--dsw-alias-label-secondary,#9aa0aa);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.05))}',
          '.wq-del{opacity:0;border:0;background:transparent;color:var(--dsw-alias-label-tertiary,#7c828c);cursor:pointer;font-size:13px;padding:0 3px;flex:none}',
          '.wq-row:hover .wq-del{opacity:1}',
          '.wq-del:hover{color:var(--dsw-alias-state-error-primary,#ff6b6b)}',
          '.wq-right{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}',
          '.wq-placeholder{flex:1;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;color:var(--dsw-alias-label-tertiary,#7c828c);font-size:13px}',
          '.wq-dwrap{height:100%;min-height:0;display:flex;flex-direction:column}',
          '.wq-dhead{flex:none;padding:16px 20px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}',
          '.wq-dtitle{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}',
          '.wq-dname{font-size:18px;font-weight:600}',
          '.wq-dcode{font-size:12px;color:var(--dsw-alias-label-tertiary,#7c828c);font-variant-numeric:tabular-nums}',
          '.wq-chip{font-size:11px;border-radius:999px;padding:1px 8px;border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));color:var(--dsw-alias-label-secondary,#9aa0aa)}',
          '.wq-dprice-row{display:flex;align-items:baseline;gap:12px;margin-top:8px;flex-wrap:wrap}',
          '.wq-dprice{font-size:30px;font-weight:700;font-variant-numeric:tabular-nums;letter-spacing:.01em}',
          '.wq-dchg{font-size:15px;font-variant-numeric:tabular-nums;font-weight:600}',
          '.wq-dtime{font-size:11px;color:var(--dsw-alias-label-tertiary,#7c828c);margin-left:auto}',
          '.wq-stats{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px 12px;margin-top:12px}',
          '.wq-stat{display:flex;flex-direction:column;gap:1px}',
          '.wq-stat-k{font-size:10.5px;color:var(--dsw-alias-label-tertiary,#7c828c)}',
          '.wq-stat-v{font-size:12.5px;font-variant-numeric:tabular-nums}',
          '.wq-tabs{flex:none;display:flex;gap:4px;padding:10px 20px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}',
          '.wq-tab{font:inherit;font-size:12px;cursor:pointer;color:var(--dsw-alias-label-secondary,#9aa0aa);background:transparent;border:1px solid transparent;border-radius:6px;padding:4px 12px}',
          '.wq-tab:hover{color:var(--dsw-alias-label-primary,#e6e6e6)}',
          '.wq-tab.is-on{color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.07));border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.14))}',
          '.wq-chartwrap{flex:1;min-height:0;overflow-y:auto;padding:8px 12px 20px}',
          '.wq-chart{position:relative;width:100%}',
          '.wq-chart-empty{padding:48px;text-align:center;color:var(--dsw-alias-label-tertiary,#7c828c)}',
          '.wq-chart-legend{position:absolute;top:2px;left:10px;display:flex;gap:10px;font-size:10.5px;font-variant-numeric:tabular-nums;pointer-events:none}',
          '.wq-modal-mask{position:absolute;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:flex-start;justify-content:center;z-index:60;padding-top:7vh;box-sizing:border-box}',
          '.wq-modal{width:min(560px,92%);max-height:80vh;display:flex;flex-direction:column;background:var(--dsw-alias-bg-layer-1,#1d2026);border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:14px;overflow:hidden;box-shadow:0 18px 48px rgba(0,0,0,.55)}',
          '.wq-modal-head{display:flex;align-items:center;gap:8px;padding:14px 16px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08))}',
          '.wq-modal-title{font-size:14px;font-weight:600;flex:1}',
          '.wq-modal-body{padding:14px 16px;overflow-y:auto}',
          '.wq-input{box-sizing:border-box;width:100%;font:inherit;font-size:13px;color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.05));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:8px;padding:8px 11px;outline:none}',
          '.wq-input:focus{border-color:var(--dsw-alias-brand-primary,#4d8dff)}',
          '.wq-field{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center}',
          '.wq-field .wq-input{flex:1;min-width:120px}',
          '.wq-res{display:flex;flex-direction:column;gap:2px;margin-top:8px}',
          '.wq-resrow{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:7px}',
          '.wq-resrow:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.05))}',
          '.wq-resname{flex:1;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.wq-rescode{font-size:11px;color:var(--dsw-alias-label-tertiary,#7c828c);font-variant-numeric:tabular-nums}',
          '.wq-secttl{font-size:11px;color:var(--dsw-alias-label-tertiary,#7c828c);margin-top:14px;letter-spacing:.04em}',
          '.wq-addbtn{font:inherit;font-size:12px;cursor:pointer;color:var(--dsw-alias-brand-primary,#6ea8ff);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 12%,transparent);border:1px solid color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 40%,transparent);border-radius:6px;padding:3px 10px;flex:none}',
          '.wq-addbtn:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 22%,transparent)}',
          '.wq-sel{font:inherit;font-size:12px;color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.05));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:8px;padding:8px 10px}',
          '.wq-settings-row{display:flex;align-items:center;gap:10px;padding:11px 0;border-bottom:1px dashed var(--dsw-alias-border-l1,rgba(255,255,255,.08));font-size:13px}',
          '.wq-settings-row .wq-sl{flex:1;color:var(--dsw-alias-label-secondary,#9aa0aa)}',
          '.wq-pill{position:fixed;right:18px;bottom:20px;z-index:900;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-size:12px}',
          '.wq-pill-tab{display:flex;align-items:center;gap:8px;cursor:pointer;background:var(--dsw-alias-bg-layer-1,rgba(30,33,40,.96));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));border-radius:999px;padding:7px 14px;box-shadow:0 8px 24px rgba(0,0,0,.4);color:var(--dsw-alias-label-primary,#e6e6e6);user-select:none}',
          '.wq-pill-card{width:262px;max-height:360px;overflow-y:auto;background:var(--dsw-alias-bg-layer-1,rgba(30,33,40,.98));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.16));border-radius:12px;box-shadow:0 12px 32px rgba(0,0,0,.5);padding:6px}',
          '.wq-pill-row{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:6px;cursor:pointer}',
          '.wq-pill-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.06))}',
          '.wq-pill-name{flex:1;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.wq-pill-price{font-variant-numeric:tabular-nums;font-size:12px}',
          '.wq-pill-pct{font-variant-numeric:tabular-nums;font-size:11.5px;min-width:52px;text-align:right;font-weight:600}',
          '.wq-news{flex:none;display:flex;flex-direction:column;border-top:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.12));background:var(--dsw-alias-bg-base,#16181d);min-height:0}',
          '.wq-news-resizer{height:6px;cursor:ns-resize;flex:none;background:linear-gradient(var(--dsw-alias-border-l2,rgba(255,255,255,.14)),transparent)}',
          '.wq-news-head{flex:none;display:flex;align-items:center;gap:8px;padding:7px 14px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.06));flex-wrap:wrap}',
          '.wq-news-title{font-size:12.5px;font-weight:600;display:flex;align-items:center;gap:6px;white-space:nowrap}',
          '.wq-nfilters{display:flex;gap:4px}',
          '.wq-nchip{font:inherit;font-size:11.5px;cursor:pointer;color:var(--dsw-alias-label-secondary,#9aa0aa);background:transparent;border:1px solid transparent;border-radius:999px;padding:2px 10px}',
          '.wq-nchip:hover{color:var(--dsw-alias-label-primary,#e6e6e6)}',
          '.wq-nchip.is-on{color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.07));border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.16))}',
          '.wq-news-body{flex:1;min-height:0;overflow-y:auto;padding:6px 10px 12px}',
          '.wq-nitem{display:flex;gap:8px;padding:8px;border-radius:8px;border:1px solid transparent}',
          '.wq-nitem:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(255,255,255,.04));border-color:var(--dsw-alias-border-l1,rgba(255,255,255,.08))}',
          '.wq-nitem.is-unread{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#4d8dff) 6%,transparent)}',
          '.wq-nsrc{flex:none;width:4px;border-radius:2px;align-self:stretch}',
          '.wq-nmain{flex:1;min-width:0}',
          '.wq-nmeta{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dsw-alias-label-tertiary,#7c828c);margin-bottom:3px;flex-wrap:wrap}',
          '.wq-nauthor{font-weight:600}',
          '.wq-ntext{font-size:12.5px;line-height:1.55;color:var(--dsw-alias-label-primary,#e6e6e6);white-space:pre-wrap;overflow-wrap:anywhere;max-height:132px;overflow:hidden}',
          '.wq-nmedia{display:flex;gap:4px;margin-top:5px;flex-wrap:wrap}',
          '.wq-nthumb{width:54px;height:54px;object-fit:cover;border-radius:5px;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.1));cursor:pointer}',
          '.wq-nacts{display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;align-items:center}',
          '.wq-nact{font:inherit;font-size:11px;cursor:pointer;color:var(--dsw-alias-label-tertiary,#7c828c);background:transparent;border:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.1));border-radius:5px;padding:1px 8px}',
          '.wq-nact:hover{color:var(--dsw-alias-label-primary,#e6e6e6);border-color:var(--dsw-alias-border-l2,rgba(255,255,255,.18))}',
          '.wq-nact.is-fav{color:#f0a020;border-color:#f0a020}',
          '.wq-nempty{padding:26px 12px;text-align:center;color:var(--dsw-alias-label-tertiary,#7c828c);font-size:12px}',
          '.wq-nset-row{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap;align-items:center}',
          '.wq-textarea{box-sizing:border-box;width:100%;min-height:54px;resize:vertical;font:inherit;font-size:12px;color:var(--dsw-alias-label-primary,#e6e6e6);background:var(--dsw-alias-bg-layer-2,rgba(255,255,255,.05));border:1px solid var(--dsw-alias-border-l2,rgba(255,255,255,.14));border-radius:8px;padding:7px 10px;outline:none}',
          '.wq-textarea:focus{border-color:var(--dsw-alias-brand-primary,#4d8dff)}',
          '.wq-testres{font-size:11.5px;color:var(--dsw-alias-label-secondary,#9aa0aa);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}',
          '@container wq (max-width:820px){.wq-left{width:300px}}',
          '@container wq (max-width:640px){.wq-body{flex-direction:column}.wq-left{width:100%;border-right:0;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(255,255,255,.08));max-height:52%}}',
        ].concat([
          "/* Trading Boat reading workspace */",
          ".wq-page{--wq-paper:var(--dsw-alias-bg-base,#141b26);--wq-panel:var(--dsw-alias-bg-layer-1,#1b2432);--wq-raised:var(--dsw-alias-bg-layer-2,#243044);--wq-ink:var(--dsw-alias-label-primary,#e8edf5);--wq-muted:var(--dsw-alias-label-secondary,#a5b2c6);--wq-dim:var(--dsw-alias-label-tertiary,#8493ab);--wq-line:var(--dsw-alias-border-l2,rgba(130,150,185,.18));--wq-accent:var(--dsw-alias-brand-primary,#668bff);background:linear-gradient(var(--wq-paper),var(--wq-paper)),#141b26;font-family:inherit;line-height:1.6;color:var(--wq-ink)}",
          ".wq-page *{box-sizing:border-box}",
          ".wq-page button{transition:background .15s,border-color .15s,color .15s,box-shadow .15s}",
          ".wq-page button:focus-visible,.wq-page input:focus-visible,.wq-page textarea:focus-visible,.wq-page select:focus-visible,.wq-page [tabindex]:focus-visible{outline:2px solid var(--wq-accent);outline-offset:3px}",
          ".wq-page button:disabled{opacity:.48;cursor:wait}",
          ".wq-topbar{gap:12px;padding:15px 20px;background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230;border-color:var(--wq-line)}",
          ".wq-title{font-size:17px;letter-spacing:.02em;white-space:nowrap;gap:10px}",
          ".wq-brandmark{width:31px;height:31px;display:inline-grid;place-items:center;color:white;border-radius:10px;font-size:19px;font-weight:700;background:linear-gradient(145deg,#537bff,#3c53c2);box-shadow:0 3px 12px #3b6ff52a}",
          ".wq-summary{display:flex;align-items:center;gap:12px;font-size:11px;white-space:nowrap;color:var(--wq-dim)}",
          ".wq-summary .wq-up,.wq-summary .wq-down{font-weight:600}",
          ".wq-btn{min-height:32px;border-radius:8px;line-height:1.4;padding:7px 12px;border-color:var(--wq-line);background:var(--wq-raised);font-size:12px;white-space:nowrap}",
          ".wq-btn.primary{box-shadow:0 3px 9px #3b6ff526}",
          ".wq-layout-switch{display:flex;align-items:center;gap:3px;padding:3px;border:1px solid var(--wq-line);border-radius:10px;background:var(--wq-paper)}",
          ".wq-layout-switch .wq-btn{min-height:29px;padding:5px 10px;background:transparent;border-color:transparent;color:var(--wq-muted);border-radius:7px;font-size:11px;box-shadow:none}",
          ".wq-layout-switch .wq-btn.primary,.wq-layout-switch .wq-btn.primary:hover{color:var(--wq-accent);background:color-mix(in srgb,var(--wq-accent) 12%,var(--wq-panel));border-color:color-mix(in srgb,var(--wq-accent) 23%,transparent);filter:none}",
          ".wq-left{width:300px;background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230;border-color:var(--wq-line)}",
          ".wq-watch-head{display:flex;align-items:center;gap:7px;padding:16px 16px 10px;font-size:12px;font-weight:600}",
          ".wq-watch-caption{margin-left:auto;color:var(--wq-dim);font-size:10px;font-weight:400}",
          ".wq-groups{padding:0 9px 28px;scrollbar-width:thin;scrollbar-color:var(--wq-line) transparent}",
          ".wq-group{margin:5px 0 13px}.wq-ghead{padding:8px 7px}.wq-gname{font-size:11px;letter-spacing:.04em}",
          ".wq-gops{gap:0}.wq-gops .wq-iconbtn{font-size:9px;padding:2px}",
          ".wq-row{padding:9px 7px;border-radius:9px;gap:6px;min-height:53px}",
          ".wq-row.is-sel{background:color-mix(in srgb,var(--wq-accent) 10%,var(--wq-panel));border-color:color-mix(in srgb,var(--wq-accent) 35%,transparent)}",
          ".wq-rname{font-size:12px;font-weight:500}.wq-rcode{font-size:10px;margin-top:2px}.wq-rprice{font-size:13px;min-width:52px;font-weight:600}.wq-rpct{min-width:58px;font-size:11px;padding:3px 5px;border-radius:6px}",
          ".wq-mkbar{width:2px;height:25px}.wq-del{font-size:11px;padding:0 1px}",
          ".wq-right{background:linear-gradient(var(--wq-paper),var(--wq-paper)),#141b26}",
          ".wq-dhead{padding:20px 24px 16px;border-color:var(--wq-line)}.wq-dname{font-size:19px}.wq-dprice{font-size:34px;letter-spacing:-.025em}",
          ".wq-dprice-row{margin-top:10px}.wq-dchg{font-size:13px}.wq-stats{gap:10px 18px;margin-top:14px}.wq-stat-k{font-size:11px}.wq-stat-v{font-size:13px;font-weight:500}.wq-chip{font-size:10px}",
          ".wq-tabs{padding:9px 22px;border-color:var(--wq-line)}.wq-tab{min-height:29px;border-radius:7px}.wq-tab.is-on{background:color-mix(in srgb,var(--wq-accent) 10%,var(--wq-panel));border-color:color-mix(in srgb,var(--wq-accent) 25%,transparent);color:var(--wq-accent)}",
          ".wq-chartwrap{padding:12px 16px 16px;scrollbar-width:thin}.wq-chart-legend{gap:12px;font-size:10px}",
          ".wq-news{background:linear-gradient(var(--wq-paper),var(--wq-paper)),#141b26;border-color:var(--wq-line);overflow:hidden}",
          ".wq-news-resizer{position:relative;height:9px;background:var(--wq-paper);border-top:1px solid var(--wq-line)}",
          ".wq-news-resizer:after{content:'';position:absolute;width:34px;height:3px;border-radius:4px;background:var(--wq-line);top:2px;left:calc(50% - 17px)}",
          ".wq-news-resizer:hover:after{background:var(--wq-accent)}",
          ".wq-news-head{padding:12px 20px;gap:8px;border-bottom:0;flex-wrap:wrap;background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230}",
          ".wq-news-heading{min-width:180px}.wq-news-title{font-size:15px;font-weight:650;gap:9px;letter-spacing:.01em}.wq-news-subtitle{font-size:11px;color:var(--wq-dim);margin-top:3px}",
          ".wq-ncount{display:inline-flex;align-items:center;justify-content:center;min-width:18px;padding:1px 5px;border-radius:5px;background:color-mix(in srgb,var(--wq-accent) 10%,var(--wq-panel));color:var(--wq-muted);font-size:10px;line-height:1.6;font-weight:500;font-variant-numeric:tabular-nums}",
          ".wq-news-tools{display:flex;align-items:center;flex-wrap:wrap;gap:10px;padding:0 20px 12px;background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230;border-bottom:1px solid var(--wq-line);flex:none}",
          ".wq-nfilters{display:flex;align-items:center;gap:3px;flex-wrap:wrap}.wq-nchip{min-height:30px;border-radius:7px;padding:5px 9px;font-size:11px;display:inline-flex;align-items:center;justify-content:center;gap:5px;white-space:nowrap;color:var(--wq-muted)}",
          ".wq-nchip.is-on{background:color-mix(in srgb,var(--wq-accent) 11%,var(--wq-panel));color:var(--wq-accent);border-color:color-mix(in srgb,var(--wq-accent) 23%,transparent)}.wq-nchip.is-on .wq-ncount{color:var(--wq-accent)}",
          ".wq-news-search{flex:1;min-width:150px;max-width:280px;min-height:31px;margin-left:auto;border:1px solid var(--wq-line);border-radius:8px;background:var(--wq-paper);color:var(--wq-ink);font-size:11px;padding:6px 10px;outline:none}.wq-news-search::placeholder{color:var(--wq-dim)}",
          ".wq-news-viewfilters{display:flex;gap:1px;border-left:1px solid var(--wq-line);padding-left:7px}",
          ".wq-news-status{display:flex;align-items:center;gap:10px;padding:9px 20px;background:color-mix(in srgb,var(--wq-accent) 7%,var(--wq-panel));color:var(--wq-muted);font-size:11px;line-height:1.7;border-bottom:1px solid var(--wq-line);flex:none;overflow-wrap:anywhere}.wq-news-status>span{flex:1;min-width:0}.wq-news-status .wq-iconbtn{flex:none}",
          ".wq-news-body{padding:12px 20px 28px;scrollbar-width:thin;scrollbar-color:var(--wq-line) transparent;overscroll-behavior:contain}",
          ".wq-nfeed{width:100%;max-width:900px;margin:0 auto}.wq-nday{display:flex;align-items:center;gap:12px;margin:16px 0 10px;color:var(--wq-dim);font-size:10px;letter-spacing:.04em}.wq-nday:after{content:'';height:1px;flex:1;background:var(--wq-line)}.wq-nfeed>div:first-child .wq-nday{margin-top:1px}",
          ".wq-nitem{position:relative;gap:0;padding:18px 20px;margin-bottom:12px;border:1px solid var(--wq-line);border-radius:12px;background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230;box-shadow:0 2px 5px rgba(0,0,0,.025)}",
          ".wq-nitem.is-unread{background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230;border-color:color-mix(in srgb,var(--wq-accent) 24%,var(--wq-line))}",
          ".wq-nitem:hover{background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230;border-color:color-mix(in srgb,var(--wq-accent) 42%,var(--wq-line));box-shadow:0 5px 18px rgba(0,0,0,.045)}",
          ".wq-nsrc{position:absolute;top:22px;left:0;width:3px;height:26px;border-radius:0 3px 3px 0;align-self:auto}.wq-nmain{width:100%}",
          ".wq-nmeta{gap:8px;margin-bottom:13px;min-height:28px;color:var(--wq-dim);font-size:10px}.wq-navatar{width:28px;height:28px;display:inline-grid;place-items:center;border-radius:9px;background:var(--wq-raised);font-size:12px;font-weight:700;flex:none}",
          ".wq-nauthor{font-size:12px;color:var(--wq-ink);font-weight:600}.wq-nplatform{border:1px solid var(--wq-line);padding:1px 6px;line-height:1.6;font-size:9px;border-radius:5px;color:var(--wq-muted)}.wq-nmeta time{margin-left:auto;white-space:nowrap}",
          ".wq-nread-dot{width:5px;height:5px;border-radius:50%;background:var(--wq-accent);flex:none}",
          ".wq-ntext{font-size:13px;line-height:1.9;color:var(--wq-ink);letter-spacing:.015em;max-height:none;overflow-wrap:anywhere;word-break:normal;white-space:pre-wrap}",
          ".wq-ntext.is-truncated{max-height:132px;overflow:hidden;mask-image:linear-gradient(#000 78%,transparent)}.wq-ntext.is-expanded{max-height:none;mask-image:none}",
          ".wq-nexpand{border:0;background:transparent;padding:7px 0;margin-top:2px;color:var(--wq-accent);font:inherit;font-size:11px;cursor:pointer;min-height:29px}",
          ".wq-nacts{gap:5px;margin-top:15px;padding-top:10px;border-top:1px solid var(--wq-line)}.wq-nact{padding:4px 8px;min-height:28px;font-size:10px;border-radius:6px;border-color:transparent;color:var(--wq-muted)}.wq-nact:first-child{color:var(--wq-accent)}.wq-nact:hover{background:var(--wq-raised)}.wq-nact.is-fav{border-color:transparent;color:#c9942f}.wq-nacts .wq-testres{font-size:10px;color:var(--wq-dim)}",
          ".wq-nmedia{gap:8px;margin-top:12px}.wq-nmedia-btn{padding:0;border:1px solid var(--wq-line);background:var(--wq-paper);border-radius:9px;cursor:pointer;overflow:hidden;line-height:0}.wq-nthumb{width:94px;height:76px;border:0;border-radius:0;display:block;object-fit:cover}",
          ".wq-news.is-full .wq-news-head{padding:25px 30px 17px}.wq-news.is-full .wq-news-title{font-size:22px;letter-spacing:-.02em}.wq-news.is-full .wq-news-subtitle{margin-top:6px;font-size:12px}.wq-news.is-full .wq-news-tools{padding:0 30px 18px;gap:12px}.wq-news.is-full .wq-news-body{padding:18px 30px 40px}.wq-news.is-full .wq-nitem{padding:22px 25px;margin-bottom:16px}.wq-news.is-full .wq-ntext{font-size:14px;line-height:1.95}.wq-news.is-full .wq-navatar{width:32px;height:32px}.wq-news.is-full .wq-nmeta{margin-bottom:15px}.wq-news.is-full .wq-nauthor{font-size:13px}",
          ".wq-news:not(.is-full) .wq-news-subtitle{display:none}.wq-news:not(.is-full) .wq-news-head{padding-top:8px;padding-bottom:7px}.wq-news:not(.is-full) .wq-news-title{font-size:13px}.wq-news:not(.is-full) .wq-news-tools{padding-bottom:8px}",
          ".wq-nempty{padding:50px 16px;line-height:1.8;color:var(--wq-muted)}.wq-nempty-icon{display:grid;place-items:center;width:48px;height:48px;margin:0 auto 15px;background:var(--wq-panel);border:1px solid var(--wq-line);border-radius:14px;color:var(--wq-accent);font-size:28px}.wq-nempty-title{font-size:16px;color:var(--wq-ink);font-weight:600}.wq-nempty p{font-size:12px;margin:8px 0 18px}",
          ".wq-iconbtn{min-width:26px;min-height:26px;font-size:13px;color:var(--wq-muted)}",
          ".wq-modal-mask{backdrop-filter:blur(8px);background:rgba(8,13,22,.55);padding:36px 16px;align-items:center}.wq-modal{max-height:calc(100% - 20px);border-radius:16px;background:linear-gradient(var(--wq-panel),var(--wq-panel)),#192230;border-color:var(--wq-line);box-shadow:0 24px 90px rgba(0,0,0,.32)}.wq-modal-head{padding:18px 22px}.wq-modal-title{font-size:16px}.wq-modal-body{padding:18px 22px 22px}.wq-input,.wq-textarea,.wq-sel{background:linear-gradient(var(--wq-paper),var(--wq-paper)),#141b26;border-color:var(--wq-line);line-height:1.6}.wq-source-toggle input{accent-color:var(--wq-accent);width:15px;height:15px}.wq-textarea{font-family:ui-monospace,Consolas,monospace;font-size:11px}.wq-testres{line-height:1.6}",
          "@container wq (max-width:1180px){.wq-topbar{gap:9px;padding:12px 15px}.wq-summary{gap:8px}.wq-left{width:280px}.wq-layout-switch .wq-btn{padding:5px 8px}.wq-topbar>.wq-btn{padding:6px 9px}.wq-news-search{max-width:210px}.wq-news-tools{gap:7px}.wq-news.is-full .wq-news-tools{gap:8px}}",
          "@container wq (max-width:980px){.wq-summary>span:last-child{display:none}.wq-news.is-full .wq-news-head{padding:20px}.wq-news.is-full .wq-news-tools{padding:0 20px 14px}.wq-news.is-full .wq-news-body{padding:14px 18px 28px}.wq-news-search{max-width:none;min-width:150px}.wq-news-viewfilters{margin-left:auto}.wq-stats{grid-template-columns:repeat(3,minmax(0,1fr))}.wq-news:not(.is-full) .wq-news-tools .wq-news-viewfilters{display:none}}",
          "@container wq (max-width:820px){.wq-left{width:248px}.wq-topbar .wq-summary{display:none}.wq-layout-switch{order:5;width:100%;justify-content:center}.wq-layout-switch .wq-btn{flex:1}.wq-watch-caption{display:none}.wq-news-head{padding:10px 14px}.wq-news-tools{padding:0 14px 10px}.wq-news-search{flex-basis:100%;max-width:none}.wq-news.is-full .wq-news-title{font-size:19px}.wq-news.is-full .wq-news-head{padding:16px}.wq-news.is-full .wq-news-tools{padding:0 16px 12px}.wq-news.is-full .wq-nitem{padding:17px}.wq-nacts .wq-testres{display:none}}",
          "@container wq (max-width:640px){.wq-body{flex-direction:column}.wq-left{width:100%;max-height:29%;border-right:0;border-bottom:1px solid var(--wq-line)}.wq-watch-head{padding:8px 14px 4px}.wq-watch-caption{display:inline}.wq-groups{padding-bottom:12px}.wq-topbar{padding:10px 12px;gap:7px}.wq-title{font-size:15px}.wq-brandmark{width:27px;height:27px;font-size:16px}.wq-topbar>.wq-btn{padding:5px 8px}.wq-news-heading{min-width:140px}.wq-news.is-full .wq-news-subtitle{display:none}.wq-news-head .wq-btn{font-size:11px;padding:6px 9px}.wq-news.is-full .wq-news-body{padding:10px 12px 24px}.wq-news.is-full .wq-ntext{font-size:13px}.wq-news.is-full .wq-news-title{font-size:16px}.wq-news-viewfilters{border-left:0;padding-left:0}.wq-news-status{padding:8px 14px}.wq-nitem{border-radius:10px}.wq-nmeta{gap:6px}.wq-nmeta time{font-size:9px}.wq-nacts{gap:2px}.wq-nact{padding:4px 6px}.wq-modal-mask{padding:12px}.wq-modal-body,.wq-modal-head{padding:16px}.wq-dhead{padding:15px}.wq-dprice{font-size:28px}}",
          "@media (hover:none){.wq-del,.wq-gops{opacity:1}}",
          "@media (prefers-reduced-motion:reduce){.wq-page *{animation:none!important;transition:none!important}}",
          "/* Graphite terminal — continuous editorial feed */",
          ".wq-page{--wq-paper:#101214;--wq-panel:#15191b;--wq-raised:#23292c;--wq-ink:#e3e7e3;--wq-muted:#a2acae;--wq-dim:#768287;--wq-line:#2b3337;--wq-accent:#d5b77d;--dsw-alias-bg-base:#101214;--dsw-alias-bg-layer-1:#15191b;--dsw-alias-bg-layer-2:#23292c;--dsw-alias-label-primary:#e3e7e3;--dsw-alias-label-secondary:#a2acae;--dsw-alias-label-tertiary:#768287;--dsw-alias-border-l1:#252d31;--dsw-alias-border-l2:#323c41;--dsw-alias-brand-primary:#d5b77d;background:#101214;color:var(--wq-ink);color-scheme:dark;font-family:Inter,'Segoe UI','Microsoft YaHei',sans-serif}",
          ".wq-topbar{padding:10px 22px;min-height:60px;gap:16px;background:#15191b}.wq-title{font-size:16px;font-weight:600;letter-spacing:.06em}.wq-brandmark{width:27px;height:29px;background:none;color:var(--wq-accent);box-shadow:none;border-radius:0}.wq-brandmark svg{display:block}.wq-summary{gap:12px}.wq-summary>span:last-child{padding-left:12px;border-left:1px solid var(--wq-line)}",
          ".wq-btn{border-radius:4px;background:none;border-color:#343d42;font-size:12px;min-height:30px;padding:5px 11px;box-shadow:none;color:var(--wq-muted)}.wq-btn.primary,.wq-btn.primary:hover{background:#d5b77d;color:#171b1d;border-color:#d5b77d;box-shadow:none;filter:none}.wq-topbar>.wq-btn.primary{background:none;color:#d5b77d;border-color:#685b41}.wq-layout-switch{border-radius:0;border:0;border-left:1px solid var(--wq-line);border-right:1px solid var(--wq-line);background:none;padding:0 9px;gap:0}.wq-layout-switch .wq-btn{position:relative;border:0;border-radius:0;padding:8px 14px;color:var(--wq-dim);font-size:12px}.wq-layout-switch .wq-btn.primary,.wq-layout-switch .wq-btn.primary:hover{background:none;color:var(--wq-ink);border:0}.wq-layout-switch .wq-btn.primary:after{content:'';height:2px;background:var(--wq-accent);position:absolute;bottom:-10px;left:14px;right:14px}",
          ".wq-left{width:310px;background:#15191b}.wq-watch-head{height:55px;padding:0 18px;border-bottom:1px solid #252d31;font-size:13px}.wq-watch-caption{font-size:10px}.wq-ncount{background:none;border:0;padding:0 3px;color:var(--wq-dim);font-size:10px;font-weight:400}.wq-groups{padding:4px 0 25px}.wq-group{margin:0 0 7px}.wq-ghead{position:relative;padding:11px 16px 7px;border-radius:0}.wq-gname{font-size:11px;font-weight:500;letter-spacing:.05em}.wq-gops{position:absolute;right:12px;background:#15191b;gap:2px}.wq-gops .wq-iconbtn{width:24px;height:24px;font-size:11px}.wq-ghead:focus-within .wq-gops{opacity:1}.wq-rows{gap:0}.wq-row{position:relative;border:0;border-left:2px solid transparent;border-radius:0;padding:10px 17px;min-height:57px;gap:8px}.wq-row.is-sel{background:#262821;border:0;border-left:2px solid var(--wq-accent)}.wq-row:hover{background:#20272a}.wq-rowmain{min-width:64px}.wq-rname{font-size:13px;font-weight:500}.wq-rcode{font-size:10px;color:#768287}.wq-rprice{font:500 13px ui-monospace,Consolas,monospace;letter-spacing:-.03em;min-width:55px}.wq-rpct{font:11px ui-monospace,Consolas,monospace;min-width:57px;border-radius:3px;padding:3px 4px}.wq-mkbar{display:none}.wq-del{position:absolute;right:2px;font-size:12px;width:15px;padding:0}.wq-row:focus-within .wq-del{opacity:1}",
          ".wq-right{background:#101214}.wq-dhead{padding:23px 28px 17px}.wq-dname{font-size:19px;font-weight:500}.wq-dprice{font:500 34px/1.25 ui-monospace,Consolas,monospace;letter-spacing:-.07em}.wq-dchg,.wq-stat-v{font:12px ui-monospace,Consolas,monospace}.wq-stat-k{font-size:10px}.wq-stat-v{margin-top:4px}.wq-chip{border-radius:3px;font-size:10px;padding:1px 5px;opacity:.8}.wq-tabs{padding:8px 24px}.wq-tab{font-size:11px;border-radius:3px;min-height:27px}.wq-tab.is-on{background:#29271f;border-color:#4b4433;color:var(--wq-accent)}",
          ".wq-news{background:#101214}.wq-news-head{padding:16px 26px 13px;background:none}.wq-news-heading{min-width:160px}.wq-news-title{font-size:16px;font-weight:500;letter-spacing:.035em}.wq-news-title .wq-ncount{color:var(--wq-accent);font-size:11px;margin-left:6px}.wq-news-subtitle{font-size:11px;letter-spacing:.03em;margin-top:6px}.wq-news-head>.wq-btn{background:none;border-color:transparent}.wq-news-head>.wq-btn:hover{background:#232a2d}.wq-news-tools{padding:0 26px;min-height:48px;gap:14px;background:none}.wq-nfilters{gap:21px;align-self:stretch;align-items:stretch}.wq-nchip{position:relative;font-size:12px;min-height:32px;padding:6px 0;border:0;border-radius:0;background:none}.wq-nchip.is-on{border:0;background:none;color:var(--wq-accent)}.wq-nfilters .wq-nchip.is-on:after{content:'';position:absolute;bottom:0;height:2px;left:0;right:0;background:var(--wq-accent)}.wq-news-search{height:31px;min-width:140px;max-width:230px;background:#171d20;border-color:#2c353a;border-radius:4px;font-size:12px}.wq-news-viewfilters{gap:14px;padding-left:14px}.wq-news-viewfilters .wq-nchip{font-size:11px}.wq-news-status{background:#29261e;color:#c9bca1;border-color:#403a2d;font-size:12px}",
          ".wq-news-body{padding:0 30px 35px}.wq-nfeed{max-width:920px}.wq-nday{margin:0;padding:18px 0 0;font-size:11px;color:#76868c}.wq-nfeed>div:first-child .wq-nday{margin-top:0}.wq-nday:after{background:#273034}.wq-nitem,.wq-nitem.is-unread,.wq-nitem:hover{position:relative;padding:22px 0 20px;margin:0;border:0;border-bottom:1px solid #273034;border-radius:0;background:none;box-shadow:none;gap:0}.wq-nsrc{display:none}.wq-nmeta{gap:9px;margin-bottom:11px;min-height:24px}.wq-navatar{width:24px;height:24px;border-radius:50%;background:#252e32;border:1px solid #364248;font-size:10px}.wq-nauthor{font-size:12px;color:#bdc8ca;font-weight:600}.wq-nplatform{border:0;border-left:1px solid #384348;border-radius:0;padding:0 0 0 9px;font-size:10px;opacity:.85}.wq-nmeta time{font:11px ui-monospace,Consolas,monospace;color:#849298}.wq-nread-dot{width:4px;height:4px;background:var(--wq-accent)}.wq-ntext{font-size:14px;line-height:1.95;color:#d9e0df;letter-spacing:.015em}.wq-ntext.is-truncated{max-height:154px;mask-image:linear-gradient(#000 83%,transparent)}.wq-nitem.is-read .wq-ntext{color:#aab7b9}.wq-nacts{border:0;padding:0;margin-top:12px;gap:16px}.wq-nact{min-height:24px;border:0;border-radius:0;background:none;padding:3px 0;font-size:11px;color:#7e8d93}.wq-nact:hover{background:none;color:#dce6e7}.wq-nact:first-child{color:#a4b5bb}.wq-nact.is-fav{color:var(--wq-accent)}.wq-nacts .wq-testres{color:#6d7f86}.wq-nexpand{font-size:11px;min-height:28px}.wq-nmedia-btn{border-radius:4px}.wq-nthumb{width:114px;height:80px}",
          ".wq-news.is-full .wq-news-head{padding:29px 34px 16px}.wq-news.is-full .wq-news-title{font-size:24px;font-weight:500;letter-spacing:.045em}.wq-news.is-full .wq-news-tools{padding:0 34px;min-height:49px}.wq-news.is-full .wq-news-body{padding:0 34px 40px}.wq-news.is-full .wq-nitem{padding:25px 0 22px;margin:0}.wq-news.is-full .wq-ntext{font-size:15px;line-height:1.95}.wq-news.is-full .wq-navatar{width:24px;height:24px}.wq-news.is-full .wq-nauthor{font-size:13px}.wq-news.is-full .wq-nmeta{margin-bottom:12px}.wq-news:not(.is-full) .wq-news-tools{padding-bottom:0;min-height:41px}.wq-news:not(.is-full) .wq-nitem{padding:16px 0}.wq-news:not(.is-full) .wq-nday{padding-top:12px}",
          ".wq-modal{background:#171e21;border-color:#3b484e;border-radius:8px}.wq-modal-title{font-size:17px;font-weight:500}.wq-input,.wq-textarea,.wq-sel{border-radius:4px;background:#111719;border-color:#36444b}.wq-textarea{font-size:12px}.wq-source-toggle input{accent-color:var(--wq-accent)}.wq-addbtn{color:var(--wq-accent);border-color:#564e3b;background:#292820;border-radius:4px}",
          "@container wq (max-width:1200px){.wq-topbar{padding:10px 16px;gap:10px}.wq-summary>span:last-child{display:none}.wq-left{width:292px}.wq-nfilters{gap:15px}.wq-news-search{max-width:180px}.wq-news-viewfilters{gap:10px;padding-left:10px}.wq-news.is-full .wq-news-head{padding:24px 27px 15px}.wq-news.is-full .wq-news-tools{padding:0 27px}.wq-news.is-full .wq-news-body{padding:0 27px 30px}}",
          "@container wq (max-width:980px){.wq-summary{display:none}.wq-left{width:270px}.wq-watch-caption{display:none}.wq-rprice{min-width:48px;font-size:12px}.wq-row{padding:10px 13px;gap:6px}.wq-news-search{order:3;max-width:none;flex-basis:100%;margin:0 0 10px}.wq-news-viewfilters{margin-left:auto}.wq-news-tools{gap:0 12px}.wq-layout-switch .wq-btn{padding:8px 10px}.wq-layout-switch{padding:0 4px}.wq-news-head>.wq-btn{padding:5px 7px}.wq-news:not(.is-full) .wq-news-tools .wq-news-viewfilters{display:flex}}",
          "@container wq (max-width:780px){.wq-layout-switch{order:5;width:100%;justify-content:center;border:0}.wq-layout-switch .wq-btn{flex:1}.wq-layout-switch .wq-btn.primary:after{bottom:-5px}.wq-topbar{gap:7px;min-height:0}.wq-title{font-size:15px}.wq-left{width:244px}.wq-rowmain{min-width:48px}.wq-rname{font-size:12px}.wq-rprice{font-size:11px}.wq-rpct{font-size:10px;min-width:49px}.wq-news.is-full .wq-news-head{padding:20px 20px 11px}.wq-news.is-full .wq-news-title{font-size:20px}.wq-news.is-full .wq-news-tools{padding:0 20px}.wq-news.is-full .wq-news-body{padding:0 20px 30px}.wq-news-heading{min-width:145px}.wq-nacts{gap:12px}.wq-news-head>.wq-btn{font-size:11px}}",
          "@container wq (max-width:640px){.wq-left{width:100%;max-height:25%}.wq-watch-head{height:37px;flex:none}.wq-watch-caption{display:inline}.wq-news.is-full .wq-news-head{padding:17px 18px 10px}.wq-news.is-full .wq-news-tools{padding:0 18px}.wq-news.is-full .wq-news-body{padding:0 18px 25px}.wq-news.is-full .wq-nitem{padding:19px 0}.wq-news.is-full .wq-news-title{font-size:19px}.wq-news.is-full .wq-ntext{font-size:14px}.wq-nfilters{gap:13px}.wq-news-viewfilters{border:0;padding:0;gap:12px}.wq-nmeta time{font-size:10px}}",
          '.wq-page{background:rgba(16,18,20,var(--wq-surface-alpha,.8));backdrop-filter:blur(var(--wq-glass-blur,8px));-webkit-backdrop-filter:blur(var(--wq-glass-blur,8px))}',
          '.wq-page .wq-right,.wq-page .wq-news,.wq-page .wq-news-head,.wq-page .wq-news-tools{background:transparent}.wq-page .wq-topbar,.wq-page .wq-left{background:rgba(35,42,45,var(--wq-layer-alpha,.08))}.wq-page .wq-row.is-sel{background:rgba(213,183,125,.09)}.wq-page .wq-news-resizer{background:rgba(35,42,45,.16)}',
          '.wq-topbar{position:relative;z-index:3}.wq-glass-control{position:relative;flex:none}.wq-glass-control>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:6px}.wq-glass-control>summary::-webkit-details-marker{display:none}.wq-glass-control[open]>summary{color:var(--wq-accent);border-color:#685b41}.wq-glass-popover{position:absolute;top:calc(100% + 12px);right:0;width:260px;padding:18px;background:#171e21;border:1px solid #3b484e;border-radius:7px;box-shadow:0 12px 40px #0006;z-index:10}.wq-glass-label{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:#e3e7e3}.wq-glass-label span{font:12px ui-monospace,Consolas,monospace;color:var(--wq-accent)}.wq-glass-popover input[type=range]{display:block;width:100%;height:22px;margin:16px 0 3px;accent-color:var(--wq-accent);cursor:pointer}.wq-glass-ends{display:flex;justify-content:space-between;font-size:10px;color:#86969d}.wq-glass-presets{display:flex;gap:6px;margin-top:15px}.wq-glass-presets .wq-btn{flex:1;padding:5px;font-size:11px}.wq-glass-hint{margin-top:12px;font-size:10px;color:#86969d}.wq-glass-control>summary:focus-visible{outline:2px solid var(--wq-accent);outline-offset:3px}',
          '@container wq (max-width:780px){.wq-glass-control{position:static}.wq-glass-popover{top:48px;right:12px;width:min(260px,calc(100% - 24px))}}',
          ".wq-watch-search{padding:10px 14px 5px;flex:none}.wq-watch-search input{width:100%;height:31px;border:1px solid #788a9633;background:#10181b55;color:var(--wq-ink);font:12px inherit;border-radius:4px;padding:6px 9px;outline:none}.wq-watch-search input::placeholder{color:var(--wq-dim)}.wq-watch-empty{padding:25px 12px;text-align:center;color:var(--wq-muted);font-size:12px}.wq-watch-status{flex:none;padding:10px 14px;border-top:1px solid #788a9626;font-size:10px;color:var(--wq-dim);display:flex;justify-content:space-between;gap:8px;align-items:center}.wq-watch-status.is-error{color:#d3ae78}.wq-focus-toggle[aria-pressed=true]{color:var(--wq-accent);border-color:#685b41}.wq-page.is-compact .wq-row{min-height:40px;padding-top:5px;padding-bottom:5px}.wq-page.is-compact .wq-rcode{font-size:9px;line-height:1.35}.wq-page.is-compact .wq-ghead{padding-top:7px;padding-bottom:4px}.wq-page.is-compact .wq-group{margin-bottom:2px}.wq-page.is-compact .wq-news.is-full .wq-nitem,.wq-page.is-compact .wq-nitem{padding-top:14px;padding-bottom:13px}.wq-page.is-compact .wq-news.is-full .wq-ntext{font-size:14px;line-height:1.8}.wq-news-results{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:7px 26px;border-bottom:1px solid #788a961c;color:var(--wq-dim);font-size:11px;flex:none}.wq-news-results .wq-btn{font-size:11px;min-height:25px;border-color:transparent;padding:3px 7px}.wq-news-results .wq-btn:hover{border-color:#788a9633}.wq-news.is-full .wq-news-results{padding-left:34px;padding-right:34px}.wq-news .wq-nitem button:disabled{cursor:wait}.wq-page.is-focused .wq-news.is-full .wq-nfeed{max-width:960px}.wq-page .wq-news-head{gap:8px}.wq-nempty .wq-btn{margin:0 4px}.wq-page .wq-news-status{max-height:120px;overflow-y:auto}.wq-page .wq-topbar{gap:9px}.wq-page .wq-layout-switch .wq-btn{padding-left:10px;padding-right:10px}.wq-page .wq-btn:disabled{cursor:default}@container wq (max-width:1100px){.wq-page .wq-summary{display:none}.wq-page .wq-topbar{gap:7px;padding-left:12px;padding-right:12px}.wq-page .wq-topbar>.wq-btn{padding:5px 8px}.wq-page .wq-layout-switch{padding:0 2px}}@container wq (max-width:900px){.wq-page .wq-layout-switch{order:5;width:100%;border:0;justify-content:center}.wq-page .wq-layout-switch .wq-btn{flex:1}.wq-page .wq-layout-switch .wq-btn.primary:after{bottom:-5px}.wq-page .wq-topbar{padding-bottom:7px}.wq-page .wq-news.is-full .wq-news-results{padding-left:20px;padding-right:20px}}@container wq (max-width:640px){.wq-page .wq-watch-search{padding-top:5px}.wq-page .wq-watch-status{display:none}.wq-page .wq-left{max-height:32%}.wq-page .wq-news-results{padding:6px 18px}.wq-page .wq-title{font-size:14px}.wq-page .wq-topbar .wq-focus-toggle{font-size:11px}}",
        ]).join("\n")
        document.head.appendChild(el)
      }

      // ------------------------------------------------------------------
      // data helpers
      // ------------------------------------------------------------------
      function post(route, body) {
        return fetch(route, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(function (r) { return r.json() })
      }
      function persistState(next) {
        try { post('api/dsh-tradingboat/state', { op: 'save', state: next }).catch(function () {}) } catch (e) {}
      }

      // ------------------------------------------------------------------
      // SVG K-line chart
      // ------------------------------------------------------------------
      function useWidth(initial) {
        var ref = React.useRef(null)
        var st = React.useState(initial || 640)
        var width = st[0], setWidth = st[1]
        React.useEffect(function () {
          if (!ref.current) return
          var el = ref.current
          function update() { setWidth(el.clientWidth || initial || 640) }
          update()
          if (typeof ResizeObserver !== 'undefined') {
            var ro = new ResizeObserver(update); ro.observe(el)
            return function () { ro.disconnect() }
          }
          window.addEventListener('resize', update)
          return function () { window.removeEventListener('resize', update) }
        }, [])
        return [ref, width]
      }

      function CandleChart(props) {
        var uw = useWidth(640)
        var ref = uw[0], W = uw[1]
        var candles = props.candles || []
        var interval = props.interval
        var item = props.item
        var base = props.upColor === 'red' ? 'red' : 'green'
        if (!candles || candles.length < 2) {
          return h('div', { className: 'wq-chart-empty' }, props.loading ? '加载中…' : '暂无 K 线数据')
        }
        var H = 280, volH = 62, padL = 6, padR = 56, padT = 12, padB = 22
        var priceH = H - volH - padB - padT
        var closes = candles.map(function (c) { return c.c })
        function ma(n) {
          return closes.map(function (_, i) {
            if (i < n - 1) return null
            var s = 0; for (var k = i - n + 1; k <= i; k++) s += closes[k]; return s / n
          })
        }
        var ma5 = ma(5), ma10 = ma(10), ma20 = ma(20)
        var lo = Infinity, hi = -Infinity, maxVol = 0
        candles.forEach(function (c) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; if (c.v > maxVol) maxVol = c.v })
        ;[ma5, ma10, ma20].forEach(function (a) { a.forEach(function (v) { if (v !== null) { if (v < lo) lo = v; if (v > hi) hi = v } }) })
        if (!isFinite(lo) || !isFinite(hi)) { lo = 0; hi = 1 }
        if (hi === lo) { hi += 1; lo -= 1 }
        var padV = (hi - lo) * 0.06; hi += padV; lo -= padV
        var n = candles.length
        var plotW = Math.max(10, W - padL - padR)
        var step = plotW / n
        var bw = Math.max(1, Math.min(14, step * 0.64))
        function xAt(i) { return padL + i * step + step / 2 }
        function yAt(p) { return padT + (hi - p) / (hi - lo) * priceH }
        var upColor = base === 'red' ? '#ff4d4f' : '#17c964'
        var downColor = base === 'red' ? '#17c964' : '#ff4d4f'
        var els = []
        var digits = priceDigits(item, hi)
        var gridN = 4
        for (var g = 0; g <= gridN; g++) {
          var p = lo + (hi - lo) * g / gridN
          var y = yAt(p)
          els.push(h('line', { key: 'gy' + g, x1: padL, y1: y, x2: padL + plotW, y2: y, stroke: 'var(--dsw-alias-border-l1,rgba(255,255,255,.07))', strokeWidth: 1 }))
          els.push(h('text', { key: 'gt' + g, x: padL + plotW + 5, y: y + 3, fill: 'var(--dsw-alias-label-tertiary,#7c828c)', fontSize: 10 }, fmtNum(p, digits)))
        }
        for (var i = 0; i < n; i++) {
          var c = candles[i]
          var x = xAt(i)
          var col = c.c >= c.o ? upColor : downColor
          var yh = yAt(c.h), yl = yAt(c.l), yo = yAt(c.o), yc = yAt(c.c)
          var top = Math.min(yo, yc), ht = Math.max(1, Math.abs(yc - yo))
          els.push(h('line', { key: 'w' + i, x1: x, y1: yh, x2: x, y2: yl, stroke: col, strokeWidth: 1 }))
          els.push(h('rect', { key: 'b' + i, x: x - bw / 2, y: top, width: bw, height: ht, fill: col }))
        }
        var volTop = padT + priceH + 8
        for (var vi = 0; vi < n; vi++) {
          var cv = candles[vi]
          if (!cv.v) continue
          var vx = xAt(vi)
          var bh = maxVol > 0 ? (cv.v / maxVol) * (volH - 10) : 0
          var vcol = cv.c >= cv.o ? upColor : downColor
          els.push(h('rect', { key: 'v' + vi, x: vx - bw / 2, y: volTop + volH - 10 - bh, width: Math.max(1, bw), height: Math.max(1, bh), fill: vcol, opacity: 0.5 }))
        }
        function polyline(arr, color, key) {
          var pts = []
          arr.forEach(function (v, i) { if (v !== null) pts.push(xAt(i) + ',' + yAt(v)) })
          if (pts.length < 2) return null
          return h('polyline', { key: key, points: pts.join(' '), fill: 'none', stroke: color, strokeWidth: 1.1, opacity: 0.92 })
        }
        els.push(polyline(ma5, '#f5c542', 'ma5'))
        els.push(polyline(ma10, '#4da3ff', 'ma10'))
        els.push(polyline(ma20, '#b07cff', 'ma20'))
        var ticks = Math.min(6, n)
        for (var tk = 0; tk < ticks; tk++) {
          var idx = Math.round(tk * (n - 1) / Math.max(1, ticks - 1))
          els.push(h('text', { key: 'xl' + tk, x: xAt(idx), y: H - 6, fill: 'var(--dsw-alias-label-tertiary,#7c828c)', fontSize: 10, textAnchor: 'middle' }, candleLabel(candles[idx].t, interval)))
        }
        return h('div', { className: 'wq-chart', ref: ref }, [
          h('svg', { key: 'svg', width: '100%', height: H, viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none' }, els),
          h('div', { key: 'lg', className: 'wq-chart-legend' }, [
            h('span', { key: 'm5', style: { color: '#f5c542' } }, 'MA5'),
            h('span', { key: 'm10', style: { color: '#4da3ff' } }, 'MA10'),
            h('span', { key: 'm20', style: { color: '#b07cff' } }, 'MA20'),
          ]),
        ])
      }

      // ------------------------------------------------------------------
      // Add dialog
      // ------------------------------------------------------------------
      function AddDialog(props) {
        var groups = props.groups || []
        var defMkt = props.defaultMkt || 'futcn'
        var qs = React.useState(''), q = qs[0], setQ = qs[1]
        var srs = React.useState([]), stockRes = srs[0], setStockRes = srs[1]
        var mks = React.useState(defMkt), mkt = mks[0], setMkt = mks[1]
        var cds = React.useState(''), code = cds[0], setCode = cds[1]
        var nms = React.useState(''), name = nms[0], setName = nms[1]
        var tgs = React.useState(props.defaultGroupId || ''), target = tgs[0], setTarget = tgs[1]

        React.useEffect(function () {
          var alive = true
          var tmr = setTimeout(function () {
            var term = q.trim()
            if (term === '') { setStockRes([]); return }
            post('api/dsh-tradingboat/search', { q: term }).then(function (j) { if (alive && j && j.ok) setStockRes(j.results || []) }).catch(function () {})
          }, 280)
          return function () { alive = false; clearTimeout(tmr) }
        }, [q])

        var local = React.useMemo(function () {
          var term = q.trim().toLowerCase()
          if (term === '') return []
          var out = []
          ;['futcn', 'futgl', 'index', 'fx'].forEach(function (m) {
            catalogList(m).forEach(function (it) {
              if (it.name.toLowerCase().indexOf(term) >= 0 || it.code.toLowerCase().indexOf(term) >= 0) out.push(it)
            })
          })
          return out.slice(0, 24)
        }, [q])

        function commitAdd(mm, cc, nn) {
          props.onAdd(mm, cc, nn, target || autoGroupId(mm, groups))
        }

        function resultRow(it, key) {
          return h('div', { className: 'wq-resrow', key: key }, [
            h('span', { className: 'wq-chip', key: 'c', style: { color: MARKETS[it.mkt].color, borderColor: MARKETS[it.mkt].color } }, MARKETS[it.mkt].short),
            h('span', { className: 'wq-resname', key: 'n' }, it.name),
            h('span', { className: 'wq-rescode', key: 'd' }, it.code),
            h('button', { className: 'wq-addbtn', key: 'a', onClick: function () { commitAdd(it.mkt, it.code, it.name) } }, '添加'),
          ])
        }

        return h('div', { className: 'wq-modal-mask', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onClose() } }, [
          h('div', { className: 'wq-modal', key: 'm' }, [
            h('div', { className: 'wq-modal-head', key: 'h' }, [
              h('span', { className: 'wq-modal-title', key: 't' }, '添加品种'),
              h('button', { className: 'wq-btn', key: 'x', onClick: props.onClose }, '关闭'),
            ]),
            h('div', { className: 'wq-modal-body', key: 'b' }, [
              h('input', { key: 'q', className: 'wq-input', placeholder: '搜索品种（中文名或代码，如 螺纹 / CL=F / 茅台 / AAPL）', value: q, onChange: function (e) { setQ(e.target.value) }, autoFocus: true }),
              local.length > 0 ? h('div', { className: 'wq-secttl', key: 'lt' }, '期货 / 指数 / 外汇') : null,
              h('div', { className: 'wq-res', key: 'lr' }, local.map(function (it, i) { return resultRow(it, 'l' + i) })),
              stockRes.length > 0 ? h('div', { className: 'wq-secttl', key: 'st' }, '股票（A股 / 美股）') : null,
              h('div', { className: 'wq-res', key: 'sr' }, stockRes.map(function (it, i) { return resultRow(it, 's' + i) })),
              h('div', { className: 'wq-secttl', key: 'mt' }, '手动添加'),
              h('div', { className: 'wq-field', key: 'mf1' }, [
                h('select', { key: 'mk', className: 'wq-sel', value: mkt, onChange: function (e) { setMkt(e.target.value) } }, Object.keys(MARKETS).map(function (m) { return h('option', { key: m, value: m }, MARKETS[m].label) })),
                h('input', { key: 'cd', className: 'wq-input', placeholder: '代码，如 RB0 / CL=F / 600519 / AAPL', value: code, onChange: function (e) { setCode(e.target.value) } }),
              ]),
              h('div', { className: 'wq-field', key: 'mf2' }, [
                h('input', { key: 'nm', className: 'wq-input', placeholder: '显示名称（可空）', value: name, onChange: function (e) { setName(e.target.value) } }),
                groups.length > 1 ? h('select', { key: 'tg', className: 'wq-sel', value: target, onChange: function (e) { setTarget(e.target.value) } }, [h('option', { key: 'auto', value: '' }, '自动分组')].concat(groups.map(function (g) { return h('option', { key: g.id, value: g.id }, g.name) }))) : null,
                h('button', { key: 'add', className: 'wq-btn primary', onClick: function () { if (code.trim()) { commitAdd(mkt, code.trim(), name.trim() || code.trim()); setCode(''); setName('') } } }, '添加'),
              ]),
            ]),
          ]),
        ])
      }

      // ------------------------------------------------------------------
      // Settings dialog
      // ------------------------------------------------------------------
      function SettingsDialog(props) {
        var ss = React.useState(Object.assign({}, DEFAULT_SETTINGS, props.settings || {}))
        var draft = ss[0], setDraft = ss[1]
        function upd(k, v) { var n = Object.assign({}, draft); n[k] = v; setDraft(n) }
        return h('div', { className: 'wq-modal-mask', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onClose() } }, [
          h('div', { className: 'wq-modal', key: 'm', style: { width: 'min(460px,92%)' } }, [
            h('div', { className: 'wq-modal-head', key: 'h' }, [
              h('span', { className: 'wq-modal-title', key: 't' }, '设置'),
              h('button', { className: 'wq-btn', key: 'x', onClick: props.onClose }, '关闭'),
            ]),
            h('div', { className: 'wq-modal-body', key: 'b' }, [
              h('div', { className: 'wq-settings-row', key: 'pill' }, [
                h('span', { className: 'wq-sl', key: 'l' }, '右下角悬浮胶囊'),
                h('input', { key: 'i', type: 'checkbox', checked: draft.pillEnabled, onChange: function (e) { upd('pillEnabled', e.target.checked) } }),
              ]),
              h('div', { className: 'wq-settings-row', key: 'color' }, [
                h('span', { className: 'wq-sl', key: 'l' }, '涨跌配色'),
                h('select', { key: 's', className: 'wq-sel', value: draft.upColor, onChange: function (e) { upd('upColor', e.target.value) } }, [
                  h('option', { key: 'a', value: 'auto' }, '自动（国内红涨，海外绿涨）'),
                  h('option', { key: 'r', value: 'red' }, '红涨绿跌'),
                  h('option', { key: 'g', value: 'green' }, '绿涨红跌'),
                ]),
              ]),
              h('div', { className: 'wq-settings-row', key: 'refresh' }, [
                h('span', { className: 'wq-sl', key: 'l' }, '刷新间隔'),
                h('select', { key: 's', className: 'wq-sel', value: String(draft.refreshMs), onChange: function (e) { upd('refreshMs', Number(e.target.value)) } }, [
                  h('option', { key: '3', value: '3000' }, '3 秒'), h('option', { key: '5', value: '5000' }, '5 秒'),
                  h('option', { key: '10', value: '10000' }, '10 秒'), h('option', { key: '30', value: '30000' }, '30 秒'),
                ]),
              ]),
              h('div', { className: 'wq-settings-row', key: 'density' }, [
                h('span', { className: 'wq-sl', key: 'l' }, '列表密度'),
                h('select', { key: 's', className: 'wq-sel', value: draft.density, onChange: function (e) { upd('density', e.target.value) } }, [
                  h('option', { key: 'c', value: 'comfortable' }, '舒适'), h('option', { key: 'k', value: 'compact' }, '紧凑'),
                ]),
              ]),
              h('div', { className: 'wq-field', key: 'save', style: { marginTop: '16px', justifyContent: 'flex-end' } }, [
                h('button', { key: 'b', className: 'wq-btn primary', onClick: function () { props.onSave(draft) } }, '保存'),
              ]),
            ]),
          ]),
        ])
      }

      // ------------------------------------------------------------------
      // Panel
      // ------------------------------------------------------------------
      // ------------------------------------------------------------------
      // 交易资讯中心 (news center)
      // ------------------------------------------------------------------
      var NEWS_META = {
        x: { label: 'X', color: '#1d9bf0' },
        weibo: { label: '微博', color: '#ff8200' },
        zsxq: { label: '星球', color: '#2ec66a' },
      }
      function relTime(ms) {
        var d = Date.now() - (ms || 0)
        if (d < 60000) return '刚刚'
        var m = Math.floor(d / 60000)
        if (m < 60) return m + '分钟前'
        var hh = Math.floor(m / 60)
        if (hh < 24) return hh + '小时前'
        var day = Math.floor(hh / 24)
        if (day < 30) return day + '天前'
        var dt = new Date(ms); return (dt.getMonth() + 1) + '/' + dt.getDate()
      }
      function lsGet(k, def) { try { var v = window.localStorage.getItem(k); return v == null ? def : JSON.parse(v) } catch (e) { return def } }
      function lsSet(k, v) { try { window.localStorage.setItem(k, JSON.stringify(v)) } catch (e) {} }

      function NewsDock(props) {
        var fullPage = props && props.fullPage === true
        var cS = React.useState(null), config = cS[0], setConfig = cS[1]
        var iS = React.useState([]), items = iS[0], setItems = iS[1]
        var fS = React.useState('all'), filter = fS[0], setFilter = fS[1]
        var vS = React.useState('all'), view = vS[0], setView = vS[1]
        var qS = React.useState(''), query = qS[0], setQuery = qS[1]
        var xS = React.useState({}), expanded = xS[0], setExpanded = xS[1]
        var lS = React.useState(false), loading = lS[0], setLoading = lS[1]
        var oS = React.useState(false), settingsOpen = oS[0], setSettingsOpen = oS[1]
        var colS = React.useState(lsGet('tb.newsCollapsed', false)), collapsed = colS[0], setCollapsed = colS[1]
        var hS = React.useState(function () { var n = Number(lsGet('tb.newsHeight', 300)); return isFinite(n) ? Math.max(160, Math.min(620, n)) : 300 }), height = hS[0], setHeight = hS[1]
        var tS = React.useState(''), notice = tS[0], setNotice = tS[1]
        var eS = React.useState(''), errMsg = eS[0], setErr = eS[1]
        var timeS = React.useState(0), updatedAt = timeS[0], setUpdatedAt = timeS[1]
        var alive = React.useRef(true), dragCleanup = React.useRef(null)
        var listVersion = React.useRef(0), mutationLock = React.useRef(false), refreshLock = React.useRef(false)
        var busyState = React.useState(false), marking = busyState[0], setMarking = busyState[1]
        var readyState = React.useState(false), listReady = readyState[0], setListReady = readyState[1]
        var cfgErrState = React.useState(''), configError = cfgErrState[0], setConfigError = cfgErrState[1]
        var unread = { all: 0, x: 0, weibo: 0, zsxq: 0 }
        items.forEach(function (it) { if (!it.read) { unread.all++; unread[it.source] = (unread[it.source] || 0) + 1 } })
        var visible = items.filter(function (it) {
          if (filter !== 'all' && it.source !== filter) return false
          if (view === 'unread' && it.read) return false
          if (view === 'fav' && !it.fav) return false
          var term = query.trim().toLocaleLowerCase()
          return !term || ((it.text || '') + ' ' + it.author).toLocaleLowerCase().indexOf(term) >= 0
        })
        function load() {
          if (mutationLock.current) return Promise.resolve()
          var version = ++listVersion.current
          return Promise.all([
            post('api/dsh-tradingboat/news', { op: 'list', source: 'all' }).then(function (j) {
              if (!j || !j.ok) throw new Error('列表加载失败')
              if (!alive.current || version !== listVersion.current) return
              setItems(j.items || []); setUpdatedAt(j.updatedAt || 0); setErr(''); setListReady(true)
            }).catch(function () { if (alive.current && version === listVersion.current) { setErr('资讯加载失败，请稍后重试或检查资讯源设置。'); setListReady(true) } }),
            post('api/dsh-tradingboat/news', { op: 'getConfig' }).then(function (j) { if (!j || !j.ok) throw new Error('配置加载失败'); if (alive.current && version === listVersion.current) { setConfig(j.config); setConfigError('') } }).catch(function () { if (alive.current && version === listVersion.current) setConfigError('资讯源设置加载失败，请点击刷新资讯重试。') }),
          ])
        }
        React.useEffect(function () {
          alive.current = true; load()
          var id = setInterval(function () { if (!refreshLock.current) load() }, 25000)
          return function () { alive.current = false; clearInterval(id); if (dragCleanup.current) dragCleanup.current() }
        }, [])
        function refreshAll() {
          if (refreshLock.current || mutationLock.current) return
          refreshLock.current = true
          setLoading(true); setNotice('正在同步关注的资讯源…')
          post('api/dsh-tradingboat/news', { op: 'refresh' }).then(function (j) {
            if (!j || !j.ok) throw new Error((j && j.error && (j.error.message || j.error)) || '刷新失败')
            if (!alive.current) return
            var reload = load()
            var results = j.results || [], labels = { x: 'X', weibo: '微博', zsxq: '知识星球' }
            var active = results.filter(function (r) { return !r.skipped || (config && config.sources && config.sources[r.source] && config.sources[r.source].enabled) })
            var messages = active.map(function (r) {
              var label = labels[r.source] || r.source
              if (r.skipped) return label + '：已启用但未填写账号或星球 ID，请检查设置'
              return r.error ? label + '：' + r.error : label + ' 拉取 ' + (r.fetched || 0) + ' 条 · 新增 ' + (r.added || 0) + ' 条'
            })
            setNotice(messages.join('；') || '尚未启用资讯源，请在「资讯源设置」中勾选来源并保存。')
            return reload
          }).catch(function (e) { if (alive.current) setNotice('刷新失败：' + ((e && e.message) || '请检查资讯服务连接')) }).finally(function () { refreshLock.current = false; if (alive.current) setLoading(false) })
        }
        function markItems(ids, patch) {
          if (!ids.length || mutationLock.current || refreshLock.current) return Promise.resolve()
          mutationLock.current = true; ++listVersion.current; setMarking(true)
          return post('api/dsh-tradingboat/news', Object.assign({ op: 'mark', ids: ids }, patch)).then(function (j) {
            if (!j || !j.ok) throw new Error('标记失败')
            if (alive.current) {
              setItems(function (prev) { return prev.map(function (x) { return ids.indexOf(x.id) >= 0 ? Object.assign({}, x, patch) : x }) })
              if (ids.length > 1) setNotice('已将当前结果中的 ' + ids.length + ' 条资讯标为已读')
            }
          }).catch(function () { if (alive.current) setNotice('操作未保存，请重试。') }).finally(function () {
            mutationLock.current = false
            if (alive.current) { setMarking(false); load() }
          })
        }
        function markItem(it, patch) { return markItems([it.id], patch) }
        function clearFilters() { setFilter('all'); setView('all'); setQuery('') }
        function openItem(it) {
          if (/^https?:\/\//i.test(it.url || '')) window.open(it.url, '_blank', 'noopener,noreferrer')
          if (!it.read) markItem(it, { read: true })
        }
        function copyText(it) {
          Promise.resolve().then(function () { return navigator.clipboard.writeText(it.text || '') }).then(function () {
            if (alive.current) setNotice('正文已复制')
          }).catch(function () { if (alive.current) setNotice('复制失败，请检查浏览器剪贴板权限。') })
        }
        function startDrag(e) {
          e.preventDefault()
          if (dragCleanup.current) dragCleanup.current()
          var startY = e.clientY, startH = height, max = Math.max(160, Math.min(620, e.currentTarget.closest('.wq-right').clientHeight - 130))
          function mv(ev) { var nh = Math.max(160, Math.min(max, startH + startY - ev.clientY)); setHeight(nh); lsSet('tb.newsHeight', nh) }
          function up() { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); dragCleanup.current = null }
          dragCleanup.current = up
          document.addEventListener('mousemove', mv); document.addEventListener('mouseup', up)
        }
        var isCollapsed = collapsed && !fullPage
        var chips = [['all', '全部来源'], ['x', 'X'], ['weibo', '微博'], ['zsxq', '知识星球']]
        var head = h('div', { className: 'wq-news-head', key: 'h' }, [
          h('div', { className: 'wq-news-heading', key: 'heading' }, [
            h('div', { className: 'wq-news-title', key: 'title' }, ['市场情报', h('span', { key: 'count', className: 'wq-ncount' }, unread.all + ' 未读')]),
            h('div', { className: 'wq-news-subtitle', key: 'sub' }, updatedAt ? '最近同步 ' + timeLabel(updatedAt) + ' · 关注来源动态' : '关注来源动态'),
          ]),
          h('span', { className: 'wq-spacer', key: 'sp' }),
          h('button', { className: 'wq-btn', key: 'rf', title: '刷新资讯', disabled: loading || marking, onClick: refreshAll }, loading ? '同步中…' : '↻ 刷新资讯'),
          h('button', { className: 'wq-btn', key: 'st', title: '资讯源设置', disabled: !config, onClick: function () { setSettingsOpen(true) } }, '资讯源设置'),
          fullPage ? null : h('button', { className: 'wq-iconbtn', key: 'cl', title: collapsed ? '展开资讯' : '收起资讯', 'aria-expanded': !collapsed, onClick: function () { var v = !collapsed; setCollapsed(v); lsSet('tb.newsCollapsed', v) } }, collapsed ? '▸' : '▾'),
        ])
        var tools = isCollapsed ? null : h('div', { className: 'wq-news-tools', key: 'tools' }, [
          h('div', { className: 'wq-nfilters', key: 'sources', role: 'group', 'aria-label': '资讯来源' }, chips.map(function (c) {
            return h('button', { key: c[0], className: 'wq-nchip' + (filter === c[0] ? ' is-on' : ''), 'aria-pressed': filter === c[0], onClick: function () { setFilter(c[0]) } }, [c[1], unread[c[0]] ? h('span', { key: 'n', className: 'wq-ncount' }, unread[c[0]]) : null])
          })),
          h('input', { key: 'search', className: 'wq-news-search', type: 'search', placeholder: '搜索正文或作者', 'aria-label': '搜索资讯正文或作者', value: query, onChange: function (e) { setQuery(e.target.value) } }),
          h('div', { key: 'view', className: 'wq-news-viewfilters', role: 'group', 'aria-label': '阅读状态' }, [['all', '全部'], ['unread', '未读'], ['fav', '收藏']].map(function (c) {
            return h('button', { key: c[0], className: 'wq-nchip' + (view === c[0] ? ' is-on' : ''), 'aria-pressed': view === c[0], onClick: function () { setView(c[0]) } }, c[1])
          })),
        ])
        var resultsBar = isCollapsed ? null : h('div', { className: 'wq-news-results', key: 'results' }, [
          h('span', { key: 'count' }, listReady ? '已加载 ' + items.length + ' 条 · 当前结果 ' + visible.length + ' 条' : '正在加载资讯…'),
          h('button', { key: 'read', className: 'wq-btn', disabled: marking || loading || !visible.some(function (it) { return !it.read }), onClick: function () { markItems(visible.filter(function (it) { return !it.read }).map(function (it) { return it.id }), { read: true }) } }, marking ? '保存中…' : '当前结果标为已读'),
        ])
        var lastDay = ''
        var cards = visible.map(function (it) {
          var meta = NEWS_META[it.source] || { label: it.source, color: '#888' }
          var dt = new Date(it.createdAt), day = dt.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })
          var dayLabel = day !== lastDay ? day : null; lastDay = day
          var isLong = (it.text || '').length > 180 || (it.text || '').split('\n').length > 4
          return h('div', { key: it.id }, [
            dayLabel ? h('div', { className: 'wq-nday', key: 'day' }, dayLabel) : null,
            h('article', { className: 'wq-nitem' + (it.read ? ' is-read' : ' is-unread'), key: 'card' }, [
              h('span', { className: 'wq-nsrc', key: 's', style: { background: meta.color } }),
              h('div', { className: 'wq-nmain', key: 'm' }, [
                h('div', { className: 'wq-nmeta', key: 'meta' }, [
                  h('span', { className: 'wq-navatar', key: 'avatar', style: { color: meta.color } }, (it.author || meta.label).replace(/^@/, '').slice(0, 1).toUpperCase()),
                  h('span', { className: 'wq-nauthor', key: 'author' }, it.author),
                  h('span', { className: 'wq-nplatform', key: 'platform', style: { color: meta.color } }, meta.label),
                  h('time', { key: 'time', dateTime: dt.toISOString(), title: dt.toLocaleString('zh-CN') }, relTime(it.createdAt)),
                  !it.read ? h('span', { key: 'unread', className: 'wq-nread-dot', title: '未读', 'aria-label': '未读' }) : null,
                ]),
                h('div', { className: 'wq-ntext' + (isLong && !expanded[it.id] ? ' is-truncated' : ' is-expanded'), key: 'text', id: 'news-text-' + it.id.replace(/[^\w-]/g, '-') }, (it.text || '（图片或分享内容，请查看原文）').split(/\n\s*\n/).map(function (paragraph, index) { return h('p', { key: index, style: { margin: index ? '12px 0 0' : '0', whiteSpace: 'pre-wrap' } }, paragraph) })),
                isLong ? h('button', { key: 'expand', className: 'wq-nexpand', 'aria-expanded': !!expanded[it.id], onClick: function () { setExpanded(function (prev) { var n = Object.assign({}, prev); n[it.id] = !n[it.id]; return n }) } }, expanded[it.id] ? '收起正文 ↑' : '展开全文 ↓') : null,
                it.media && it.media.length ? h('div', { className: 'wq-nmedia', key: 'media' }, it.media.slice(0, 4).map(function (url, i) {
                  return h('button', { key: i, className: 'wq-nmedia-btn', 'aria-label': '查看原文中的图片 ' + (i + 1), onClick: function () { openItem(it) } }, h('img', { className: 'wq-nthumb', src: url, alt: '资讯配图 ' + (i + 1), referrerPolicy: 'no-referrer', loading: 'lazy' }))
                })) : null,
                h('div', { className: 'wq-nacts', key: 'actions' }, [
                  h('button', { className: 'wq-nact', key: 'open', onClick: function () { openItem(it) } }, '查看原文 ↗'),
                  h('button', { className: 'wq-nact' + (it.fav ? ' is-fav' : ''), key: 'fav', disabled: marking || loading, 'aria-pressed': it.fav, onClick: function () { markItem(it, { fav: !it.fav }) } }, it.fav ? '★ 已收藏' : '☆ 收藏'),
                  h('button', { className: 'wq-nact', key: 'read', disabled: marking || loading, onClick: function () { markItem(it, { read: !it.read }) } }, it.read ? '标为未读' : '标为已读'),
                  h('button', { className: 'wq-nact', key: 'copy', onClick: function () { copyText(it) } }, '复制'),
                  it.stats && (it.stats.like || it.stats.comment || it.stats.repost) ? h('span', { className: 'wq-testres', key: 'stats', style: { marginLeft: 'auto' } }, '赞 ' + it.stats.like + ' · 评 ' + it.stats.comment) : null,
                ]),
              ]),
            ]),
          ])
        })
        var emptyTitle = !listReady ? '正在加载资讯…' : query || view !== 'all' || filter !== 'all' ? '没有符合条件的资讯' : '资讯会从这里开始'
        var emptyHint = !listReady ? '正在读取已保存的资讯，请稍候。' : query || view !== 'all' || filter !== 'all' ? '试试其他关键词，或切换阅读状态与来源。' : '配置你关注的博主或星球，开启后点击「刷新资讯」。'
        var body = isCollapsed ? null : h('div', { className: 'wq-news-body', key: 'body' }, h('div', { className: 'wq-nfeed' }, visible.length ? cards : h('div', { className: 'wq-nempty' }, [
          h('div', { className: 'wq-nempty-icon', key: 'icon' }, '≋'),
          h('div', { className: 'wq-nempty-title', key: 'title' }, emptyTitle),
          h('p', { key: 'hint' }, emptyHint),
          query || view !== 'all' || filter !== 'all' ? h('button', { key: 'reset', className: 'wq-btn', onClick: clearFilters }, '清除筛选') : null,
          listReady && !items.length ? h('button', { className: 'wq-btn', key: 'setup', disabled: !config, onClick: function () { setSettingsOpen(true) } }, '配置资讯源') : null,
        ])))
        var style = fullPage ? { flex: '1 1 0', height: 'auto', borderTop: 0 } : (isCollapsed ? {} : { height: height + 'px', maxHeight: '72%' })
        return h('div', { className: 'wq-news' + (fullPage ? ' is-full' : ''), style: style }, [
          isCollapsed || fullPage ? null : h('div', { className: 'wq-news-resizer', key: 'resize', onMouseDown: startDrag, onDoubleClick: function () { setHeight(300); lsSet('tb.newsHeight', 300) }, title: '拖动调整资讯高度，双击恢复默认' }),
          head, tools, resultsBar,
          errMsg || configError || notice ? h('div', { key: 'status', className: 'wq-news-status', role: 'status' }, [h('span', { key: 'text' }, errMsg || configError || notice), h('button', { key: 'close', className: 'wq-iconbtn', title: '关闭提示', onClick: function () { setErr(''); setConfigError(''); setNotice('') } }, '×')]) : null,
          body,
          settingsOpen ? h(NewsSettings, { key: 'settings', config: config, onClose: function () { setSettingsOpen(false) }, onSaved: function (cfg) { setConfig(cfg); setSettingsOpen(false); load(); setNotice('资讯源已保存，点击「刷新资讯」同步内容。') } }) : null,
        ])
      }
      NewsDock.displayName = 'NewsDock'

      function NewsSettings(props) {
        var cfg = props.config || { sources: {}, pollMinutes: {}, credentials: {} }
        var dS = React.useState({
          x: Object.assign({ enabled: true, screenName: '' }, cfg.sources && cfg.sources.x),
          weibo: Object.assign({ enabled: false, uid: '' }, cfg.sources && cfg.sources.weibo),
          zsxq: Object.assign({ enabled: false, groupId: '' }, cfg.sources && cfg.sources.zsxq),
          weiboCookie: '', zsxqCookie: '',
        })
        var d = dS[0], setD = dS[1]
        var rS = React.useState({}), results = rS[0], setResults = rS[1]
        var mS = React.useState(''), saveMsg = mS[0], setSaveMsg = mS[1]
        var savingState = React.useState(false), saving = savingState[0], setSaving = savingState[1]
        var saveLock = React.useRef(false), testLocks = React.useRef({})
        function upd(k, patch) { var n = Object.assign({}, d); n[k] = Object.assign({}, n[k], patch); setD(n) }
        function setVal(k, v) { var n = Object.assign({}, d); n[k] = v; setD(n) }
        function test(source) {
          if (saveLock.current || testLocks.current[source]) return
          testLocks.current[source] = true
          var payload = { op: 'test', source: source }
          if (source === 'x') payload.screenName = d.x.screenName
          if (source === 'weibo') { payload.uid = d.weibo.uid; if (d.weiboCookie) payload.cookie = d.weiboCookie }
          if (source === 'zsxq') { payload.groupId = d.zsxq.groupId; if (d.zsxqCookie) payload.cookie = d.zsxqCookie }
          setResults(function (prev) { var n = Object.assign({}, prev); n[source] = { loading: true }; return n })
          post('api/dsh-tradingboat/news', payload).then(function (j) {
            setResults(function (prev) { var n = Object.assign({}, prev); n[source] = j && j.ok ? { ok: true, text: '成功，取到 ' + j.count + ' 条' } : { ok: false, text: (j && j.error) || '失败' }; return n })
          }).catch(function () { setResults(function (prev) { var n = Object.assign({}, prev); n[source] = { ok: false, text: '网络错误' }; return n }) }).finally(function () { testLocks.current[source] = false })
        }
        function save() {
          if (saveLock.current || Object.keys(testLocks.current).some(function (k) { return testLocks.current[k] })) return
          saveLock.current = true; setSaving(true)
          var config = {
            pollMinutes: cfg.pollMinutes,
            sources: { x: { enabled: d.x.enabled, screenName: d.x.screenName }, weibo: { enabled: d.weibo.enabled, uid: d.weibo.uid }, zsxq: { enabled: d.zsxq.enabled, groupId: d.zsxq.groupId } },
            credentials: { weiboCookie: d.weiboCookie || '', zsxqCookie: d.zsxqCookie || '' },
          }
          setSaveMsg('')
          post('api/dsh-tradingboat/news', { op: 'saveConfig', config: config }).then(function (j) {
            if (j && j.ok) { props.onSaved(j.config) } else { setSaveMsg('保存失败：' + ((j && j.error && (j.error.message || j.error)) || '资讯路由未就绪，请重启 DSH 桌面端一次')) }
          }).catch(function () { setSaveMsg('保存失败，请检查连接后重试。') }).finally(function () { saveLock.current = false; setSaving(false) })
        }
        function section(source, title, children) {
          var r = results[source]
          var head = h('div', { key: 'hd', style: { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } }, [
            h('label', { key: 'toggle', className: 'wq-source-toggle', style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' } }, [
              h('input', { key: 'ck', type: 'checkbox', checked: d[source].enabled, onChange: function (e) { upd(source, { enabled: e.target.checked }) } }),
              h('span', { key: 'tt', style: { fontWeight: 600, fontSize: '12.5px' } }, title),
              h('span', { key: 'state', className: 'wq-nplatform' }, d[source].enabled ? '已启用' : '未启用'),
            ]),
            h('button', { key: 'tb', className: 'wq-addbtn', style: { marginLeft: 'auto' }, disabled: saving || !!(r && r.loading), onClick: function () { test(source) } }, r && r.loading ? '测试中…' : '测试连接'),
            r && !r.loading ? h('span', { key: 'rs', className: 'wq-testres', style: { color: r.ok ? '#17c964' : '#ff6b6b' } }, r.text) : null,
          ])
          return h('div', { key: source, style: { marginTop: '14px', paddingTop: '10px', borderTop: '1px dashed var(--dsw-alias-border-l1,rgba(255,255,255,.08))' } }, [head].concat(children))
        }
        return h('div', { className: 'wq-modal-mask', onMouseDown: function (e) { if (e.target === e.currentTarget) props.onClose() } }, [
          h('div', { className: 'wq-modal', key: 'm', style: { width: 'min(580px,94%)' } }, [
            h('div', { className: 'wq-modal-head', key: 'h' }, [h('span', { className: 'wq-modal-title', key: 't' }, '资讯源设置'), h('button', { className: 'wq-btn', key: 'x', onClick: props.onClose }, '关闭')]),
            h('div', { className: 'wq-modal-body', key: 'b' }, [
              h('div', { key: 'hint', style: { fontSize: '11.5px', color: 'var(--dsw-alias-label-tertiary,#7c828c)', lineHeight: 1.6 } }, 'X 使用 FxTwitter 免费镜像；微博 / 知识星球需要登录 Cookie。勾选来源后保存即可启用。Cookie 保存在本机，仅用于对应平台的认证请求。'),
              section('x', 'X（推特）', [
                h('div', { key: 'row', className: 'wq-nset-row' }, [h('input', { key: 'sn', className: 'wq-input', placeholder: '博主 screenName，如 trader_joe', value: d.x.screenName, onChange: function (e) { upd('x', { screenName: e.target.value }) } })]),
              ]),
              section('weibo', '微博', [
                h('div', { key: 'row', className: 'wq-nset-row' }, [h('input', { key: 'uid', className: 'wq-input', placeholder: '微博 UID（数字），如 1234567890', value: d.weibo.uid, onChange: function (e) { upd('weibo', { uid: e.target.value }) } })]),
                h('div', { key: 'ck', className: 'wq-nset-row' }, [h('textarea', { key: 'c', className: 'wq-textarea', placeholder: cfg.credentials && cfg.credentials.weiboCookieSet ? '已设置 Cookie，留空保持不变' : '粘贴微博 Cookie（含 SUB=…; SUBP=…）', value: d.weiboCookie, onChange: function (e) { setVal('weiboCookie', e.target.value) } })]),
              ]),
              section('zsxq', '知识星球', [
                h('div', { key: 'row', className: 'wq-nset-row' }, [h('input', { key: 'gid', className: 'wq-input', placeholder: '星球 groupId（数字）', value: d.zsxq.groupId, onChange: function (e) { upd('zsxq', { groupId: e.target.value }) } })]),
                h('div', { key: 'ck', className: 'wq-nset-row' }, [h('textarea', { key: 'c', className: 'wq-textarea', placeholder: cfg.credentials && cfg.credentials.zsxqCookieSet ? '已设置 Cookie，留空保持不变' : '粘贴星球 Cookie（含 zsxq_access_token=…）', value: d.zsxqCookie, onChange: function (e) { setVal('zsxqCookie', e.target.value) } })]),
              ]),
              h('div', { key: 'actions', style: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px' } }, [
                saveMsg ? h('span', { key: 'msg', className: 'wq-testres', style: { color: '#ff6b6b', flex: 1, whiteSpace: 'normal' } }, saveMsg) : h('span', { key: 'sp', style: { flex: 1 } }),
                h('button', { key: 'sv', className: 'wq-btn primary', disabled: saving || Object.keys(results).some(function (k) { return results[k].loading }), onClick: save }, saving ? '保存中…' : '保存'),
              ]),
            ]),
          ]),
        ])
      }
      NewsSettings.displayName = 'NewsSettings'

      function createPanel(ctx, t) {
        function Panel(props) {
          var stState = React.useState(null), state = stState[0], setState = stState[1]
          var stQuotes = React.useState({}), quotes = stQuotes[0], setQuotes = stQuotes[1]
          var stUpd = React.useState(false), updating = stUpd[0], setUpdating = stUpd[1]
          var stTs = React.useState(0), lastTs = stTs[0], setLastTs = stTs[1]
          var stSel = React.useState(null), selectedId = stSel[0], setSelectedId = stSel[1]
          var stChartRefresh = React.useState(0), chartRefresh = stChartRefresh[0], setChartRefresh = stChartRefresh[1]
          var stIv = React.useState('1d'), detailInterval = stIv[0], setDetailInterval = stIv[1]
          var stDet = React.useState(null), detail = stDet[0], setDetail = stDet[1]
          var stAdd = React.useState(false), addOpen = stAdd[0], setAddOpen = stAdd[1]
          var stAddT = React.useState(null), addTarget = stAddT[0], setAddTarget = stAddT[1]
          var stSet = React.useState(false), settingsOpen = stSet[0], setSettingsOpen = stSet[1]
          var stEG = React.useState(null), editingGroup = stEG[0], setEditingGroup = stEG[1]
          var stEN = React.useState(''), editName = stEN[0], setEditName = stEN[1]
          var stLayout = React.useState(function () {
            var saved = lsGet('tb.detailLayout', 'both')
            return ['both', 'chart', 'news'].indexOf(saved) >= 0 ? saved : 'both'
          }), layoutMode = stLayout[0], setLayoutMode = stLayout[1]
          function changeLayout(mode) { setLayoutMode(mode); lsSet('tb.detailLayout', mode) }
          var refreshRef = React.useRef(null)
          var stWatch = React.useState(''), watchQuery = stWatch[0], setWatchQuery = stWatch[1]
          var stFocus = React.useState(function () { return lsGet('tb.hideWatchlist', false) === true }), hideWatchlist = stFocus[0], setHideWatchlist = stFocus[1]
          var stQuoteError = React.useState(''), quoteError = stQuoteError[0], setQuoteError = stQuoteError[1]
          var stInitialError = React.useState(''), initialError = stInitialError[0], setInitialError = stInitialError[1]
          var stRetry = React.useState(0), retry = stRetry[0], setRetry = stRetry[1]
          function toggleWatchlist() { var hidden = !hideWatchlist; setHideWatchlist(hidden); lsSet('tb.hideWatchlist', hidden) }

          var flat = React.useMemo(function () {
            if (!state) return []
            var out = []
            state.groups.forEach(function (g) { g.items.forEach(function (it) { out.push(it) }) })
            return out
          }, [state])
          var byId = React.useMemo(function () {
            var m = {}
            flat.forEach(function (it) { m[it.id] = it })
            return m
          }, [flat])

          React.useEffect(function () {
            var alive = true
            setInitialError('')
            post('api/dsh-tradingboat/state', { op: 'get' }).then(function (j) {
              if (!alive) return
              if (!j || !j.ok || !j.value) throw new Error('自选加载失败')
              setState(j.value)
              setSettingsValue(j.value.settings)
              var first = null
              if (j.value.groups && j.value.groups[0] && j.value.groups[0].items[0]) first = j.value.groups[0].items[0].id
              if (first) setSelectedId(function (prev) { return prev || first })
            }).catch(function () { if (alive) setInitialError('自选加载失败，请检查连接后重试。') })
            return function () { alive = false }
          }, [retry])

          React.useEffect(function () {
            if (!state) return
            var alive = true
            var items = []
            state.groups.forEach(function (g) { g.items.forEach(function (it) { items.push(it) }) })
            if (items.length === 0) { setQuotes({}); setQuoteError(''); setUpdating(false); return }
            var inFlight = false
            function tick() {
              if (!alive || inFlight) return
              inFlight = true
              setUpdating(true)
              post('api/dsh-tradingboat/quotes', {
                items: items.map(function (it) { return { id: it.id, mkt: it.mkt, code: it.code, name: it.name } }),
              }).then(function (j) {
                if (!alive) return
                if (!j || !j.ok) throw new Error('行情更新失败')
                setQuotes(j.quotes || {}); setLastTs(j.ts || Date.now()); setQuoteError('')
              }).catch(function () { if (alive) setQuoteError('行情更新失败，当前显示上次结果') }).finally(function () { inFlight = false; if (alive) setUpdating(false) })
            }
            refreshRef.current = tick
            tick()
            var tmr = setInterval(tick, Math.max(2000, (state.settings && state.settings.refreshMs) || 5000))
            return function () { alive = false; clearInterval(tmr); refreshRef.current = null }
          }, [state])

          React.useEffect(function () {
            if (layoutMode === 'news') return
            if (!selectedId || !byId[selectedId]) { setDetail(null); return }
            var item = byId[selectedId]
            var alive = true
            setDetail(function (prev) { return { loading: true, item: item, interval: detailInterval, candles: prev && prev.item && prev.item.id === selectedId ? prev.candles : [] } })
            post('api/dsh-tradingboat/kline', { mkt: item.mkt, code: item.code, interval: detailInterval }).then(function (j) {
              if (!alive) return
              setDetail({ loading: false, item: item, interval: detailInterval, candles: (j && j.ok && j.candles) || [], error: j && !j.ok ? (j.error && j.error.message) : null })
            }).catch(function () { if (alive) setDetail({ loading: false, item: item, interval: detailInterval, candles: [], error: 'network' }) })
            return function () { alive = false }
          }, [selectedId, detailInterval, state, layoutMode, chartRefresh])

          function mutate(fn) {
            setState(function (prev) {
              if (!prev) return prev
              var next = fn(prev)
              persistState(next)
              return next
            })
          }
          function commitRename(gid) {
            var nm = (editName || '').trim()
            if (nm) mutate(function (prev) { return Object.assign({}, prev, { groups: prev.groups.map(function (g) { return g.id === gid ? Object.assign({}, g, { name: nm }) : g }) }) })
            setEditingGroup(null); setEditName('')
          }
          function toggleGroup(gid) { mutate(function (prev) { return Object.assign({}, prev, { groups: prev.groups.map(function (g) { return g.id === gid ? Object.assign({}, g, { collapsed: !g.collapsed }) : g }) }) }) }
          function removeItem(gid, iid) { mutate(function (prev) { return Object.assign({}, prev, { groups: prev.groups.map(function (g) { return g.id === gid ? Object.assign({}, g, { items: g.items.filter(function (it) { return it.id !== iid }) }) : g }) }) }) }
          function addGroup() { mutate(function (prev) { return Object.assign({}, prev, { groups: prev.groups.concat([{ id: 'g-' + Date.now(), name: '新分组', collapsed: false, items: [] }]) }) }) }
          function deleteGroup(gid) { mutate(function (prev) { if (prev.groups.length <= 1) return prev; return Object.assign({}, prev, { groups: prev.groups.filter(function (g) { return g.id !== gid }) }) }) }
          function moveGroup(gid, dir) {
            mutate(function (prev) {
              var arr = prev.groups.slice()
              var i = -1; for (var k = 0; k < arr.length; k++) if (arr[k].id === gid) { i = k; break }
              var j = i + dir
              if (i < 0 || j < 0 || j >= arr.length) return prev
              var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp
              return Object.assign({}, prev, { groups: arr })
            })
          }
          function addItem(mkt, code, name, gid) {
            code = String(code || '').trim(); if (!code) return
            var item = { id: newId(mkt, code), mkt: mkt, code: code, name: name || code }
            mutate(function (prev) {
              var target = gid || autoGroupId(mkt, prev.groups)
              var found = false
              var groups = prev.groups.map(function (g) { if (g.id === target) { found = true; return Object.assign({}, g, { items: g.items.concat([item]) }) } return g })
              if (!found && groups.length) groups[0] = Object.assign({}, groups[0], { items: groups[0].items.concat([item]) })
              return Object.assign({}, prev, { groups: groups })
            })
            setSelectedId(item.id)
          }
          function saveSettings(next) {
            setSettingsValue(next)
            setState(function (prev) { if (!prev) return prev; var n = Object.assign({}, prev, { settings: next }); persistState(n); return n })
            setSettingsOpen(false)
          }
          var stGlass = React.useState(function () {
            var value = Number(lsGet('tb.backgroundTransparency', 20))
            return isFinite(value) ? Math.max(0, Math.min(80, value)) : 20
          }), transparency = stGlass[0], setTransparency = stGlass[1]
          function changeTransparency(value) {
            var next = Math.max(0, Math.min(80, Number(value) || 0))
            setTransparency(next); lsSet('tb.backgroundTransparency', next)
          }
          var glassStyle = { '--wq-surface-alpha': String(1 - transparency / 100), '--wq-layer-alpha': String((1 - transparency / 100) * 0.1), '--wq-glass-blur': transparency ? '8px' : '0px' }
          function manualRefresh() { if (updating) return; if (refreshRef.current) refreshRef.current(); setChartRefresh(function (v) { return v + 1 }) }

          if (!state) {
            return h('section', { className: 'wq-page', style: glassStyle }, h('div', { className: 'wq-placeholder', role: 'status' }, [initialError || '正在加载自选…', initialError ? h('button', { key: 'retry', className: 'wq-btn', onClick: function () { setRetry(function (n) { return n + 1 }) } }, '重新加载') : null]))
          }

          var settings = state.settings || DEFAULT_SETTINGS
          var upCount = 0, downCount = 0
          flat.forEach(function (it) { var q = quotes[it.id]; if (q && q.changePct !== null && q.changePct !== undefined && isFinite(q.changePct)) { if (q.changePct > 0) upCount++; else if (q.changePct < 0) downCount++ } })

          var topbar = h('div', { className: 'wq-topbar', key: 'tb', style: { flexWrap: 'wrap' } }, [
            h('div', { className: 'wq-title', key: 'ti' }, [h('span', { key: 'ico', className: 'wq-brandmark', 'aria-hidden': true }, h('svg', { width: 26, height: 28, viewBox: '0 0 26 28', fill: 'none' }, [h('path', { key: 'sail', d: 'M13 2 L13 19 L3 19 Z M16 7 L23 19 L16 19 Z', stroke: 'currentColor', strokeWidth: 1.4 }), h('path', { key: 'boat', d: 'M2 22 L24 22 L19 26 L7 26 Z', fill: 'currentColor' })])), h('span', { key: 'x' }, t('page.title'))]),
            h('div', { className: 'wq-summary', key: 'sum' }, [h('span', { key: 'up', className: 'wq-up' }, '↑ ' + upCount), h('span', { key: 'down', className: 'wq-down' }, '↓ ' + downCount), h('span', { key: 'time' }, timeLabel(lastTs))]),
            h('span', { className: 'wq-spacer', key: 'sp' }),
            h('button', { key: 'focus', className: 'wq-btn wq-focus-toggle', 'aria-pressed': hideWatchlist, title: hideWatchlist ? '恢复左侧自选行情' : '隐藏左侧自选，扩大右侧阅读空间', onClick: toggleWatchlist }, hideWatchlist ? '显示自选' : '专注模式'),
            h('div', { key: 'layout', className: 'wq-layout-switch', role: 'group', 'aria-label': '右侧布局' }, [['both', '行情＋资讯'], ['chart', '仅行情'], ['news', '仅资讯']].map(function (pair) {
              return h('button', { key: pair[0], className: 'wq-btn' + (layoutMode === pair[0] ? ' primary' : ''), 'aria-pressed': layoutMode === pair[0], onClick: function () { changeLayout(pair[0]) } }, pair[1])
            })),
            h('details', { className: 'wq-glass-control', key: 'glass', onKeyDown: function (e) { if (e.key === 'Escape') { e.currentTarget.open = false; e.currentTarget.querySelector('summary').focus() } } }, [
              h('summary', { className: 'wq-btn', key: 'toggle', title: '调整背景透明度' }, '透明度 ' + transparency + '%'),
              h('div', { className: 'wq-glass-popover', key: 'panel' }, [
                h('label', { key: 'label', htmlFor: 'tb-background-transparency', className: 'wq-glass-label' }, ['背景透明度', h('span', { key: 'value' }, transparency + '%')]),
                h('input', { key: 'range', id: 'tb-background-transparency', type: 'range', min: 0, max: 80, step: 5, value: transparency, 'aria-label': '背景透明度', 'aria-valuetext': transparency + '% 透明', onChange: function (e) { changeTransparency(e.target.value) } }),
                h('div', { key: 'ends', className: 'wq-glass-ends' }, [h('span', { key: 'solid' }, '实色'), h('span', { key: 'glass' }, '通透')]),
                h('div', { key: 'presets', className: 'wq-glass-presets' }, [[0, '实色'], [20, '轻透'], [45, '融合'], [70, '通透']].map(function (pair) { return h('button', { key: pair[0], className: 'wq-btn' + (transparency === pair[0] ? ' primary' : ''), onClick: function () { changeTransparency(pair[0]) } }, pair[1]) })),
                h('div', { key: 'hint', className: 'wq-glass-hint' }, '即时生效 · 自动记忆 · 文字保持清晰'),
              ]),
            ]),
            h('span', { className: 'wq-dot' + (updating ? ' spin' : ''), key: 'dot', title: updating ? '更新中' : '就绪' }),
            h('button', { className: 'wq-btn', key: 'rf', disabled: updating, onClick: manualRefresh }, updating ? '更新中' : '刷新行情'),
            h('button', { className: 'wq-btn primary', key: 'ad', onClick: function () { setAddTarget(null); setAddOpen(true) } }, '＋ 添加'),
            h('button', { className: 'wq-btn', key: 'st', onClick: function () { setSettingsOpen(true) } }, '⚙'),
            h('button', { className: 'wq-btn', key: 'ag', onClick: addGroup }, '＋ 分组'),
          ])

          var watchTerm = watchQuery.trim().toLocaleLowerCase()
          function matchesWatch(it) { return !watchTerm || ((it.name || '') + ' ' + it.code + ' ' + ((quotes[it.id] && quotes[it.id].name) || '')).toLocaleLowerCase().indexOf(watchTerm) >= 0 }
          var watchMatches = flat.filter(matchesWatch).length
          var groupEls = state.groups.map(function (g) {
            var matchedItems = g.items.filter(matchesWatch)
            if (watchTerm && !matchedItems.length) return null
            var head = h('div', { className: 'wq-ghead', key: 'gh', onClick: function (e) { if (e.target.closest && e.target.closest('.wq-gops')) return; if (editingGroup === g.id) return; toggleGroup(g.id) } }, [
              h('span', { className: 'wq-caret', key: 'ca' }, g.collapsed && !watchTerm ? '▸' : '▾'),
              editingGroup === g.id
                ? h('input', { key: 'in', className: 'wq-input', style: { padding: '2px 6px', fontSize: '12px' }, value: editName, autoFocus: true, onChange: function (e) { setEditName(e.target.value) }, onKeyDown: function (e) { if (e.key === 'Enter') commitRename(g.id); else if (e.key === 'Escape') { setEditingGroup(null); setEditName('') } }, onBlur: function () { commitRename(g.id) }, onClick: function (e) { e.stopPropagation() } })
                : h('span', { className: 'wq-gname', key: 'gn' }, g.name),
              h('span', { className: 'wq-gcount', key: 'gc' }, watchTerm ? matchedItems.length : g.items.length),
              h('span', { className: 'wq-gops', key: 'go' }, [
                h('button', { className: 'wq-iconbtn', key: 'up', title: '上移', onClick: function (e) { e.stopPropagation(); moveGroup(g.id, -1) } }, '▲'),
                h('button', { className: 'wq-iconbtn', key: 'dn', title: '下移', onClick: function (e) { e.stopPropagation(); moveGroup(g.id, 1) } }, '▼'),
                h('button', { className: 'wq-iconbtn', key: 'rn', title: '重命名', onClick: function (e) { e.stopPropagation(); setEditingGroup(g.id); setEditName(g.name) } }, '✎'),
                h('button', { className: 'wq-iconbtn', key: 'ap', title: '添加到此分组', onClick: function (e) { e.stopPropagation(); setAddTarget(g.id); setAddOpen(true) } }, '＋'),
                h('button', { className: 'wq-iconbtn', key: 'dl', title: '删除分组', onClick: function (e) { e.stopPropagation(); deleteGroup(g.id) } }, '🗑'),
              ]),
            ])
            var rows = g.collapsed && !watchTerm ? null : h('div', { className: 'wq-rows', key: 'rows' }, matchedItems.map(function (it) {
              var q = quotes[it.id]
              var base = upBaseFor(it, settings)
              var pct = q ? q.changePct : null
              return h('div', { className: 'wq-row' + (selectedId === it.id ? ' is-sel' : ''), key: it.id, role: 'button', tabIndex: 0, onClick: function () { setSelectedId(it.id) }, onKeyDown: function (e) { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setSelectedId(it.id) } } }, [
                h('span', { className: 'wq-mkbar', key: 'mb', style: { background: MARKETS[it.mkt] ? MARKETS[it.mkt].color : '#888' } }),
                h('span', { className: 'wq-rowmain', key: 'mn' }, [
                  h('span', { className: 'wq-rname', key: 'n' }, (q && q.name) || it.name),
                  h('span', { className: 'wq-rcode', key: 'c' }, (MARKETS[it.mkt] ? MARKETS[it.mkt].short : '') + ' · ' + it.code),
                ]),
                h('span', { className: 'wq-rprice', key: 'p', style: { color: chgColor(pct, base) } }, q && q.ok ? fmtNum(q.price, priceDigits(it, q.price)) : '—'),
                h('span', { className: 'wq-rpct ' + pctClass(pct, base), key: 'pc' }, q && q.ok ? fmtPct(pct) : '—'),
                h('button', { className: 'wq-del', key: 'del', title: '删除', onClick: function (e) { e.stopPropagation(); removeItem(g.id, it.id) } }, '×'),
              ])
            }))
            return h('div', { className: 'wq-group', key: g.id }, [head, rows])
          })

          var left = h('div', { className: 'wq-left', key: 'left' }, [
            h('div', { className: 'wq-watch-head', key: 'heading' }, [h('span', { key: 'title' }, '自选行情'), h('span', { key: 'count', className: 'wq-ncount' }, flat.length), h('span', { key: 'caption', className: 'wq-watch-caption' }, '最新价 / 涨跌幅')]),
            h('div', { className: 'wq-watch-search', key: 'search' }, h('input', { type: 'search', value: watchQuery, placeholder: '搜索名称 / 代码', 'aria-label': '搜索自选行情', onChange: function (e) { setWatchQuery(e.target.value) }, onKeyDown: function (e) { if (e.key === 'Escape') setWatchQuery('') } })),
            h('div', { className: 'wq-groups', key: 'gs' }, watchTerm && !watchMatches ? h('div', { className: 'wq-watch-empty' }, [h('p', { key: 'text' }, '没有匹配的自选品种'), h('button', { key: 'clear', className: 'wq-btn', onClick: function () { setWatchQuery('') } }, '清空搜索')]) : groupEls),
            h('div', { className: 'wq-watch-status' + (quoteError ? ' is-error' : ''), key: 'status', role: 'status' }, [h('span', { key: 'text' }, quoteError || (updating ? '正在更新行情…' : (lastTs ? '更新于 ' + timeLabel(lastTs) : '等待行情'))), quoteError ? h('button', { key: 'retry', className: 'wq-nact', disabled: updating, onClick: manualRefresh }, '重试') : null]),
          ])

          var right
          var sel = selectedId && byId[selectedId]
          if (layoutMode === 'news') {
            right = h('div', { className: 'wq-right', key: 'right' }, h('div', { className: 'wq-dwrap' }, h(NewsDock, { key: 'news', fullPage: true })))
          } else if (!sel) {
            right = h('div', { className: 'wq-right', key: 'right' }, h('div', { className: 'wq-dwrap' }, [h('div', { className: 'wq-placeholder', key: 'ph', style: { flex: '1 1 auto' } }, [h('div', { key: 'i', style: { fontSize: '30px' } }, '📊'), h('div', { key: 't' }, '从左侧选择一个品种查看 K 线')]), layoutMode === 'both' ? h(NewsDock, { key: 'news' }) : null]))
          } else {
            var q = quotes[selectedId]
            var base = upBaseFor(sel, settings)
            var pct = q ? q.changePct : null
            var dhead = h('div', { className: 'wq-dhead', key: 'dh' }, [
              h('div', { className: 'wq-dtitle', key: 'dt' }, [
                h('span', { className: 'wq-dname', key: 'n' }, (q && q.name) || sel.name),
                h('span', { className: 'wq-dcode', key: 'c' }, sel.code),
                h('span', { className: 'wq-chip', key: 'm', style: { color: MARKETS[sel.mkt].color, borderColor: MARKETS[sel.mkt].color } }, MARKETS[sel.mkt].label),
                q && q.source ? h('span', { className: 'wq-chip', key: 's' }, q.source) : null,
              ]),
              h('div', { className: 'wq-dprice-row', key: 'dp' }, [
                h('span', { className: 'wq-dprice', key: 'p', style: { color: chgColor(pct, base) } }, q && q.ok ? fmtNum(q.price, priceDigits(sel, q.price)) : '—'),
                h('span', { className: 'wq-dchg', key: 'ch', style: { color: chgColor(pct, base) } }, q && q.ok ? (fmtNum(q.change, priceDigits(sel, q.price)) + '  ' + fmtPct(pct)) : ''),
                h('span', { className: 'wq-dtime', key: 'tm' }, q && q.time ? String(q.time) : ''),
              ]),
              h('div', { className: 'wq-stats', key: 'st' }, [
                stat('开盘', q && q.open !== null && q.open !== undefined ? fmtNum(q.open, priceDigits(sel, q.open)) : '—'),
                stat('最高', q && q.high !== null && q.high !== undefined ? fmtNum(q.high, priceDigits(sel, q.high)) : '—'),
                stat('最低', q && q.low !== null && q.low !== undefined ? fmtNum(q.low, priceDigits(sel, q.low)) : '—'),
                stat('昨收', q && q.prevClose !== null && q.prevClose !== undefined ? fmtNum(q.prevClose, priceDigits(sel, q.prevClose)) : '—'),
                stat('成交量', q ? fmtVolume(q.volume) : '—'),
                stat('币种', q && q.cur ? q.cur : (sel.mkt === 'cnstock' || sel.mkt === 'futcn' ? 'CNY' : '—')),
              ]),
            ])
            var tabs = h('div', { className: 'wq-tabs', key: 'tb2' }, [['5m', '5分'], ['15m', '15分'], ['60m', '60分'], ['1d', '日K']].map(function (pair) {
              return h('button', { className: 'wq-tab' + (detailInterval === pair[0] ? ' is-on' : ''), key: pair[0], onClick: function () { setDetailInterval(pair[0]) } }, pair[1])
            }))
            var chartArea = h('div', { className: 'wq-chartwrap', key: 'cw' }, h(CandleChart, {
              candles: detail && detail.item && detail.item.id === sel.id ? detail.candles : [],
              loading: detail ? detail.loading : true,
              interval: detailInterval,
              item: sel,
              upColor: base,
            }))
            right = h('div', { className: 'wq-right', key: 'right' }, h('div', { className: 'wq-dwrap' }, [dhead, tabs, chartArea, layoutMode === 'both' ? h(NewsDock, { key: 'news' }) : null]))
          }

          var body = h('div', { className: 'wq-body', key: 'body' }, [hideWatchlist ? null : left, right])

          var overlays = []
          if (addOpen) overlays.push(h(AddDialog, {
            key: 'add', groups: state.groups, defaultGroupId: addTarget, defaultMkt: addTarget && state.groups.filter(function (g) { return g.id === addTarget })[0] && autoMktForGroup(addTarget) || 'futcn',
            onAdd: function (m, c, n, gid) { addItem(m, c, n, gid); setAddOpen(false) },
            onClose: function () { setAddOpen(false) },
          }))
          if (settingsOpen) overlays.push(h(SettingsDialog, { key: 'set', settings: settings, onSave: saveSettings, onClose: function () { setSettingsOpen(false) } }))

          return h('section', { className: 'wq-page' + (settings.density === 'compact' ? ' is-compact' : '') + (hideWatchlist ? ' is-focused' : ''), style: glassStyle, 'aria-label': t('page.title') }, [topbar, body].concat(overlays))
        }

        function stat(k, v) { return h('div', { className: 'wq-stat', key: k }, [h('span', { className: 'wq-stat-k', key: 'k' }, k), h('span', { className: 'wq-stat-v', key: 'v' }, v)]) }
        function autoMktForGroup(gid) {
          var map = { 'g-futcn': 'futcn', 'g-futgl': 'futgl', 'g-index': 'index', 'g-fx': 'fx', 'g-stock': 'cnstock' }
          return map[gid] || 'futcn'
        }
        Panel.displayName = 'QuoteWatchPanel'
        return Panel
      }

      // ------------------------------------------------------------------
      // floating pill (optional)
      // ------------------------------------------------------------------
      function openPanel(ctx) {
        try {
          var layout = ctx && typeof ctx.get === 'function' ? ctx.get('layout') : undefined
          if (layout && typeof layout.selectPanel === 'function') { layout.selectPanel(MODULE_ID); return }
        } catch (e) {}
        try { if (ctx && ctx.layout && typeof ctx.layout.selectPanel === 'function') ctx.layout.selectPanel(MODULE_ID) } catch (e) {}
      }

      function createPill(ctx, t) {
        function Pill() {
          var cs = React.useState(getSettings()), cfg = cs[0], setCfg = cs[1]
          var os = React.useState(false), open = os[0], setOpen = os[1]
          var qs = React.useState({}), quotes = qs[0], setQuotes = qs[1]
          var gs = React.useState([]), groups = gs[0], setGroups = gs[1]
          React.useEffect(function () { return subscribeSettings(function () { setCfg(Object.assign({}, getSettings())) }) }, [])
          React.useEffect(function () {
            if (!cfg.pillEnabled) return
            var alive = true
            function load() {
              post('api/dsh-tradingboat/state', { op: 'get' }).then(function (j) {
                if (!alive || !j || !j.ok || !j.value) return
                if (j.value.settings) setSettingsValue(j.value.settings)
                var sgs = j.value.groups || []
                setGroups(sgs)
                var items = sgs[0] ? sgs[0].items : []
                if (items.length === 0) { setQuotes({}); return }
                return post('api/dsh-tradingboat/quotes', { items: items.map(function (it) { return { id: it.id, mkt: it.mkt, code: it.code, name: it.name } }) }).then(function (jj) { if (alive && jj && jj.ok) setQuotes(jj.quotes || {}) })
              }).catch(function () {})
            }
            load()
            var tmr = setInterval(load, Math.max(5000, cfg.refreshMs || 5000))
            return function () { alive = false; clearInterval(tmr) }
          }, [cfg.pillEnabled, cfg.refreshMs])
          if (!cfg.pillEnabled) return null
          var g0 = groups[0]
          var items = g0 ? g0.items : []
          var up = 0, down = 0
          var settings = cfg
          items.forEach(function (it) { var q = quotes[it.id]; if (q && q.changePct !== null && q.changePct !== undefined && isFinite(q.changePct)) { if (q.changePct > 0) up++; else if (q.changePct < 0) down++ } })
          var card = null
          if (open) {
            card = h('div', { className: 'wq-pill-card', key: 'card' }, [
              h('div', { key: 'hd', style: { display: 'flex', alignItems: 'center', padding: '4px 8px', color: 'var(--dsw-alias-label-tertiary,#7c828c)' } }, [
                h('span', { key: 'n', style: { flex: 1, fontSize: '11px' } }, g0 ? g0.name : '行情'),
                h('button', { key: 'o', className: 'wq-addbtn', onClick: function () { openPanel(ctx) } }, '打开面板'),
              ]),
            ].concat(items.slice(0, 12).map(function (it) {
              var q = quotes[it.id]; var base = upBaseFor(it, settings); var pct = q ? q.changePct : null
              return h('div', { className: 'wq-pill-row', key: it.id }, [
                h('span', { className: 'wq-pill-name', key: 'n' }, (q && q.name) || it.name),
                h('span', { className: 'wq-pill-price', key: 'p', style: { color: chgColor(pct, base) } }, q && q.ok ? fmtNum(q.price, priceDigits(it, q.price)) : '—'),
                h('span', { className: 'wq-pill-pct', key: 'c', style: { color: chgColor(pct, base) } }, q && q.ok ? fmtPct(pct) : '—'),
              ])
            })))
          }
          var tab = h('div', { className: 'wq-pill-tab', key: 'tab', onClick: function () { setOpen(!open) } }, [
            h('span', { key: 'i' }, '📈'),
            h('span', { key: 't' }, '行情'),
            h('span', { key: 'u', className: 'wq-up' }, '↑' + up),
            h('span', { key: 'd', className: 'wq-down' }, '↓' + down),
          ])
          return h('div', { className: 'wq-pill' }, open ? [card, tab] : [tab])
        }
        Pill.displayName = 'QuoteWatchPill'
        return Pill
      }

      // ------------------------------------------------------------------
      // icon
      // ------------------------------------------------------------------
      function createIcon() {
        function Icon(props) {
          var size = props && typeof props.size === 'number' ? props.size : 16
          return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' }, [
            h('path', { key: 'ax', d: 'M4 20V4' }),
            h('path', { key: 'bx', d: 'M4 20h16' }),
            h('path', { key: 'l1', d: 'M7 15l3-4 3 2 4-6' }),
            h('circle', { key: 'c1', cx: 7, cy: 15, r: 1 }),
            h('circle', { key: 'c2', cx: 17, cy: 7, r: 1 }),
          ])
        }
        Icon.displayName = 'QuoteWatchNavIcon'
        return Icon
      }

      // ------------------------------------------------------------------
      // apply
      // ------------------------------------------------------------------
      function apply(ctx) {
        ctx.effect(function () { return ctx.locale.register(NS, { zh: ZH, en: EN }) }, 'dsh-tradingboat: dictionaries')
        var t = ctx.locale.bind(NS)
        injectStyles()

        var Panel = createPanel(ctx, t)
        var Icon = createIcon()
        var Pill = createPill(ctx, t)

        ctx.slots.inject('main', function () {
          return ctx.slots.register({ name: 'main', key: MODULE_ID, locale: NS }, function (props) { return h(Panel, props) })
        })
        ctx.slots.inject('sidebar.panellist', function () {
          return ctx.slots.register({ name: 'sidebar.panellist', id: MODULE_ID, order: 32, label: function () { return t('nav.title') }, locale: NS }, function (props) { return h(Icon, { size: props && typeof props.size === 'number' ? props.size : undefined }) })
        })
        try {
          ctx.slots.inject('shell.overlay', function () {
            return ctx.slots.register({ name: 'shell.overlay', id: MODULE_ID + '-pill' }, function () { return h(Pill) })
          })
        } catch (e) {}
      }

      module.exports = { name: MODULE_ID, inject: ['slots', 'locale'], apply: apply }
      return module.exports
    },
  })
})()
