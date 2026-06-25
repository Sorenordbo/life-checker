---
name: life-components
description: Use when working with Laerdal's Life Design System in a React/web project — using existing Life components, applying Life design tokens, or following Life design guidelines. Triggers when the user wants to "use Life components", "use Life design tokens", "design with Life", asks for a "Life button/card/modal/etc.", mentions the Laerdal design system, Life icons, or pastes a Figma Make/Lovable prototype that needs to be re-skinned with Life. Enforces the rule "use existing component → fall back to tokens → flag new components for upstream contribution" and walks through first-time install when the packages aren't yet present in the project.
---

# Life Design System (consumer skill)

This skill is for **using** Life in an application codebase — not contributing to the library itself. For upstream component contribution work, load `contribute-to-life-react` instead.

---

## The three rules (apply in order, every time)

For every UI element being built or modified:

1. **Use an existing Life React component if one even loosely matches.** Check the component list below before reaching for anything else. Style adjustments happen through the component's own variants/props — not by wrapping it in custom CSS.
2. **If nothing matches, build the element from Life design tokens.** Never from raw hex values, arbitrary Tailwind values (`bg-[#ff00ff]`, `bottom-[3px]`), or hardcoded colors. The token system is the design language — anything else breaks theming, dark mode, and accessibility contrast guarantees.
3. **If you end up building a new component, flag it to the user.** Plain English: *"This could be worth proposing as an official Life component — want me to open a proposal issue?"* Never open the issue without explicit confirmation.

---

## Communication style during vibe coding

Per the user's global `CLAUDE.md`, describe changes in **plain English** — never surface package names, token strings, file paths, or prop syntax to the user. The technical detail in this skill is reference for you, not output for them.

- Bad: *"I added `<Button variant='filled' />` from `@laerdal-medical/life-react-components` and applied `bg-bg-fill-primary`."*
- Good: *"I added a filled Life button in the primary brand color."*

---

## Environment detection (run BEFORE any setup or install)

This skill installs an npm package that targets **React 19 + TailwindCSS v4**. The user may invoke it mid-flow in any tech stack, so the first job is always to detect the environment and pick a mode. Never run `npm install` blindly.

### Detection

```bash
test -f package.json && node -e "
const p = require('./package.json');
const d = {...(p.dependencies||{}), ...(p.devDependencies||{})};
const otherFw = Object.keys(d).filter(k=>/^(vue|svelte|@angular)/.test(k)).join(',') || 'none';
const cssInJs = Object.keys(d).filter(k=>/^(styled-components|@emotion|@stitches)/.test(k)).join(',') || 'none';
console.log('REACT:' + (d.react||'none'));
console.log('TAILWIND:' + (d.tailwindcss||'none'));
console.log('NEXT:' + (d.next||'none'));
console.log('OTHER_FW:' + otherFw);
console.log('CSS_IN_JS:' + cssInJs);
" || echo "PACKAGE_JSON:missing"

test -d .lovable && echo "LOVABLE:detected"
test -f figma.config.json && echo "FIGMA_MAKE:detected"
```

### Pick a mode based on the results

- **Native mode** → React ≥19 AND Tailwind ≥4, no prototype-tool markers, GitHub Packages reachable. Skip to **First-time setup (Native mode)** below.
- **Adapter mode** → React present but Tailwind missing, Tailwind v3, React <19, Next.js detected, or CSS-in-JS detected. Go to **Adapter mode** below — and confirm every setup change with the user before touching build config.
- **Manual mode** → Non-React stack (Vue / Svelte / Angular / vanilla / WordPress / Webflow), OR `.lovable` / `figma.config.json` markers present, OR no `package.json`, OR GitHub Packages unreachable. Go to **Manual mode** below — do NOT attempt `npm install`.

Always surface the chosen mode to the user in plain English before doing anything. Example: *"This is a Vue project, so the Life React library can't be installed here — I'll apply Life styling manually using the design system's colors and icons."*

---

## Adapter mode (React present, but pipeline needs work)

Confirm each fix with the user before making it.

| Detected condition                          | What to do                                                                                                                                                          |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| React + no Tailwind                         | Install Tailwind v4 (`npm install -D tailwindcss@^4 @tailwindcss/vite`), wire the Vite or PostCSS plugin, then continue to native steps.                            |
| React + Tailwind v3                         | This is a real migration, not a swap. Offer the v4 upgrade with caveats. If declined, drop to manual mode for any new token-based styling.                          |
| React <19                                   | Peer dep mismatch. Offer to upgrade React. If declined, install with `--legacy-peer-deps` and warn that Form-related components (which lean on react-hook-form 7.71+ behavior on React 19) may misbehave. |
| Next.js (app router)                        | CSS imports go in `app/layout.tsx`, not `src/index.css`. Dark mode applied via a client component on `<html>`.                                                       |
| Next.js (pages router)                      | CSS imports go in `pages/_app.tsx`.                                                                                                                                  |
| styled-components / Emotion / CSS Modules   | Token utility classes don't reach the styling runtime. Either co-install Tailwind for utility usage in non-styled-components code, or drop to manual mode.          |

Once the adapter fix is in place, continue to **First-time setup (Native mode)** below.

---

## Manual mode (when the npm package can't be used)

The Life React library can't be installed here, but Life-looking UI is still achievable by hand. Defer to `life-composition` for the canonical palette, type scale, and principles. Apply them as follows:

- **Colors** — use the hex values from `life-composition`'s style guide directly (e.g. Primary 500 = `#2e7fa1`, Text default = `#1a1a1a`). Apply via whatever the host stack supports: CSS variables, inline styles, the prototype tool's visual editor.
- **Icons** — download SVGs from the Life icon showcase (`https://laerdal-medical.github.io/skills-react-life-icons`) and inline them. Don't substitute with a different icon library without checking `life-composition` for the current canonical icon source for that stack.
- **Components** — recreate the visual structure from `life-composition`'s principles. Target the *look*, not the React API. Storybook (`https://laerdal-medical.github.io/life-react-components`) is the visual reference.
- **Typography** — load Lato + Noto Sans via a Google Fonts link, or the host tool's font system.

When entering manual mode, tell the user in plain English: *"This is a [stack] project, so I'm applying Life styling by hand — colors, icons, and type. When you port to React + Tailwind v4, /life-components can install the real library and you'll get the actual components, dark mode, and theme support for free."*

---

## First-time setup (Native mode only)

Run this only after detection confirms native mode. Otherwise, see Adapter mode or Manual mode above.

### Step 0 — detect current state

```bash
node -e "try{require.resolve('@laerdal-medical/life-react-components');console.log('LIFE:installed')}catch{console.log('LIFE:missing')}" 2>/dev/null
node -e "try{require.resolve('@laerdal-medical/skills-react-life-icons');console.log('ICONS:installed')}catch{console.log('ICONS:missing')}" 2>/dev/null
test -f .npmrc && grep -q "npm.pkg.github.com" .npmrc && echo "NPMRC:project-ok" || echo "NPMRC:project-missing"
test -f ~/.npmrc && grep -q "npm.pkg.github.com" ~/.npmrc && echo "NPMRC:home-ok" || echo "NPMRC:home-missing"
```

Skip any step whose check shows "ok" or "installed."

### Step 1 — configure GitHub Packages auth

Both Life packages are published to **GitHub Packages (private registry)**. They need an auth token with `read:packages`. The user is already authenticated via `gh auth` (you can read the token with `gh auth token`).

Prefer a **project-level** `.npmrc` (so it's checked in for collaborators) unless the user says otherwise:

```
@laerdal-medical:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then export the token for the current shell:

```bash
export GITHUB_TOKEN=$(gh auth token)
```

For a persistent setup, the export needs to live in `~/.zshrc`. **Confirm with the user before editing rc files** — modifying shell startup is durable, not local. A one-line append is enough:

```bash
echo 'export GITHUB_TOKEN=$(gh auth token)' >> ~/.zshrc
```

### Step 2 — install the packages

```bash
npm install @laerdal-medical/life-react-components @laerdal-medical/skills-react-life-icons
```

Peer dependencies the project must already accept: `react ^19.2`, `react-dom ^19.2`. The component library also depends on `react-hook-form ^7.71`, `@hookform/resolvers ^5.2`, and `zod ^4.3` (used by Form-related components) — the transitive install is sufficient unless the project owns its own forms.

### Step 3 — wire the CSS

Add to the project's main CSS entry (e.g. `src/index.css` or `src/main.css`):

```css
@import '@laerdal-medical/life-react-components/style.css';
@import '@laerdal-medical/life-react-components/tailwind-setup.css';
@import '@laerdal-medical/life-react-components/life-theme.css';
/* Alternatives: rqi-theme.css, aap-theme.css — import EXACTLY ONE theme. */
```

### Step 4 — dark mode

Components react to a `dark` class on the root element. To enable a toggle:

```jsx
<html className={isDarkMode ? 'dark' : ''}>
```

No additional config needed — semantic tokens adapt automatically.

### Step 5 — editor (optional, recommended)

Add to `.vscode/settings.json` so Tailwind autocomplete recognises the `cn` and `cva` helpers:

```json
{
  "tailwindCSS.classFunctions": ["cn", "cva", "cx", "clsx"]
}
```

---

## Rule 1 — pick from existing components first

The library currently exports **37 components**. Check this list before designing anything custom — even a loose match is usually better than rolling your own:

Accordion, Banner, Button, Card, Carousel, Checkbox, CircleProgress, CompressionStack, Dropdown, Form, HandPosition, IconButton, InProductFeedback, Input, Label, LaerdalLogo, LifeCarousel, Loader, MenuItem, Modal, Pagination, Progress, QuizButton, RadioGroup, RatingButton, RatingStars, SamaritanIcon, SamaritanTextButton, SegmentedControl, Sheet, Slider, SliderSnapped, Speedometer, Table, Tabs, Tag, Textarea, Toast, ToggleButton, ToggleSwitch, Tooltip

Standard import:

```tsx
import { Button, Modal, Tabs } from '@laerdal-medical/life-react-components';
```

To confirm the list is current (a new component may have shipped since this skill was last updated):

```bash
node -e "console.log(Object.keys(require('@laerdal-medical/life-react-components')).sort().join('\n'))"
```

For prop shapes, variants, and example usage, check the published Storybook at `https://laerdal-medical.github.io/life-react-components`, or read the type definitions in `node_modules/@laerdal-medical/life-react-components/dist`.

---

## Rule 1b — Life icons before any other icon set

Never reach for `lucide-react`, `heroicons`, Material Icons, or any other icon library. The Life icon set covers UI, content, and Laerdal-branded needs.

```tsx
import {
  SystemIcons,
  ContentIcons,
  HeartSaverIcons,
  LogoIcons,
  FlagIcons,
} from '@laerdal-medical/skills-react-life-icons';

<SystemIcons.Add className="h-6 w-6 text-text-primary" />
<ContentIcons.Assignments className="h-8 w-8 text-text" />
```

Available subpath categories:
- `/system` — UI icons (Add, ChevronLeft, Settings, …)
- `/content` — Domain content (Assignments, AedNoShockAdvised, Adult, Adaptive, …)
- `/heartsaver` — HeartSaver-branded (Epi, Shock, …)
- `/logos` — Brand marks (SamaritanLogo, LaerdalLogo, …)
- `/flag` — Country flags (Us, De, Se, …)

Always color icons via Life text tokens (`text-text`, `text-text-primary`, `text-text-on-fill-positive`) — never with raw hex.

Showcase: `https://laerdal-medical.github.io/skills-react-life-icons`.

---

## Rule 2 — build with tokens, not raw values

When no existing component fits and a custom element is genuinely needed, build it with Life design tokens via Tailwind classes.

Naming pattern: `{tailwind-prefix}-{token-name}` — e.g. `bg-bg-fill-primary`, `text-text-on-fill-positive`, `border-border-focus`.

### Token categories (color only — spacing/typography use standard Tailwind)

- **Backgrounds:** `bg-bg`, `bg-bg-surface`, `bg-bg-surface-{high|low|subtle|neutral}`, `bg-bg-fill-{primary|positive|critical|warning|accent1|accent2}` — each with `-hover`, `-active`, `-disabled`.
- **Text:** `text-text`, `text-text-{subtle|primary|disabled}`, `text-text-on-fill-{primary|positive|critical|warning}`, `text-text-link`, `text-text-link-{primary|accent1|critical}`.
- **Borders:** `border-border`, `border-border-{subtle|focus|hover|active}`, `border-border-{primary|positive|critical|warning}`.
- **Primitive scales** (avoid inside components — only for raw foundations): `primary-*`, `accent1-*`, `accent2-*`, `positive-*`, `warning-*`, `critical-*`, `neutral-*` with values 100–850 (plus some 020–050).

### Token rules

- Prefer semantic tokens (`bg-bg-fill-primary`) over primitive scales (`bg-primary-500`).
- Pair `bg-bg-fill-{state}` with the matching `text-text-on-fill-{state}` — never mismatch.
- Use built-in state variants (`-hover`, `-active`, `-focus`, `-disabled`) — don't reimplement with custom colors.
- **Never use arbitrary Tailwind values** (`bg-[#ff00ff]`, `bottom-[3px]`, `text-[14.5px]`). The Life team treats these as equivalent to inventing tokens.
- If a needed token genuinely doesn't exist, tell the user and ask whether to use the closest match or flag it for tokens-system expansion. Do not silently invent.

### Verifying a token exists

```bash
grep "your-token-name" node_modules/@laerdal-medical/life-react-components/tailwind-setup.css
```

### Class merging utility

```tsx
import { cn } from '@laerdal-medical/life-react-components';
```

---

## Rule 3 — flag potential contributions

Whenever a non-trivial new component is built from tokens, surface the contribution opportunity. Plain English, no jargon:

> *"I built a [thing] from Life tokens for this. If it ends up being reused, it could be worth proposing as an official Life component — want me to draft a proposal issue?"*

Only act if the user agrees. The proposal opens as an **issue**, never as a PR (PRs go through `contribute-to-life-react` with maintainer approval):

```bash
gh issue create \
  --repo Laerdal-Medical/life-react-components \
  --title "Proposal: <ComponentName>" \
  --body "$(cat <<'EOF'
## What it is
<one-sentence description>

## Use case
<where this is needed and why no existing Life component fits>

## Visual reference
<screenshot or Figma frame link>

## Variants / states observed
- <variant 1>
- <variant 2>

## Tokens used in the prototype
- <token 1>
- <token 2>
EOF
)"
```

Templates also available via `https://github.com/Laerdal-Medical/life-react-components/issues/new/choose`.

---

## When Life can't be installed

In **Figma Make**, **Lovable**, or any environment without access to GitHub Packages, the React library cannot be installed. In those cases:

- Apply Life token names and equivalent color values manually in the prototype.
- Use Life icons by visual reference (the package can't be installed there).
- Tell the user the prototype will need to be re-skinned with the real Life library before it can move into a production codebase.

---

## Reference

- Component library (internal repo): `https://github.com/Laerdal-Medical/life-react-components`
- Icon library (internal repo): `https://github.com/Laerdal-Medical/skills-react-life-icons`
- Storybook (live): `https://laerdal-medical.github.io/life-react-components`
- Icon showcase: `https://laerdal-medical.github.io/skills-react-life-icons`
- Design guidelines (Zeroheight): `https://life.laerdal.com`
- Companion skill for designing Life-like (layout, voice, foundations): `life-composition`
- Companion skill for contributing upstream: `contribute-to-life-react`
