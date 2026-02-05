
# Plan: Optimizaciones de Rendimiento para 100+ Custodios Concurrentes

## Resumen Ejecutivo

Implementar tres optimizaciones criticas para garantizar estabilidad del sistema cuando multiples custodios completan checklists simultaneamente: compresion de imagenes, rate limiting con cola de subida, y backoff exponencial con jitter.

---

## Arquitectura de Optimizaciones

```text
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        FLUJO OPTIMIZADO DE SUBIDA DE FOTOS                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  [Foto Capturada]                                                                   │
│        │                                                                            │
│        ▼                                                                            │
│  ┌─────────────────┐                                                                │
│  │  COMPRESION     │  Reducir ~2MB -> ~300-500KB                                    │
│  │  (imageUtils)   │  - Canvas resize: max 1920px                                   │
│  │                 │  - JPEG quality: 0.7                                           │
│  │                 │  - Mantiene EXIF GPS                                           │
│  └────────┬────────┘                                                                │
│           │                                                                         │
│           ▼                                                                         │
│  ┌─────────────────┐                                                                │
│  │   INDEXEDDB     │  Almacena blob comprimido                                      │
│  │   (local)       │  - Menor uso de storage                                        │
│  └────────┬────────┘                                                                │
│           │                                                                         │
│           ▼  (Cuando hay conexion)                                                  │
│  ┌─────────────────┐                                                                │
│  │  UPLOAD QUEUE   │  Rate limiting por usuario                                     │
│  │  (uploadQueue)  │  - Max 2 uploads concurrentes                                  │
│  │                 │  - Cola FIFO con prioridad                                     │
│  └────────┬────────┘                                                                │
│           │                                                                         │
│           ▼  (Si falla)                                                             │
│  ┌─────────────────┐                                                                │
│  │ RETRY + BACKOFF │  Reintentos inteligentes                                       │
│  │ (retryUtils)    │  - Exponential: 1s, 2s, 4s, 8s                                 │
│  │                 │  - Jitter: +/- 30%                                             │
│  │                 │  - Circuit breaker integrado                                   │
│  └────────┬────────┘                                                                │
│           │                                                                         │
│           ▼                                                                         │
│  ┌─────────────────┐                                                                │
│  │   SUPABASE      │  Carga controlada al servidor                                  │
│  │   STORAGE       │  - Evita saturacion                                            │
│  └─────────────────┘                                                                │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Componente 1: Compresion de Imagenes

### Archivo: `src/lib/imageUtils.ts` (Nuevo)

Utilidad para comprimir fotos antes de almacenarlas en IndexedDB.

```typescript
interface CompressionOptions {
  maxWidth: number;      // Default: 1920
  maxHeight: number;     // Default: 1080
  quality: number;       // Default: 0.7 (70%)
  format: 'jpeg' | 'webp';
}

interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}
```

Funcionalidades:
- Redimensionar usando Canvas API a max 1920x1080
- Comprimir a JPEG con calidad 70%
- Preservar orientacion EXIF
- Retornar metricas de compresion para logging
- Reduccion esperada: ~2MB -> ~300-500KB (75-85% reduccion)

### Integracion

Modificar `useServiceChecklist.ts` en funcion `capturePhoto`:

```typescript
// Antes de savePhotoBlob:
const compressed = await compressImage(file, {
  maxWidth: 1920,
  quality: 0.7,
});
console.log(`[Photo] Comprimida: ${compressed.compressionRatio.toFixed(0)}% reduccion`);

// Usar compressed.blob en lugar de file original
await savePhotoBlob({
  ...
  blob: compressed.blob,
  mimeType: 'image/jpeg',
});
```

---

## Componente 2: Cola de Subida con Rate Limiting

### Archivo: `src/lib/uploadQueue.ts` (Nuevo)

Sistema de cola para controlar subidas concurrentes.

```typescript
interface UploadQueueConfig {
  maxConcurrent: number;      // Default: 2
  delayBetweenUploads: number; // Default: 500ms
}

interface QueuedUpload {
  id: string;
  priority: number;
  execute: () => Promise<void>;
  onProgress?: (progress: number) => void;
}

class UploadQueue {
  private queue: QueuedUpload[];
  private activeCount: number;
  private config: UploadQueueConfig;
  
  add(upload: QueuedUpload): void;
  pause(): void;
  resume(): void;
  clear(): void;
  getStatus(): { pending: number; active: number };
}
```

Caracteristicas:
- Maximo 2 uploads concurrentes por usuario
- Delay de 500ms entre uploads para evitar rafagas
- Sistema de prioridad (fotos > checklists > documentos)
- Metodos para pausar/resumir cola
- Eventos de progreso para UI feedback

### Integracion

Modificar `useOfflineSync.ts`:

```typescript
const uploadQueue = new UploadQueue({ maxConcurrent: 2 });

const syncAll = useCallback(async () => {
  const queue = await getSyncQueue();
  
  // Agrupar por tipo y encolar
  for (const item of queue) {
    uploadQueue.add({
      id: item.id,
      priority: item.action === 'upload_photo' ? 1 : 2,
      execute: () => syncItem(item),
    });
  }
  
  // La cola maneja el rate limiting automaticamente
}, []);
```

---

## Componente 3: Backoff Exponencial con Jitter

### Archivo: `src/lib/retryUtils.ts` (Nuevo)

Utilidades para reintentos inteligentes.

```typescript
interface RetryConfig {
  maxAttempts: number;      // Default: 5
  baseDelayMs: number;      // Default: 1000
  maxDelayMs: number;       // Default: 30000
  jitterPercent: number;    // Default: 0.3 (30%)
}

function calculateBackoffDelay(
  attempt: number, 
  config: RetryConfig
): number;

async function withRetry<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>,
  onRetry?: (attempt: number, delay: number, error: Error) => void
): Promise<T>;
```

Comportamiento:
- Intento 1: 1000ms +/- 300ms
- Intento 2: 2000ms +/- 600ms
- Intento 3: 4000ms +/- 1200ms
- Intento 4: 8000ms +/- 2400ms
- Intento 5: 16000ms (capped at 30000ms)

El jitter previene el "thundering herd" cuando 100 dispositivos reintenten simultaneamente.

### Integracion con Circuit Breaker

Modificar `useOfflineSync.ts`:

```typescript
import { CircuitBreaker } from '@/services/circuitBreakerService';
import { withRetry, calculateBackoffDelay } from '@/lib/retryUtils';

const circuitBreaker = new CircuitBreaker({
  maxConsecutiveFailures: 5,
  maxFailureRate: 30,
  cooldownPeriod: 120,
});

const syncItem = async (item: SyncQueueItem): Promise<boolean> => {
  if (circuitBreaker.isCircuitOpen()) {
    console.warn('[Sync] Circuit abierto, esperando cooldown');
    return false;
  }
  
  try {
    await withRetry(
      () => executeSync(item),
      { maxAttempts: 3, baseDelayMs: 1000 },
      (attempt, delay) => {
        console.log(`[Sync] Reintento ${attempt}, esperando ${delay}ms`);
      }
    );
    circuitBreaker.recordSuccess();
    return true;
  } catch (error) {
    const errorType = error instanceof Error ? error.name : 'unknown';
    circuitBreaker.recordFailure(errorType);
    return false;
  }
};
```

---

## Archivos a Crear

| Archivo | Descripcion | Lineas Est. |
|---------|-------------|-------------|
| `src/lib/imageUtils.ts` | Compresion de imagenes con Canvas | ~80 |
| `src/lib/uploadQueue.ts` | Cola con rate limiting | ~120 |
| `src/lib/retryUtils.ts` | Backoff exponencial + jitter | ~60 |

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useServiceChecklist.ts` | Integrar compresion en capturePhoto |
| `src/hooks/useOfflineSync.ts` | Integrar cola, retry y circuit breaker |
| `src/types/checklist.ts` | Agregar config de compresion |

---

## Metricas de Impacto Esperado

| Metrica | Antes | Despues | Mejora |
|---------|-------|---------|--------|
| Tamano foto promedio | ~2MB | ~400KB | 80% |
| Trafico total (100 users x 4 fotos) | 800MB | 160MB | 80% |
| Uploads concurrentes al servidor | Ilimitado | Max 200 | Controlado |
| Tasa de falla por timeout | Alta en picos | Minima | ~90% |
| Tiempo de recovery post-offline | Instantaneo (rafaga) | Gradual (2min) | Estable |

---

## Orden de Implementacion

1. **Crear** `src/lib/imageUtils.ts` - Compresion de imagenes
2. **Crear** `src/lib/retryUtils.ts` - Backoff + jitter
3. **Crear** `src/lib/uploadQueue.ts` - Cola con rate limiting
4. **Modificar** `src/hooks/useServiceChecklist.ts` - Integrar compresion
5. **Modificar** `src/hooks/useOfflineSync.ts` - Integrar cola y retry
6. **Probar** flujo completo con conexion intermitente

---

## Consideraciones Adicionales

### Compatibilidad Movil
- Canvas API soportado en todos los navegadores moviles modernos
- WebWorker opcional para compresion sin bloquear UI (fase futura)

### Configuracion Adaptativa
- Detectar calidad de conexion (NetworkInformation API)
- Ajustar concurrencia: 2G=1, 3G=2, 4G+=3

### Monitoreo
- Logs estructurados para metricas de compresion
- Dashboard de circuit breaker status (fase futura)
