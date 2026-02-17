
## Agregar línea de tendencia polinómica al gráfico GMV Diario

### Qué se hará

Agregar una línea de tendencia punteada (polinómica de grado 3) superpuesta sobre el gráfico de área existente en `GmvDailyChart.tsx`. Esto permite visualizar la dirección general del performance de GMV filtrando el ruido diario.

### Implementación técnica

**Archivo:** `src/components/executive/GmvDailyChart.tsx`

1. **Calcular regresión polinómica (grado 3):** Implementar una función `polyFit` directamente en el componente que reciba los puntos `(x, y)` del GMV diario y devuelva los coeficientes del polinomio usando mínimos cuadrados (eliminación gaussiana sobre la matriz normal).

2. **Generar datos de tendencia:** Crear un campo `gmvTrend` en cada punto de `dailyCurrent` con el valor calculado por el polinomio ajustado.

3. **Agregar línea al gráfico:** Usar un componente `Line` de Recharts (importado adicionalmente) con:
   - `dataKey="gmvTrend"`
   - `strokeDasharray="6 4"` (punteada)
   - Color diferenciado (naranja/amber)
   - Sin dots (`dot={false}`)
   - `strokeWidth={2}`

4. **Leyenda visual:** Agregar indicador en el header mostrando qué representa la línea punteada ("Tendencia").

### Resultado visual

- La línea de área actual se mantiene igual
- Se superpone una línea punteada suave que muestra la tendencia general del GMV
- Solo se calcula sobre días con datos reales (GMV > 0)
