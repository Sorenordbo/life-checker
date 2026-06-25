---
name: life-composition
description: Build UI using Laerdal Medical's Life design system. Apply Life design tokens, typography, color palette, spacing, and component patterns. Use when the user says "use Life design", "Life design system", "Laerdal design", "Samaritan Lifeguard", or asks to build a UI/product that should follow Laerdal's visual brand. Covers React component libraries, CSS custom properties, iconography (Lucide React), accessibility (WCAG 2.2 AA), and UI writing guidelines.
---

# Samaritan Lifeguard — Life Design System

Laerdal Medical's Life design system (v4.5.0). Apply it consistently across all UI built for Laerdal products.

## Environment detection (run first)

The **principles** in this skill — color palette, typography, layout, accessibility (WCAG 2.2 AA), and UI writing — apply in any stack. Read the relevant sections regardless of what the project is built in.

The **Quick Setup snippet below is React-specific.** Detect the stack first and adapt:

```bash
test -f package.json && node -e "
const p = require('./package.json');
const d = {...(p.dependencies||{}), ...(p.devDependencies||{})};
const fw = Object.keys(d).filter(k=>/^(react|vue|svelte|@angular)/.test(k))[0] || 'none';
console.log('FRAMEWORK:' + fw);
console.log('NEXT:' + (d.next||'none'));
" || echo "PACKAGE_JSON:missing"

test -d .lovable && echo "LOVABLE:detected"
test -f figma.config.json && echo "FIGMA_MAKE:detected"
```

### Mode by stack

- **Native mode** — React + a standard CSS pipeline → use the Quick Setup section below as written.
- **Adapter mode** — Next.js, Vue, Svelte, Angular, or another framework → the principles apply unchanged. Adapt only the setup snippet: load Lato + Noto Sans via that framework's font system (e.g. `next/font` in Next.js, `@font-face` in vanilla CSS, the framework's preferred font loader). Place the CSS reset in the framework's global stylesheet entry.
- **Manual mode** — Lovable, Figma Make, Webflow, WordPress, vanilla HTML, or any tool without an npm pipeline → skip the npm step entirely. Load fonts via the host tool's settings or a Google Fonts `<link>` in the HTML head. Apply colors as hex values directly from the Style Guide section in this skill. Every principle (color, type, layout, a11y, writing) still applies — the design system is the language, not the package.

Always surface the chosen mode to the user in plain English (e.g. *"This is a Webflow project, so I'm applying Life by hand — colors, fonts, and spacing — without installing anything."*) before continuing.

---

## Quick Setup (React)

```bash
npm install lucide-react
```

Import Google Fonts in your HTML or CSS:
```html
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Noto+Sans&display=swap" rel="stylesheet">
```

Base CSS reset:
```css
:root {
  font-family: 'Lato', 'Noto Sans', sans-serif;
  font-size: 16px;
  color: #1a1a1a;
  background: #ffffff;
}
```

Check the Storybook instances for ready-made components before building custom ones:
- **DCS Life React**: https://laerdal-components-storybook-dev.azurewebsites.net
- **Skills Life React**: https://hhst0027ne.blob.core.windows.net/cdn-skills/react-app/dev/storybook

## Core Design Principles

- **8px baseline grid** — all dimensions divisible by 8 (2px and 4px also allowed)
- **rem units** — base 16px
- **Minimalist** — clean layouts, use divider lines instead of bounding boxes
- **Semantic color tokens** — use token names not raw hex values in code

## Key Token Reference (commit these to memory)

**Primary action color:** `#2e7fa1` (Primary 500)
**Text default:** `#1a1a1a` (Black)
**Background default:** `#ffffff` (White)
**Subtle background:** `#fafafa` (Neutral 020)
**Border default:** `#cccccc` (Neutral 200)
**Disabled text:** `#949494` (Neutral 400)

**Border radius:** 4px (small) · 8px (medium) · 16px (large)
**Shadow:** `rgba(0,0,0,0.15)`

## Responsive Grid

| Breakpoint | Width        | Columns |
|-----------|-------------|---------|
| Small     | 320–767px   | 4       |
| Medium    | 768–1279px  | 8       |
| Large     | 1280–1600px | 12      |

## Reference Files

Load these when you need detailed values:

- **[style-guide.md](references/style-guide.md)** — Full color palette (all 7 scales + semantic tokens), spacing/size tokens, z-index tokens, elevation, shapes, iconography
- **[accessibility.md](references/accessibility.md)** — WCAG 2.2 AA requirements: contrast ratios, focus, touch targets, ARIA, semantic HTML
- **[writing.md](references/writing.md)** — Tone, capitalization, punctuation, number formatting, error messages

Read `style-guide.md` for any task involving colors, spacing, or layout. Read `accessibility.md` when building interactive components. Read `writing.md` when writing labels, error messages, or any UI copy.


# Life Design System — Accessibility Requirements

Comply with **WCAG 2.2 Level AA** for all UI.

## Contrast
- Text: minimum **4.5:1** contrast ratio
- Large text (18px+ regular or 14px+ bold) and UI icons: minimum **3:1**

## Focus Indicators
- All interactive elements must have visible focus indicators
- Focus rings must not be hidden or obscured
- Use `--life-z-index-5` (z-index: 5) for focused elements

## Touch Targets
- Minimum **24×24 CSS pixels** for all interactive elements
- Prefer 44×44px for primary actions

## Keyboard Navigation
- All interactive elements must be reachable by keyboard
- Logical focus order must be maintained
- No keyboard traps

## ARIA
- Use ARIA roles and attributes for all interactive elements that lack native semantics
- Provide `aria-label` or `aria-labelledby` for icon-only buttons and inputs

## Semantic HTML
- Use semantic elements for structure: `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>`, `<article>`, `<aside>`
- Use `<label>` for all form fields and controls (associated via `for`/`id` or wrapping)
- Use `<button>` for actions, `<a>` for navigation

## Images & Media
- All meaningful images require descriptive `alt` text
- Decorative images use `alt=""`
- Icons used as actions need accessible labels

## Color
- Never rely on color alone to convey information
- Pair color cues with text, icons, or patterns


# Life Design System — Style Guide

## Color Palette

### Base
| Name  | Hex       |
|-------|-----------|
| White | `#ffffff` |
| Black | `#1a1a1a` |

### Neutral
| Token     | Hex       |
|-----------|-----------|
| 020 Tint  | `#fafafa` |
| 050 Tint  | `#f2f2f2` |
| 100 Tint  | `#e5e5e5` |
| 200 Tint  | `#cccccc` |
| 300 Tint  | `#b3b3b3` |
| 400 Tint  | `#949494` |
| 500 Shade | `#767676` |
| 600 Shade | `#666666` |
| 700 Shade | `#4d4d4d` |
| 800 Shade | `#333333` |

### Primary (Blue)
| Token     | Hex       |
|-----------|-----------|
| 020 Tint  | `#f1fbfe` |
| 050 Tint  | `#e3f5fc` |
| 100 Tint  | `#d4e9f2` |
| 200 Tint  | `#a9d3e5` |
| 300 Tint  | `#7fbcd7` |
| 400 Tint  | `#519dbd` |
| 500 Shade | `#2e7fa1` |
| 600 Shade | `#276d8b` |
| 700 Shade | `#215369` |
| 800 Shade | `#163746` |

### Accent 1 (Teal)
| Token     | Hex       |
|-----------|-----------|
| 020 Tint  | `#edfcfb` |
| 050 Tint  | `#d5f7f4` |
| 100 Tint  | `#b0ede8` |
| 200 Tint  | `#7addd6` |
| 300 Tint  | `#44ccc4` |
| 400 Tint  | `#1db8ae` |
| 500 Shade | `#0e9991` |
| 600 Shade | `#0b807a` |
| 700 Shade | `#085f5b` |
| 800 Shade | `#053e3b` |

### Accent 2 (Amber)
| Token     | Hex       |
|-----------|-----------|
| 020 Tint  | `#fffaee` |
| 050 Tint  | `#fff3cc` |
| 100 Tint  | `#ffe999` |
| 200 Tint  | `#ffd966` |
| 300 Tint  | `#ffc933` |
| 400 Tint  | `#ffb800` |
| 500 Shade | `#cc9400` |
| 600 Shade | `#aa7a00` |
| 700 Shade | `#7a5800` |
| 800 Shade | `#523b00` |

### Positive (Green)
| Token     | Hex       |
|-----------|-----------|
| 020 Tint  | `#ecfef1` |
| 050 Tint  | `#d0fada` |
| 100 Tint  | `#a3f5b5` |
| 200 Tint  | `#70e88e` |
| 300 Tint  | `#3dd96b` |
| 400 Tint  | `#18c44d` |
| 500 Shade | `#12a33f` |
| 600 Shade | `#0d8033` |
| 700 Shade | `#085c25` |
| 800 Shade | `#043a17` |

### Warning (Orange)
| Token     | Hex       |
|-----------|-----------|
| 020 Tint  | `#fef7f1` |
| 050 Tint  | `#fdeadb` |
| 100 Tint  | `#fad4b7` |
| 200 Tint  | `#f7b98b` |
| 300 Tint  | `#f49d5f` |
| 400 Tint  | `#f08132` |
| 500 Shade | `#d4621a` |
| 600 Shade | `#b05016` |
| 700 Shade | `#7d3910` |
| 800 Shade | `#4f240a` |

### Critical (Red)
| Token     | Hex       |
|-----------|-----------|
| 020 Tint  | `#fef5f7` |
| 050 Tint  | `#fde0e6` |
| 100 Tint  | `#f9b3c3` |
| 200 Tint  | `#f47f9b` |
| 300 Tint  | `#ee4d73` |
| 400 Tint  | `#e61e4e` |
| 500 Shade | `#c01240` |
| 600 Shade | `#9c0e34` |
| 700 Shade | `#710a25` |
| 800 Shade | `#470618` |

### Overlay
- White 75%: `rgba(255,255,255,0.75)`
- Black 50%: `rgba(0,0,0,0.5)`

### Gradient
- Black linear: `linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)`

---

## Semantic Color Tokens

These map semantic intent to palette values. Use these in code rather than raw hex values.

### Light Mode
**Background**
- Default: White `#ffffff`
- Subtle: Neutral 020 `#fafafa`
- Inverse: Neutral 800 `#333333`

**Text**
- Default: Black `#1a1a1a`
- Subtle: Neutral 600 `#666666`
- Disabled: Neutral 400 `#949494`
- Inverse: White `#ffffff`
- Primary: Primary 500 `#2e7fa1`
- Positive: Positive 600 `#0d8033`
- Warning: Warning 600 `#b05016`
- Critical: Critical 600 `#9c0e34`

**Icon**
- Default: Neutral 700 `#4d4d4d`
- Subtle: Neutral 400 `#949494`
- Disabled: Neutral 300 `#b3b3b3`
- Inverse: White `#ffffff`
- Primary: Primary 500 `#2e7fa1`
- Positive: Positive 500 `#12a33f`
- Warning: Warning 500 `#d4621a`
- Critical: Critical 500 `#c01240`

**Border**
- Default: Neutral 200 `#cccccc`
- Strong: Neutral 400 `#949494`
- Disabled: Neutral 200 `#cccccc`
- Primary: Primary 400 `#519dbd`
- Positive: Positive 400 `#18c44d`
- Warning: Warning 400 `#f08132`
- Critical: Critical 400 `#e61e4e`

### Dark Mode
Same structure as Light Mode with values inverted for dark backgrounds. Primary color in dark mode uses Primary 300 `#7fbcd7` for text/icons.

---

## Typography

**Font stack:** `font-family: 'Lato', 'Noto Sans', sans-serif;`
Embed via Google Fonts. Lato is primary; Noto Sans is fallback for non-Latin scripts.

**Root size:** 16px. Use `rem` units throughout.

**Hyperlinks:** bold, Primary 500 `#2e7fa1`, no underline.

### Responsive Heading Scale
| Level | Mobile       | Tablet       | Desktop      |
|-------|-------------|-------------|-------------|
| H1    | 48px / 700  | 54px / 700  | 60px / 700  |
| H2    | 40px / 700  | 44px / 700  | 48px / 700  |
| H3    | 32px / 700  | 36px / 700  | 40px / 700  |
| H4    | 28px / 700  | 30px / 700  | 32px / 700  |
| H5    | 24px / 700  | 26px / 700  | 28px / 700  |
| H6    | 20px / 600  | 22px / 600  | 24px / 600  |

### Component Text Sizes
| Size | px   | Weight options     |
|------|------|--------------------|
| XL   | 20px | Regular/Bold/Italic|
| L    | 18px | Regular/Bold/Italic|
| M    | 16px | Regular/Bold/Italic|
| S    | 14px | Regular/Bold/Italic|
| XS   | 12px | Regular/Bold/Italic|
| XXS  | 10px | Regular/Bold       |

---

## Layout & Grid

**Design philosophy:** Clean, minimalist UI.

**Baseline grid:** 8px. All dimensions must be divisible by 8 (exceptions: 2px and 4px are allowed).

**Units:** `rem`, base 16px.

### Breakpoints
| Size   | Width        | Columns |
|--------|-------------|---------|
| Small  | 320–767px   | 4       |
| Medium | 768–1279px  | 8       |
| Large  | 1280–1600px | 12      |

### Spacing Tokens
```css
--life-space-025:   2px;
--life-space-050:   4px;
--life-space-100:   8px;
--life-space-150:   12px;
--life-space-200:   16px;
--life-space-300:   24px;
--life-space-400:   32px;
--life-space-600:   48px;
--life-space-800:   64px;
--life-space-1200:  96px;
--life-space-1600:  128px;
```

### Size Tokens
```css
--life-size-025:    2px;
--life-size-050:    4px;
--life-size-100:    8px;
--life-size-150:    12px;
--life-size-200:    16px;
--life-size-300:    24px;
--life-size-400:    32px;
--life-size-600:    48px;
--life-size-800:    64px;
--life-size-1200:   96px;
--life-size-1600:   128px;
```

---

## Elevation & Layering

**Shadow color:** `rgba(0,0,0,0.15)`

### Z-Index Tokens
```css
--life-z-index-1:              1;    /* normal */
--life-z-index-2:              2;    /* hover */
--life-z-index-3:              3;    /* pressed */
--life-z-index-4:              4;    /* active */
--life-z-index-5:              5;    /* focus */
--life-z-index-dropdown:       1000;
--life-z-index-sticky:         1020;
--life-z-index-fixed:          1030;
--life-z-index-modal-backdrop: 1040;
--life-z-index-offcanvas:      1050;
--life-z-index-modal:          1060;
--life-z-index-popover:        1070;
--life-z-index-tooltip:        1080;
```

---

## Shapes & Strokes

### Border Radius
| Size   | Value |
|--------|-------|
| Small  | 4px   |
| Medium | 8px   |
| Large  | 16px  |

### Border Thickness
| Size   | Value |
|--------|-------|
| Small  | 1px   |
| Medium | 2px   |
| Large  | 3px   |

**Border guidance:** Avoid using borders to close/box spaces — use divider lines instead.

---

## Iconography

Use **Lucide React** (`lucide-react`) for all icons. Install via:
```bash
npm install lucide-react
```

Use icons for navigation and interactive actions. Match icon size to the component text size.

---

## Component Libraries

- **DCS Life React** (Storybook): https://laerdal-components-storybook-dev.azurewebsites.net
- **Skills Life React** (Storybook): https://hhst0027ne.blob.core.windows.net/cdn-skills/react-app/dev/storybook
- **Design system site**: https://life.laerdal.com/5d20fd236/p/03b194-digital-life

Check the Storybook instances for available components, props, and usage examples before building custom components.


# Life Design System — UI Writing Guidelines

## Tone & Voice
- Clear, respectful, and supportive
- Active voice; address user in second person ("you")
- User-centered: focus on what users can do, not what the system does
- Inclusive and gender-neutral language
- Plain language — no jargon unless necessary
- US English spelling and conventions

## Capitalization
| Context | Rule |
|---------|------|
| Sentences, labels, body text | Sentence case |
| Product names, category names | Title Case |
| Short UI elements (status badges, tags) | ALL CAPS |
| UI elements referenced in docs | Bold, sentence case |

## Formatting
- Left-align text
- Max line length: 80 characters
- Bold for UI element names and actions in instructional text
- Avoid italics for emphasis; use sparingly for titles or technical terms

## Punctuation
- Oxford comma for lists of 3+ items
- One space after periods
- Use colon to introduce lists
- Quotation marks for direct quotes only — not for UI label references (use bold instead)
- Avoid exclamation marks
- Em dash (—) for sentence breaks; en dash (–) for ranges; hyphen (-) for compound adjectives

## Lists
- Bulleted for unordered items
- Numbered for sequential/ordered steps
- Parallel grammatical structure within each list
- No punctuation at end of list items unless they are full sentences

## Numbers
- Spell out one through ten; numerals for 11 and above
- Always use numerals for: measurements, percentages, file sizes, version numbers
- File sizes: numeral + unit with a space (e.g., `5 KB`, `2.4 MB`, `1 GB`)

## UI Element References (in instructional content)
- Sentence case
- Bold formatting: **Save**, **Next**, **Settings**
- Include icon names when relevant: **Edit** (pencil icon)
- Do not wrap UI label names in quotation marks

## Error & Feedback Messages
- Be specific about what happened and what to do next
- Avoid blame ("You entered an invalid email") — prefer "Enter a valid email address"
- Positive: "File saved successfully" (not "No errors occurred")
- Critical: Direct and actionable — "Connection failed. Check your network and try again."


---
