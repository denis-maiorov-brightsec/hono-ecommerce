# Spec 011: Request ID + Structured Request Logging Middleware

## Goal
Improve observability with per-request correlation IDs and structured logs.

## Scope
- Inject request ID (accept incoming header or generate one).
- Include request ID in response headers.
- Emit structured request logs with status, latency, method/path, and request ID.

## Out of scope
- Full distributed tracing integration.
- Log shipping pipeline setup.

## Acceptance criteria
- Every request has a request ID available in handlers and logs.
- Response includes request ID header.
- Logs use structured format aligned with stack conventions.
- Tests verify request ID propagation behavior.

## Verification
- Integration tests plus manual request/response header checks.

## Stack Expectations (Bun/Hono/Drizzle)
- Implement HTTP routes and middleware with Hono + TypeScript.
- Use PostgreSQL persistence through Drizzle ORM for runtime feature behavior.
- Run verification with Bun commands from `docs/STACK_PROFILE.md`.
