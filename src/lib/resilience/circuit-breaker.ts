/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascade failures and provides graceful degradation
 */

export enum CircuitState {
  CLOSED = "closed",
  OPEN = "open",
  HALF_OPEN = "half_open",
}

export interface CircuitBreakerConfig {
  failureThreshold: number; // Number of failures before opening
  successThreshold: number; // Number of successes to close from half-open
  timeout: number; // Time to wait before transitioning to half-open (ms)
  monitoringPeriod: number; // Time window for failure counting (ms)
  expectedErrors?: string[]; // Error types that should not trigger circuit
}

export interface CircuitBreakerMetrics {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime: number | null;
  lastSuccessTime: number | null;
  stateChangedAt: number;
  totalRequests: number;
  totalFailures: number;
  totalSuccesses: number;
}

export class CircuitBreakerError extends Error {
  constructor(
    message: string,
    public state: CircuitState,
    public metrics: CircuitBreakerMetrics,
  ) {
    super(message);
    this.name = "CircuitBreakerError";
  }
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private lastSuccessTime: number | null = null;
  private stateChangedAt = Date.now();
  private totalRequests = 0;
  private totalFailures = 0;
  private totalSuccesses = 0;
  private readonly listeners: Array<(metrics: CircuitBreakerMetrics) => void> =
    [];

  constructor(
    private name: string,
    private config: CircuitBreakerConfig,
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    this.totalRequests++;

    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.transitionTo(CircuitState.HALF_OPEN);
      } else {
        throw new CircuitBreakerError(
          `Circuit breaker '${this.name}' is OPEN`,
          this.state,
          this.getMetrics(),
        );
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.successCount++;
    this.totalSuccesses++;
    this.lastSuccessTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      if (this.successCount >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else if (this.state === CircuitState.CLOSED) {
      this.resetFailureCount();
    }

    this.notifyListeners();
  }

  private onFailure(error: Error): void {
    // Check if this is an expected error that shouldn't trigger circuit
    if (this.isExpectedError(error)) {
      return;
    }

    this.failureCount++;
    this.totalFailures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
    } else if (this.state === CircuitState.CLOSED) {
      if (this.failureCount >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }

    this.notifyListeners();
  }

  private isExpectedError(error: Error): boolean {
    if (!this.config.expectedErrors) return false;

    return this.config.expectedErrors.some(
      (expectedType) =>
        error.name === expectedType || error.message.includes(expectedType),
    );
  }

  private shouldAttemptReset(): boolean {
    const timeSinceStateChange = Date.now() - this.stateChangedAt;
    return timeSinceStateChange >= this.config.timeout;
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.stateChangedAt = Date.now();

    if (newState === CircuitState.CLOSED) {
      this.resetFailureCount();
      this.successCount = 0;
    } else if (newState === CircuitState.HALF_OPEN) {
      this.successCount = 0;
    }

    this.notifyListeners();
  }

  private resetFailureCount(): void {
    this.failureCount = 0;
  }

  private notifyListeners(): void {
    const metrics = this.getMetrics();
    this.listeners.forEach((listener) => {
      try {
        listener(metrics);
      } catch (error) {}
    });
  }

  public getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      stateChangedAt: this.stateChangedAt,
      totalRequests: this.totalRequests,
      totalFailures: this.totalFailures,
      totalSuccesses: this.totalSuccesses,
    };
  }

  public addListener(listener: (metrics: CircuitBreakerMetrics) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(
    listener: (metrics: CircuitBreakerMetrics) => void,
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  public reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.lastSuccessTime = null;
    this.stateChangedAt = Date.now();
    this.notifyListeners();
  }

  public getName(): string {
    return this.name;
  }

  public getState(): CircuitState {
    return this.state;
  }

  public isOpen(): boolean {
    return this.state === CircuitState.OPEN;
  }

  public isClosed(): boolean {
    return this.state === CircuitState.CLOSED;
  }

  public isHalfOpen(): boolean {
    return this.state === CircuitState.HALF_OPEN;
  }
}

// Circuit breaker registry for managing multiple breakers
export class CircuitBreakerRegistry {
  private static instance: CircuitBreakerRegistry;
  private breakers = new Map<string, CircuitBreaker>();

  private constructor() {}

  static getInstance(): CircuitBreakerRegistry {
    if (!CircuitBreakerRegistry.instance) {
      CircuitBreakerRegistry.instance = new CircuitBreakerRegistry();
    }
    return CircuitBreakerRegistry.instance;
  }

  createCircuitBreaker(
    name: string,
    config: CircuitBreakerConfig,
  ): CircuitBreaker {
    if (this.breakers.has(name)) {
      throw new Error(`Circuit breaker '${name}' already exists`);
    }

    const breaker = new CircuitBreaker(name, config);
    this.breakers.set(name, breaker);
    return breaker;
  }

  getCircuitBreaker(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllBreakers(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  getMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    this.breakers.forEach((breaker, name) => {
      metrics[name] = breaker.getMetrics();
    });
    return metrics;
  }

  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }

  removeCircuitBreaker(name: string): boolean {
    return this.breakers.delete(name);
  }
}

// Pre-configured circuit breakers for common services
export const createDefaultCircuitBreakers = () => {
  const registry = CircuitBreakerRegistry.getInstance();

  // Database operations circuit breaker
  registry.createCircuitBreaker("database", {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 30000, // 30 seconds
    monitoringPeriod: 60000, // 1 minute
    expectedErrors: ["ValidationError", "NotFoundError"],
  });

  // AI service circuit breaker
  registry.createCircuitBreaker("ai-service", {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 60000, // 1 minute
    monitoringPeriod: 300000, // 5 minutes
    expectedErrors: ["RateLimitError", "InvalidInputError"],
  });

  // File upload circuit breaker
  registry.createCircuitBreaker("file-upload", {
    failureThreshold: 10,
    successThreshold: 5,
    timeout: 15000, // 15 seconds
    monitoringPeriod: 60000, // 1 minute
    expectedErrors: ["FileTooLargeError", "InvalidFileTypeError"],
  });

  // External API circuit breaker
  registry.createCircuitBreaker("external-api", {
    failureThreshold: 5,
    successThreshold: 3,
    timeout: 45000, // 45 seconds
    monitoringPeriod: 120000, // 2 minutes
    expectedErrors: ["TimeoutError", "AuthenticationError"],
  });

  return registry;
};

// Utility function to wrap any async function with circuit breaker
export function withCircuitBreaker<T extends any[], R>(
  name: string,
  fn: (...args: T) => Promise<R>,
  config?: CircuitBreakerConfig,
): (...args: T) => Promise<R> {
  const registry = CircuitBreakerRegistry.getInstance();

  let breaker = registry.getCircuitBreaker(name);
  if (!breaker && config) {
    breaker = registry.createCircuitBreaker(name, config);
  }

  if (!breaker) {
    throw new Error(
      `Circuit breaker '${name}' not found and no config provided`,
    );
  }

  return async (...args: T): Promise<R> => {
    return breaker!.execute(() => fn(...args));
  };
}

// Export registry instance
export const circuitBreakerRegistry = CircuitBreakerRegistry.getInstance();
