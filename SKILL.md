---
name: life-checker
description: Use when a designer or developer wants to verify Life design system usage in a project — "is this using Life?", "are we on the latest version?", "which Life components are in this project?". Reads package.json and source imports to give a ground-truth answer. No DOM scraping, no guessing from visual hints — facts from the code only.
---

# Life Checker

Verify Life design system usage in this project from the source code.

Run these steps in order. Each one is a bash command — read the output before moving to the next.

---

## Step 1 — Is Life installed?

```bash
node -e "
const p = require('./package.json');
const d = {...(p.dependencies||{}), ...(p.devDependencies||{})};
const v = d['@laerdal-medical/life-react-components'];
console.log(v ? 'INSTALLED: ' + v : 'NOT INSTALLED');
"
```

If the output is `NOT INSTALLED`, stop here. Life is not part of this project — tell the designer that clearly and don't continue.

---

## Step 2 — Installed version vs. latest

Get the exact installed version (from node_modules, not the package.json range):

```bash
node -e "
try {
  const p = require('./node_modules/@laerdal-medical/life-react-components/package.json');
  console.log(p.version);
} catch(e) { console.log('node_modules missing — run npm install first'); }
"
```

Get the latest published version (requires GitHub Packages auth to be configured):

```bash
export GITHUB_TOKEN=$(gh auth token 2>/dev/null) \
  && npm view @laerdal-medical/life-react-components version 2>/dev/null \
  || echo "(could not fetch — gh auth login required)"
```

If installed is behind latest, flag it. The update command is:

```bash
npm install @laerdal-medical/life-react-components@latest
```

---

## Step 3 — Which Life components are used, and where?

Find every file that imports from Life:

```bash
grep -rl "@laerdal-medical/life-react-components" \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  src/ 2>/dev/null || grep -rl "@laerdal-medical/life-react-components" \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  . 2>/dev/null
```

For each file found, show exactly which components it imports:

```bash
grep -rn "from '@laerdal-medical/life-react-components'" \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  src/ 2>/dev/null || grep -rn "from '@laerdal-medical/life-react-components'" \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  .
```

Unique list of all Life components imported across the whole project:

```bash
grep -rh "from '@laerdal-medical/life-react-components'" \
  --include="*.tsx" --include="*.ts" --include="*.jsx" --include="*.js" \
  . \
  | grep -oE '\{[^}]+\}' \
  | tr -d '{}' | tr ',' '\n' \
  | sed 's/^[[:space:]]*//' | sed 's/[[:space:]]*$//' \
  | grep -v '^$' | grep -v ' as ' \
  | sort | uniq
```

---

## Step 4 — Report to the designer

Present everything as a plain, honest summary:

**Is Life in this project?** Yes / No

**Version**
- Installed: `x.y.z`
- Latest: `x.y.z`
- Up to date: yes / **no — update needed**

**Life components in use** (N components across N files)
List each component with the file path(s) where it's imported.

**If nothing is found:** say so directly. Don't soften it to "it seems like Life may not be..." — just say "Life is not installed in this project."
