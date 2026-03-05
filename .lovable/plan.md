

# Solución: Permitir reutilizar folios de servicios cancelados

## Problema de Axel

TEOVTEL-790 se subió con "armado" por error. Lo canceló, pero al intentar subir de nuevo el mismo folio con la configuración correcta (sin armado), la base de datos rechaza el INSERT porque `id_servicio` tiene constraint UNIQUE — incluyendo filas canceladas.

## Opciones de solución

Hay dos enfoques posibles. Ambos son compatibles con monitoreo (bitácora filtra por `hora_inicio_real IS NOT NULL` y excluye cancelados):

### Opción A: Unique index parcial (excluyendo cancelados)

Cambiar el constraint UNIQUE para que solo aplique a servicios **no cancelados**. Así el mismo folio puede existir N veces si las versiones anteriores están canceladas.

**SQL Migration:**
```sql
-- Quitar el UNIQUE de la columna (constraint de tabla)
ALTER TABLE servicios_planificados 
  DROP CONSTRAINT IF EXISTS servicios_planificados_id_servicio_key;

-- Quitar el índice único existente
DROP INDEX IF EXISTS idx_servicios_planificados_id_servicio_unique;

-- Crear nuevo índice único parcial: solo aplica a NO cancelados
CREATE UNIQUE INDEX idx_servicios_planificados_id_servicio_active
ON servicios_planificados (id_servicio)
WHERE estado_planeacion != 'cancelado';
```

**Impacto downstream:**
- Bitácora (`useBitacoraBoard`): ya filtra `.not('estado_planeacion', 'in', '(cancelado,completado)')` — sin impacto
- Checklist monitoreo: mismo filtro — sin impacto
- Vista facturación (`vw_servicios_facturacion`): usa `servicios_custodia`, no `servicios_planificados` — sin impacto
- Edge functions (incumplimientos, auto-reactivar): filtran por estado activo — sin impacto
- KPIs/reportes: todos excluyen cancelados — sin impacto

**Riesgo:** Ninguno. El único escenario que se "abre" es poder crear un servicio con un folio que ya fue cancelado, que es exactamente lo que Axel necesita.

### Opción B: Soft-delete con sufijo al cancelar

Al cancelar, renombrar el `id_servicio` agregando un sufijo (e.g., `TEOVTEL-790` → `TEOVTEL-790_CANC_20260305`). Esto libera el folio para reutilización.

**Descartada** porque rompe la trazabilidad en consultas históricas y auditorías.

## Recomendación: Opción A

Un solo cambio SQL, cero cambios en frontend, cero impacto en monitoreo.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | DROP constraint + DROP index + CREATE partial unique index |

Cero archivos TypeScript modificados.

