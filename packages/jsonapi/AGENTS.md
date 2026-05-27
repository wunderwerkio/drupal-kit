# @drupal-kit/jsonapi

## OVERVIEW

JSON:API integration plugin. Most complex plugin, providing strictly typed CRUD operations for Drupal resources.

## KEY FILES

- `src/DrupalkitJsonApi.ts`: Plugin entry; provides `jsonApi` namespace.
- `src/resources.ts`: `JsonApiResources` interface and type derivation logic.
- `src/DrupalkitJsonApiError.ts`: Specialized error handling for JSON:API responses.
- `src/utils.ts`: Content-type checks and internal utilities.

## WHERE TO LOOK

| Task | Location | Notes |
|------|----------|-------|
| Resource operations | `jsonApi.resource()` | Unified entry point for all CRUD |
| Response simplification | `jsonApi.simplifyResourceResponse()` | Flatten responses via `jsona` |
| Type safety examples | `tests/resources.test-d.ts` | Interface augmentation patterns |
| Mock payloads | `tests/fixtures/` | Sample JSON:API responses |

## CONVENTIONS

- **Interface Augmentation**: MUST augment `JsonApiResources` to enable type safety for `.resource()`.
- **Resource Operations**: `readSingle`, `readMany`, `create`, `update`, `delete`.
- **Query Params**: Use `drupal-jsonapi-params` for filtering, sorting, includes.
- **Simplification**: Use `jsona` to deserialize nested JSON:API structures.

## ANTI-PATTERNS

| Pattern | Why |
|---------|-----|
| Skipping augmentation | `.resource()` returns `never` or `string` types |
| Direct response parsing | Use simplification helpers instead |
| Manual URL building | Use `buildJsonApiUrl` or `.resource()` |
