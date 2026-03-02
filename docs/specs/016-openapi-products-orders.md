# Spec 016: OpenAPI Annotations for Products + Orders

## Goal
Document stabilized API surface for products and orders.

## Scope
- Add OpenAPI setup in app startup.
- Document handlers and request/response schemas for:
  - Products endpoints
  - Orders list/detail/cancel endpoints
- Include examples for common request/response payloads.
- Group by tags and version context (`v1`).

## Out of scope
- Full documentation for every route group.
- SDK generation.

## Documentation requirements
- Include error response schema examples aligned with global envelope.
- Show auth requirement on promotions endpoints only if already implemented.
- Mark deprecated request field alias (`sku`) in docs notes.

## Acceptance criteria
- Docs endpoints `/docs` (UI) and `/docs/openapi.json` (JSON) are available.
- Products and orders routes appear with parameters and schemas.
- Cancel endpoint is documented as a state transition operation.

## Verification
- Manual check of generated docs UI/JSON.
- Optional snapshot test for API docs stability.

## Stack Expectations (Bun/Hono/Drizzle)
- Implement HTTP routes and middleware with Hono + TypeScript.
- Use PostgreSQL persistence through Drizzle ORM for runtime feature behavior.
- Run verification with Bun commands from `docs/STACK_PROFILE.md`.
