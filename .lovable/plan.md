
# Corregir el TVAlertTicker para que muestre alertas correctamente

## Problema visible en el screenshot

El ticker en la esquina inferior derecha muestra **"Sin alertas de ruta recientes"** a pesar de que existen incidentes en la base de datos. Esto se debe a tres causas técnicas.

## Causas raíz

1. **Ventana temporal de 1 día (24h)**: Los datos del último scrape de Twitter tienen ~25+ horas, quedando fuera del filtro `dias_atras: 1`
2. **Filtro muy estricto**: La lógica solo prioriza incidentes con el campo `carretera` poblado en la BD, pero la mayoría de tweets mencionan carreteras solo en el texto libre (`resumen_ai`)
3. **Sin actualización automática**: El hook no tiene `refetchInterval`, por lo que no se refresca sin recargar la página

## Correcciones

### En `src/components/monitoring/tv/TVAlertTicker.tsx`:

- Cambiar `dias_atras` de **1 a 3** para garantizar contenido visible
- Mejorar la detección de incidentes carreteros usando regex sobre `resumen_ai`:
  - Palabras clave: `carretera`, `autopista`, `tramo`, `corredor`, `libramiento`, `trailer`, `volcadura`
- Relajar la lógica de relleno: si hay menos de 5 incidentes "de carretera", completar con el resto hasta 20
- Agregar `refetchInterval: 120000` (cada 2 minutos) para mantener datos frescos en el videowall

### Resultado esperado

El ticker mostrará los incidentes relevantes a operaciones carreteras con el marquee animado, incluyendo severidad, ubicación geográfica y tiempo transcurrido, actualizándose automáticamente cada 2 minutos.
