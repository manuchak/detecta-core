

# Filtros Semanales con Ciclo Configurable (Lun-Dom / Dom-Sáb)

## Cambios

### 1. `CxPOperativoTab.tsx` — Navegador semanal con toggle de ciclo

- Agregar estado `weekStartsOn: 0 | 1` (default `1` = Lunes-Domingo) con toggle visual (switch o segmented control)
- Agregar estado `currentWeekStart: Date` calculado con `startOfWeek(subWeeks(now, 1), { weekStartsOn })`
- UI: barra superior con `← Semana anterior | "Lun 03/Mar – Dom 09/Mar 2026" | Semana siguiente →` + toggle "L-D / D-S"
- Pasar `semanaInicio` y `semanaFin` como props al hook `useCxPCortesSemanales`
- KPIs se filtran automáticamente a la semana visible

### 2. `useCxPCortesSemanales.ts` — Aceptar filtro de rango semanal

- Cambiar firma: `useCxPCortesSemanales(estado?: string, semanaInicio?: string, semanaFin?: string)`
- Agregar filtros opcionales: `.gte('semana_inicio', semanaInicio)` y `.lte('semana_fin', semanaFin)` cuando estén presentes
- Agregar al `queryKey` para invalidación correcta

### 3. `GenerarCorteDialog.tsx` — Respetar ciclo seleccionado

- Recibir `weekStartsOn` como prop
- Ajustar defaults de `semana_inicio` / `semana_fin` según el ciclo activo
- Labels dinámicos: "Inicio (Lunes)" / "Fin (Domingo)" o "Inicio (Domingo)" / "Fin (Sábado)"

### Archivos
| Archivo | Cambio |
|---------|--------|
| `CxPOperativoTab.tsx` | Navegador semanal + toggle ciclo + pasar rango al hook |
| `useCxPCortesSemanales.ts` | Agregar params `semanaInicio`/`semanaFin` al query |
| `GenerarCorteDialog.tsx` | Recibir `weekStartsOn`, ajustar defaults y labels |

