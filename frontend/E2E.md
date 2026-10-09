# Frontend E2E tests

The Playwright suite covers the public blog using deterministic API fixtures; it does not require the backend database or real user credentials.

```sh
pnpm install
pnpm exec playwright install chromium
pnpm test:e2e
```

The test command type-checks the E2E files and runs them headlessly. Use `pnpm test:e2e:headed` or `pnpm test:e2e:ui` for interactive debugging. To target an already-running site, set `PLAYWRIGHT_BASE_URL`; in that mode Playwright does not start a local Vite server.

The current cases cover card/horizontal views, debounced search, empty results, pagination/URL state, article rendering, metadata and guest interaction prompts.
