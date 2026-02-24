
# Auditoria: Conteo de Custodios y Armados en KPIs

## Hallazgo

El conteo actual en `gmvMTDService.ts` (lineas 144-145) es:

```text
custodiosMTD = new Set(services.map(s => s.nombre_custodio).filter(Boolean)).size  --> 124
armadosMTD   = new Set(services.map(s => s.nombre_armado).filter(Boolean)).size    --> 62
```

### Problema con Custodios
El conteo por `nombre_custodio` (texto libre) ya es DISTINCT, pero puede inflarse si:
- El mismo custodio aparece con variaciones de nombre ("Juan Perez" vs "Juan Pérez" vs "JUAN PEREZ")
- No se usa UUID (`id_custodio`) que es el identificador unico real

### Problema con Armados
El campo `nombre_armado` en `servicios_custodia` es texto libre que mezcla:
- Armados internos (personal propio)
- Personal de proveedores externos

No existe campo `tipo_asignacion_armado` en `servicios_custodia`, por lo que no se puede distinguir interno vs externo solo con esa tabla. Se necesita cruzar con `asignacion_armados` (que tiene `tipo_asignacion: 'interno' | 'proveedor'`).

---

## Plan de Remediacion

### Archivo 1: `src/services/gmvMTDService.ts`

**Cambios:**

1. Agregar `id_custodio` al SELECT canonico para hacer DISTINCT por UUID en lugar de nombre
2. Agregar una funcion auxiliar que consulte `asignacion_armados` para el rango MTD y separe internos vs proveedor
3. Exponer 3 metricas nuevas en `UnifiedMTDResult`:
   - `custodiosMTD`: DISTINCT por `id_custodio` (UUID). Fallback a `nombre_custodio` normalizado (trim + lowercase) si UUID es null
   - `armadosInternosMTD`: DISTINCT armado_id donde `tipo_asignacion = 'interno'` en `asignacion_armados`
   - `serviciosProveedorExternoMTD`: COUNT de servicios donde `tipo_asignacion = 'proveedor'` en `asignacion_armados`

**Detalle de la query de asignacion_armados:**

```text
SELECT armado_id, tipo_asignacion, servicio_custodia_id
FROM asignacion_armados
WHERE created_at >= MTD_start AND created_at <= MTD_end
  AND estado_asignacion NOT IN ('cancelado')
```

Luego en JS:
- `armadosInternosMTD` = new Set(assignments.filter(a => a.tipo_asignacion === 'interno').map(a => a.armado_id)).size
- `serviciosProveedorExternoMTD` = new Set(assignments.filter(a => a.tipo_asignacion === 'proveedor').map(a => a.servicio_custodia_id)).size

### Archivo 2: `src/hooks/useUnifiedMTDMetrics.ts`

Exponer los nuevos campos: `armadosInternosMTD`, `serviciosProveedorExternoMTD`, y el `custodiosMTD` corregido.

### Archivo 3: `src/components/executive/ExecutiveKPIsBar.tsx`

Cambios en las tarjetas:

| Tarjeta actual | Cambio |
|----------------|--------|
| **Custodios: 124** | Usar `custodiosMTD` basado en UUID (numero probablemente bajara) |
| **Armados: 62** | Renombrar a "Armados Int." y usar `armadosInternosMTD` (solo internos) |
| *(nueva)* | Agregar tarjeta "Svcs. Prov. Ext." con `serviciosProveedorExternoMTD` y icono diferenciado |

La tarjeta de proveedores externos reemplazara una de las dos tarjetas placeholder ("Clientes Mon." o "Suscr. Mon." que muestran N/D).

### Resultado esperado

```text
ANTES:
  Custodios: 124 (nombre_custodio, puede tener duplicados por variantes de texto)
  Armados: 62 (mezcla internos + externos)

DESPUES:
  Custodios: ~X (distinct por id_custodio UUID, numero real sin duplicados)
  Armados Int.: ~Y (solo tipo_asignacion='interno', distinct por armado_id)
  Svcs. Prov. Ext.: ~Z (servicios atendidos por proveedores externos)
```
