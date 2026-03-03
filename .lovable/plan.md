

# Plan: Default 120 días + Filtro por CSM asignado en Análisis Clientes

## Cambios

### 1. `src/components/executive/ClientAnalytics.tsx`

**a) Cambiar default de `current_month` a `last_120d`**
- Línea 54: `useState<DateFilterType>('current_month')` → `useState<DateFilterType>('last_120d')`

**b) Agregar filtro de CSM asignado**
- Importar `useCSCartera` para obtener la lista de CSMs únicos y el mapeo cliente→CSM
- Agregar estado `filterByCSM` (default: `'all'`)
- Extraer CSMs únicos del cartera data: `{ id, nombre }[]`
- Agregar un `<Select>` junto al filtro de tipo existente ("Todos los tipos") con opciones: "Todos los CSM", "Sin asignar", y cada CSM con nombre
- En `filteredAndSortedClients`, filtrar por CSM: cruzar `clientName` con `pc_clientes.nombre` → `csm_asignado`

### 2. `src/hooks/useClientAnalytics.ts`

Sin cambios — los hooks ya aceptan `dateRange` dinámico.

### Archivos a modificar
| Archivo | Cambio |
|---|---|
| `src/components/executive/ClientAnalytics.tsx` | Default `last_120d`, estado + Select de CSM, lógica de filtrado cruzando con cartera |

