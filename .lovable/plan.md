

## Fix: Incluir `servicios_planificados` en el Funnel de Fidelidad

### Problema

`useCSLoyaltyFunnel.ts` (linea 110-113) solo consulta `servicios_custodia`, ignorando `servicios_planificados`. Resultado:
- Clientes con servicios recientes en la tabla nueva aparecen con `dias_sin_contacto = 999`
- `calculateStage()` los clasifica como **En Riesgo** (condicion: `dias_sin_contacto > 60`)
- Por eso 49 de 80 clientes (61%) caen en "En Riesgo" cuando en realidad estan activos

### Solucion

Aplicar el mismo patron de "Dual-Source Unification" ya implementado en los otros 3 hooks de CS.

### Cambio en `src/hooks/useCSLoyaltyFunnel.ts`

**Reemplazar** el fetch simple de servicios (lineas 110-113):
```
const { data: servicios, error: sErr } = await supabase
  .from('servicios_custodia')
  .select('nombre_cliente, cobro_cliente, fecha_hora_cita');
```

**Por** el patron dual con deduplicacion:
```
const [legacyRes, planRes] = await Promise.all([
  supabase.from('servicios_custodia')
    .select('nombre_cliente, cobro_cliente, fecha_hora_cita'),
  supabase.from('servicios_planificados')
    .select('nombre_cliente, cobro_posicionamiento, fecha_hora_cita'),
]);
if (legacyRes.error) throw legacyRes.error;
if (planRes.error) throw planRes.error;

const planData = (planRes.data || []).map(s => ({
  nombre_cliente: s.nombre_cliente,
  cobro_cliente: s.cobro_posicionamiento,
  fecha_hora_cita: s.fecha_hora_cita,
}));
const allServicios = [...(legacyRes.data || []), ...planData];
const seen = new Set();
const servicios = allServicios.filter(s => {
  const key = `${s.nombre_cliente?.toLowerCase().trim()}|${s.fecha_hora_cita}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
```

Mover estas dos queries al bloque `Promise.all` existente (linea 116) para mantener el paralelismo.

### Resultado esperado

- Clientes con servicios planificados recientes saldran de "En Riesgo" y se clasificaran correctamente (Activo, Leal, Promotor, etc.)
- El conteo del funnel hara match con los datos de las tarjetas de Cartera
- Sin cambios en la UI ni en la logica de `calculateStage()`

