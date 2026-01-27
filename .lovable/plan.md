
# Plan: Corrección Integral de AnnualComparisonCard para YoY Dinámico

## Resumen Ejecutivo

La tarjeta "Comparativa Anual" tiene valores hardcoded de 2025 que causan errores graves en 2026. Este plan implementa cálculos completamente dinámicos usando datos del año actual vs año anterior.

---

## Datos Correctos Verificados

| Métrica | Valor |
|---------|-------|
| **Total 2025** | 10,988 servicios / $75.1M |
| **Total 2024** | 10,714 servicios / $63.6M |
| **YTD 2026 (1-26 ene)** | 544 servicios / $5.0M |
| **YTD 2025 (1-26 ene)** | 809 servicios / $5.5M |
| **Día actual 2026** | 26 de 365 |

---

## Cambios por Archivo

### 1. `src/hooks/useYearOverYearComparison.ts`

**Problema**: Líneas 66-76 usan `2025` y `10714` hardcoded

```text
ANTES (líneas 66-75):
const daysElapsed = Math.floor((adjustedDate.getTime() - new Date(2025, 0, 1).getTime()) / ...);
const full2024Services = 10714;

DESPUÉS:
const currentYear = adjustedDate.getFullYear(); // 2026
const daysElapsed = Math.floor((adjustedDate.getTime() - new Date(currentYear, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;
const previousYearTotal = exactYTDData.previousYearTotal || 10988; // Desde DB
```

**Agregar al retorno**:
- `previousYearTotal`: Total del año anterior completo (para proyecciones)
- Renombrar `current2025` → `currentYTD` y `same2024` → `previousYTD`

---

### 2. `src/utils/exactDateYTDCalculations.ts`

**Agregar query** para obtener total del año anterior completo:

```typescript
// Agregar a YTDComparisonData interface:
previousYearTotal: number;

// En calculateExactYTDComparison, después de la query principal:
const previousYear = adjustedDate.getFullYear() - 1;
const { count: previousYearTotal } = await supabase
  .from('servicios_custodia')
  .select('id', { count: 'exact', head: true })
  .gte('fecha_hora_cita', `${previousYear}-01-01`)
  .lt('fecha_hora_cita', `${previousYear + 1}-01-01`)
  .neq('estado', 'Cancelado');
```

---

### 3. `src/components/executive/AnnualComparisonCard.tsx`

**Cambios de cálculo (useMemo líneas 19-46)**:

| Línea | Antes | Después |
|-------|-------|---------|
| 24 | `new Date(2025, 0, 1)` | `new Date(currentYear, 0, 1)` donde `currentYear = new Date().getFullYear()` |
| 25 | `daysInYear - daysElapsed` | `Math.max(daysInYear - daysElapsed, 1)` para evitar división negativa |
| 28 | `10714` | `yearData.previousYearTotal` |
| 31 | `10714` | `yearData.previousYearTotal` |
| 34 | `10714` | `yearData.previousYearTotal` |

**Cambios de UI**:

| Línea | Antes | Después |
|-------|-------|---------|
| 78 | `Día {daysElapsed}/365` | Sin cambio, pero ahora calcula correctamente (26/365) |
| 91 | `"vs 2024 total (10,714)"` | `"vs ${previousYear} total (${previousYearTotal.toLocaleString()})"` |
| 101-102 | `"YTD 2025"` | `"YTD {currentYear}"` dinámico |
| 105-106 | `"YTD 2024"` | `"YTD {previousYear}"` dinámico |
| 125 | `"Ritmo para igualar 2024"` | `"Ritmo para igualar {previousYear}"` |
| 156 | `"para igualar 2024"` | `"para igualar {previousYear}"` |
| 163 | `"superar' : 'igualar'} 2024"` | `"superar' : 'igualar'} {previousYear}"` |
| 170 | `"Proyección anual 2025"` | `"Proyección anual {currentYear}"` |
| 173 | `"vs 2024 total"` | `"vs {previousYear} total"` |

---

## Estructura de Datos Actualizada

```typescript
// useYearOverYearComparison retorno actualizado
{
  currentYear: 2026,
  previousYear: 2025,
  currentYTD: {
    services: 544,
    gmv: 5.05 // millones
  },
  previousYTD: {
    services: 809,
    gmv: 5.54
  },
  previousYearTotal: 10988, // NUEVO: para proyecciones
  growth: {
    servicesPercent: -32.8,
    gmvPercent: -8.9,
    servicesGap: -265,
    gmvGap: -0.49
  },
  annualProjection: {
    projected: 7644, // (544/26)*365
    vsPreviousPercent: -30.4
  },
  periodLabel: {
    current: "YTD al 26 ene, 2026",
    previous: "YTD al 26 ene, 2025",
    comparison: "YTD 2026 vs YTD 2025 (períodos exactos)"
  }
}
```

---

## Resultado Visual Esperado

```text
┌─────────────────────────────────────────────────────┐
│ 📅 Comparativa Anual              Declive  Día 26/365 │
│ YTD 2026 vs YTD 2025 (períodos exactos)              │
├─────────────────────────────────────────────────────┤
│ Progreso vs 2025 total (10,988)              5.0%   │
│ ██░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
├─────────────────────────────────────────────────────┤
│   [544]         [809]           [-32.8%]            │
│  YTD 2026      YTD 2025          Brecha             │
│  $5.0M         $5.5M            -265 srv            │
├─────────────────────────────────────────────────────┤
│ ⚡ Ritmo para igualar 2025                          │
│   20.9           30.8 ⚠️                             │
│  srv/día        srv/día                             │
│  actual        necesario                            │
│         +47% más rápido requerido                   │
├─────────────────────────────────────────────────────┤
│ ⚠️ Acción Requerida                                 │
│ Faltan +10,444 servicios (≈$96M) para igualar 2025 │
├─────────────────────────────────────────────────────┤
│        Proyección anual 2026                        │
│             7,644 srv                               │
│         -30.4% vs 2025 total                        │
└─────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/utils/exactDateYTDCalculations.ts` | Agregar `previousYearTotal` a interface y query |
| `src/hooks/useYearOverYearComparison.ts` | Usar años dinámicos, agregar `previousYearTotal` al retorno |
| `src/components/executive/AnnualComparisonCard.tsx` | Reemplazar todos los hardcodes con valores dinámicos |

---

## Principios Aplicados

1. **Zero Hardcoding**: Todos los años y metas vienen de cálculos dinámicos
2. **Defensive Math**: `Math.max(daysRemaining, 1)` evita divisiones negativas/cero
3. **Single Source of Truth**: Total año anterior viene de la base de datos
4. **Backward Compatibility**: Si falla la query, usa fallback sensato (10988)
