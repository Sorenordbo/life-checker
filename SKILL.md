---
name: life-checker-install
description: Use when a designer asks to install, add, or set up the Life Checker (the "Build with Life" badge) in a REACT prototype or project. Installs the Laerdal Life component library and design tokens so the project is ready to build with Life, then drops in the zero-dependency Life Checker badge that auto-detects which Life components and tokens the running UI already uses. REACT ONLY — the Life component library ships React components only (Vite+React, Next.js, CRA). Not for Vue/Angular/Svelte/plain-HTML projects, non-Laerdal projects, or pure backend work.
---

# Install the Life Checker

> **⚛️ React only.** The Laerdal Life component library (`@laerdal-medical/life-react-components`)
> ships **React components only** — there is no Vue, Angular, Svelte, or plain-HTML build. So
> "Build with Life" only works in a React project (Vite + React, Next.js, Create React App).
> **Before installing, confirm the project is React.** If it isn't, stop and tell the designer
> the Life Checker can't give them Life components on their stack — don't install it.

A designer wants the **Build with Life** badge in their React prototype. Installing it does two
things at once:

1. **Makes the project ready to build with Life** — installs the Life component library and
   design tokens, so they can vibe code with real Life components from the first prompt.
2. **Adds the Life Checker badge** — a subtle pill in the corner. Clicking it opens a panel
   that **highlights live Life usage** in the running UI and shows **coverage**: which Life
   components are already in use (auto-detected), what's still missing, and the full catalogue.

The checker auto-detects Life usage on screen, so **anything built with Life before the
checker was installed still counts as compliant** — no configuration required.

Work through the steps in order. Skip a step only if its check shows it's already done.

---

## Step 0 — Install the companion Claude Code skills

These two skills teach Claude Code *how to build with Life* — they are what the colleague will
invoke after the checker is installed to start lifefying their UI. Install them globally so
they're available in every future Claude Code session:

```bash
SKILLS_DIR="$HOME/.claude/skills"
CHECKER_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
mkdir -p "$SKILLS_DIR"
cp "$CHECKER_DIR/skills/life-components.md" "$SKILLS_DIR/"
cp "$CHECKER_DIR/skills/life-composition.md" "$SKILLS_DIR/"
```

If Claude Code is running from a fetched (not cloned) repo, use these instead:

```bash
mkdir -p ~/.claude/skills
curl -fsSL https://raw.githubusercontent.com/Sorenordbo/life-checker/main/skills/life-components.md -o ~/.claude/skills/life-components.md
curl -fsSL https://raw.githubusercontent.com/Sorenordbo/life-checker/main/skills/life-composition.md -o ~/.claude/skills/life-composition.md
```

After this step the colleague can invoke:
- **`/life-components`** — pick existing Life components, apply design tokens, get install help
- **`/life-composition`** — color palette, typography, spacing, accessibility, writing guidelines

These skills are bundled snapshots. Laerdal employees can pull the originals from
`Laerdal-Medical/dp-laerdal-skills` to get the latest version.

---

## Step 1 — Make the project ready to build with Life

If `@laerdal-medical/life-react-components` is already in `package.json`, skip to Step 2.

### 1a. Configure GitHub Packages auth

The Life packages are published to **GitHub Packages** (not public npm). They require a GitHub
token with `read:packages` scope. Check if auth is already configured:

```bash
test -f .npmrc && grep -q "npm.pkg.github.com" .npmrc && echo "project .npmrc: OK" || echo "project .npmrc: missing"
test -f ~/.npmrc && grep -q "npm.pkg.github.com" ~/.npmrc && echo "global .npmrc: OK" || echo "global .npmrc: missing"
gh auth status 2>/dev/null | grep -q "Logged in" && echo "gh auth: OK" || echo "gh auth: not logged in"
```

If both `.npmrc` checks are missing, add a project-level `.npmrc` (checked in, safe — token
comes from the environment, not hardcoded):

```
@laerdal-medical:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Then export the token for the current shell (reads from the `gh` CLI auth you already have):

```bash
export GITHUB_TOKEN=$(gh auth token)
```

> If `gh auth status` showed "not logged in", the colleague needs to run `gh auth login` first
> (web browser flow, one-time). Don't proceed to install until that's done.

### 1b. Install the Life packages

```bash
npm install @laerdal-medical/life-react-components @laerdal-medical/skills-react-life-icons
```

Both require **React 19**. If the project is on React 18, offer to upgrade. If declined,
install with `--legacy-peer-deps` and warn that Form-related components may misbehave.

### 1c. Wire the Life CSS

Add these four imports to the project's global stylesheet (`src/index.css`, `src/main.css`,
`app/globals.css`, or whatever the project uses), in this order, before any `@tailwind utilities`:

```css
@import '@laerdal-medical/life-react-components/life-font.css';
@import '@laerdal-medical/life-react-components/style.css';
@import '@laerdal-medical/life-react-components/tailwind-setup.css';
@import '@laerdal-medical/life-react-components/life-theme.css';
```

This gives the project Lato, every Life CSS variable, the Tailwind preset that exposes Life
tokens as classes (`bg-fill-primary`, `text-default`, `border-subtle`, …), and the base theme.
No `ThemeProvider` is needed.

> **Building with Life — two companion skills:**
>
> - **`/life-components`** — use this when building *in* the codebase. It governs which
>   existing Life React components to reach for, how to apply design-token Tailwind classes,
>   and when to flag a new pattern for upstream contribution. Load it whenever you're about
>   to vibe-code UI in a React project that has (or is getting) Life installed.
>
> - **`/life-composition`** — use this for design foundations: the full color palette,
>   typography scale, spacing tokens, grid, accessibility (WCAG 2.2 AA), and UI writing
>   guidelines. It applies in any stack — including environments where the npm package can't
>   be installed (Figma Make, Lovable, Webflow, vanilla HTML). Load it when you need the
>   canonical token values, or when building Life-looking UI without the React library.
>
> The Life Checker measures coverage; these two skills govern how to build.

---

## Step 2 — Add the Build with Life badge

The checker is one zero-dependency classic script (`life-checker.js`). It self-mounts the
badge and needs no framework wiring. Vendor a copy into the project, then reference it the way
that project loads assets.

### 2a. Get the script into the project

Copy `src/life-checker.js` from this repo into the project's public/static assets folder. If
you don't have the repo locally, fetch the latest:

```bash
mkdir -p public
curl -fsSL https://raw.githubusercontent.com/Sorenordbo/life-checker/main/src/life-checker.js -o public/life-checker.js
```

(Use the project's `public/` dir — served from the site root in Vite, CRA, and Next.js.)

### 2b. Reference it — pick the React framework

**Vite / Create React App** — add to `index.html` before `</body>` (files in `public/`
are served from the site root):

```html
<script src="/life-checker.js"></script>
```

**Next.js (App Router)** — in `app/layout.tsx`, render Next's `Script` just before `</body>`:

```tsx
import Script from 'next/script'
// inside <body>, after {children}:
<Script src="/life-checker.js" strategy="afterInteractive" />
```

**Next.js (Pages Router)** — add the same `<Script src="/life-checker.js" />` in
`pages/_app.tsx`, or a plain `<script>` in a custom `pages/_document.tsx`.

That's all. No import in app code, no provider, no config.

---

## Step 3 — Verify

Run the project's dev server and open it. Confirm:

- A **Build with Life** pill appears in the bottom-left corner.
- Clicking it opens the panel; the **highlight toggle** outlines Life components (solid box)
  and design-token usage (dashed box) in the live UI.
- The **All Life components** tab shows checkmarks against Life components currently on screen —
  this is the auto-detection working. Navigate the prototype with the panel open to see more
  light up as Life components render on other views.

---

## Optional — project-specific coverage

Auto-detection covers "which components are in use." To also fill the **Implemented** and
**Missing Life** tabs (a curated migration view), supply config — set a global before the
script, or call the API at runtime:

```html
<script>
  window.LifeCheckerConfig = {
    implemented: [
      { group: 'Foundation', items: [
        { name: 'Design tokens', detail: 'var(--life-color-*) app-wide', status: 'done' }, // 'done' | 'partial' | 'todo'
      ] },
    ],
    missing: [
      { area: 'Buttons', current: 'Hand-rolled <button>', suggest: 'Button' },
    ],
    // 'components' is optional — auto-detection already marks on-screen usage.
    // Use it only to assert usage the live scan can't see (e.g. a route not yet visited).
    components: [ { name: 'Button', used: true } ],
  }
</script>
```

For a bundled app that can't easily add a global, call `window.LifeChecker.configure({ … })`
from the entry module after load.

---

## Notes

- **Source of truth** is this repo's `src/life-checker.js`. The vendored copy is a snapshot;
  re-run the `curl` in Step 2a to update it.
- The checker is **safe to ship in a prototype** — it's dev tooling, but it's tiny, dependency
  free, and only renders its own badge. Remove it before production with
  `window.LifeChecker.destroy()` or by dropping the script tag.
