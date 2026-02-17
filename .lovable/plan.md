

## Corregir gráfico "Comparativo MTD por Día Semana" para comparación justa

### Problema identificado

El gráfico actual suma todos los servicios del mes anterior completo vs solo los días transcurridos del mes actual. Esto genera una impresión visual falsa de bajo rendimiento cuando en realidad el mes actual va mejor en ritmo diario.

### Solución: Promediar por número de ocurrencias

Cambiar la métrica de "total de servicios por día de semana" a "promedio de servicios por día de semana", dividiendo entre cuántas veces aparece cada día en el período.

### Cambios técnicos

**Archivo 1: `src/hooks/useExecutiveMultiYearData.ts` (lineas 224-237)**

Cambiar la lógica de acumulación de weekday para también contar las ocurrencias de cada día:

```ts
// Contar servicios Y ocurrencias de cada día
const weekdayCurrent: Record<number, number> = {};
const weekdayPrev: Record<number, number> = {};
const weekdayCurrentDays: Record<number, Set<string>> = {};
const weekdayPrevDays: Record<number, Set<string>> = {};

enriched.filter(s => s.year === currentYear && s.month === currentMonth).forEach(s => {
  weekdayCurrent[s.weekdayIndex] = (weekdayCurrent[s.weekdayIndex] || 0) + 1;
  if (!weekdayCurrentDays[s.weekdayIndex]) weekdayCurrentDays[s.weekdayIndex] = new Set();
  weekdayCurrentDays[s.weekdayIndex].add(String(s.day));
});

enriched.filter(s => s.year === prevYear && s.month === prevMonth).forEach(s => {
  weekdayPrev[s.weekdayIndex] = (weekdayPrev[s.weekdayIndex] || 0) + 1;
  if (!weekdayPrevDays[s.weekdayIndex]) weekdayPrevDays[s.weekdayIndex] = new Set();
  weekdayPrevDays[s.weekdayIndex].add(String(s.day));
});

const weekdayComparison = WEEKDAY_LABELS.map((label, idx) => ({
  weekday: label,
  weekdayIndex: idx,
  currentMTD: weekdayCurrentDays[idx]?.size
    ? Math.round((weekdayCurrent[idx] || 0) / weekdayCurrentDays[idx].size)
    : 0,
  previousMTD: weekdayPrevDays[idx]?.size
    ? Math.round((weekdayPrev[idx] || 0) / weekdayPrevDays[idx].size)
    : 0,
}));
```

**Archivo 2: `src/components/executive/WeekdayComparisonChart.tsx`**

- Actualizar el titulo a "Promedio de Servicios por Día Semana" para reflejar la nueva métrica
- Actualizar el tooltip para mostrar "promedio" en lugar de total
- Agregar subtitulo explicativo: "Servicios promedio por ocurrencia de cada día"

### Resultado esperado

- Si un viernes promedio de febrero tiene 40 servicios vs 35 de enero, las barras reflejarán que febrero va mejor
- Comparación justa independientemente de cuántos días han pasado
- El feeling del usuario coincidirá con la realidad de los datos
