# @drupal-kit/core

## OVERVIEW
Core orchestration engine. Provides the base `Drupalkit` class, hook lifecycle, network handling, and the plugin composition system.

## KEY FILES
- `src/Drupalkit.ts`: Primary class; manages config, hooks, and plugin registration.
- `src/DrupalkitError.ts`: Specialized error class for SDK-wide failure reporting.
- `src/fetch-wrapper.ts`: Low-level fetch logic, response parsing, and error mapping.
- `src/utils.ts`: Shared internal utilities (URL building, merging logic).
- `src/types.ts`: Core interface definitions for config, hooks, and requests.

## WHERE TO LOOK
| Feature | Location | Details |
|---------|----------|---------|
| Plugin Composition | `Drupalkit.plugin()` | Static method to create extended classes. |
| Plugin Merging | `applyPlugins()` | Internal logic merging plugin objects up to 2 levels deep. |
| Request Flow | `Drupalkit.request()` | Entry point for calls; triggers the `request` hook. |
| URL Generation | `buildUrl()` | Orchestrates base URL, locale prefixes, and path joining. |
| Error Schema | `DrupalkitError` | Standardized object: `status`, `message`, `request`, `response`. |

## CONVENTIONS
- **Hook system**: Uses `before-after-hook`. Register via `drupalkit.hook.[before|after|wrap|error]('request', ...)`.
- **Locale Prefixing**: `buildUrl` automatically prepends `locale` to paths if it differs from `defaultLocale`.
- **Result Pattern**: Every async method MUST return `Result<Ok, Err>` via `@wunderwerk/ts-functional`.
- **Request Lifecycle**: `request()` -> Hooks -> `fetchWrapper` -> Response Parsing -> Result.

## ANTI-PATTERNS
- **Raw Fetch**: Never use global `fetch`. Use `drupalkit.request()` to ensure hooks and headers are applied.
- **Throwing Errors**: Never use `throw`. Return `Result.Err(new DrupalkitError(...))`.
- **Manual Path Joining**: Avoid manual string concatenation for URLs; use `buildUrl()`.
- **Deep Plugin Objects**: Limit plugin method nesting; `applyPlugins` only merges 2 levels deep.
