
## Fix: Columna incorrecta en queries a `servicios_planificados`

### Problema raiz

La tabla `servicios_planificados` no tiene columna `cobro_cliente` -- se llama `cobro_posicionamiento`. Los 3 hooks de CS hacen `select('nombre_cliente, cobro_cliente, fecha_hora_cita')` contra esa tabla, lo que retorna un error HTTP 400:

```
"column servicios_planificados.cobro_cliente does not exist"
```

Como el codigo hace `if (planRes.error) throw planRes.error`, toda la query falla y la tabla muestra 0 clientes.

### Solucion

Cambiar `cobro_cliente` a `cobro_posicionamiento` en los 3 archivos, y mapear el valor al alias `cobro_cliente` en el codigo para mantener compatibilidad con la logica existente.

### Cambios por archivo

**1. `src/hooks/useCSCartera.ts` (linea 48)**
- Cambiar: `select('nombre_cliente, cobro_cliente, fecha_hora_cita')`
- A: `select('nombre_cliente, cobro_posicionamiento, fecha_hora_cita')`
- En la logica de GMV, usar `cobro_posicionamiento` para los registros de planificados (o unificar con un map previo)

**2. `src/hooks/useCSHealthScores.ts` (linea 50)**
- Mismo cambio: `cobro_cliente` a `cobro_posicionamiento`

**3. `src/hooks/useCSRetentionMetrics.ts` (linea 35)**
- Mismo cambio: `cobro_cliente` a `cobro_posicionamiento`

### Estrategia de unificacion

Despues de hacer fetch de `servicios_planificados`, mapear los resultados para normalizar el nombre del campo:

```text
const planData = (planRes.data || []).map(s => ({
  nombre_cliente: s.nombre_cliente,
  cobro_cliente: s.cobro_posicionamiento,
  fecha_hora_cita: s.fecha_hora_cita,
}));
```

Esto mantiene toda la logica downstream (calculo de GMV, NRR, etc.) sin cambios adicionales.

### Resultado

- La query dejara de fallar con error 400
- Los ~62+ clientes activos apareceran en la tabla de Cartera
- Las metricas de Panorama (NRR, Churn, CSAT) tambien se corregiranm porque usan los mismos hooks
