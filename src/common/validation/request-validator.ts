import type { Context, MiddlewareHandler } from "hono";
import type { ZodIssue, ZodType } from "zod";

import { ValidationError, type ValidationDetail } from "../errors";

export type ValidationTarget = "json" | "query" | "param";

function mapZodIssuesToDetails(
  issues: ZodIssue[],
  target: ValidationTarget
): ValidationDetail[] {
  const grouped = new Map<string, Set<string>>();

  for (const issue of issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : target;
    const constraints = grouped.get(field);

    if (constraints) {
      constraints.add(issue.message);
      continue;
    }

    grouped.set(field, new Set([issue.message]));
  }

  return Array.from(grouped.entries()).map(([field, constraints]) => ({
    field,
    constraints: Array.from(constraints)
  }));
}

async function readValidationInput(
  c: Context,
  target: ValidationTarget
): Promise<unknown> {
  if (target === "json") {
    try {
      return await c.req.json();
    } catch {
      throw new ValidationError([
        {
          field: "body",
          constraints: ["body must be valid JSON"]
        }
      ]);
    }
  }

  if (target === "query") {
    return c.req.query();
  }

  return c.req.param();
}

export function validateRequest<TOutput>(
  target: ValidationTarget,
  schema: ZodType<TOutput>
): MiddlewareHandler {
  return async (c, next) => {
    const input = await readValidationInput(c, target);
    const parsed = schema.safeParse(input);

    if (!parsed.success) {
      throw new ValidationError(mapZodIssuesToDetails(parsed.error.issues, target));
    }

    c.set(`validated:${target}`, parsed.data);

    await next();
  };
}

export function getValidatedData<TOutput>(
  c: Context,
  target: ValidationTarget
): TOutput {
  return c.get(`validated:${target}`) as TOutput;
}
