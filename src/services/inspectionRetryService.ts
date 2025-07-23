import { log } from "@/lib/logging/enterprise-logger";

export class InspectionRetryService {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
  ): Promise<T> {
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < maxAttempts) {
      attempts++;
      log.debug(
        "Executing operation attempt",
        {
          component: "InspectionRetryService",
          action: "executeWithRetry",
          attempt: attempts,
          maxAttempts,
          baseDelay,
        },
        "RETRY_ATTEMPT_STARTED",
      );

      try {
        const result = await operation();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        log.error(
          "Retry attempt failed",
          lastError,
          {
            component: "InspectionRetryService",
            action: "executeWithRetry",
            attempt: attempts,
            maxAttempts,
            nextDelay:
              attempts < maxAttempts ? baseDelay * (attempts + 1) : null,
          },
          "RETRY_ATTEMPT_FAILED",
        );

        if (attempts === maxAttempts) {
          break;
        }

        // Wait before retry with exponential backoff
        const delay = baseDelay * attempts;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw (
      lastError ||
      new Error("Failed to execute operation after multiple attempts")
    );
  }
}
