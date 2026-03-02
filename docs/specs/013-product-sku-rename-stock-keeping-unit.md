# Spec 013: Rename `product.sku` -> `product.stockKeepingUnit`

## Goal
Introduce a realistic contract rename while preserving compatibility during transition.

## Scope
- Update product domain model and API responses to use `stockKeepingUnit` as canonical field.
- Accept deprecated request alias `sku` for backward compatibility.
- Persist with canonical storage name according to stack/data-layer conventions.

## Out of scope
- Removing backward compatibility alias in this spec.
- Renaming unrelated fields.

## Compatibility rules
- Responses expose `stockKeepingUnit`.
- Requests may provide `stockKeepingUnit` or deprecated `sku`; conflict rules must be deterministic and documented.
- Deprecation should be visible in docs/comments/tests.

## Acceptance criteria
- Products CRUD and search continue to work with canonical field.
- Deprecated `sku` input path remains accepted.
- Tests cover canonical and alias behavior, including conflict/validation cases.

## Verification
- Run products and search integration/e2e suites.

## Stack Expectations (Bun/Hono/Drizzle)
- Implement HTTP routes and middleware with Hono + TypeScript.
- Use PostgreSQL persistence through Drizzle ORM for runtime feature behavior.
- Run verification with Bun commands from `docs/STACK_PROFILE.md`.
