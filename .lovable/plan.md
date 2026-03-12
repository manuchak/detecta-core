

# Implementación: Fix armados en cortes — cálculo por km con tarifas escalonadas

## 3 archivos a modificar

### 1. `GenerarCortesMasivosDialog.tsx` (preview masivo)

**Importar** `fetchTarifasKm` y `calcularCostoPlano` de `@/utils/tarifasKmUtils`.

**Query de armados (líneas 55-72):** Eliminar filtro por `hora_encuentro`. Traer `asignacion_armados` sin filtro de fecha. Agregar `km_recorridos` al SELECT de `servicios_custodia`.

**Agrupación de armados (líneas 114-140):** Cross-referenciar cada asignación con el servicio vinculado via `servicio_custodia_id` → `id_servicio`. Si el servicio no está en la semana o no está finalizado, se ignora. Calcular costo con `calcularCostoPlano(km_recorridos, tarifasKm)`. Enriquecer cada detalle con fecha, origen, destino y km del servicio padre.

```typescript
// Import añadido
import { fetchTarifasKm, calcularCostoPlano } from '@/utils/tarifasKmUtils';

// En la queryFn:
// 1) Query servicios incluyendo km_recorridos y id_servicio
const { data: servicios } = await supabase
  .from('servicios_custodia')
  .select('id, id_servicio, id_custodio, nombre_custodio, costo_custodio, casetas, fecha_hora_cita, origen, destino, km_recorridos')
  .eq('estado', 'Finalizado')
  .gte('fecha_hora_cita', `${semanaInicio}T00:00:00`)
  .lte('fecha_hora_cita', `${semanaFin}T23:59:59`);

// 2) Query asignaciones SIN filtro de fecha
const { data: asignaciones } = await supabase
  .from('asignacion_armados')
  .select('id, armado_id, armado_nombre_verificado, servicio_custodia_id, estado_asignacion')
  .eq('tipo_asignacion', 'interno')
  .in('estado_asignacion', ['completado', 'confirmado', 'pendiente'])
  .not('armado_id', 'is', null);

// Map servicios por id_servicio para cross-ref
const svcMap = new Map((servicios || []).filter(s => s.id_servicio).map(s => [s.id_servicio, s]));
const tarifasKm = await fetchTarifasKm();

// Agrupar armados: solo los que tienen servicio en la semana
for (const a of asignaciones || []) {
  if (!a.armado_id || !a.servicio_custodia_id) continue;
  const svc = svcMap.get(a.servicio_custodia_id);
  if (!svc) continue; // servicio no está en la semana
  
  const km = Number(svc.km_recorridos) || 0;
  const { costo } = calcularCostoPlano(km, tarifasKm);
  // ... agrupar por armado_id con costo calculado, fecha/origen/destino del servicio
}
```

### 2. `useCxPCortesSemanales.ts` (creación real del corte)

**Bloque armado_interno (líneas 153-176):** Mismo fix:
- Query `asignacion_armados` sin filtro `hora_encuentro`
- Traer servicios finalizados de la semana para este armado via JOIN manual
- Calcular monto con `calcularCostoPlano(km, tarifas)`
- Descripción del detalle incluye km y tarifa: `"Servicio FOLIO — 180 km × $5.50/km"`

```typescript
import { fetchTarifasKm, calcularCostoPlano } from '@/utils/tarifasKmUtils';

// En el bloque armado_interno:
const { data: asignaciones } = await supabase
  .from('asignacion_armados')
  .select('id, armado_id, servicio_custodia_id')
  .eq('armado_id', data.operativo_id)
  .eq('tipo_asignacion', 'interno')
  .in('estado_asignacion', ['completado', 'confirmado', 'pendiente']);

// Traer servicios vinculados finalizados en la semana
const svcIds = (asignaciones || []).map(a => a.servicio_custodia_id).filter(Boolean);
const { data: svcs } = await supabase
  .from('servicios_custodia')
  .select('id, id_servicio, km_recorridos, nombre_cliente')
  .in('id_servicio', svcIds)
  .eq('estado', 'Finalizado')
  .gte('fecha_hora_cita', `${data.semana_inicio}T00:00:00`)
  .lte('fecha_hora_cita', `${data.semana_fin}T23:59:59`);

const tarifas = await fetchTarifasKm();
const svcMap = new Map((svcs || []).map(s => [s.id_servicio, s]));

for (const a of asignaciones || []) {
  const svc = svcMap.get(a.servicio_custodia_id);
  if (!svc) continue;
  const km = Number(svc.km_recorridos) || 0;
  const { costo, tarifa } = calcularCostoPlano(km, tarifas);
  montoServicios += costo;
  totalServicios++;
  detalles.push({
    concepto: 'servicio',
    descripcion: `Servicio ${svc.id_servicio} — ${km} km × $${tarifa}/km`,
    monto: costo,
    servicio_custodia_id: svc.id,
  });
}
```

### 3. `GenerarCorteDialog.tsx` (preview individual)

**Bloque armado (líneas 103-116):** Mismo patrón: query sin `hora_encuentro`, cross-ref con servicios, calcular por km.

```typescript
// Reemplazar bloque else (líneas 103-116)
const { data: asignaciones } = await supabase
  .from('asignacion_armados')
  .select('id, servicio_custodia_id')
  .eq('armado_id', operativoId)
  .eq('tipo_asignacion', 'interno')
  .in('estado_asignacion', ['completado', 'confirmado', 'pendiente']);

const svcIds = (asignaciones || []).map(a => a.servicio_custodia_id).filter(Boolean);
if (svcIds.length > 0) {
  const { data: svcs } = await supabase
    .from('servicios_custodia')
    .select('id, id_servicio, km_recorridos')
    .in('id_servicio', svcIds)
    .eq('estado', 'Finalizado')
    .gte('fecha_hora_cita', `${semanaInicio}T00:00:00`)
    .lte('fecha_hora_cita', `${semanaFin}T23:59:59`);

  const tarifas = await fetchTarifasKm();
  for (const svc of svcs || []) {
    const km = Number(svc.km_recorridos) || 0;
    const { costo } = calcularCostoPlano(km, tarifas);
    montoServicios += costo;
    totalServicios++;
  }
}
```

## Resumen del cambio

| Antes | Después |
|-------|---------|
| Filtra por `hora_encuentro` (siempre NULL) | Cross-ref con `servicios_custodia.fecha_hora_cita` |
| Usa `tarifa_acordada` (siempre NULL → $0) | `calcularCostoPlano(km_recorridos, tarifas_km)` |
| Armados muestran 0 svcs / $0.00 | Armados muestran servicios reales con costo por km |

