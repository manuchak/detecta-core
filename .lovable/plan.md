

## Fix: KM e Ingresos en ceros en Tendencias

### Causa raiz

En `useProfileTrends.ts` linea 108, la query selecciona `estado_servicio` pero la columna real en `servicios_custodia` se llama `estado`. Esto causa que toda la query de Supabase falle con error 400 (columna inexistente), y el codigo al verificar `if (ejecutados)` simplemente salta todo el bloque. Resultado: km, ingresos y puntualidad quedan en 0 para todos los meses.

### Solucion

Cambiar `estado_servicio` por `estado` en el select de la query, y actualizar la referencia en la linea de comparacion.

### Cambio por archivo

| Archivo | Cambio |
|---|---|
| `src/pages/PerfilesOperativos/hooks/useProfileTrends.ts` | Linea 108: cambiar `estado_servicio` a `estado` en el `.select()`. Linea 123: cambiar `s.estado_servicio` a `s.estado`. Comparar con `'Finalizado'` (mayuscula inicial, segun los datos reales de la BD). |

### Detalle del cambio

```typescript
// Linea 108: ANTES
.select('id, km_recorridos, km_teorico, costo_custodio, fecha_hora_cita, hora_presentacion, estado_servicio')

// Linea 108: DESPUES
.select('id, km_recorridos, km_teorico, costo_custodio, fecha_hora_cita, hora_presentacion, estado')

// Linea 123: ANTES
if (s.estado_servicio === 'finalizado') {

// Linea 123: DESPUES
if (s.estado?.toLowerCase() === 'finalizado') {
```

### Impacto

- Los 6 meses de datos de Alvaro Toriz (87 servicios, 12,275 km, $137,307 en ingresos) se mostraran correctamente en las graficas
- La puntualidad mensual tambien aparecera (79 servicios con datos de hora_presentacion)
- Afecta a todos los perfiles operativos, no solo a Alvaro
