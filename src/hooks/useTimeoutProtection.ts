import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface TimeoutConfig {
  timeout?: number;
  fallbackValue?: any;
  retryAttempts?: number;
  retryDelay?: number;
}

export const useTimeoutProtection = () => {
  const [isRetrying, setIsRetrying] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const executeWithTimeout = useCallback(async <T>(
    asyncFunction: () => Promise<T>,
    config: TimeoutConfig = {}
  ): Promise<T> => {
    const {
      timeout = 30000, // 30 segundos default
      fallbackValue = null,
      retryAttempts = 2,
      retryDelay = 1000
    } = config;

    // Cancelar operación anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        setIsRetrying(attempt > 0);

        const result = await Promise.race([
          asyncFunction(),
          new Promise<never>((_, reject) => {
            const timeoutId = setTimeout(() => {
              reject(new Error(`Operation timed out after ${timeout}ms`));
            }, timeout);

            // Limpiar timeout si se cancela
            abortControllerRef.current?.signal.addEventListener('abort', () => {
              clearTimeout(timeoutId);
              reject(new Error('Operation aborted'));
            });
          })
        ]);

        setIsRetrying(false);
        return result;

      } catch (error) {
        console.warn(`Attempt ${attempt + 1} failed:`, error);

        if (attempt === retryAttempts) {
          setIsRetrying(false);
          
          if (error instanceof Error && error.message.includes('timed out')) {
            toast.warning('La consulta está tardando más de lo normal. Usando datos de respaldo.');
            return fallbackValue as T;
          }
          
          throw error;
        }

        // Esperar antes del siguiente intento
        if (attempt < retryAttempts) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw new Error('Max retry attempts reached');
  }, []);

  const cancelOperation = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsRetrying(false);
    }
  }, []);

  return {
    executeWithTimeout,
    cancelOperation,
    isRetrying
  };
};

// Hook específico para métricas que siempre devuelve valores válidos
export const useMetricsWithFallback = () => {
  const { executeWithTimeout, isRetrying } = useTimeoutProtection();

  const getMetricSafely = useCallback(async <T>(
    metricFunction: () => Promise<T>,
    fallback: T,
    metricName: string
  ): Promise<T> => {
    try {
      return await executeWithTimeout(metricFunction, {
        timeout: 15000, // 15 segundos para métricas
        fallbackValue: fallback,
        retryAttempts: 1
      });
    } catch (error) {
      console.error(`Error loading ${metricName}:`, error);
      toast.error(`Error cargando ${metricName}. Usando valores de respaldo.`);
      return fallback;
    }
  }, [executeWithTimeout]);

  return {
    getMetricSafely,
    isRetrying
  };
};