# Drupal Kit

## Overview

A modular, strictly-typed Drupal SDK (monorepo) for Node.js and the browser. This is a **library/SDK**, not a runnable application — there are no servers, databases, or external services to start.

## Cursor Cloud specific instructions

### Runtime requirements

- **Node.js 20.19.6** and **pnpm 8.5.1** (from `.cursor/Dockerfile`, matching Volta/`packageManager` in root `package.json`). Do not use npm or yarn.

### Key commands

All commands are run from the workspace root:

| Task | Command |
|------|---------|
| Install deps | `pnpm install` |
| Build all | `pnpm build` |
| Lint all | `pnpm lint` |
| Test all | `pnpm test` |
| Typecheck all | `pnpm typecheck` |
| Format check | `pnpm format:check` |
| Format write | `pnpm format:write` |
| Full check | `pnpm check-all` |

### Build order matters

Turborepo handles dependency ordering: `@drupal-kit/core` must build before downstream plugins. Always use `pnpm build` (via turbo) rather than building individual packages manually, unless you know the dependency graph.

### Tests use Vitest and MSW mocks

Packages run tests with Vitest (`vitest run`). Shared config lives in `@drupal-kit/config-vitest`. All HTTP is mocked via MSW (Mock Service Worker). No real Drupal instance or network access is required for the test suite.

### Shared skills

The shared skills repository (`wunderwerkio/wunderskills`) is cloned to `~/.cursor/skills` on environment startup via `.cursor/install-skills.sh` and kept up to date on each install run. The Cursor environment is built from `.cursor/Dockerfile` (Node 20, pnpm 8.5.1, git).

### Commit conventions

Husky enforces conventional commits via commitlint on the `commit-msg` hook. Use format: `type(scope): message` (e.g., `feat(core): add new hook`).
