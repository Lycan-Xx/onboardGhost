/**
 * Error handling utilities and custom error classes
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class GitHubAPIError extends AppError {
  constructor(message: string, statusCode: number, details?: any) {
    super(message, 'GITHUB_API_ERROR', statusCode, details);
    this.name = 'GitHubAPIError';
  }
}

export class GeminiAPIError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'GEMINI_API_ERROR', 500, details);
    this.name = 'GeminiAPIError';
  }
}

export class FirebaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'FIREBASE_ERROR', 500, details);
    this.name = 'FirebaseError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string, resetTime?: Date) {
    super(message, 'RATE_LIMIT_ERROR', 429, { resetTime });
    this.name = 'RateLimitError';
  }
}

export class AnalysisTimeoutError extends AppError {
  constructor(message: string = 'Analysis timeout. Repository may be too complex.') {
    super(message, 'ANALYSIS_TIMEOUT', 408);
    this.name = 'AnalysisTimeoutError';
  }
}

/**
 * Formats an error for user display
 */
export function formatErrorForUser(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Logs error details to console
 */
export function logError(error: unknown, context?: string): void {
  const prefix = context ? `[${context}]` : '';
  
  if (error instanceof AppError) {
    console.error(`${prefix} ${error.name}:`, {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
    });
  } else if (error instanceof Error) {
    console.error(`${prefix} Error:`, error.message, error.stack);
  } else {
    console.error(`${prefix} Unknown error:`, error);
  }
}

/**
 * Handles errors in API routes
 */
export function handleAPIError(error: unknown): {
  message: string;
  code: string;
  statusCode: number;
} {
  logError(error, 'API');
  
  if (error instanceof AppError) {
    return {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
    };
  }
  
  return {
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    statusCode: 500,
  };
}
