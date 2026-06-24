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

## Step 1 — Make the project ready to build with Life

If `@laerdal-medical/life-react-components` is already in `package.json`, skip to Step 2.

### 1a. Install the Life packages

```bash
npm install @laerdal-medical/life-react-components @laerdal-medical/skills-react-life-icons
```

Both are **public on npm** and require **React 19**.

### 1b. Wire the Life CSS

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

> For the full set of rules on building with Life (components, icons, color, type, spacing,
> a11y, UI writing), follow the **life-guard** skill. The Life Checker just measures coverage;
> life-guard governs how you build.

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
- The **All components** tab shows checkmarks against Life components currently on screen —
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
