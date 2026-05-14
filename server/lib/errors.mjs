export class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.expose = Boolean(options.expose);
    this.code = options.code || "APP_ERROR";
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, { expose: true, code: "VALIDATION_ERROR" });
    this.name = "ValidationError";
    this.details = details;
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401, { expose: true, code: "UNAUTHORIZED" });
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404, { expose: true, code: "NOT_FOUND" });
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message, retryAfterSeconds) {
    super(message, 429, { expose: true, code: "RATE_LIMITED" });
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function toSafeErrorResponse(error, isProduction) {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      payload: {
        error: error.expose || !isProduction ? error.message : "Request failed",
        ...(error.details ? { details: error.details } : {}),
        ...(typeof error.retryAfterSeconds === "number"
          ? { retryAfterSeconds: error.retryAfterSeconds }
          : {}),
      },
    };
  }

  return {
    statusCode: 500,
    payload: {
      error: isProduction ? "Internal server error" : (error instanceof Error ? error.message : "Unknown server error"),
    },
  };
}
