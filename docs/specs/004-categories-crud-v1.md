# Spec 004: Add `/v1/categories` CRUD

## Goal
Add categories resource to support product grouping.

## Scope
- Endpoints:
  - `GET /v1/categories`
  - `GET /v1/categories/:id`
  - `POST /v1/categories`
  - `PATCH /v1/categories/:id`
  - `DELETE /v1/categories/:id`
- Category fields:
  - `id`, `name`, `slug`, `description?`, `createdAt`, `updatedAt`

## Out of scope
- Cascading delete strategy for related products unless explicitly required.

## Behavior rules
- `slug` is unique.
- Duplicate `slug` returns conflict (`409`) with standard envelope.
- `DELETE` semantics match products behavior from spec 003.

## Acceptance criteria
- Full CRUD behavior implemented and validated.
- Error envelope and validation behavior consistent with spec 002.
- Integration tests cover duplicate slug and not-found paths.

## Verification
- Run resource-specific and e2e tests.

## Stack Expectations (Bun/Hono/Drizzle)
- Implement HTTP routes and middleware with Hono + TypeScript.
- Use PostgreSQL persistence through Drizzle ORM for runtime feature behavior.
- Run verification with Bun commands from `docs/STACK_PROFILE.md`.
