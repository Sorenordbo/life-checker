# Life Checker &nbsp;![Beta](https://img.shields.io/badge/status-beta-orange)

> **This is a beta tool.** Expect rough edges and breaking changes between versions.

A tiny, **zero-dependency** drop-in plugin for prototypes built on (or migrating to)
the Laerdal **Life** design system.

> ## ⚛️ React only
> The Life Checker is for **React** prototypes. The Laerdal Life component library
> (`@laerdal-medical/life-react-components`) ships **React components only** — there is no
> Vue, Angular, Svelte, or plain-HTML build — so "Build with Life" only works in a React
> project (Vite + React, Next.js, Create React App, etc.). If your prototype isn't React,
> this won't give you Life components.

It pins a subtle **“Build with Life”** badge in the corner of your prototype. Click it to:

- **Highlight Life usage live in the running UI** — toggle on to outline every
  **Life component** (solid dark-green box, labelled with its name) and every **design-token**
  usage (light-green dashed box). The toggle persists while you keep working, even after the
  panel is closed.
- **See coverage** — the **All Life components** tab auto-detects which Life components are on
  screen and checks them off, so work you did with Life *before* installing the checker still
  counts as compliant. Optional tabs show what’s implemented and what’s still missing.

## Install it — just ask Claude Code

This is the easy path for designers. In your prototype, ask Claude Code:

> Install the Life Checker from https://github.com/Sorenordbo/life-checker

Claude follows the bundled [`SKILL.md`](./SKILL.md): it installs the Life component library and
design tokens (so you’re ready to vibe code with Life), then drops in the **Build with Life**
badge — framework and all. No manual wiring.

## Or add it by hand

Add one line to your prototype:

```html
<script src="life-checker.js"></script>
```

That’s it — the badge self-mounts. The highlight feature and the auto-detected
component catalogue work with no configuration.

### Optional configuration

The **All Life components** tab fills itself by scanning the live UI — no config needed.
Supply data only to add the curated “Implemented” and “Missing Life” tabs. Either set
a global **before** the script, or call the API any time after.

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
    // Optional — the live scan already marks on-screen usage. Use this only to assert
    // usage the scan can't see (e.g. a Life component on a route you haven't visited).
    components: [ { name: 'Button', used: true } ],
  }
</script>
<script src="life-checker.js"></script>
```

```js
// or, at runtime (e.g. from a bundled app):
window.LifeChecker.configure({ /* same shape */ })
window.LifeChecker.setHighlight(true)
```

### Tuning detection

Defaults detect both styled-components-based Life usage (`class="sc-…"`) and
Tailwind-class Life tokens (`bg-fill-*`, etc.). Override per project:

```js
window.LifeChecker.configure({
  componentSelector: '[class*="sc-"], [data-slot]',
  tokenSelector: '[style*="--life-"], [class*="bg-fill-"]',
})
```

## API

| Call | Effect |
|---|---|
| `window.LifeChecker.configure(cfg)` | Merge config; re-renders if open |
| `window.LifeChecker.open()` / `.close()` | Open/close the panel |
| `window.LifeChecker.setHighlight(bool)` | Toggle the live highlight |
| `window.LifeChecker.destroy()` | Remove the badge, panel, and highlight |

## Develop

```bash
npm install    # first time only
npm run dev    # Vite dev server with live reload
```

Then open **http://localhost:4178/demo/** (in VS Code's Simple Browser, or any
browser). It uses Vite, so the demo **refreshes automatically** whenever you save
`src/life-checker.js` — no manual reload.

`src/life-checker.js` is the **source of truth**. Prototypes should reference it
(local `file:` dependency, or a hosted URL) rather than copy it, so they stay
up to date.

## License

MIT
