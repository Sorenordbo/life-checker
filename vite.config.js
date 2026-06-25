import { defineConfig } from 'vite'

// Dev/preview server for the Life Checker demo. Root is the repo so demo/index.html
// can load the checker source at /src/life-checker.js and get Vite's live reload —
// open http://localhost:4178/demo/ in VS Code's Simple Browser and it refreshes on save.
export default defineConfig({
  root: '.',
  appType: 'mpa',
  server: { port: 4178, open: false },
})
