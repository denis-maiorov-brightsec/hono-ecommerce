# Spec 007: Add `/v1/orders/:id/cancel` State Transition

## Goal
Support explicit order cancellation as a controlled state transition.

## Scope
- Add `POST /v1/orders/:id/cancel`.
- Enforce allowed transitions: only `pending` -> `cancelled` is allowed.
- Persist transition timestamp/audit fields if project conventions require.

## Out of scope
- Refund/payment side effects.
- Event bus integrations.

## Acceptance criteria
- Canceling eligible order returns success with updated order.
- Canceling non-existing order returns `404`.
- Canceling ineligible status returns conflict/business-rule error (`409`).
- Transition rules are covered by deterministic tests.

## Verification
- Integration/e2e tests for valid and invalid transition scenarios.

## Stack Expectations (Bun/Hono/Drizzle)
- Implement HTTP routes and middleware with Hono + TypeScript.
- Use PostgreSQL persistence through Drizzle ORM for runtime feature behavior.
- Run verification with Bun commands from `docs/STACK_PROFILE.md`.
