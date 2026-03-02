# Stack Profile

This file is the stack/tooling contract for implementation in this repository.
API behavior/contracts are defined by specs.

## Product Context
- Project name: `hono-ecommerce`
- Domain: `ecommerce-backoffice`
- API style: `REST`

## Core Tech Choices
- Language: `TypeScript`
- Runtime: `Bun`
- Framework: `Hono`
- ORM / Data Mapper: `Drizzle ORM`
- Database: `PostgreSQL`

## Repository Conventions
- Package/dependency manager: `bun`
- Migration strategy: `drizzle-kit` SQL migrations, committed under `drizzle/`; apply with repo scripts.
- Configuration style: `.env` file for local development + explicit `src/config/env.ts` accessors.

## Repository Topology Contract
- Source root path: `src/`
- Module path pattern: `src/modules/<module>/{routes,service,repository,dto}`
- Shared/common code path: `src/common/`
- DB/migrations path: `src/db/` (schema/client) and `drizzle/` (generated SQL migrations)
- Test path strategy: `separate` + `test/**/*.test.ts`
- API docs artifact path (if generated): `docs/openapi.json`
- Prohibited top-level paths (to avoid drift): `lib/`, `misc/`, `legacy/`

## Quality Gates
- Lint command: `bun run lint`
- Unit test command: `bun test`
- Integration/e2e test command: `bun test test/integration`
- Type-check/static-analysis command: `bun run typecheck`

## Implementation Preferences
- Validation library preference: `zod`
- Logging library preference: `pino`
- API docs tool preference: `@hono/zod-openapi` with OpenAPI JSON output
- Auth library preference: `hono/jwt` middleware pattern for stubs

## Additional Constraints
- Performance/security/compliance requirements: keep handlers stateless, sanitize internal errors, and avoid logging secrets/PII.
- Deployment/runtime environment: containerized Bun service + managed PostgreSQL in non-local environments.
- Backward-compatibility rules: preserve existing route behavior unless the active spec explicitly changes it.

## Precedence Rules
- Specs are the source of truth for API behavior and contracts.
- If this profile conflicts with a spec, follow the spec.
