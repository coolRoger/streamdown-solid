<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=streamdown-solidjs&background=tiles&project=%20" alt="streamdown-solidjs">
</p>

# streamdown-solidjs

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

Streamdown components for Solid.js


## Quick start

Install it:

```bash
npm i streamdown-solidjs
# or
yarn add streamdown-solidjs
# or
pnpm add streamdown-solidjs
```

Use it:

```tsx
import { StreamdownSolid } from 'streamdown-solidjs'
```

## Test Packed Artifact Before Publish

```bash
pnpm smoke:pack
```

This command will:

1. build the library
2. create a local tarball with `pnpm pack`
3. install that tarball in a temporary Vite+Solid consumer app
4. run consumer build to catch package/runtime integration issues early

If you also want to test in a real browser dev server:

```bash
pnpm smoke:pack:serve
```
