

# Plan: Botón "Liberar Espacio" en Portal del Custodio

## Enfoque

Crear un componente `StorageCleanupCard` que se muestre en el dashboard del custodio. Al presionar, ejecuta una limpieza agresiva de IndexedDB (fotos huérfanas sin restricción de 48h + cola de sync completada) y muestra cuánto espacio se liberó.

## Cambios

### 1. Nuevo componente `src/components/custodian/StorageCleanupCard.tsx`
- Botón "Liberar espacio" con icono `HardDrive`
- Al montar, calcula el tamaño actual usando `getOfflineStorageSize()` y lo muestra (ej: "1.2 MB en uso")
- Al hacer clic: ejecuta limpieza agresiva (todas las fotos huérfanas sin importar antigüedad + sync queue vacía), recalcula tamaño, muestra toast con "Se liberaron X MB"
- Estado: idle → cleaning → done

### 2. Nueva función en `src/lib/offlineStorage.ts`
- `aggressiveCleanup()`: elimina TODOS los blobs que no tengan un draft activo (sin el filtro de 48h), limpia la sync queue completada, y retorna `{ photosRemoved, bytesFreed }`

### 3. Integrar en `MobileDashboardLayout.tsx`
- Agregar `StorageCleanupCard` debajo de `RecentServicesCollapsible` (antes del cierre de `</main>`), solo visible si el tamaño offline es > 0

