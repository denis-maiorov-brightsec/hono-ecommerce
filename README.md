# Hono E-commerce Backoffice API (Spec-Driven)

This repository is a Bun + TypeScript + Hono scaffold for iterative ecommerce backoffice API development driven by dependency-ordered specs.

## Stack

- Runtime/package manager/test runner: Bun
- Language: TypeScript
- API framework: Hono
- Persistence: Drizzle ORM + PostgreSQL
- Lint: ESLint

## Specs Workflow

- Backlog/dependencies: `docs/SPECS_INDEX.md`
- Stack/tooling contract: `docs/STACK_PROFILE.md`
- Per-spec implementation docs: `docs/specs/*.md`

Implement exactly one ready spec per run.

## Local setup

1. Copy env file:

```bash
cp .env.example .env
```

2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Install dependencies:

```bash
bun install
```

4. Start API in dev mode:

```bash
bun run dev
```

## Quality gates

```bash
bun run lint
bun run typecheck
bun test
bun test test/integration
```

## DB commands

```bash
bun run db:generate
bun run db:migrate
```

## Harness

```bash
bun run specs:auto --dry-run
```
