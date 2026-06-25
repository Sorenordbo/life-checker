/*
 * Life Checker — a drop-in prototype plugin for the Laerdal Life design system.
 *
 * REACT ONLY. The Laerdal Life component library ships React components only, so
 * "Build with Life" only works in a React project (Vite + React, Next.js, CRA).
 * The script itself is zero-dependency vanilla JS that self-mounts a "Build with
 * Life" badge in the corner — click it to open the Life checker: a highlight toggle
 * that visually outlines live Life usage in the running UI, plus reference tabs.
 *
 * USAGE (in a React prototype):
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

  // Maps a Life component's data-slot name (the v1.4+ Tailwind library tags every
  // element it renders with data-slot="button", "card", …) to its catalogue entry.
  // We key on the FIRST segment of the slot, so sub-parts like "card-header" or
  // "dropdown-trigger" still count toward their parent component.
  var SLOT_ALIASES = {
    banner: 'Banners', progress: 'LinearProgress', segmented: 'SegmentControl',
    tooltip: 'Tooltips', toggle: 'Toggles', modal: 'Modals', dialog: 'Modals',
    input: 'InputFields', chip: 'Chips', loader: 'LoadingIndicator',
    hyperlink: 'HyperLink', toast: 'Toasters',
  }

  // Detection selectors. Defaults cover both styled-components-based Life usage
  // (class "sc-…") and Tailwind-class Life-token usage (bg-fill-*, etc.).
  var DEFAULTS = {
    badgeText: 'Build with Life',
    title: 'Life checker',
    subtitle: 'How much of the Laerdal Life design system this prototype uses',
    docsUrl: 'https://life.laerdal.com/',
    highlightDefault: false,
    componentSelector: '[class*="sc-"], [data-slot]',
    tokenSelector: '[style*="--life-"], [class*="bg-fill-"], [class*="bg-surface-"], [class*="text-default"], [class*="text-subtle"], [class*="border-default"], [class*="border-subtle"]',
    // Life tokens (with standalone fallbacks). Components highlight with a solid
    // dark-green box; design tokens with a light-green dashed box.
    componentColor: 'var(--life-color-positive-600, #046e23)',
    tokenColor: 'var(--life-color-positive-300, #77c589)',
    implemented: null, // [{group, items:[{name, detail, status:'done'|'partial'|'todo'}]}]
    missing: null,     // [{area, current, suggest}]
    components: null,  // [{name, used}] — overrides used-flags on the catalogue
  }

  var cfg = Object.assign({}, DEFAULTS, window.LifeCheckerConfig || {})
  // highlight: 'off' | 'life' | 'gaps'
  var state = { open: false, tab: 'main', highlight: 'off', detected: {}, liveVersion: null, liveComponents: null }
  var els = {} // cached DOM refs
  var CATALOG_CACHE_KEY = '__lc_catalog__'
  var CATALOG_CACHE_TTL = 3600000 // 1 hour

  // Normalised lookup of catalogue names, so a detected slot can match an entry
  // regardless of plural/casing/parenthetical (e.g. "Icons (SystemIcons)" -> "icons").
  var CAT_LOOKUP = {}
  function norm(s) { return String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z]/g, '') }
  DEFAULT_COMPONENTS.forEach(function (n) { CAT_LOOKUP[norm(n)] = n })

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
  // Life System icons from @laerdal-medical/skills-react-life-icons — inlined for
  // this zero-dependency script. All use fill="currentColor" (the Life pattern) so
  // color is controlled via CSS `color` on the parent, not hardcoded here.
  var SVG = {
    close: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.3 5.71003C17.91 5.32003 17.28 5.32003 16.89 5.71003L12 10.59L7.10997 5.70003C6.71997 5.31003 6.08997 5.31003 5.69997 5.70003C5.30997 6.09003 5.30997 6.72003 5.69997 7.11003L10.59 12L5.69997 16.89C5.30997 17.28 5.30997 17.91 5.69997 18.3C6.08997 18.69 6.71997 18.69 7.10997 18.3L12 13.41L16.89 18.3C17.28 18.69 17.91 18.69 18.3 18.3C18.69 17.91 18.69 17.28 18.3 16.89L13.41 12L18.3 7.11003C18.68 6.73003 18.68 6.09003 18.3 5.71003Z"/></svg>',
    check: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.05629 16.17L5.58629 12.7C5.19629 12.31 4.56629 12.31 4.17629 12.7C3.78629 13.09 3.78629 13.72 4.17629 14.11L8.35629 18.29C8.74629 18.68 9.37629 18.68 9.76629 18.29L20.3463 7.71001C20.7363 7.32001 20.7363 6.69001 20.3463 6.30001C19.9563 5.91001 19.3263 5.91001 18.9363 6.30001L9.05629 16.17Z"/></svg>',
    ext: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:middle" aria-hidden="true"><path d="M20 10C19.4477 10 19 9.5523 19 9.00001V6.41441L12.7717 12.6428C12.3553 13.0591 11.7011 13.0801 11.3106 12.6896C10.9201 12.299 10.9411 11.6449 11.3574 11.2285L17.586 5.00001L15 5.00001C14.4477 5.00001 14 4.5523 14 4.00001C14 3.44773 14.4477 3.00001 15 3.00001L19.9953 3.00001L20 3C20.2527 3 20.4835 3.09373 20.6596 3.24833C20.6759 3.26254 20.6918 3.27739 20.7073 3.2929C20.7235 3.30911 20.739 3.32577 20.7538 3.34285C20.9071 3.51859 21 3.74845 21 4V9.00001C21 9.5523 20.5523 10 20 10Z"/><path d="M5 6.00001C5 5.44773 5.44772 5.00001 6 5.00001H10C10.5523 5.00001 11 4.5523 11 4.00001C11 3.44773 10.5523 3.00001 10 3.00001H6C4.34315 3.00001 3 4.34316 3 6.00001V18C3 19.6569 4.34315 21 6 21H18C19.6569 21 21 19.6569 21 18V14C21 13.4477 20.5523 13 20 13C19.4477 13 19 13.4477 19 14V18C19 18.5523 18.5523 19 18 19H6C5.44772 19 5 18.5523 5 18V6.00001Z"/></svg>',
    heart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.9114 4.70052C9.64401 2.43316 5.96789 2.43316 3.70052 4.70052C1.43316 6.96789 1.43316 10.644 3.70052 12.9114L11.2647 20.4756C11.6553 20.8661 12.2884 20.8661 12.679 20.4756C13.0695 20.0851 13.0695 19.4519 12.679 19.0614L5.11474 11.4972C3.62842 10.0108 3.62842 7.60105 5.11474 6.11474C6.60105 4.62842 9.01084 4.62842 10.4972 6.11474L11.2647 6.88232C11.4691 7.08669 11.7399 7.1841 12.0076 7.17458C12.2753 7.1841 12.5462 7.08669 12.7505 6.88232L13.5181 6.11474C15.0044 4.62842 17.4142 4.62842 18.9005 6.11474C20.0319 7.24608 20.3021 8.91248 19.7111 10.2994C19.0571 11.8342 20.9143 12.5092 21.5094 11.1801C22.465 9.04574 22.0668 6.45255 20.3147 4.70052C18.0474 2.43316 14.3713 2.43316 12.1039 4.70052L12.0076 4.79678L11.9114 4.70052Z"/><path d="M16.508 9.56401C16.8144 9.10448 16.6902 8.48361 16.2307 8.17726C15.7712 7.87091 15.1503 7.99508 14.8439 8.45461L12.1773 12.4546C11.9727 12.7615 11.9536 13.156 12.1276 13.4812C12.3017 13.8063 12.6405 14.0093 13.0093 14.0093H15.1408L13.5106 16.4546C13.2042 16.9141 13.3284 17.535 13.7879 17.8414C14.2475 18.1477 14.8683 18.0235 15.1747 17.564L17.8414 13.564C18.0459 13.2572 18.065 12.8626 17.891 12.5375C17.717 12.2123 17.3781 12.0093 17.0093 12.0093H14.8778L16.508 9.56401Z"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.5034 11.1417C21.1655 11.5283 21.1655 12.4789 20.5034 12.8656L8.51815 19.864C7.84659 20.2561 7 19.7755 7 19.0021V5.00518C7 4.23176 7.8466 3.75111 8.51815 4.14325L20.5034 11.1417Z"/></svg>',
    dotOff: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11H7v-2h10v2z"/></svg>',
    dotGaps: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>',
    copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm3 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
    idea: '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/></svg>',
  }

  // Life CSS sets --life-color-primary-500 on :root; if absent the packages aren't wired up.
  function isLifeInstalled() {
    var val = getComputedStyle(document.documentElement).getPropertyValue('--life-color-primary-500')
    return val.trim().length > 0
  }

  // ---------------------------------------------------------------- highlight
  var HL_ID = '__life-checker-highlight__'
  var LABEL_ATTR = 'data-life-label'
  var GAP_ATTR = 'data-life-gap'

  function clearLabels() {
    var labeled = document.querySelectorAll('[' + LABEL_ATTR + ']')
    for (var i = 0; i < labeled.length; i++) labeled[i].removeAttribute(LABEL_ATTR)
  }
  function clearGaps() {
    var gaps = document.querySelectorAll('[' + GAP_ATTR + ']')
    for (var i = 0; i < gaps.length; i++) gaps[i].removeAttribute(GAP_ATTR)
  }

  // Returns visible UI elements that are NOT using Life components or tokens.
  // Ancestor-deduped so we only mark the outermost non-Life container.
  function findGapElements() {
    var all = document.querySelectorAll('*')
    var SKIP_TAGS = { html:1,body:1,head:1,script:1,style:1,link:1,meta:1,noscript:1,svg:1,path:1,g:1,defs:1,title:1 }
    // Only elements that COULD be a Life component.
    // Interactive elements (button, a, input…) are always candidates.
    // span/div are included only when they have an explicit background — the
    // reliable signal that something is styled like a component (tag, chip,
    // avatar, card) rather than being structural/layout. background-color
    // defaults to transparent and doesn't inherit, so getComputedStyle is safe.
    var COMPONENT_TAGS = { button:1,a:1,input:1,select:1,textarea:1 }
    var COMPONENT_ROLES = { button:1,link:1,progressbar:1,dialog:1,checkbox:1,radio:1,switch:1,tab:1,tablist:1 }
    var raw = []
    for (var i = 0; i < all.length; i++) {
      var el = all[i]
      if (el.closest('[data-life-checker]')) continue
      var tag = el.tagName.toLowerCase()
      if (SKIP_TAGS[tag]) continue
      var role = el.getAttribute && el.getAttribute('role')
      var isInteractive = COMPONENT_TAGS[tag] || (role && COMPONENT_ROLES[role])
      if (!isInteractive) {
        if (tag !== 'span' && tag !== 'div') continue
        var hasClass = el.className && typeof el.className === 'string' && el.className.trim()
        if (!hasClass) continue
        var cs = window.getComputedStyle(el)
        var hasBg = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') ||
                    (cs.backgroundImage && cs.backgroundImage !== 'none')
        if (!hasBg) continue
      }
      if (el.matches(cfg.componentSelector)) continue
      raw.push(el)
    }
    // Keep only outermost — skip any element whose ancestor is already in the list
    var result = []
    for (var i = 0; i < raw.length; i++) {
      var dominated = false
      for (var j = 0; j < raw.length; j++) {
        if (i !== j && raw[j] !== raw[i] && raw[j].contains(raw[i])) { dominated = true; break }
      }
      if (!dominated) result.push(raw[i])
    }
    return result
  }

  function applyHighlight() {
    var prev = document.getElementById(HL_ID)
    if (prev) prev.remove()
    clearLabels()
    clearGaps()
    if (state.highlight === 'off') return

    if (state.highlight === 'life') {
      // Tag each named Life component with its name for the label pill
      var nodes = document.querySelectorAll(cfg.componentSelector)
      for (var i = 0; i < nodes.length; i++) {
        var el = nodes[i]
        if (el.hasAttribute('data-life-checker') || el.closest('[data-life-checker]')) continue
        var name = componentName(el)
        if (!name) continue
        var dup = false, p = el.parentElement
        while (p) { if (p.getAttribute && p.getAttribute(LABEL_ATTR) === name) { dup = true; break } p = p.parentElement }
        if (!dup) el.setAttribute(LABEL_ATTR, name)
      }
      var s = document.createElement('style')
      s.id = HL_ID
      s.textContent =
        cfg.componentSelector + ':not([data-life-checker]):not([data-life-checker] *){' +
        'outline:2px solid ' + cfg.componentColor + ' !important;outline-offset:1px !important;}' +
        cfg.tokenSelector + ':not([data-life-checker]):not([data-life-checker] *){' +
        'outline:2px dashed ' + cfg.tokenColor + ' !important;outline-offset:1px !important;}' +
        '[' + LABEL_ATTR + ']{position:relative}' +
        '[' + LABEL_ATTR + ']::after{content:attr(' + LABEL_ATTR + ');position:absolute;top:0;left:0;' +
          'transform:translateY(-100%);background:' + cfg.componentColor + ';color:var(--life-color-base-white,#fff);' +
          'font:700 10px/1.45 ' + FONT + ';padding:2px 8px;border-radius:4px 4px 0 0;white-space:nowrap;' +
          'pointer-events:none;z-index:2147483647;letter-spacing:.02em}'
      document.head.appendChild(s)
    } else if (state.highlight === 'gaps') {
      var gapEls = findGapElements()
      for (var i = 0; i < gapEls.length; i++) gapEls[i].setAttribute(GAP_ATTR, '')
      var s = document.createElement('style')
      s.id = HL_ID
      s.textContent =
        '[' + GAP_ATTR + ']{' +
        'outline:2px dashed var(--life-color-warning-400,#e8970a) !important;' +
        'outline-offset:2px !important;' +
        'box-shadow:inset 0 0 0 9999px rgba(232,151,10,0.09) !important}'
      document.head.appendChild(s)
    }
  }

  function setHighlight(val) {
    if (val === true) val = 'life'
    if (val === false) val = 'off'
    if (val !== 'off' && val !== 'life' && val !== 'gaps') val = 'off'
    state.highlight = val
    applyHighlight()
    updateBadgeDots()
    if (state.open) renderModal()
  }

  // ---------------------------------------------------------------- styles
  // The Life typeface: Lato primary, Noto Sans fallback for non-Latin scripts.
  var FONT = "'Lato','Noto Sans',sans-serif"
  // Load Lato + Noto Sans so the checker renders in the Life typeface even on host
  // pages / standalone prototypes that don't already include them. Idempotent.
  function ensureFont() {
    if (document.getElementById('__life-checker-font__')) return
    var pre = document.createElement('link')
    pre.rel = 'preconnect'
    pre.href = 'https://fonts.gstatic.com'
    pre.crossOrigin = 'anonymous'
    document.head.appendChild(pre)
    var link = document.createElement('link')
    link.id = '__life-checker-font__'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&family=Noto+Sans:wght@400;700&display=swap'
    document.head.appendChild(link)
  }

  function injectStyles() {
    ensureFont()
    if (document.getElementById('__life-checker-styles__')) return
    // The checker panel is a fixed dark-mode overlay — it must look the same
    // regardless of whether the host prototype has Life CSS loaded (Life's tokens
    // are defined for light-mode use, so letting them inherit would break the panel).
    // Highlight overlay CSS (applyHighlight) still uses Life vars where appropriate
    // since those style host-app elements, not the checker panel itself.
    var T = {
      surface:      '#0f2934',
      surfaceRaised:'#163746',
      scrim:        'rgba(26,26,26,.5)',
      scrimSoft:    'rgba(26,26,26,.3)',
      hairline:     'rgba(255,255,255,.2)',
      white:        '#ffffff',
      text:         '#e5e5e5',
      textSubtle:   '#ababab',
      textFaint:    '#949494',
      link:         '#cccccc',
      primary:      '#2e7fa1',
    }
    // Spacing/sizes follow the Life 8px grid (4 and 2 allowed); type uses the Life
    // component sizes (10/12/14/16/18) and Lato weights (400/700). The panel is a
    // FIXED size — 2× tall as wide — so switching tabs never resizes it; only the
    // body list scrolls. It shrinks to fit short viewports (then the body scrolls).
    var focus = 'outline:2px solid ' + T.primary + ';outline-offset:2px'
    var css = [
      '.lc-badge{position:fixed;left:24px;bottom:24px;z-index:2147483646;display:inline-flex;align-items:center;gap:2px;padding:5px 6px 5px 10px;border-radius:999px;background:' + T.scrim + ';-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid ' + T.hairline + ';font-family:' + FONT + ';opacity:0.45;transition:opacity .15s}',
      '.lc-badge:hover{opacity:1}',
      '.lc-badge-label{background:transparent;border:none;color:' + T.white + ';font-size:10px;font-weight:700;font-family:inherit;letter-spacing:0.02em;cursor:pointer;padding:0 6px 0 0;white-space:nowrap}',
      '.lc-badge-label:focus-visible{' + focus + '}',
      '.lc-badge-sep{width:1px;height:14px;background:' + T.hairline + ';margin:0 2px;flex-shrink:0}',
      '.lc-bdot{width:22px;height:22px;border-radius:50%;border:none;background:transparent;color:' + T.textSubtle + ';display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;flex-shrink:0;transition:background .12s,color .12s}',
      '.lc-bdot:hover{background:rgba(255,255,255,0.12);color:' + T.white + '}',
      '.lc-bdot-off.lc-active{background:#636363;color:' + T.white + '}',
      '.lc-bdot-life.lc-active{background:#046e23;color:' + T.white + '}',
      '.lc-bdot-gaps.lc-active{background:#d17b00;color:' + T.white + '}',
      '.lc-bdot:focus-visible{' + focus + '}',
      '.lc-backdrop{position:fixed;inset:0;background:' + T.scrim + ';display:flex;align-items:flex-end;justify-content:flex-start;padding:16px;z-index:2147483647}',
      '.lc-panel{width:520px;height:896px;max-width:calc(100vw - 32px);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:' + T.surface + ';color:' + T.text + ';border-radius:16px;border:1px solid ' + T.hairline + ';box-shadow:0 16px 48px rgba(0,0,0,0.15);overflow:hidden;font-family:' + FONT + '}',
      '.lc-header{flex:0 0 auto;display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:20px 20px 16px}',
      '.lc-eyebrow{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:' + T.textFaint + ';margin-bottom:6px}',
      '.lc-title{font-size:20px;font-weight:700;color:' + T.white + ';line-height:1.2}',
      '.lc-sub{font-size:12px;color:' + T.textSubtle + ';margin-top:6px;line-height:1.5}',
      '.lc-x{width:40px;height:40px;flex-shrink:0;display:flex;align-items:center;justify-content:center;border:none;background:transparent;border-radius:50%;cursor:pointer;padding:0;transition:background .12s;color:#ababab}',
      '.lc-x:hover{background:rgba(255,255,255,0.1)}',
      '.lc-x:active{background:rgba(255,255,255,0.16)}',
      '.lc-x:focus-visible{' + focus + '}',
      // Highlight 3-segment control
      '.lc-hl{flex:0 0 auto;padding:12px 20px 16px}',
      '.lc-hl-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:' + T.textFaint + ';margin-bottom:8px}',
      '.lc-hsegs{display:flex;gap:4px;padding:4px;border-radius:12px;background:rgba(26,26,26,.3)}',
      '.lc-hseg{flex:1;display:inline-flex;align-items:center;justify-content:center;padding:6px 4px;border:none;border-radius:8px;background:transparent;color:' + T.textSubtle + ';font-size:12px;font-weight:700;font-family:inherit;cursor:pointer;transition:background .12s,color .12s;white-space:nowrap}',
      '.lc-hseg:not(.lc-active):hover{background:' + T.hairline + ';color:' + T.text + '}',
      '.lc-hseg.lc-hoff{background:#636363;color:' + T.white + '}',
      '.lc-hseg.lc-hlife{background:' + T.primary + ';color:' + T.white + '}',
      '.lc-hseg.lc-hgaps{background:#d17b00;color:' + T.white + '}',
      '.lc-hseg:focus-visible{' + focus + '}',
      '.lc-legend{display:flex;flex-direction:column;gap:6px;margin-top:10px}',
      '.lc-legend-hint{font-size:11px;color:' + T.textFaint + ';line-height:1.4}',
      '.lc-legend-swatches{display:flex;gap:20px}',
      '.lc-leg{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:' + T.textSubtle + '}',
      '.lc-sw-c{width:16px;height:12px;border-radius:2px;border:2px solid ' + cfg.componentColor + '}',
      '.lc-sw-t{width:16px;height:12px;border-radius:2px;border:2px dashed ' + cfg.tokenColor + '}',
      '.lc-sw-g{width:16px;height:12px;border-radius:2px;border:2px dashed #e8970a;background:rgba(232,151,10,0.15)}',
      '.lc-install{margin:16px 20px 8px;padding:16px;border-radius:8px;background:' + T.surfaceRaised + ';border:1px solid #a9d3e5}',
      '.lc-install-title{font-size:13px;font-weight:700;color:' + T.white + ';margin-bottom:6px}',
      '.lc-install-desc{font-size:12px;color:' + T.textSubtle + ';line-height:1.6;margin-bottom:12px}',
      '.lc-install-cmd{font-family:monospace;font-size:11px;background:rgba(26,26,26,.3);color:' + T.link + ';padding:8px 10px;border-radius:6px;margin-bottom:10px;word-break:break-all;user-select:all;line-height:1.5}',
      '.lc-install-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}',
      '.lc-install-npm{font-size:12px;font-weight:700;color:' + T.textSubtle + ';text-decoration:none;display:inline-flex;align-items:center;gap:4px;margin-left:auto;border-radius:4px}',
      '.lc-install-npm:hover{color:' + T.white + '}',
      '.lc-content{flex:1;min-height:0;display:flex;flex-direction:column}',
      '.lc-prog{flex:0 0 auto;display:flex;align-items:center;gap:12px;padding:16px 20px}',
      '.lc-count{font-size:18px;font-weight:700;color:' + T.white + '}',
      '.lc-plabel{font-size:12px;color:' + T.textSubtle + '}',
      '.lc-track{flex:1;height:6px;border-radius:999px;background:rgba(255,255,255,0.15);overflow:hidden;position:relative}',
      '.lc-fill{height:100%;width:100%;border-radius:999px;background:#25837e;transition:transform .3s ease}',
      '.lc-pdot{position:absolute;top:50%;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,0.45);transform:translateY(-50%);pointer-events:none}',
      '.lc-sep-line{height:1px;background:rgba(255,255,255,.1);margin:0 20px;flex-shrink:0}',
      '.lc-body{flex:1;min-height:0;overflow-y:auto;padding:8px 20px 24px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}',
      '.lc-body::-webkit-scrollbar{width:6px}',
      '.lc-body::-webkit-scrollbar-track{background:transparent}',
      '.lc-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:999px}',
      '.lc-body::-webkit-scrollbar-thumb:hover{background:#949494}',
      '.lc-sec{margin-top:36px}',
      '.lc-sec:first-child{margin-top:8px}',
      '.lc-sectitle{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:' + T.textFaint + ';margin-bottom:12px}',
      '.lc-item{padding:12px 0;border-bottom:1px solid ' + T.hairline + '}',
      '.lc-item-main{display:flex;align-items:center;justify-content:space-between;gap:8px}',
      '.lc-item-name{font-size:14px;font-weight:700;color:' + T.text + '}',
      '.lc-item-detail{font-size:12px;color:' + T.textSubtle + ';line-height:1.6;margin-top:6px}',
      '.lc-tag{flex-shrink:0;display:inline-flex;align-items:center;justify-content:center;gap:4px;overflow:hidden;white-space:nowrap;border-radius:2px;border:1px solid transparent;padding:4px;font-size:14px;font-weight:700;line-height:1}',
      '.lc-tag svg{width:12px;height:12px}',
      '.lc-tag-done{background:#034613;color:#a0d9ad}',
      '.lc-tag-partial{background:#622c02;color:#f8c096}',
      '.lc-tag-todo{background:#474747;color:#e5e5e5}',
      '.lc-suggest{flex-shrink:0;font-size:12px;font-weight:700;color:#7fbcd7;background:' + T.surfaceRaised + ';padding:2px 8px;border-radius:999px;white-space:nowrap}',
      '.lc-ask-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:6px 12px;border:2px solid #a9d3e5;border-radius:12px;background:transparent;color:#a9d3e5;font-size:14px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;transition:color .12s,border-color .12s,box-shadow .12s}',
      '.lc-ask-btn svg{width:16px;height:16px;flex-shrink:0;pointer-events:none}',
      '.lc-ask-btn:hover{border-color:#f1fbfe;color:#f1fbfe}',
      '.lc-ask-btn:active{border-color:#d4e9f2;color:#d4e9f2}',
      '.lc-ask-btn:focus-visible{' + focus + '}',
      '.lc-grid{column-count:2;column-gap:28px;column-rule:1px solid ' + T.hairline + ';margin-top:16px}',
      '.lc-crow{display:flex;align-items:center;gap:8px;padding:6px 0;break-inside:avoid;-webkit-column-break-inside:avoid}',
      '.lc-cslot{width:16px;flex-shrink:0;display:flex;align-items:center;justify-content:center;color:#37a851}',
      '.lc-cname{font-size:12px;color:' + T.text + ';overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.lc-footer{flex:0 0 auto;display:flex;align-items:center;justify-content:flex-start;gap:12px;padding:16px 20px 16px 12px;flex-wrap:wrap}',
      '.lc-close-btn{background:transparent;border:1px solid ' + T.hairline + ';color:' + T.textSubtle + ';font-size:12px;font-weight:700;font-family:inherit;padding:5px 14px;border-radius:999px;cursor:pointer;transition:background .12s,color .12s}',
      '.lc-close-btn:hover{background:rgba(255,255,255,0.08);color:' + T.white + '}',
      '.lc-close-btn:focus-visible{' + focus + '}',
      '.lc-version{font-size:11px;color:' + T.textFaint + ';font-weight:700;letter-spacing:0.04em}',
      '.lc-link{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:' + T.link + ';text-decoration:none;font-weight:700;border-radius:4px;margin-left:auto}',
      '.lc-link:focus-visible{' + focus + '}',
      '.lc-badge:focus-visible{' + focus + '}',
      // Tab row (Coverage | Resources) — Life Tabs underline style
      '.lc-tabrow{flex:0 0 auto;display:flex;gap:0;padding:0 20px;margin-bottom:4px}',
      '.lc-tabpill{padding:12px 16px 11px;border:none;border-bottom:2px solid transparent;background:transparent;color:' + T.textSubtle + ';font-size:13px;font-weight:700;font-family:inherit;cursor:pointer;transition:color .12s,border-color .12s;margin-bottom:-1px;white-space:nowrap}',
      '.lc-tabpill:not(.lc-active):hover{color:' + T.text + '}',
      '.lc-tabpill.lc-active{color:' + T.white + ';border-bottom-color:' + T.primary + '}',
      '.lc-tabpill:focus-visible{' + focus + '}',
      // Resources tab
      '.lc-res-body{flex:1;min-height:0;overflow-y:auto;padding:8px 20px 24px;scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.2) transparent}',
      '.lc-res-body::-webkit-scrollbar{width:6px}',
      '.lc-res-body::-webkit-scrollbar-track{background:transparent}',
      '.lc-res-body::-webkit-scrollbar-thumb{background:rgba(255,255,255,.2);border-radius:999px}',
      '.lc-res-group{margin-top:32px}',
      '.lc-res-group:first-child{margin-top:12px}',
      '.lc-res-grouptitle{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:' + T.textFaint + ';margin-bottom:12px}',
      '.lc-res-item{display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid ' + T.hairline + '}',
      '.lc-res-icon{flex-shrink:0;margin-top:1px;color:' + T.textFaint + '}',
      '.lc-res-text{flex:1;min-width:0}',
      '.lc-res-name{font-size:13px;font-weight:700;color:' + T.text + ';line-height:1.3}',
      '.lc-res-desc{font-size:12px;color:' + T.textSubtle + ';margin-top:4px;line-height:1.5}',
      '.lc-res-action{flex-shrink:0;align-self:center}',
      '.lc-res-link-btn{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:700;color:' + T.link + ';text-decoration:none;border-radius:4px;padding:2px 4px}',
      '.lc-res-link-btn:hover{color:' + T.white + '}',
      '.lc-res-link-btn:focus-visible{' + focus + '}',
      '.lc-res-copy-btn{display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border:1px solid ' + T.hairline + ';border-radius:999px;background:transparent;color:' + T.textSubtle + ';font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;white-space:nowrap;transition:color .12s,border-color .12s}',
      '.lc-res-copy-btn:hover{color:' + T.white + ';border-color:rgba(255,255,255,.4)}',
      '.lc-res-copy-btn:focus-visible{' + focus + '}',
      '.lc-skill-pill{display:inline-block;font-family:monospace;font-size:12px;background:rgba(26,26,26,.4);color:#7fbcd7;padding:2px 8px;border-radius:4px;margin-bottom:4px}',
      '.lc-item-propose{margin-top:8px}',
      '.lc-propose-btn{background:transparent;border:none;color:#7fbcd7;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;padding:0;display:inline-flex;align-items:center;gap:4px;transition:color .12s}',
      '.lc-propose-btn:hover{color:#a9d3e5}',
      '.lc-propose-btn:focus-visible{' + focus + '}',
    ].join('')
    var style = h('style', { id: '__life-checker-styles__' })
    style.textContent = css
    document.head.appendChild(style)
  }

  function sep() { return h('div', { class: 'lc-sep-line' }) }

  // Returns true when the suggest string matches a known Life catalogue entry.
  // Splits on "/" and "," so "Card / Tile" checks "Card" and "Tile" separately.
  function suggestInCatalogue(suggest) {
    if (!suggest) return true
    var words = suggest.split(/[\s\/,]+/).filter(Boolean)
    return words.some(function (w) { return !!CAT_LOOKUP[norm(w)] })
  }

  // ---------------------------------------------------------------- modal content
  function renderTabContent() {
    var wrap = h('div', { class: 'lc-content' })
    if (state.highlight === 'life' && cfg.implemented && cfg.implemented.length) {
      // Only show done/partial — todo items are not Life-compliant yet
      var allItems = cfg.implemented.reduce(function (a, s) { return a.concat(s.items) }, [])
      var activeItems = allItems.filter(function (i) { return i.status !== 'todo' })
      var done = activeItems.filter(function (i) { return i.status === 'done' }).length
      wrap.appendChild(progress(done, activeItems.length, 'areas on Life'))
      var body = h('div', { class: 'lc-body' })
      cfg.implemented.forEach(function (sec) {
        var visibleItems = sec.items.filter(function (i) { return i.status !== 'todo' })
        if (!visibleItems.length) return
        var s = h('div', { class: 'lc-sec' }, [h('div', { class: 'lc-sectitle' }, [sec.group])])
        visibleItems.forEach(function (it) { s.appendChild(implItem(it)) })
        body.appendChild(s)
      })
      wrap.appendChild(sep()); wrap.appendChild(body); wrap.appendChild(sep())
    } else if (state.highlight === 'gaps' && cfg.missing && cfg.missing.length) {
      wrap.appendChild(progress(cfg.missing.length, null, 'areas to migrate to Life'))
      var b2 = h('div', { class: 'lc-body' })
      cfg.missing.forEach(function (m) {
        var prompt = 'In this prototype, find the ' + m.area +
          ' (currently implemented as: ' + m.current + ')' +
          ' and replace it with the Life React component "' + m.suggest + '"' +
          ' from @laerdal-medical/life-react-components.' +
          ' Import the component, wire up equivalent props and event handlers, and remove the hand-rolled code.'
        var btnLabel = 'Fix with Claude Code'
        var btnDone = SVG.check + ' Copied! Paste into Claude'
        var askBtn = h('button', {
          class: 'lc-ask-btn', 'data-slot': 'button', 'data-variant': 'outlined', 'data-size': 'sm', type: 'button',
          title: 'Copies a ready-made prompt to your clipboard',
          html: btnLabel,
        })
        askBtn.onclick = function (e) {
          var btn = e.currentTarget
          function showCopied() {
            btn.innerHTML = btnDone
            setTimeout(function () { btn.innerHTML = btnLabel }, 2500)
          }
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(prompt).then(showCopied).catch(function () {
              var ta = document.createElement('textarea')
              ta.value = prompt; ta.style.cssText = 'position:fixed;opacity:0'
              document.body.appendChild(ta); ta.select()
              try { document.execCommand('copy') } catch (err) {}
              document.body.removeChild(ta)
              showCopied()
            })
          } else {
            var ta = document.createElement('textarea')
            ta.value = prompt; ta.style.cssText = 'position:fixed;opacity:0'
            document.body.appendChild(ta); ta.select()
            try { document.execCommand('copy') } catch (err) {}
            document.body.removeChild(ta)
            showCopied()
          }
        }
        var itemChildren = [
          h('div', { class: 'lc-item-main' }, [
            h('span', { class: 'lc-item-name' }, [m.area]),
            askBtn,
          ]),
          h('div', { class: 'lc-item-detail' }, [m.current]),
        ]
        if (!suggestInCatalogue(m.suggest)) {
          var proposePrompt =
            'The "' + m.area + '" component in this prototype (currently: ' + m.current + ') ' +
            'doesn\'t exist in the Laerdal Life design system yet but seems like a good candidate. ' +
            'Draft a GitHub issue proposing it as an official Life component at ' +
            'Laerdal-Medical/life-react-components, following the contribution proposal template ' +
            'from the /life-components skill. Include what it is, the use case, visible variants ' +
            'and states, and which Life design tokens it uses.'
          var propBtn = h('button', { class: 'lc-propose-btn', type: 'button', html: SVG.idea + ' Propose to Life' })
          propBtn.onclick = function () { copyText(proposePrompt, propBtn, 'Paste into Claude') }
          itemChildren.push(h('div', { class: 'lc-item-propose' }, [propBtn]))
        }
        b2.appendChild(h('div', { class: 'lc-item' }, itemChildren))
      })
      wrap.appendChild(sep()); wrap.appendChild(b2); wrap.appendChild(sep())
    } else {
      if (!isLifeInstalled()) {
        var installCmd = 'npm install @laerdal-medical/life-react-components @laerdal-medical/skills-react-life-icons'
        var installClaudePrompt =
          'Install the Laerdal Life React component library in this prototype.\n\n' +
          '1. Run: npm install @laerdal-medical/life-react-components @laerdal-medical/skills-react-life-icons\n\n' +
          '2. Add these imports to the global stylesheet (e.g. src/index.css), in this order, before any @tailwind utilities:\n' +
          "   @import '@laerdal-medical/life-react-components/life-font.css';\n" +
          "   @import '@laerdal-medical/life-react-components/style.css';\n" +
          "   @import '@laerdal-medical/life-react-components/tailwind-setup.css';\n" +
          "   @import '@laerdal-medical/life-react-components/life-theme.css';\n\n" +
          'This gives the project Lato, all Life CSS variables, the Tailwind preset (bg-fill-*, text-default, border-subtle …), and the base theme. No ThemeProvider needed.'
        function makeInstallBtn(text, initHtml, doneHtml) {
          var btn = h('button', { class: 'lc-ask-btn', type: 'button', html: initHtml })
          btn.onclick = function () {
            var b = btn
            function done() { b.innerHTML = SVG.check + ' ' + doneHtml; setTimeout(function () { b.innerHTML = initHtml }, 2500) }
            function fallback() {
              var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'
              document.body.appendChild(ta); ta.select(); try { document.execCommand('copy') } catch (e) {} document.body.removeChild(ta); done()
            }
            navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(done).catch(fallback) : fallback()
          }
          return btn
        }
        wrap.appendChild(h('div', { class: 'lc-install' }, [
          h('div', { class: 'lc-install-title' }, ['Life not installed']),
          h('div', { class: 'lc-install-desc' }, ['Install the Life React component library to start building with Life in this prototype.']),
          h('div', { class: 'lc-install-cmd' }, [installCmd]),
          h('div', { class: 'lc-install-actions' }, [
            makeInstallBtn(installClaudePrompt, 'Fix with Claude Code', 'Paste into Claude'),
            h('a', { class: 'lc-install-npm', href: 'https://www.npmjs.com/package/@laerdal-medical/life-react-components', target: '_blank', rel: 'noopener noreferrer', html: 'Life on npm ' + SVG.ext }),
          ]),
        ]))
      }
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
      wrap.appendChild(sep()); wrap.appendChild(b3); wrap.appendChild(sep())
    }
    return wrap
  }
  // Scan the LIVE UI for Life components already on screen and mark their catalogue
  // entries as in-use. This is what makes pre-existing Life work count as compliant
  // with zero configuration — whether it was built before or after the checker was
  // added. Runs on mount and on every open, so it tracks SPA route changes too.
  // Resolve a DOM element to its Life catalogue name via its data-slot (the v1.4+
  // library tags every element). Keys on the first slot segment, so sub-parts like
  // "card-header" resolve to "Card". Returns null when it isn't a named Life component.
  function componentName(el) {
    if (!el || !el.getAttribute) return null
    var base = (el.getAttribute('data-slot') || '').split('-')[0]
    if (!base) return null
    return SLOT_ALIASES[base] || CAT_LOOKUP[norm(base)] || CAT_LOOKUP[norm(base + 's')] || null
  }
  function detectUsedComponents() {
    var found = {}
    var nodes = document.querySelectorAll('[data-slot]')
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i]
      if (el.hasAttribute('data-life-checker') || el.closest('[data-life-checker]')) continue
      var name = componentName(el)
      if (name) found[name] = true
    }
    state.detected = found
    return found
  }
  function catalogue() {
    detectUsedComponents()
    // A component counts as used if it's auto-detected on screen OR flagged in config.
    var override = {}
    ;(cfg.components || []).forEach(function (c) { override[c.name] = !!c.used })
    return (state.liveComponents || DEFAULT_COMPONENTS).map(function (name) {
      return { name: name, used: !!(state.detected[name] || override[name]) }
    })
  }
  function progress(n, total, label) {
    var children = [
      h('span', { class: 'lc-count' }, [total == null ? String(n) : n + '/' + total]),
      h('span', { class: 'lc-plabel' }, [label]),
    ]
    if (total != null) {
      var pct = total ? Math.round((n / total) * 100) : 0
      var tx = 'translateX(' + (-(100 - pct)) + '%)'
      children.push(h('div', {
        class: 'lc-track', 'data-slot': 'progress', role: 'progressbar',
        'aria-valuenow': String(pct), 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-label': label,
      }, [
        h('div', { class: 'lc-fill', 'data-slot': 'progress-indicator', style: 'transform:' + tx }),
        h('div', { class: 'lc-pdot', style: 'left:1px' }),
        h('div', { class: 'lc-pdot', style: 'right:1px' }),
      ]))
    }
    return h('div', { class: 'lc-prog' }, children)
  }
  function implItem(it) {
    var tag
    if (it.status === 'done') tag = h('span', { class: 'lc-tag lc-tag-done', 'data-slot': 'tag', html: SVG.check })
    else if (it.status === 'partial') tag = h('span', { class: 'lc-tag lc-tag-partial', 'data-slot': 'tag' }, ['Partial'])
    else tag = h('span', { class: 'lc-tag lc-tag-todo', 'data-slot': 'tag' }, ['Planned'])
    return h('div', { class: 'lc-item' }, [
      h('div', { class: 'lc-item-main' }, [h('span', { class: 'lc-item-name' }, [it.name]), tag]),
      h('div', { class: 'lc-item-detail' }, [it.detail || '']),
    ])
  }

  function setTab(val) {
    state.tab = val
    if (state.open) renderModal()
  }

  function copyText(text, btn, doneLabel) {
    var orig = btn.innerHTML
    function done() { btn.innerHTML = SVG.check + ' ' + doneLabel; setTimeout(function () { btn.innerHTML = orig }, 2000) }
    function fallback() {
      var ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'
      document.body.appendChild(ta); ta.select(); try { document.execCommand('copy') } catch (e) {} document.body.removeChild(ta); done()
    }
    navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(done).catch(fallback) : fallback()
  }

  function renderResources() {
    var CHECKER_URL = 'https://github.com/Sorenordbo/life-checker'
    var INSTALL_PROMPT = 'Install the Life Checker from ' + CHECKER_URL

    function resLink(name, desc, href) {
      var a = h('a', { class: 'lc-res-link-btn', href: href, target: '_blank', rel: 'noopener noreferrer',
        html: 'Open ' + SVG.ext })
      return h('div', { class: 'lc-res-item' }, [
        h('span', { class: 'lc-res-icon', html: SVG.ext }),
        h('div', { class: 'lc-res-text' }, [
          h('div', { class: 'lc-res-name' }, [name]),
          h('div', { class: 'lc-res-desc' }, [desc]),
        ]),
        h('div', { class: 'lc-res-action' }, [a]),
      ])
    }

    function skillItem(skill, desc) {
      var btn = h('button', { class: 'lc-res-copy-btn', type: 'button', html: SVG.copy + ' Copy' })
      btn.onclick = function () { copyText(skill, btn, 'Copied') }
      return h('div', { class: 'lc-res-item' }, [
        h('span', { class: 'lc-res-icon', html: SVG.play }),
        h('div', { class: 'lc-res-text' }, [
          h('div', { class: 'lc-skill-pill' }, [skill]),
          h('div', { class: 'lc-res-desc' }, [desc]),
        ]),
        h('div', { class: 'lc-res-action' }, [btn]),
      ])
    }

    function copyItem(name, desc, text, btnLabel, doneLabel) {
      var btn = h('button', { class: 'lc-res-copy-btn', type: 'button', html: SVG.copy + ' ' + btnLabel })
      btn.onclick = function () { copyText(text, btn, doneLabel) }
      return h('div', { class: 'lc-res-item' }, [
        h('span', { class: 'lc-res-icon', html: SVG.copy }),
        h('div', { class: 'lc-res-text' }, [
          h('div', { class: 'lc-res-name' }, [name]),
          h('div', { class: 'lc-res-desc' }, [desc]),
        ]),
        h('div', { class: 'lc-res-action' }, [btn]),
      ])
    }

    var body = h('div', { class: 'lc-res-body' })

    var dsGroup = h('div', { class: 'lc-res-group' }, [h('div', { class: 'lc-res-grouptitle' }, ['Design system'])])
    dsGroup.appendChild(resLink('Life design system', 'Guidelines, principles, and the full token reference', 'https://life.laerdal.com/'))
    dsGroup.appendChild(resLink('Component library (Storybook)', 'Live component demos, props, and usage examples', 'https://laerdal-medical.github.io/life-react-components'))
    dsGroup.appendChild(resLink('Icon showcase', 'All SystemIcons, ContentIcons, and HeartSaverIcons', 'https://laerdal-medical.github.io/skills-react-life-icons'))
    dsGroup.appendChild(resLink('Life on npm', 'Package page for @laerdal-medical/life-react-components', 'https://www.npmjs.com/package/@laerdal-medical/life-react-components'))
    body.appendChild(dsGroup)

    var ccGroup = h('div', { class: 'lc-res-group' }, [h('div', { class: 'lc-res-grouptitle' }, ['Build with Claude Code'])])
    ccGroup.appendChild(skillItem('/life-components', 'Use existing Life React components in your app — picks components, applies design tokens, handles install'))
    ccGroup.appendChild(skillItem('/life-composition', 'Design foundations for any stack — color palette, typography, spacing, accessibility, writing guidelines'))
    body.appendChild(ccGroup)

    var GENERIC_PROPOSE_PROMPT =
      'I\'ve built a component in this prototype that doesn\'t exist in the Laerdal Life ' +
      'design system yet, but seems like it should. Draft a GitHub issue proposing it as an ' +
      'official Life component at Laerdal-Medical/life-react-components, following the ' +
      'contribution proposal template from the /life-components skill. Include: what it is, ' +
      'the use case, visible variants and states, and which Life design tokens it uses.'

    var contributeGroup = h('div', { class: 'lc-res-group' }, [h('div', { class: 'lc-res-grouptitle' }, ['Contribute to Life'])])
    contributeGroup.appendChild(resLink(
      'Open a proposal issue',
      'Suggest a new component directly on the life-react-components repo',
      'https://github.com/Laerdal-Medical/life-react-components/issues/new/choose'
    ))
    contributeGroup.appendChild(copyItem(
      'Propose via Claude Code',
      'Copies a prompt — describe your component and Claude drafts the full proposal issue',
      GENERIC_PROPOSE_PROMPT, 'Copy prompt', 'Paste into Claude'
    ))
    body.appendChild(contributeGroup)

    var checkerGroup = h('div', { class: 'lc-res-group' }, [h('div', { class: 'lc-res-grouptitle' }, ['This checker'])])
    checkerGroup.appendChild(resLink('Source on GitHub', 'The life-checker repo — issues, changelog, and updates', CHECKER_URL))
    checkerGroup.appendChild(copyItem(
      'Install in another project',
      'Copies the prompt — paste into Claude Code in any React prototype',
      INSTALL_PROMPT, 'Copy prompt', 'Paste into Claude'
    ))
    body.appendChild(checkerGroup)

    var wrap = h('div', { class: 'lc-content' })
    wrap.appendChild(sep()); wrap.appendChild(body); wrap.appendChild(sep())
    return wrap
  }

  // ---------------------------------------------------------------- modal shell
  function renderModal() {
    if (els.backdrop) els.backdrop.remove()
    if (!state.open) return

    function mkHseg(val, label) {
      var activeClass = val === 'off' ? 'lc-hoff' : val === 'life' ? 'lc-hlife' : 'lc-hgaps'
      var cls = 'lc-hseg' + (state.highlight === val ? ' lc-active ' + activeClass : '')
      return h('button', {
        class: cls, type: 'button', role: 'tab', 'aria-selected': String(state.highlight === val),
        onclick: function () { setHighlight(val) },
      }, [label])
    }

    var legendSwatches = state.highlight === 'life' ? [
      h('span', { class: 'lc-leg' }, [h('span', { class: 'lc-sw-c' }), 'Components']),
      h('span', { class: 'lc-leg' }, [h('span', { class: 'lc-sw-t' }), 'Design tokens']),
    ] : state.highlight === 'gaps' ? [
      h('span', { class: 'lc-leg' }, [h('span', { class: 'lc-sw-g' }), 'Non-Life components']),
    ] : []
    var legend = h('div', { class: 'lc-legend' },
      legendSwatches.length ? [
        h('span', { class: 'lc-legend-hint' }, ['Visible in the app behind this panel']),
        h('div', { class: 'lc-legend-swatches' }, legendSwatches),
      ] : []
    )

    function mkTabPill(val, label) {
      var btn = h('button', {
        class: 'lc-tabpill' + (state.tab === val ? ' lc-active' : ''),
        type: 'button', role: 'tab', 'aria-selected': String(state.tab === val),
      }, [label])
      btn.onclick = function () { setTab(val) }
      return btn
    }

    var panelChildren = [
      h('div', { class: 'lc-header' }, [
        h('div', {}, [h('div', { class: 'lc-eyebrow' }, ['Prototype plugin']), h('div', { class: 'lc-title' }, [cfg.title]), h('div', { class: 'lc-sub' }, [cfg.subtitle])]),
        h('button', { class: 'lc-x', type: 'button', 'aria-label': 'Close', 'data-slot': 'icon-button', html: SVG.close, onclick: close }),
      ]),
      h('div', { class: 'lc-tabrow', role: 'tablist' }, [
        mkTabPill('main', 'Coverage'),
        mkTabPill('resources', 'Resources'),
      ]),
      sep(),
    ]

    if (state.tab === 'main') {
      panelChildren.push(h('div', { class: 'lc-hl' }, [
        h('div', { class: 'lc-hsegs', role: 'tablist' }, [
          mkHseg('off', 'Off'),
          mkHseg('life', 'Life-compliant'),
          mkHseg('gaps', 'Fix gaps'),
        ]),
        legend,
      ]))
      panelChildren.push(renderTabContent())
    } else {
      panelChildren.push(renderResources())
    }

    panelChildren.push(h('div', { class: 'lc-footer' }, [
      h('button', { class: 'lc-close-btn', type: 'button', onclick: close }, ['Close']),
      state.liveVersion ? h('span', { class: 'lc-version' }, ['Life v' + state.liveVersion]) : null,
      h('a', { class: 'lc-link', href: cfg.docsUrl, target: '_blank', rel: 'noopener noreferrer',
        html: 'Open the Life design system ' + SVG.ext }),
    ]))

    var panel = h('div', { class: 'lc-panel', role: 'dialog', 'aria-modal': 'true', 'aria-label': cfg.title,
      onclick: function (e) { e.stopPropagation() } })
    panelChildren.forEach(function (c) { if (c) panel.appendChild(c) })

    els.backdrop = h('div', { class: 'lc-backdrop', 'data-life-checker': '', role: 'presentation', onclick: close }, [panel])
    document.body.appendChild(els.backdrop)
  }

  function open() { state.open = true; renderModal() }
  function close() { state.open = false; if (els.backdrop) { els.backdrop.remove(); els.backdrop = null } }

  // ---------------------------------------------------------------- live catalog
  function applyCatalog(data) {
    var changed = false
    if (data.version && data.version !== state.liveVersion) {
      state.liveVersion = data.version
      changed = true
    }
    if (data.components && data.components.length > 15) {
      state.liveComponents = data.components
      // Extend the slot lookup so live-detected components resolve correctly
      state.liveComponents.forEach(function (n) { CAT_LOOKUP[norm(n)] = n })
      changed = true
    }
    if (changed && state.open) renderModal()
  }

  function fetchCatalog() {
    try {
      var cached = JSON.parse(localStorage.getItem(CATALOG_CACHE_KEY) || 'null')
      if (cached && cached.ts && (Date.now() - cached.ts) < CATALOG_CACHE_TTL) {
        applyCatalog(cached)
        return
      }
    } catch (e) {}

    fetch('https://registry.npmjs.org/@laerdal-medical%2Flife-react-components/latest')
      .then(function (r) { return r.ok ? r.json() : Promise.reject() })
      .then(function (pkg) {
        var names = []
        if (pkg.exports && typeof pkg.exports === 'object') {
          Object.keys(pkg.exports).forEach(function (k) {
            var m = k.match(/^\.\/([A-Z][A-Za-z0-9]+)$/)
            if (m) names.push(m[1])
          })
        }
        var catalog = {
          ts: Date.now(),
          version: pkg.version || null,
          components: names.length > 15 ? names : null,
        }
        try { localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(catalog)) } catch (e) {}
        applyCatalog(catalog)
      })
      .catch(function () {})
  }

  function updateBadgeDots() {
    if (!els.dotOff) return
    els.dotOff.className  = 'lc-bdot lc-bdot-off'  + (state.highlight === 'off'  ? ' lc-active' : '')
    els.dotLife.className = 'lc-bdot lc-bdot-life' + (state.highlight === 'life' ? ' lc-active' : '')
    els.dotGaps.className = 'lc-bdot lc-bdot-gaps' + (state.highlight === 'gaps' ? ' lc-active' : '')
  }

  // ---------------------------------------------------------------- mount
  function mount() {
    if (els.badge) return
    injectStyles()

    els.labelBtn = h('button', { class: 'lc-badge-label', type: 'button', 'data-life-checker': '',
      'aria-label': cfg.title }, [cfg.badgeText])
    els.labelBtn.onclick = open

    els.dotOff  = h('button', { class: 'lc-bdot lc-bdot-off',  type: 'button', 'data-life-checker': '', 'aria-label': 'Highlight off',  html: SVG.dotOff })
    els.dotLife = h('button', { class: 'lc-bdot lc-bdot-life', type: 'button', 'data-life-checker': '', 'aria-label': 'Highlight Life', html: SVG.check })
    els.dotGaps = h('button', { class: 'lc-bdot lc-bdot-gaps', type: 'button', 'data-life-checker': '', 'aria-label': 'Highlight Gaps', html: SVG.dotGaps })

    els.dotOff.onclick  = function () { setHighlight('off') }
    els.dotLife.onclick = function () { setHighlight(state.highlight === 'life' ? 'off' : 'life') }
    els.dotGaps.onclick = function () { setHighlight(state.highlight === 'gaps' ? 'off' : 'gaps') }

    els.badge = h('div', { class: 'lc-badge', 'data-life-checker': '', role: 'group', 'aria-label': cfg.title })
    els.badge.appendChild(els.labelBtn)
    els.badge.appendChild(h('div', { class: 'lc-badge-sep', 'data-life-checker': '' }))
    els.badge.appendChild(els.dotOff)
    els.badge.appendChild(els.dotLife)
    els.badge.appendChild(els.dotGaps)

    document.body.appendChild(els.badge)
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close() })
    if (cfg.highlightDefault) setHighlight(true)
    updateBadgeDots()
    fetchCatalog()
    window.LifeChecker.__mounted = true
  }

  function configure(next) {
    cfg = Object.assign(cfg, next || {})
    if (els.labelBtn) {
      els.labelBtn.setAttribute('aria-label', cfg.title)
      els.labelBtn.textContent = cfg.badgeText
    }
    if (els.badge) els.badge.setAttribute('aria-label', cfg.title)
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
      clearLabels()
      window.LifeChecker.__mounted = false
    },
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount)
  } else {
    mount()
  }
})()
