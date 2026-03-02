import type { Hono } from "hono";
import { ZodError, type ZodIssue } from "zod";

import { ValidationError, type ValidationDetail } from "../errors";

function mapZodIssuesToDetails(issues: ZodIssue[]): ValidationDetail[] {
  const grouped = new Map<string, Set<string>>();

  for (const issue of issues) {
    const field = issue.path.length > 0 ? issue.path.join(".") : "request";
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

export function registerValidationPipeline(app: Hono<any>): void {
  app.use("*", async (_c, next) => {
    try {
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new ValidationError(mapZodIssuesToDetails(error.issues));
      }

      throw error;
    }
  });
}
