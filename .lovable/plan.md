
## Fix: Incluir `servicios_planificados` en todos los hooks de Customer Success

### Problema

Los 3 hooks principales de CS solo consultan `servicios_custodia` (tabla legacy), ignorando `servicios_planificados` donde se crean los servicios nuevos. Resultado: **66 clientes con actividad reciente son invisibles** para CS, mostrando 33 en lugar de los 62+ reales.

### Hooks afectados

| Hook | Impacto |
|------|---------|
| `useCSCartera` | Cartera muestra 33 clientes "con servicio" en vez de ~62 |
| `useCSClientesConQuejas` | Lista de clientes y riesgo subestimado |
| `useCSRetentionMetrics` | NRR, Churn Rate y tendencia 6 meses incorrectos |

### Solucion

Aplicar el mismo patron usado en `useCustodianServices`: consultar ambas tablas en paralelo, unificar por `nombre_cliente` normalizado, y deduplicar.

### Cambios por archivo

**1. `src/hooks/useCSCartera.ts`**
- Agregar query paralelo a `servicios_planificados` (campos: `nombre_cliente`, `cobro_cliente`, `fecha_hora_cita`)
- Combinar resultados de ambas tablas en un solo array `servicios` antes del `.map()`
- Deduplicar por combinacion de `nombre_cliente + fecha_hora_cita` para evitar contar doble

**2. `src/hooks/useCSHealthScores.ts` (funcion `useCSClientesConQuejas`)**
- Mismo patron: agregar fetch paralelo de `servicios_planificados`
- Unificar array de servicios antes de calcular metricas por cliente
- Esto corrige: dias sin contacto, servicios recientes, GMV tendencia, y nivel de riesgo

**3. `src/hooks/useCSRetentionMetrics.ts`**
- Agregar fetch paralelo de `servicios_planificados`
- Combinar antes de calcular: NRR (GMV mes actual vs anterior), Churn Rate (clientes sin servicio 60d+), tendencia 6 meses, y dias promedio sin contacto

### Patron de unificacion (comun a los 3)

```text
// Fetch ambas tablas en paralelo
const [legacyRes, planRes] = await Promise.all([
  supabase.from('servicios_custodia').select('nombre_cliente, cobro_cliente, fecha_hora_cita'),
  supabase.from('servicios_planificados').select('nombre_cliente, cobro_cliente, fecha_hora_cita'),
]);

// Unificar y deduplicar
const allServicios = [...(legacyRes.data || []), ...(planRes.data || [])];
const seen = new Set();
const servicios = allServicios.filter(s => {
  const key = `${s.nombre_cliente?.toLowerCase().trim()}|${s.fecha_hora_cita}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
```

### Resultado esperado

- Cartera mostrara los ~62 clientes activos con servicio reciente (en lugar de 33)
- KPIs de Panorama (NRR, Churn, dias sin contacto) reflejaran actividad real
- Segmentos "Sin servicio 90d+" y "En Riesgo" se reduciran al considerar servicios planificados
- Sin cambios en la UI, solo datos mas completos
