import type { Context, MiddlewareHandler } from "hono";

import { ApiError } from "../errors";

export type AuthRole = "promotions:manage" | "catalog:read";

export type AuthContext = {
  subject: string;
  roles: AuthRole[];
};

export const PROMOTIONS_MANAGE_ROLE: AuthRole = "promotions:manage";

export const AUTH_TEST_TOKENS = {
  PROMOTIONS_MANAGER: "stub-promotions-manager",
  CATALOG_VIEWER: "stub-catalog-viewer"
} as const;

const AUTH_CONTEXT_KEY = "auth:context";
const AUTHENTICATION_REQUIRED_CODE = "AUTHENTICATION_REQUIRED";
const AUTHENTICATION_REQUIRED_MESSAGE = "Authentication required";
const FORBIDDEN_CODE = "FORBIDDEN";
const FORBIDDEN_MESSAGE = "Forbidden";

const AUTH_CONTEXT_BY_TOKEN: Record<string, AuthContext> = {
  [AUTH_TEST_TOKENS.PROMOTIONS_MANAGER]: {
    subject: "stub-promotions-manager",
    roles: [PROMOTIONS_MANAGE_ROLE]
  },
  [AUTH_TEST_TOKENS.CATALOG_VIEWER]: {
    subject: "stub-catalog-viewer",
    roles: ["catalog:read"]
  }
};

function readBearerToken(c: Context): string | undefined {
  const authorization = c.req.header("authorization");

  if (!authorization) {
    return undefined;
  }

  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return undefined;
  }

  return token;
}

function readAuthContext(c: Context): AuthContext | undefined {
  const token = readBearerToken(c);
  return token ? AUTH_CONTEXT_BY_TOKEN[token] : undefined;
}

export function requireAuthenticated(): MiddlewareHandler {
  return async (c, next) => {
    const authContext = readAuthContext(c);

    if (!authContext) {
      throw new ApiError(
        401,
        AUTHENTICATION_REQUIRED_CODE,
        AUTHENTICATION_REQUIRED_MESSAGE
      );
    }

    c.set(AUTH_CONTEXT_KEY, authContext);

    await next();
  };
}

export function requireRoles(requiredRoles: AuthRole[]): MiddlewareHandler {
  return async (c, next) => {
    const authContext = c.get(AUTH_CONTEXT_KEY) as AuthContext | undefined;

    if (!authContext) {
      throw new ApiError(
        401,
        AUTHENTICATION_REQUIRED_CODE,
        AUTHENTICATION_REQUIRED_MESSAGE
      );
    }

    const hasAllRequiredRoles = requiredRoles.every((role) =>
      authContext.roles.includes(role)
    );

    if (!hasAllRequiredRoles) {
      throw new ApiError(403, FORBIDDEN_CODE, FORBIDDEN_MESSAGE);
    }

    await next();
  };
}
