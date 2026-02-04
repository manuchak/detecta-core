

# Plan: Corregir Fuente de fecha_hora_cita en Vista de Facturacion

## Problema Identificado

El campo `fecha_hora_cita` en la vista `vw_servicios_facturacion` muestra timestamps corruptos porque usa directamente `servicios_custodia.fecha_hora_cita` que tiene un patron de corrupcion sistematico.

### Evidencia de Corrupcion

| Fuente | Patron | Cantidad | Estado |
|--------|--------|----------|--------|
| servicios_planificados | `:00:00` | 622 | Correcto |
| servicios_planificados | `:30:00` | 189 | Correcto |
| servicios_custodia | `:59:24` | 312 | Corrupto |
| servicios_custodia | `:29:24` | 116 | Corrupto |

**Ejemplo real:**
- Planeacion: `2026-02-05 19:00:00+00` (hora cerrada, correcto)
- Custodia: `2026-02-03 22:59:24+00` (segundos extraños, corrupto)

## Causa Raiz

La vista actual en la linea de `fecha_hora_cita`:
```sql
sc.fecha_hora_cita  -- Usa directamente custodia (corrupto)
```

Deberia priorizar planeacion:
```sql
COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita) AS fecha_hora_cita
```

## Solucion

### Cambio en la Vista SQL

Actualizar `vw_servicios_facturacion` para priorizar `servicios_planificados.fecha_hora_cita` sobre `servicios_custodia.fecha_hora_cita`:

```sql
-- Linea actual:
sc.fecha_hora_cita,

-- Cambiar a:
COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita) AS fecha_hora_cita,
```

Esto asegura que:
1. Si existe el servicio en planeacion, usa la fecha/hora correcta
2. Si solo existe en custodia (historicos), usa el dato existente como fallback

## Validacion del Codigo Frontend

El codigo en `ServicioDetalleDialog.tsx` ya usa correctamente `formatCDMXTime`:

```typescript
const formatDateTime = (dateStr: string | null) => {
  if (!dateStr) return '-';
  try {
    return formatCDMXTime(dateStr, 'dd/MM/yyyy HH:mm'); // Correcto
  } catch {
    return dateStr;
  }
};
```

Este formateo usa `formatInTimeZone` con `America/Mexico_City`, lo cual es correcto para convertir UTC a hora local CDMX.

## Impacto

| Servicio | Antes (corrupto) | Despues (correcto) |
|----------|-----------------|-------------------|
| EMEDEME-234 | 03/02/2026 16:59 | 05/02/2026 13:00 |
| MURAMLA-16 | 03/02/2026 12:59 | (fecha real de planeacion) |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `vw_servicios_facturacion` (SQL) | Cambiar `sc.fecha_hora_cita` por `COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita)` |

No se requieren cambios en el frontend ya que el formateo de timezone esta correcto.

## Nota sobre Datos Legacy

Los ~3,500+ servicios historicos en `servicios_custodia` con timestamps corruptos seguiran mostrando datos incorrectos porque no tienen registro en `servicios_planificados`. La correccion de esos datos requeriria:
1. Identificar el patron de corrupcion (parece ser -36 segundos)
2. Ejecutar UPDATE masivo para corregir

Esto se puede hacer como tarea separada si es necesario.

