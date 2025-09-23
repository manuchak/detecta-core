interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface AddressMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheHitRate: number;
  averageResponseTime: number;
  errorRate: number;
}

class AddressCache {
  private cache = new Map<string, CacheEntry>();
  private requestPromises = new Map<string, Promise<any>>();
  private metrics: AddressMetrics = {
    totalRequests: 0,
    cacheHits: 0,
    cacheHitRate: 0,
    averageResponseTime: 0,
    errorRate: 0
  };
  private responseTimes: number[] = [];
  private recentSearches: string[] = [];
  private readonly MAX_RECENT_SEARCHES = 10;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Get cached data if valid
  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    this.metrics.cacheHits++;
    return entry.data;
  }

  // Set cache entry
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  // Check if request is already in progress
  getInFlightRequest(key: string): Promise<any> | null {
    return this.requestPromises.get(key) || null;
  }

  // Set in-flight request promise
  setInFlightRequest(key: string, promise: Promise<any>): void {
    this.requestPromises.set(key, promise);
    
    // Clean up when promise resolves/rejects
    promise.finally(() => {
      this.requestPromises.delete(key);
    });
  }

  // Get similar cached results for partial matches
  getSimilarResults(query: string, minLength = 4): any[] {
    const results: any[] = [];
    const normalizedQuery = query.toLowerCase().trim();
    
    if (normalizedQuery.length < minLength) return results;

    for (const [key, entry] of this.cache.entries()) {
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        continue;
      }

      const normalizedKey = key.toLowerCase();
      if (normalizedKey.includes(normalizedQuery) && entry.data?.suggestions) {
        results.push(...entry.data.suggestions);
      }
    }

    // Remove duplicates and limit results
    const uniqueResults = results.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );

    return uniqueResults.slice(0, 5);
  }

  // Add to recent searches
  addToRecent(query: string): void {
    const normalized = query.trim();
    if (normalized.length < 3) return;

    this.recentSearches = [
      normalized,
      ...this.recentSearches.filter(q => q !== normalized)
    ].slice(0, this.MAX_RECENT_SEARCHES);
  }

  // Get recent searches
  getRecentSearches(): string[] {
    return [...this.recentSearches];
  }

  // Record performance metrics
  recordRequest(responseTime: number, isError = false): void {
    this.metrics.totalRequests++;
    
    if (isError) {
      this.metrics.errorRate = ((this.metrics.totalRequests - 1) * this.metrics.errorRate + 1) / this.metrics.totalRequests;
    }
    
    this.responseTimes.push(responseTime);
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
    
    this.metrics.averageResponseTime = 
      this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
    
    this.metrics.cacheHitRate = 
      this.metrics.totalRequests > 0 ? this.metrics.cacheHits / this.metrics.totalRequests : 0;
  }

  // Get performance metrics
  getMetrics(): AddressMetrics {
    return { ...this.metrics };
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
    this.requestPromises.clear();
    this.recentSearches = [];
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }
}

// Network speed detection
export const detectNetworkSpeed = (): 'slow' | 'fast' => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      return ['slow-2g', '2g', '3g'].includes(effectiveType) ? 'slow' : 'fast';
    }
  }
  return 'fast';
};

// Adaptive timing based on network speed
export const getAdaptiveTiming = () => {
  const networkSpeed = detectNetworkSpeed();
  
  return {
    debounce: networkSpeed === 'slow' ? 800 : 600,
    throttle: networkSpeed === 'slow' ? 1500 : 1000,
    minChars: networkSpeed === 'slow' ? 5 : 4,
    retryDelay: networkSpeed === 'slow' ? 3000 : 2000
  };
};

// Global instance
export const addressCache = new AddressCache();

// Auto cleanup every 10 minutes
setInterval(() => {
  addressCache.cleanup();
}, 10 * 60 * 1000);