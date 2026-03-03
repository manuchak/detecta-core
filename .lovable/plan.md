

# Diagnóstico: GmvAccumulatedCard compara meses completos vs incompletos

## Problema

En `GmvAccumulatedCard.tsx`, línea 20:

```typescript
.filter(d => d.year === year && d.month <= currentMonth)
```

Hoy es 3 de marzo. `currentMonth = 3`, así que suma:
- **2026**: Ene (completo) + Feb (completo) + Mar (**3 días**)
- **2025**: Ene (completo) + Feb (completo) + Mar (**31 días**)

Resultado: servicios 2026 parecen -15.2% peor cuando en realidad Ene y Feb estuvieron por encima de 2025. Los ~28 días faltantes de marzo 2025 inflan artificialmente el denominador.

La etiqueta "Ene-Mar" refuerza la percepción errónea de que es una comparación justa.

## Solución

Cambiar la lógica para **excluir el mes en curso** y comparar solo meses completos. El mes en curso ya tiene su propia tarjeta MTD dedicada (`UnifiedGMVDashboard`), así que esta tarjeta YTD debe mostrar solo períodos cerrados.

### Archivo: `src/components/executive/GmvAccumulatedCard.tsx`

1. Cambiar el filtro de `d.month <= currentMonth` a `d.month < currentMonth` para ambos años
2. Actualizar el `periodLabel` para reflejar el último mes completo (ej: "Ene-Feb" en lugar de "Ene-Mar")
3. Agregar nota aclaratoria "Meses completos" en el subtitle
4. Edge case: si `currentMonth === 1` (enero, sin meses completos), mostrar mensaje "Sin meses completos aún"

### Cambio clave:

```typescript
// ANTES (compara mes incompleto vs completo)
.filter(d => d.year === year && d.month <= currentMonth)
// periodLabel: "Ene-Mar"

// DESPUÉS (solo meses cerrados)
.filter(d => d.year === year && d.month < currentMonth)
// periodLabel: "Ene-Feb" + "(meses completos)"
```

### Resultado

- YTD solo refleja períodos cerrados → comparación justa
- El mes en curso se monitorea vía la tarjeta MTD existente
- Elimina la falsa señal de declive en servicios

