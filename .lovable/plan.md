

# Validacion del Flujo de Liberaciones para Supply en Live

## Estado actual encontrado

### 1. Ghost record activo en Live
Existe un registro `custodio_liberacion` con id `e531328f` para ANGEL DIONISIO MENDOZA PLONEDA en estado `aprobado_final` (creado hoy 2026-03-06 17:54). Este es el record "fantasma" que quedó cuando la liberación falló por el unique constraint. Aparece en la pestaña "En proceso" del modulo de Liberaciones.

### 2. La migración del RPC NO está en Live
La función `liberar_custodio_a_planeacion_v2` en Live **no tiene** el fallback lookup por nombre/telefono. Sigue siendo la versión vieja que solo busca por `pc_custodio_id`. Si Mariana intenta liberar nuevamente, el RPC creará un nuevo `pc_custodios` (porque no hay uno previo vinculado), luego buscará en `custodios_operativos` por ese nuevo `pc_custodio_id` (no lo encontrará), e intentará INSERT -- que fallará por el unique constraint en nombre.

### 3. `custodios_operativos` con `pc_custodio_id = NULL`
Hay ~20 registros legacy en `custodios_operativos` sin `pc_custodio_id`. Cualquiera de estos puede causar el mismo bug si un candidato con nombre idéntico pasa por liberación.

## Problemas que bloquean al equipo de Supply

```text
PROBLEMA 1: Ghost record (dato huérfano)
  → ANGEL DIONISIO aparece "pendiente" en Liberaciones
  → Fue liberado via Evaluaciones pero la RPC falló
  → Fix: DELETE o UPDATE a 'liberado' en Live

PROBLEMA 2: RPC sin fallback (schema no publicado)
  → La migración 20260306180848 solo existe en Test
  → Fix: Publicar proyecto para aplicar a Live

PROBLEMA 3: Bug en filtro "en_proceso" (línea 31)
  → El filtro usa `liberaciones` sin aplicar `tipoOperativo`
  → Los tabs pendientes_gps y completados sí filtran correctamente
  → Fix: Cambiar `liberaciones` → `filtered` en línea 31
```

## Plan de corrección (3 cambios)

### 1. SQL: Limpiar ghost record en Live
Ejecutar manualmente en Cloud View > Run SQL (con **Live** seleccionado):
```sql
-- Opción A: Eliminar el ghost (recomendado si se va a re-liberar desde Evaluaciones)
DELETE FROM custodio_liberacion WHERE id = 'e531328f-8e44-44b0-81c0-cad4f3074871';

-- Opción B: Vincular el operativo existente y marcar como liberado
-- (si ya no se necesita re-liberar)
```

### 2. Publicar el proyecto
La migración que agrega el fallback lookup por nombre/telefono al RPC debe llegar a Live. Esto requiere **publicar** el proyecto.

### 3. Fix del filtro en LiberacionPage.tsx (línea 31)
El tab "en_proceso" ignora el filtro de `tipoOperativo` porque usa `liberaciones` (sin filtrar) en lugar de `filtered`:

```typescript
// Línea 31 actual:
filtered = liberaciones.filter(l => 
  !['liberado', 'rechazado'].includes(l.estado_liberacion)
);

// Corrección:
filtered = filtered.filter(l => 
  !['liberado', 'rechazado'].includes(l.estado_liberacion)
);
```

### Archivos a modificar
- `src/pages/Leads/LiberacionPage.tsx` -- fix filtro tipoOperativo en tab en_proceso (línea 31)

### Acciones manuales requeridas
1. Ejecutar SQL de limpieza del ghost record en **Live** via Supabase Dashboard
2. **Publicar** el proyecto para que la migración del RPC se aplique a Live

