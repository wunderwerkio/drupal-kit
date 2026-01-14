# DRUPAL-KIT

**Generated:** 2026-01-14T08:26:54Z | **Commit:** fd2c89f | **Branch:** main

## OVERVIEW

TypeScript SDK monorepo for building specialized Drupal API clients. Plugin-based architecture: minimal core extended by feature plugins (JSON:API, OAuth, etc.).

## STRUCTURE

```
drupal-kit/
├── packages/
│   ├── core/           # Base Drupalkit class, hooks, request handling
│   ├── jsonapi/        # JSON:API integration plugin
│   ├── simple-oauth/   # OAuth token/userinfo plugin
│   ├── simple-oauth-auth-code/  # Auth code flow plugin
│   ├── consumers/      # X-Consumer-ID header plugin
│   ├── verification/   # Hash/magic-code verification plugin
│   ├── user-api/       # User registration/password/email endpoints
│   ├── types/          # Shared TypeScript types
│   └── config/         # Shared ESLint, Prettier, TSConfig
├── scripts/            # Release tagging script
└── patches/            # pnpm dependency patches
```

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Core SDK logic | `packages/core/src/Drupalkit.ts` | Base class, plugin system, hooks |
| Plugin implementation | `packages/*/src/Drupalkit*.ts` | Each plugin exports a function |
| Type definitions | `packages/types/src/` | Shared request/response types |
| Test patterns | `packages/*/tests/*.test.ts` | AVA + MSW mocking |
| Build config | `packages/*/rollup.config.mjs` | Per-package Rollup |
| Shared configs | `packages/config/` | ESLint, Prettier, TypeScript bases |

## CONVENTIONS

### Plugin Pattern
```typescript
// Plugin = function that extends Drupalkit
export const DrupalkitFoo = (drupalkit: Drupalkit, options: DrupalkitOptions) => {
  return {
    foo: { /* methods */ }
  };
};

// Usage: compose plugins
const Enhanced = Drupalkit.plugin(DrupalkitJsonApi, DrupalkitSimpleOauth);
```

### Hook System
Uses `before-after-hook`. Register via `drupalkit.hook.before/after/wrap/error('request', ...)`.

### Result Type
All async methods return `Result<Ok, Err>` from `@wunderwerk/ts-functional`. Never throws.

### Module Exports
- Entry: `src/index.ts` → Build: `dist/index.mjs` + `dist/index.d.ts`
- ESM only (`"type": "module"`)

### Versioning
- Changesets for version bumps
- `export-version` script syncs version to `src/version.ts`
- Tags based on `@drupal-kit/core` version only

## ANTI-PATTERNS

| Pattern | Why |
|---------|-----|
| `as any`, `@ts-ignore` | Strict typing required |
| Direct fetch | Use `drupalkit.request()` for hooks |
| Throwing errors | Return `Result.Err()` instead |
| Skipping interface augmentation | Plugins require augmenting `JsonApiResources`, `SimpleOauthUserInfo`, etc. |

## DEPRECATIONS (Remove in 1.0.0)

- `packages/consumers`: `consumerUUID` → use `consumerId`
- `packages/user-api`: Multiple endpoint renames (see `src/types.ts` deprecation comments)

## COMMANDS

```bash
pnpm install              # Install deps
pnpm build                # Build all packages (turbo)
pnpm test                 # Run all tests (AVA via turbo)
pnpm check-all            # build + lint + test + typecheck
pnpm format:write         # Prettier + syncpack
pnpm version-packages     # Prep release (changeset version)
pnpm publish-packages     # Publish to npm.wunderwerk.dev
```

## TECH STACK

| Tool | Purpose |
|------|---------|
| pnpm | Package manager + workspaces |
| Turbo | Monorepo task orchestration |
| Rollup + esbuild | Build/bundle |
| AVA | Testing |
| MSW | API mocking in tests |
| Changesets | Versioning/changelog |
| Nix | Reproducible dev environment |

## NOTES

- **Private registry**: Publishes to `npm.wunderwerk.dev`, not public npm
- **Node >=18**: Required engine version
- **Nix-powered CI**: Uses `nix develop` in GitHub Actions for reproducibility
- **Locale handling**: URL prefix for non-default locales (e.g., `/de/api/...`)
- **Type tests**: `*.test-d.ts` files checked via `tsc`, not runtime
