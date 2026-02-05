 /**
  * Utilidades para reintentos con backoff exponencial y jitter
  * Previene "thundering herd" cuando múltiples dispositivos reintenten simultáneamente
  */
 
 export interface RetryConfig {
   maxAttempts: number;
   baseDelayMs: number;
   maxDelayMs: number;
   jitterPercent: number;
 }
 
 const DEFAULT_RETRY_CONFIG: RetryConfig = {
   maxAttempts: 5,
   baseDelayMs: 1000,
   maxDelayMs: 30000,
   jitterPercent: 0.3,
 };
 
 /**
  * Calcula el delay con backoff exponencial y jitter
  * Ejemplo: attempt 1 = 1000ms ± 300ms, attempt 2 = 2000ms ± 600ms, etc.
  */
 export function calculateBackoffDelay(
   attempt: number,
   config: Partial<RetryConfig> = {}
 ): number {
   const { baseDelayMs, maxDelayMs, jitterPercent } = { ...DEFAULT_RETRY_CONFIG, ...config };
 
   // Backoff exponencial: baseDelay * 2^(attempt-1)
   const exponentialDelay = baseDelayMs * Math.pow(2, attempt - 1);
   
   // Limitar al máximo
   const cappedDelay = Math.min(exponentialDelay, maxDelayMs);
 
   // Aplicar jitter: ±jitterPercent del delay
   const jitterRange = cappedDelay * jitterPercent;
   const jitter = (Math.random() * 2 - 1) * jitterRange;
 
   return Math.max(0, Math.round(cappedDelay + jitter));
 }
 
 /**
  * Espera un tiempo determinado
  */
 export function sleep(ms: number): Promise<void> {
   return new Promise((resolve) => setTimeout(resolve, ms));
 }
 
 /**
  * Ejecuta una función con reintentos automáticos y backoff exponencial
  */
 export async function withRetry<T>(
   fn: () => Promise<T>,
   config: Partial<RetryConfig> = {},
   onRetry?: (attempt: number, delay: number, error: Error) => void
 ): Promise<T> {
   const { maxAttempts } = { ...DEFAULT_RETRY_CONFIG, ...config };
   let lastError: Error | null = null;
 
   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
     try {
       return await fn();
     } catch (error) {
       lastError = error instanceof Error ? error : new Error(String(error));
 
       if (attempt === maxAttempts) {
         console.error(`[Retry] Fallido después de ${maxAttempts} intentos:`, lastError.message);
         throw lastError;
       }
 
       const delay = calculateBackoffDelay(attempt, config);
       
       console.log(`[Retry] Intento ${attempt}/${maxAttempts} fallido, esperando ${delay}ms...`);
       onRetry?.(attempt, delay, lastError);
 
       await sleep(delay);
     }
   }
 
   throw lastError || new Error('Retry failed');
 }
 
 /**
  * Determina si un error es retryable (transiente vs permanente)
  */
 export function isRetryableError(error: unknown): boolean {
   if (error instanceof Error) {
     const message = error.message.toLowerCase();
     
     // Errores de red transitorios
     if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
       return true;
     }
     
     // Errores de rate limiting
     if (message.includes('429') || message.includes('rate limit') || message.includes('too many')) {
       return true;
     }
     
     // Errores de servidor temporales
     if (message.includes('502') || message.includes('503') || message.includes('504')) {
       return true;
     }
   }
   
   return false;
 }
 
 /**
  * Ejecuta con retry solo si el error es retryable
  */
 export async function withSmartRetry<T>(
   fn: () => Promise<T>,
   config: Partial<RetryConfig> = {},
   onRetry?: (attempt: number, delay: number, error: Error) => void
 ): Promise<T> {
   const { maxAttempts } = { ...DEFAULT_RETRY_CONFIG, ...config };
   let lastError: Error | null = null;
 
   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
     try {
       return await fn();
     } catch (error) {
       lastError = error instanceof Error ? error : new Error(String(error));
 
       // Si no es retryable, fallar inmediatamente
       if (!isRetryableError(lastError)) {
         console.error(`[SmartRetry] Error no retryable:`, lastError.message);
         throw lastError;
       }
 
       if (attempt === maxAttempts) {
         console.error(`[SmartRetry] Fallido después de ${maxAttempts} intentos:`, lastError.message);
         throw lastError;
       }
 
       const delay = calculateBackoffDelay(attempt, config);
       console.log(`[SmartRetry] Intento ${attempt}/${maxAttempts}, esperando ${delay}ms...`);
       onRetry?.(attempt, delay, lastError);
 
       await sleep(delay);
     }
   }
 
   throw lastError || new Error('Retry failed');
 }