import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ValidationDetail = {
  field: string;
  constraints: string[];
};

export type ErrorEnvelope = {
  timestamp: string;
  path: string;
  error: {
    code: string;
    message: string;
    details?: ValidationDetail[];
  };
};

export const INTERNAL_SERVER_ERROR_CODE = "INTERNAL_SERVER_ERROR";
export const INTERNAL_SERVER_ERROR_MESSAGE = "Internal server error";
export const NOT_FOUND_ERROR_CODE = "NOT_FOUND";
export const NOT_FOUND_MESSAGE = "Route not found";
export const VALIDATION_ERROR_CODE = "VALIDATION_ERROR";
export const VALIDATION_ERROR_MESSAGE = "Request validation failed";

export class ApiError extends Error {
  constructor(
    public readonly status: ContentfulStatusCode,
    public readonly code: string,
    message: string,
    public readonly details?: ValidationDetail[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(details: ValidationDetail[]) {
    super(400, VALIDATION_ERROR_CODE, VALIDATION_ERROR_MESSAGE, details);
    this.name = "ValidationError";
  }
}

export function buildErrorEnvelope(
  path: string,
  code: string,
  message: string,
  details?: ValidationDetail[]
): ErrorEnvelope {
  return {
    timestamp: new Date().toISOString(),
    path,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    }
  };
}

export function buildInternalServerErrorEnvelope(path: string): ErrorEnvelope {
  return buildErrorEnvelope(
    path,
    INTERNAL_SERVER_ERROR_CODE,
    INTERNAL_SERVER_ERROR_MESSAGE
  );
}
