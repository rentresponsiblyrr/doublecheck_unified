/**
 * Error Recovery Provider
 * Replaces nuclear error patterns with professional recovery mechanisms
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
} from "react";
import { logger } from "../utils/logger";

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

interface ErrorRecoveryState {
  retryCount: number;
  lastError: Error | null;
  isRecovering: boolean;
  recoveryMessage: string;
}

interface ErrorRecoveryContextType {
  // Core recovery methods
  recoverFromError: (error: Error, component: string) => Promise<boolean>;
  resetErrorState: () => void;
  retryOperation: (
    operation: () => Promise<void>,
    config?: Partial<RetryConfig>,
  ) => Promise<boolean>;

  // State access
  errorState: ErrorRecoveryState;

  // Configuration
  setRetryConfig: (config: Partial<RetryConfig>) => void;
}

const defaultRetryConfig: RetryConfig = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

const ErrorRecoveryContext = createContext<ErrorRecoveryContextType | null>(
  null,
);

export const useErrorRecovery = () => {
  const context = useContext(ErrorRecoveryContext);
  if (!context) {
    throw new Error(
      "useErrorRecovery must be used within ErrorRecoveryProvider",
    );
  }
  return context;
};

interface ErrorRecoveryProviderProps {
  children: ReactNode;
  defaultConfig?: Partial<RetryConfig>;
}

export const ErrorRecoveryProvider: React.FC<ErrorRecoveryProviderProps> = ({
  children,
  defaultConfig = {},
}) => {
  const [retryConfig, setRetryConfigState] = useState<RetryConfig>({
    ...defaultRetryConfig,
    ...defaultConfig,
  });

  const [errorState, setErrorState] = useState<ErrorRecoveryState>({
    retryCount: 0,
    lastError: null,
    isRecovering: false,
    recoveryMessage: "",
  });

  const resetErrorState = useCallback(() => {
    setErrorState({
      retryCount: 0,
      lastError: null,
      isRecovering: false,
      recoveryMessage: "",
    });
  }, []);

  const setRetryConfig = useCallback((config: Partial<RetryConfig>) => {
    setRetryConfigState((prev) => ({ ...prev, ...config }));
  }, []);

  const calculateDelay = useCallback(
    (attemptNumber: number): number => {
      const delay =
        retryConfig.baseDelay *
        Math.pow(retryConfig.backoffMultiplier, attemptNumber - 1);
      return Math.min(delay, retryConfig.maxDelay);
    },
    [retryConfig],
  );

  const sleep = useCallback((ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }, []);

  const retryOperation = useCallback(
    async (
      operation: () => Promise<void>,
      config: Partial<RetryConfig> = {},
    ): Promise<boolean> => {
      const effectiveConfig = { ...retryConfig, ...config };
      let lastError: Error | null = null;

      setErrorState((prev) => ({
        ...prev,
        isRecovering: true,
        retryCount: 0,
        recoveryMessage: "Attempting recovery...",
      }));

      for (let attempt = 1; attempt <= effectiveConfig.maxAttempts; attempt++) {
        try {
          setErrorState((prev) => ({
            ...prev,
            retryCount: attempt,
            recoveryMessage: `Attempt ${attempt}/${effectiveConfig.maxAttempts}...`,
          }));

          await operation();

          logger.logInfo("Operation retry succeeded", {
            component: "ErrorRecoveryProvider",
            attempt,
            totalAttempts: effectiveConfig.maxAttempts,
          });

          setErrorState((prev) => ({
            ...prev,
            isRecovering: false,
            recoveryMessage: "Recovery successful",
          }));

          return true;
        } catch (error) {
          lastError = error as Error;

          logger.logWarning("Operation retry failed", {
            component: "ErrorRecoveryProvider",
            attempt,
            totalAttempts: effectiveConfig.maxAttempts,
            error: lastError.message,
          });

          if (attempt < effectiveConfig.maxAttempts) {
            const delay = calculateDelay(attempt);
            setErrorState((prev) => ({
              ...prev,
              recoveryMessage: `Retrying in ${Math.round(delay / 1000)}s...`,
            }));
            await sleep(delay);
          }
        }
      }

      setErrorState((prev) => ({
        ...prev,
        isRecovering: false,
        lastError,
        recoveryMessage: "Recovery failed after all attempts",
      }));

      logger.logError(
        "Operation retry exhausted",
        lastError || new Error("Unknown error"),
        {
          component: "ErrorRecoveryProvider",
          totalAttempts: effectiveConfig.maxAttempts,
        },
      );

      return false;
    },
    [retryConfig, calculateDelay, sleep],
  );

  const recoverFromError = useCallback(
    async (error: Error, component: string): Promise<boolean> => {
      logger.logError(`Error in ${component}`, error, {
        component: "ErrorRecoveryProvider",
        sourceComponent: component,
        action: "recoverFromError",
      });

      setErrorState((prev) => ({
        ...prev,
        lastError: error,
        isRecovering: true,
        recoveryMessage: "Analyzing error and attempting recovery...",
      }));

      // Analyze error type and determine recovery strategy
      const errorMessage = error.message.toLowerCase();

      // Network errors - retry with exponential backoff
      if (
        errorMessage.includes("network") ||
        errorMessage.includes("fetch") ||
        errorMessage.includes("timeout")
      ) {
        return await retryOperation(
          async () => {
            // Trigger component re-render/re-initialization
            window.dispatchEvent(
              new CustomEvent("component-recovery", {
                detail: { component, errorType: "network" },
              }),
            );
          },
          { maxAttempts: 5 },
        );
      }

      // Authentication errors - attempt token refresh
      if (
        errorMessage.includes("auth") ||
        errorMessage.includes("unauthorized") ||
        errorMessage.includes("token")
      ) {
        return await retryOperation(
          async () => {
            window.dispatchEvent(
              new CustomEvent("auth-recovery", {
                detail: { component, errorType: "auth" },
              }),
            );
          },
          { maxAttempts: 2 },
        );
      }

      // Database/API errors - basic retry
      if (
        errorMessage.includes("database") ||
        errorMessage.includes("api") ||
        errorMessage.includes("server")
      ) {
        return await retryOperation(
          async () => {
            window.dispatchEvent(
              new CustomEvent("api-recovery", {
                detail: { component, errorType: "api" },
              }),
            );
          },
          { maxAttempts: 3 },
        );
      }

      // Component errors - attempt state reset
      return await retryOperation(
        async () => {
          window.dispatchEvent(
            new CustomEvent("state-recovery", {
              detail: { component, errorType: "component" },
            }),
          );
        },
        { maxAttempts: 1 },
      );
    },
    [retryOperation],
  );

  const contextValue: ErrorRecoveryContextType = {
    recoverFromError,
    resetErrorState,
    retryOperation,
    errorState,
    setRetryConfig,
  };

  return (
    <ErrorRecoveryContext.Provider value={contextValue}>
      {children}
    </ErrorRecoveryContext.Provider>
  );
};
