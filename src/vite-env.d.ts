/// <reference types="vite/client" />

// Vite's client types declare the non-code imports its build handles — `.svg`,
// `.png`, `.css?inline` and so on — as modules with a string default export.
// Without this file every `import logo from '@/assets/logo.svg'` in the app was
// a TS2307 "cannot find module", nineteen of them, because nothing had ever
// told TypeScript that Vite resolves those. The build never noticed: the build
// script is `vite build`, which does not typecheck.
