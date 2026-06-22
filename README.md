# Life Checker

A tiny, **zero-dependency** drop-in plugin for prototypes built on (or migrating to)
the Laerdal **Life** design system.

It pins a subtle **“Built on Life”** badge in the corner of any prototype. Click it to:

- **Highlight Life usage live in the running UI** — toggle on to outline every
  **Life component** (solid blue box) and every **design-token** usage (purple dashed box).
  The toggle persists while you keep working, even after the panel is closed.
- **See coverage** — reference tabs for what’s implemented, what’s still missing
  (with the Life component to migrate to), and the full Life component catalogue.

It works in **any** prototype — React, Vue, or plain HTML — because it’s a classic
self-mounting script, not a framework component.

## Use it

Add one line to your prototype:

```html
<script src="life-checker.js"></script>
```

That’s it — the badge self-mounts. The highlight feature and the universal
component catalogue work with no configuration.

### Optional configuration

Supply project-specific data for the “Implemented” and “Missing Life” tabs, and
mark which catalogue components you’re using. Either set a global **before** the
script, or call the API any time after.

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
    components: [ { name: 'Button', used: true } ], // marks catalogue entries in-use
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
npm run demo   # serves ./demo at http://localhost:4178
```

`src/life-checker.js` is the **source of truth**. Prototypes should reference it
(local `file:` dependency, or a hosted URL) rather than copy it, so they stay
up to date.

## License

MIT
