/*
 * Life Checker — a drop-in prototype plugin for the Laerdal Life design system.
 *
 * Zero dependencies. Works in any prototype (React, Vue, plain HTML) — it is a
 * classic script that self-mounts a small "Built on Life" badge in the corner.
 * Click it to open the Life checker: a highlight toggle that visually outlines
 * live Life usage in the running UI, plus reference tabs.
 *
 * USAGE (any prototype):
 *   <script src="life-checker.js"></script>
 *
 * Optionally configure (before the script, OR any time after via the API):
 *   window.LifeCheckerConfig = { implemented: [...], missing: [...], components: [...] }
 *   // or
 *   window.LifeChecker.configure({ ... })
 *
 * The highlight feature and the universal component catalogue work out of the
 * box with no config. The "Implemented" and "Missing Life" tabs only appear
 * when you supply that (project-specific) data.
 *
 * SOURCE OF TRUTH: this file. Embedding prototypes should reference it, not
 * copy it, so they stay up to date.
 */
(function () {
  'use strict'
  if (typeof window === 'undefined') return
  if (window.LifeChecker && window.LifeChecker.__mounted) return // guard double-load

  // ---- Universal catalogue: components shipped in @laerdal/life-react-components ----
  var DEFAULT_COMPONENTS = [
    'Icons (SystemIcons)', 'Icons (ContentIcons)', 'Accordion', 'AuthPage', 'Banners',
    'Breadcrumb', 'Button', 'Card', 'Chips', 'ChipsInput', 'Dropdown', 'Footer',
    'GlobalNavigationBar', 'HyperLink', 'Image', 'InputFields', 'Layouts', 'LinearProgress',
    'List', 'LoadingIndicator', 'LoadingPage', 'MenuItem', 'MiniProductCard', 'Modals',
    'NavItem', 'Navigation', 'NotificationDot', 'Paginator', 'Panel', 'Popover',
    'ProfileButton', 'QuizButton', 'SegmentControl', 'SideMenu', 'SkipToContent',
    'Switcher', 'Table', 'Tabs', 'Tag', 'Tile', 'Toasters', 'Toggles', 'Tooltips',
  ]

  // Detection selectors. Defaults cover both styled-components-based Life usage
  // (class "sc-…") and Tailwind-class Life-token usage (bg-fill-*, etc.).
  var DEFAULTS = {
    badgeText: 'Built on Life',
    title: 'Life checker',
    subtitle: 'How much of the Laerdal Life design system this prototype uses',
    docsUrl: 'https://life.laerdal.com/',
    highlightDefault: false,
    componentSelector: '[class*="sc-"], [data-slot]',
    tokenSelector: '[style*="--life-"], [class*="bg-fill-"], [class*="bg-surface-"], [class*="text-default"], [class*="text-subtle"], [class*="border-default"], [class*="border-subtle"]',
    componentColor: '#0891B2',
    tokenColor: '#AF50AF',
    implemented: null, // [{group, items:[{name, detail, status:'done'|'partial'|'todo'}]}]
    missing: null,     // [{area, current, suggest}]
    components: null,  // [{name, used}] — overrides used-flags on the catalogue
  }

  var cfg = Object.assign({}, DEFAULTS, window.LifeCheckerConfig || {})
  var state = { open: false, tab: null, highlight: false }
  var els = {} // cached DOM refs

  // ---------------------------------------------------------------- helpers
  function h(tag, attrs, children) {
    var el = document.createElement(tag)
    attrs = attrs || {}
    Object.keys(attrs).forEach(function (k) {
      if (k === 'style') el.setAttribute('style', attrs[k])
      else if (k === 'html') el.innerHTML = attrs[k]
      else if (k.indexOf('on') === 0 && typeof attrs[k] === 'function') el[k.toLowerCase()] = attrs[k]
      else el.setAttribute(k, attrs[k])
    })
    ;(children || []).forEach(function (c) {
      if (c == null) return
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
    })
    return el
  }
  var SVG = {
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="#cbd2de" stroke-width="2" stroke-linecap="round"/></svg>',
    check: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="#3EC2A6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    ext: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><path d="M14 5h5v5M19 5l-8 8M10 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-4" stroke="#9aa3b2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  }

  // ---------------------------------------------------------------- highlight
  var HL_ID = '__life-checker-highlight__'
  function applyHighlight() {
    var prev = document.getElementById(HL_ID)
    if (prev) prev.remove()
    if (!state.highlight) return
    var s = document.createElement('style')
    s.id = HL_ID
    s.textContent =
      cfg.componentSelector + ':not([data-life-checker]):not([data-life-checker] *){' +
      'outline:2px solid ' + cfg.componentColor + ' !important;outline-offset:1px !important;}' +
      cfg.tokenSelector + ':not([data-life-checker]):not([data-life-checker] *){' +
      'outline:2px dashed ' + cfg.tokenColor + ' !important;outline-offset:1px !important;}'
    document.head.appendChild(s)
  }
  function setHighlight(on) {
    state.highlight = !!on
    applyHighlight()
    if (els.switch) {
      els.switch.setAttribute('aria-checked', String(state.highlight))
      els.switch.className = 'lc-switch' + (state.highlight ? ' lc-on' : '')
    }
  }

  // ---------------------------------------------------------------- styles
  function injectStyles() {
    if (document.getElementById('__life-checker-styles__')) return
    var css = [
      '.lc-badge{position:fixed;left:24px;bottom:24px;z-index:9000;display:inline-flex;align-items:center;gap:7px;padding:5px 10px;border-radius:999px;background:rgba(26,32,44,0.4);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,0.08);color:#fff;font-size:10px;font-weight:500;font-family:Lato,system-ui,sans-serif;letter-spacing:0.02em;cursor:pointer;opacity:0.45;transition:opacity .15s,background .15s}',
      '.lc-badge:hover{opacity:1;background:rgba(26,32,44,0.85)}',
      '.lc-backdrop{position:fixed;inset:0;background:rgba(10,14,22,0.5);display:flex;align-items:flex-end;justify-content:flex-start;padding:16px;z-index:9001}',
      '.lc-panel{width:100%;max-width:440px;max-height:82vh;display:flex;flex-direction:column;background:#1A2332;color:#e8ebf0;border-radius:16px;border:1px solid rgba(255,255,255,0.1);box-shadow:0 24px 70px rgba(0,0,0,0.45);overflow:hidden;font-family:Lato,system-ui,sans-serif}',
      '.lc-header{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.08)}',
      '.lc-title{font-size:16px;font-weight:700;color:#fff;line-height:1.2}',
      '.lc-sub{font-size:12px;color:#9aa3b2;margin-top:3px;line-height:1.4}',
      '.lc-x{width:32px;height:32px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:none;background:transparent;border-radius:8px;cursor:pointer}',
      '.lc-x:hover{background:rgba(255,255,255,0.08)}',
      '.lc-hl{display:flex;align-items:center;gap:12px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08)}',
      '.lc-switch{flex-shrink:0;width:38px;height:22px;border-radius:99px;border:none;padding:2px;cursor:pointer;background:rgba(255,255,255,0.18);transition:background .15s;display:flex;align-items:center}',
      '.lc-switch.lc-on{background:#3EC2A6}',
      '.lc-knob{width:18px;height:18px;border-radius:50%;background:#fff;transition:transform .15s;transform:translateX(0)}',
      '.lc-switch.lc-on .lc-knob{transform:translateX(16px)}',
      '.lc-hl-label{font-size:13px;font-weight:600;color:#e8ebf0}',
      '.lc-legend{display:flex;gap:14px;margin-top:4px}',
      '.lc-leg{display:inline-flex;align-items:center;gap:5px;font-size:11px;color:#9aa3b2}',
      '.lc-sw-c{width:14px;height:10px;border-radius:2px;border:2px solid ' + cfg.componentColor + '}',
      '.lc-sw-t{width:14px;height:10px;border-radius:2px;border:2px dashed ' + cfg.tokenColor + '}',
      '.lc-tabs{display:flex;gap:4px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,0.08)}',
      '.lc-tab{flex:1;padding:8px 12px;border:none;border-radius:8px;background:transparent;color:#9aa3b2;font-size:12.5px;font-weight:600;font-family:inherit;cursor:pointer;transition:background .12s,color .12s}',
      '.lc-tab.lc-active{background:rgba(255,255,255,0.08);color:#fff}',
      '.lc-prog{display:flex;align-items:center;gap:10px;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,0.08)}',
      '.lc-count{font-size:18px;font-weight:800;color:#fff}',
      '.lc-plabel{font-size:12px;color:#9aa3b2}',
      '.lc-track{flex:1;height:6px;border-radius:99px;background:rgba(255,255,255,0.1);overflow:hidden}',
      '.lc-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#3EC2A6,#2E7FA1)}',
      '.lc-body{overflow-y:auto;padding:6px 20px 16px}',
      '.lc-sec{margin-top:16px}',
      '.lc-sectitle{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#6f7889;margin-bottom:8px}',
      '.lc-item{padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05)}',
      '.lc-item-main{display:flex;align-items:center;justify-content:space-between;gap:10px}',
      '.lc-item-name{font-size:13.5px;font-weight:600;color:#e8ebf0}',
      '.lc-item-detail{font-size:12px;color:#8a93a6;line-height:1.45;margin-top:3px}',
      '.lc-tag{flex-shrink:0;font-size:10.5px;font-weight:700;padding:2px 8px;border-radius:99px;text-transform:uppercase;letter-spacing:0.03em}',
      '.lc-tag-done{color:#3EC2A6;background:rgba(62,194,166,0.14);display:inline-flex;align-items:center;padding:3px 6px}',
      '.lc-tag-partial{color:#E6B860;background:rgba(230,184,96,0.16)}',
      '.lc-tag-todo{color:#8A93A6;background:rgba(138,147,166,0.16)}',
      '.lc-suggest{flex-shrink:0;font-size:11px;font-weight:700;color:#7CC4E0;background:rgba(46,127,161,0.18);padding:2px 8px;border-radius:99px;white-space:nowrap}',
      '.lc-grid{display:grid;grid-template-columns:1fr 1fr;column-gap:14px;row-gap:2px;margin-top:12px}',
      '.lc-crow{display:flex;align-items:center;gap:8px;padding:6px 0}',
      '.lc-cslot{width:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center}',
      '.lc-cname{font-size:13px;color:#e8ebf0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.lc-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-top:1px solid rgba(255,255,255,0.08);flex-wrap:wrap}',
      '.lc-link{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;color:#cbd2de;text-decoration:none;font-weight:600}',
      '.lc-note{font-size:11px;color:#6f7889}',
    ].join('')
    var style = h('style', { id: '__life-checker-styles__' })
    style.textContent = css
    document.head.appendChild(style)
  }

  // ---------------------------------------------------------------- modal content
  function availableTabs() {
    var tabs = []
    if (cfg.implemented && cfg.implemented.length) tabs.push({ id: 'implemented', label: 'Implemented' })
    if (cfg.missing && cfg.missing.length) tabs.push({ id: 'missing', label: 'Missing Life' })
    tabs.push({ id: 'all', label: 'All components' })
    return tabs
  }

  function renderTabContent() {
    var wrap = h('div')
    if (state.tab === 'implemented' && cfg.implemented) {
      var items = cfg.implemented.reduce(function (a, s) { return a.concat(s.items) }, [])
      var done = items.filter(function (i) { return i.status === 'done' }).length
      wrap.appendChild(progress(done, items.length, 'areas fully on Life'))
      var body = h('div', { class: 'lc-body' })
      cfg.implemented.forEach(function (sec) {
        var s = h('div', { class: 'lc-sec' }, [h('div', { class: 'lc-sectitle' }, [sec.group])])
        sec.items.forEach(function (it) { s.appendChild(implItem(it)) })
        body.appendChild(s)
      })
      wrap.appendChild(body)
    } else if (state.tab === 'missing' && cfg.missing) {
      wrap.appendChild(progress(cfg.missing.length, null, 'areas to migrate to Life'))
      var b2 = h('div', { class: 'lc-body' })
      cfg.missing.forEach(function (m) {
        b2.appendChild(h('div', { class: 'lc-item' }, [
          h('div', { class: 'lc-item-main' }, [
            h('span', { class: 'lc-item-name' }, [m.area]),
            h('span', { class: 'lc-suggest' }, ['→ ' + m.suggest]),
          ]),
          h('div', { class: 'lc-item-detail' }, [m.current]),
        ]))
      })
      wrap.appendChild(b2)
    } else {
      var comps = catalogue()
      var used = comps.filter(function (c) { return c.used }).length
      wrap.appendChild(progress(used, comps.length, 'components in use'))
      var b3 = h('div', { class: 'lc-body' })
      var grid = h('div', { class: 'lc-grid' })
      comps.forEach(function (c) {
        var row = h('div', { class: 'lc-crow', style: 'opacity:' + (c.used ? 1 : 0.55) }, [
          h('span', { class: 'lc-cslot', html: c.used ? SVG.check : '' }),
          h('span', { class: 'lc-cname' }, [c.name]),
        ])
        grid.appendChild(row)
      })
      b3.appendChild(grid)
      wrap.appendChild(b3)
    }
    return wrap
  }
  function catalogue() {
    var override = {}
    ;(cfg.components || []).forEach(function (c) { override[c.name] = !!c.used })
    return DEFAULT_COMPONENTS.map(function (name) { return { name: name, used: !!override[name] } })
  }
  function progress(n, total, label) {
    var children = [
      h('span', { class: 'lc-count' }, [total == null ? String(n) : n + '/' + total]),
      h('span', { class: 'lc-plabel' }, [label]),
    ]
    if (total != null) {
      children.push(h('div', { class: 'lc-track' }, [
        h('div', { class: 'lc-fill', style: 'width:' + (total ? (n / total) * 100 : 0) + '%' }),
      ]))
    }
    return h('div', { class: 'lc-prog' }, children)
  }
  function implItem(it) {
    var tag
    if (it.status === 'done') tag = h('span', { class: 'lc-tag lc-tag-done', html: SVG.check })
    else if (it.status === 'partial') tag = h('span', { class: 'lc-tag lc-tag-partial' }, ['Partial'])
    else tag = h('span', { class: 'lc-tag lc-tag-todo' }, ['Planned'])
    return h('div', { class: 'lc-item' }, [
      h('div', { class: 'lc-item-main' }, [h('span', { class: 'lc-item-name' }, [it.name]), tag]),
      h('div', { class: 'lc-item-detail' }, [it.detail || '']),
    ])
  }

  // ---------------------------------------------------------------- modal shell
  function renderModal() {
    if (els.backdrop) els.backdrop.remove()
    if (!state.open) return
    var tabs = availableTabs()
    if (!state.tab || !tabs.some(function (t) { return t.id === state.tab })) state.tab = tabs[0].id

    var tabBar = h('div', { class: 'lc-tabs' })
    tabs.forEach(function (t) {
      tabBar.appendChild(h('button', {
        class: 'lc-tab' + (state.tab === t.id ? ' lc-active' : ''), type: 'button',
        onclick: function () { state.tab = t.id; renderModal() },
      }, [t.label]))
    })

    els.switch = h('button', {
      class: 'lc-switch' + (state.highlight ? ' lc-on' : ''), type: 'button', role: 'switch',
      'aria-checked': String(state.highlight), onclick: function () { setHighlight(!state.highlight) },
    }, [h('span', { class: 'lc-knob' })])

    var panel = h('div', { class: 'lc-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': cfg.title,
      onclick: function (e) { e.stopPropagation() } }, [
      h('div', { class: 'lc-header' }, [
        h('div', {}, [h('div', { class: 'lc-title' }, [cfg.title]), h('div', { class: 'lc-sub' }, [cfg.subtitle])]),
        h('button', { class: 'lc-x', type: 'button', 'aria-label': 'Close', html: SVG.close, onclick: close }),
      ]),
      h('div', { class: 'lc-hl' }, [
        els.switch,
        h('div', {}, [
          h('div', { class: 'lc-hl-label' }, ['Highlight Life elements in the app']),
          h('div', { class: 'lc-legend' }, [
            h('span', { class: 'lc-leg' }, [h('span', { class: 'lc-sw-c' }), 'Components']),
            h('span', { class: 'lc-leg' }, [h('span', { class: 'lc-sw-t' }), 'Design tokens']),
          ]),
        ]),
      ]),
      tabBar,
      renderTabContent(),
      h('div', { class: 'lc-footer' }, [
        h('a', { class: 'lc-link', href: cfg.docsUrl, target: '_blank', rel: 'noopener noreferrer',
          html: 'Open the Life design system ' + SVG.ext }),
        h('span', { class: 'lc-note' }, ['Life checker · prototype plugin']),
      ]),
    ])

    els.backdrop = h('div', { class: 'lc-backdrop', 'data-life-checker': '', role: 'presentation', onclick: close }, [panel])
    document.body.appendChild(els.backdrop)
  }

  function open() { state.open = true; renderModal() }
  function close() { state.open = false; if (els.backdrop) { els.backdrop.remove(); els.backdrop = null } }

  // ---------------------------------------------------------------- mount
  function mount() {
    if (els.badge) return
    injectStyles()
    els.badge = h('button', { class: 'lc-badge', type: 'button', 'data-life-checker': '',
      'aria-label': cfg.title, title: cfg.title, onclick: open }, [
      h('span', {}, [cfg.badgeText]),
    ])
    document.body.appendChild(els.badge)
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close() })
    if (cfg.highlightDefault) setHighlight(true)
    window.LifeChecker.__mounted = true
  }

  function configure(next) {
    cfg = Object.assign(cfg, next || {})
    if (els.badge) {
      els.badge.setAttribute('title', cfg.title)
      els.badge.setAttribute('aria-label', cfg.title)
      els.badge.firstChild.textContent = cfg.badgeText
    }
    applyHighlight()
    if (state.open) renderModal()
  }

  // ---------------------------------------------------------------- public API
  window.LifeChecker = {
    __mounted: false,
    mount: mount,
    configure: configure,
    open: open,
    close: close,
    setHighlight: setHighlight,
    destroy: function () {
      close()
      if (els.badge) { els.badge.remove(); els.badge = null }
      var hl = document.getElementById(HL_ID); if (hl) hl.remove()
      window.LifeChecker.__mounted = false
    },
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }
})()
