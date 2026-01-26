
# Plan: Filtro de Fecha para Tab de Clientes (CRM Hub)

## Problema Identificado

La tab "Clientes" actualmente muestra **todos los deals** (open y won) sin límite temporal. Esto resulta en:
- 178 deals totales con solo 15% vinculados
- Deals antiguos (como 23/12/24) mezclados con recientes
- Métricas infladas que no reflejan la realidad operativa actual

## Solución Propuesta

Implementar un filtro de fecha de **6 meses** por defecto, con opción de ver más si es necesario.

---

## Cambios Técnicos

### Archivo: `src/hooks/useCrmClientMatcher.ts`

**Modificar la query en `useCrmClientMatches`:**

```text
ANTES:
.eq('is_deleted', false)
.in('status', ['open', 'won'])

DESPUES:
.eq('is_deleted', false)
.in('status', ['open', 'won'])
.gte('created_at', sixMonthsAgo)  // Nuevo filtro
```

Agregar parámetro opcional para override del rango:

```typescript
export function useCrmClientMatches(dateFilter?: { months: number }) {
  const months = dateFilter?.months ?? 6;
  const cutoffDate = new Date();
  cutoffDate.setMonth(cutoffDate.getMonth() - months);
  const sixMonthsAgo = cutoffDate.toISOString();
  
  // ... query con filtro .gte('created_at', sixMonthsAgo)
}
```

### Archivo: `src/pages/CRMHub/components/ClientServicesLink.tsx`

**Agregar selector de rango temporal:**

```text
┌─────────────────────────────────────────────────────────────────────────┐
│  [Últimos 6 meses ▼]  [Toggle: Solo pendientes]                        │
│                                                                         │
│  Opciones del dropdown:                                                 │
│  - Últimos 3 meses                                                      │
│  - Últimos 6 meses (default)                                           │
│  - Último año                                                           │
│  - Todos los deals                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Actualizar el Hero Card para mostrar el contexto temporal:**

```text
ANTES:
"26 de 178 deals tienen cliente asignado"

DESPUES:
"26 de 52 deals (últimos 6 meses) tienen cliente asignado"
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useCrmClientMatcher.ts` | Agregar filtro de fecha a la query, aceptar parámetro de meses |
| `src/pages/CRMHub/components/ClientServicesLink.tsx` | Agregar dropdown de rango temporal, pasar parámetro al hook |

---

## Beneficios Esperados

| Métrica | Antes | Después |
|---------|-------|---------|
| Total deals mostrados | 178 | ~50-60 (estimado) |
| % Vinculados | 15% | ~40-50% (más realista) |
| Deals pendientes | 152 | ~30-40 (accionables) |
| Enfoque del equipo | Disperso | En deals recientes |

---

## Comportamiento por Defecto

- **Default**: Últimos 6 meses
- **Razón**: Balance entre suficiente historial para análisis y relevancia operativa
- **Override**: Usuario puede cambiar a 3 meses, 12 meses, o "Todos" si lo necesita

## Consistencia con Otras Tabs

Otras tabs del CRM (Pipeline, Forecast) pueden beneficiarse del mismo filtro en el futuro, pero por ahora nos enfocamos en la tab de Clientes donde el problema es más evidente.
