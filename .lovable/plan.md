

# Plan: Corregir Visualizacion de Timeline en Tabla de Facturacion

## Problema Identificado

La tabla de servicios muestra "-" en los campos de Duracion porque el codigo frontend usa el campo incorrecto.

### Diagnostico

| Campo | Variable Usada | Variable Correcta | Tiene Datos? |
|-------|----------------|-------------------|--------------|
| Duracion | `duracion_servicio` | `duracion_calculada` | Si (ej: 03:53:37) |
| Presentacion | `hora_presentacion` | Ya correcto | Parcial |
| Arribo | `hora_arribo` | Ya correcto | Parcial |

**Evidencia de datos en vista:**
```
folio: PRCOPEM-7, duracion_calculada: -06:24:51.325, hora_presentacion: 2026-01-20 08:50:00
folio: TEOVTEL-719, duracion_calculada: 01:37:41.999
folio: COGFCGM-93, hora_arribo: 2026-01-19 12:17:42
```

## Cambios Requeridos

### Archivo: `src/pages/Facturacion/components/ServiciosConsulta.tsx`

#### 1. Agregar funcion para formatear intervalos PostgreSQL

Los intervalos vienen como strings "HH:MM:SS.mmm" desde la vista. Necesita convertirse a formato legible:

```typescript
const formatDuracion = (duracion: string | null) => {
  if (!duracion) return '-';
  const match = duracion.match(/^(-?)(\d+):(\d+):(\d+)/);
  if (!match) return duracion;
  
  const [, negativo, horas, minutos] = match;
  const h = parseInt(horas);
  const m = parseInt(minutos);
  
  if (h === 0 && m === 0) return '< 1m';
  if (h > 0) return `${negativo}${h}h ${m}m`;
  return `${negativo}${m}m`;
};
```

#### 2. Corregir linea 528

**Antes:**
```typescript
{s.duracion_servicio || '-'}
```

**Despues:**
```typescript
{formatDuracion(s.duracion_calculada)}
```

#### 3. Actualizar exportacion Excel

Agregar duracion calculada a los datos exportados para consistencia.

## Resultado Esperado

| Campo | Antes | Despues |
|-------|-------|---------|
| Duracion | - | 3h 53m |
| Presentacion | - (si NULL) | 08:50 (si tiene datos) |
| Arribo | - (si NULL) | 12:17 (si tiene datos) |

## Nota sobre Datos Faltantes

Los campos Presentacion y Arribo mostraran "-" cuando no existen datos en la base de datos. Para febrero 2026:

- `hora_presentacion`: Requiere que planeacion registre `hora_llegada_custodio`
- `hora_arribo`: Requiere que operaciones registre en servicios_custodia

El sistema de fallback esta listo - solo faltan los datos operativos.

## Seccion Tecnica

El campo `duracion_calculada` es un intervalo PostgreSQL:
```sql
COALESCE(sp.hora_fin_real, sc.hora_finalizacion) 
- COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia)
```

Valores negativos indican timestamps invertidos (hora_fin < hora_inicio) que deberian revisarse manualmente.

