

# Auditoría de Discrepancias: Bitácora vs Coordinador (Fishbone)

## Hallazgo Principal

**Coordinador muestra 9 servicios para Karla. Bitácora filtrada muestra 8.**

El servicio faltante es **COGFCGM-102** (COMERCIALIZACION GENESIS MEXICANA FUGF), visible en la tarjeta del Coordinador pero ausente en la Bitácora.

---

## Diagrama Fishbone (Causa-Raíz)

```text
                        ┌─────────────────────────────┐
                        │  Discrepancia 9 vs 8        │
                        │  (Coordinador vs Bitácora)   │
                        └──────────────┬──────────────┘
                                       │
       ┌───────────────┬───────────────┼───────────────┬──────────────┐
       │               │               │               │              │
  ┌────┴────┐    ┌─────┴─────┐   ┌─────┴─────┐  ┌─────┴─────┐  ┌────┴────┐
  │ FUENTE  │    │ LIFECYCLE │   │ ASIGNACIÓN│  │  FILTROS  │  │ TIMING │
  │ DE DATOS│    │ MISMATCH  │   │  ZOMBIE   │  │ QUERY     │  │  RACE  │
  └────┬────┘    └─────┬─────┘   └─────┬─────┘  └─────┴─────┘  └────┬────┘
       │               │               │               │              │
 Coordinador      Servicio ya     Asignación       Pending query   OrphanGuard
 lee de           completado      sigue activa     requiere        vs completion
 bitacora_        (hora_fin_real  en bitacora_     custodio_       timing
 asignaciones     IS NOT NULL)    asignaciones     asignado
 _monitorista                    _monitorista     NOT NULL
       │               │               │               │
 Bitácora          ...pero        ...porque        Bitácora
 lee de            Bitácora lo    nadie la         active query
 servicios_        excluye por    desactivó        excluye
 planificados      sus WHERE                      completados
```

## Causa Raíz Confirmada: **Fuentes de datos diferentes sin sincronización de lifecycle**

### El problema en 3 oraciones:

1. **El Coordinador** cuenta servicios desde `bitacora_asignaciones_monitorista WHERE activo = true`. Muestra todo lo que tiene asignación formal activa.

2. **La Bitácora** muestra servicios desde `servicios_planificados` con condiciones estrictas de lifecycle:
   - Pending: `hora_inicio_real IS NULL` + `estado_planeacion IN (confirmado, planificado)` + rango de hoy + `custodio_asignado IS NOT NULL`
   - Active: `hora_inicio_real IS NOT NULL` + `hora_fin_real IS NULL` + `estado_planeacion NOT IN (cancelado, completado)`

3. **COGFCGM-102** probablemente ya fue **completado** (`hora_fin_real` tiene valor o `estado_planeacion = 'completado'`), pero su registro en `bitacora_asignaciones_monitorista` **sigue con `activo = true`** porque ningún proceso lo desactivó al completarse.

### Espinas contribuyentes:

| Espina | Detalle |
|--------|---------|
| **Fuente de datos** | Dos tablas independientes sin JOIN: asignaciones vs servicios planificados |
| **Lifecycle mismatch** | Cuando un servicio se completa (liberarCustodio), el código actualiza `servicios_planificados` pero **no desactiva** la asignación en `bitacora_asignaciones_monitorista` |
| **Asignación zombie** | La asignación permanece `activo=true` indefinidamente para servicios completados |
| **Handoff parcial** | Solo `handoffTurno` desactiva asignaciones (servicios >6h sin actividad). La liberación normal no lo hace. |

---

## Fix Propuesto

### 1. `src/hooks/useBitacoraBoard.ts` — Sincronizar lifecycle

En la mutación `liberarCustodio` (línea ~465), después de marcar `hora_fin_real` y `estado_planeacion = 'completado'`, agregar:

```typescript
// Desactivar asignación de monitorista al completar servicio
await (supabase as any)
  .from('bitacora_asignaciones_monitorista')
  .update({ activo: false, fin_turno: nowTs })
  .eq('servicio_id', params.servicioIdServicio)
  .eq('activo', true);
```

### 2. `src/components/monitoring/bitacora/BitacoraBoard.tsx` — Conteo consistente

Cambiar el conteo del filtro para que refleje solo servicios visibles en las columnas (ya lo hace correctamente con `displayPending.length + displayEnCurso.length + displayEventoEspecial.length`).

### 3. Fix de datos retroactivo (SQL one-time)

Desactivar asignaciones zombie para servicios ya completados:

```sql
UPDATE bitacora_asignaciones_monitorista bam
SET activo = false, fin_turno = NOW()
WHERE activo = true
AND NOT EXISTS (
  SELECT 1 FROM servicios_planificados sp
  WHERE sp.id_servicio = bam.servicio_id
  AND sp.hora_fin_real IS NULL
  AND sp.estado_planeacion NOT IN ('cancelado', 'completado')
);
```

### Alcance
- 1 archivo modificado: `useBitacoraBoard.ts` (agregar ~4 líneas en `liberarCustodio`)
- 1 query SQL de limpieza (ejecutar una vez)
- Sin cambios en el Coordinador — se auto-corrige al sincronizar las asignaciones

