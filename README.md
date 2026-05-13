<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=streamdown-solidjs&background=tiles&project=%20" alt="streamdown-solidjs">
</p>

# streamdown-solidjs

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)
[![npm](https://img.shields.io/npm/v/streamdown-solidjs?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/streamdown-solidjs)
[![downloads](https://img.shields.io/npm/dw/streamdown-solidjs?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/streamdown-solidjs)

Streamdown components for Solid.js.

This project is a Solid.js port of Vercel's Streamdown: https://github.com/vercel/streamdown.
All credit for the original idea, API design, and core UX belongs to the upstream project and its contributors.

## Features

- SolidStart SSR friendly (no `document`/`window` access on the server, plus a dedicated server entry for SSR resolution)
- Built-in UI styles via `streamdown-solidjs/styles.css`
- Markdown rendering + common extensions (tables, code blocks, Mermaid, etc.)

## Credits

- Upstream project (Vercel Streamdown): https://github.com/vercel/streamdown

## Quick start

Install:

```bash
npm i streamdown-solidjs
# or
yarn add streamdown-solidjs
# or
pnpm add streamdown-solidjs
```

Use:

```tsx
import "streamdown-solidjs/styles.css";
import { StreamdownSolid } from "streamdown-solidjs";

export default function Demo() {
    return (
        <StreamdownSolid>
            {`# Hello Streamdown (Solid)`}
        </StreamdownSolid>
    );
}
```

## SolidStart SSR

This package is designed to work in SolidStart SSR out of the box.
If you run into dependency-cache issues after upgrading, try:

- Removing `node_modules/.vite` (or your bundler cache directory)
- Restarting the dev server

## Test packed artifact before publish

```bash
pnpm smoke:pack
```

This command will:

1. Build the library
2. Create a local tarball with `pnpm pack`
3. Install that tarball in a temporary Vite + Solid consumer app
4. Run the consumer build to catch package/runtime integration issues early

If you also want to test in a real browser dev server:

```bash
pnpm smoke:pack:serve
```
