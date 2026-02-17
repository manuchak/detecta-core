
## Corregir cálculo de promedios y bug de timezone en gráfico de días de semana

### Problema confirmado

El gráfico muestra **totales** en vez de **promedios** a pesar de que el código de división está presente. La causa raíz es un **bug de timezone** en el cálculo del `weekdayIndex` que corrompe la agrupación:

- **Línea 180-181**: `const d = new Date(fecha); const weekdayIndex = d.getDay();`
- Esto usa el timezone del navegador para determinar el día de la semana, pero puede causar que el weekdayIndex sea inconsistente con el `day` extraído via CDMX
- El resultado: los Sets de días únicos (`weekdayPrevDays`) acumulan días de otros weekdays, distorsionando la división

**Datos verificados desde la DB:**
- Dom enero: 66 total / 4 ocurrencias = promedio real **16.5** (el gráfico muestra 66)
- Vie enero: 140 total / 5 ocurrencias = promedio real **28.0** (el gráfico muestra ~140)

### Solución

**Archivo: `src/utils/cdmxDateUtils.ts`**
- Agregar nueva función `getCDMXWeekday(isoString)` que retorna 0-6 (Dom-Sáb) usando timezone CDMX
- Usa `formatInTimeZone` con formato `'e'` para obtener el día de semana correcto

**Archivo: `src/hooks/useExecutiveMultiYearData.ts`**
- Reemplazar `const weekdayIndex = d.getDay()` (línea 181) con `getCDMXWeekday(fecha)` importado desde cdmxDateUtils
- Eliminar la variable `d` (línea 180) ya que no se usa para nada más

### Resultado esperado

| Día | Antes (incorrecto) | Después (correcto) |
|-----|-------------------|-------------------|
| Dom | 66 | ~17 |
| Lun | ~105 | ~26 |
| Mar | ~102 | ~26 |
| Mié | ~114 | ~29 |
| Jue | ~134 | ~27 |
| Vie | ~140 | ~28 |
| Sáb | ~35 | ~7 |

Los valores ahora reflejarán el volumen diario promedio real, permitiendo una comparación justa mes a mes.
