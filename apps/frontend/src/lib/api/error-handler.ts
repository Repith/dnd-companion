import axios, { AxiosError } from "axios";

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  retryable?: boolean;
}

export class ApiErrorHandler {
  static parseError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const data = axiosError.response?.data as any;

      // Handle different error types
      if (status === 400) {
        return {
          message: data?.message || "Invalid request data",
          status,
          code: "BAD_REQUEST",
          retryable: false,
        };
      }

      if (status === 401) {
        return {
          message: "Authentication required",
          status,
          code: "UNAUTHORIZED",
          retryable: false,
        };
      }

      if (status === 403) {
        return {
          message: "Access denied",
          status,
          code: "FORBIDDEN",
          retryable: false,
        };
      }

      if (status === 404) {
        return {
          message: data?.message || "Resource not found",
          status,
          code: "NOT_FOUND",
          retryable: false,
        };
      }

      if (status === 409) {
        return {
          message: data?.message || "Conflict with existing data",
          status,
          code: "CONFLICT",
          retryable: false,
        };
      }

      if (status === 422) {
        return {
          message: data?.message || "Validation failed",
          status,
          code: "VALIDATION_ERROR",
          retryable: false,
        };
      }

      if (status === 429) {
        return {
          message: "Too many requests. Please try again later.",
          status,
          code: "RATE_LIMITED",
          retryable: true,
        };
      }

      if (status && status >= 500) {
        return {
          message: "Server error. Please try again.",
          status,
          code: "SERVER_ERROR",
          retryable: true,
        };
      }

      // Network errors
      if (!axiosError.response) {
        return {
          message: "Network error. Please check your connection.",
          code: "NETWORK_ERROR",
          retryable: true,
        };
      }

      // Default error
      return {
        message:
          data?.message || axiosError.message || "An unexpected error occurred",
        status,
        code: "UNKNOWN_ERROR",
        retryable: false,
      };
    }

    // Non-Axios errors
    if (error instanceof Error) {
      return {
        message: error.message,
        code: "UNKNOWN_ERROR",
        retryable: false,
      };
    }

    return {
      message: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      retryable: false,
    };
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      delayMs?: number;
      backoffMultiplier?: number;
      retryCondition?: (error: ApiError) => boolean;
    } = {},
  ): Promise<T> {
    const {
      maxRetries = 3,
      delayMs = 1000,
      backoffMultiplier = 2,
      retryCondition = (error) => error.retryable !== false,
    } = options;

    let lastError: ApiError;
    let currentDelay = delayMs;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = ApiErrorHandler.parseError(error);

        // Don't retry if this is the last attempt or error is not retryable
        if (attempt === maxRetries || !retryCondition(lastError)) {
          throw lastError;
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }

    throw lastError!;
  }
}

export const handleApiError = ApiErrorHandler.parseError;
export const withApiRetry = ApiErrorHandler.withRetry;
