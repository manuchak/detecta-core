export interface CircuitBreakerConfig {
  maxConsecutiveFailures: number;
  maxFailureRate: number; // percentage (0-100)
  sampleSize: number; // minimum records to evaluate failure rate
  cooldownPeriod: number; // seconds
}

export interface CircuitBreakerState {
  consecutiveFailures: number;
  totalProcessed: number;
  totalFailed: number;
  isOpen: boolean; // true = circuit is open (blocking)
  lastFailureTime: number;
  errorsByType: Record<string, number>;
}

export class CircuitBreaker {
  private config: CircuitBreakerConfig;
  private state: CircuitBreakerState;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      maxConsecutiveFailures: 10,
      maxFailureRate: 20, // 20%
      sampleSize: 50,
      cooldownPeriod: 60, // 1 minute
      ...config
    };

    this.state = {
      consecutiveFailures: 0,
      totalProcessed: 0,
      totalFailed: 0,
      isOpen: false,
      lastFailureTime: 0,
      errorsByType: {}
    };
  }

  recordSuccess(): void {
    this.state.consecutiveFailures = 0;
    this.state.totalProcessed++;
    
    // Check if circuit can be closed after cooldown
    if (this.state.isOpen && this.shouldClosCircuit()) {
      this.state.isOpen = false;
      console.log('🔄 Circuit breaker closed - resuming operations');
    }
  }

  recordFailure(errorType: string = 'unknown'): boolean {
    this.state.consecutiveFailures++;
    this.state.totalProcessed++;
    this.state.totalFailed++;
    this.state.lastFailureTime = Date.now();
    
    // Track error types
    this.state.errorsByType[errorType] = (this.state.errorsByType[errorType] || 0) + 1;

    // Check if circuit should open
    if (this.shouldOpenCircuit()) {
      this.state.isOpen = true;
      console.warn('⚠️ Circuit breaker OPENED - stopping operations');
      return true; // Circuit opened
    }

    return false; // Circuit still closed
  }

  isCircuitOpen(): boolean {
    return this.state.isOpen;
  }

  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  getFailureRate(): number {
    if (this.state.totalProcessed === 0) return 0;
    return (this.state.totalFailed / this.state.totalProcessed) * 100;
  }

  getErrorReport(): string {
    const failureRate = this.getFailureRate();
    const topErrors = Object.entries(this.state.errorsByType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');

    return `Tasa de falla: ${failureRate.toFixed(1)}% (${this.state.totalFailed}/${this.state.totalProcessed}). ` +
           `Errores consecutivos: ${this.state.consecutiveFailures}. ` +
           `Principales errores: ${topErrors || 'ninguno'}`;
  }

  private shouldOpenCircuit(): boolean {
    // Open if too many consecutive failures
    if (this.state.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      return true;
    }

    // Open if failure rate is too high (but only after minimum sample)
    if (this.state.totalProcessed >= this.config.sampleSize) {
      const failureRate = this.getFailureRate();
      if (failureRate >= this.config.maxFailureRate) {
        return true;
      }
    }

    return false;
  }

  private shouldClosCircuit(): boolean {
    const now = Date.now();
    const timeSinceLastFailure = (now - this.state.lastFailureTime) / 1000;
    return timeSinceLastFailure >= this.config.cooldownPeriod;
  }

  reset(): void {
    this.state = {
      consecutiveFailures: 0,
      totalProcessed: 0,
      totalFailed: 0,
      isOpen: false,
      lastFailureTime: 0,
      errorsByType: {}
    };
  }
}