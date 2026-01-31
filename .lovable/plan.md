
# Plan: Contexto Operativo Real en Home

## Diagnóstico del Problema

**Situación actual del widget "Completitud Hoy":**
- Consulta `servicios_custodia` (tabla legacy de ejecución) en lugar de `servicios_planificados` (tabla de planeación)
- Solo muestra un porcentaje aislado (ej: "0%") sin contexto
- No responde las preguntas operativas reales: ¿hay servicios planeados? ¿cuántos salieron? ¿hay retrasos?

**Lo que el ejecutivo necesita saber de un vistazo:**
1. ¿Cuántos servicios tiene el turno actual?
2. ¿Cuál es el estado operativo? (posicionados vs en camino vs pendientes)
3. ¿Hay algo bloqueado? (servicios sin custodio)

---

## Solución: Widget "Pulso del Turno"

Reemplazar `completionRateToday` con un nuevo widget `shiftPulse` que consume la misma lógica del Centro de Control (`useServiciosTurno`).

### Diseño Visual

```text
┌──────────────────────────────┐
│  TURNO ACTUAL                │
│  ───────────────────────────│
│  14 servicios                │  ← Valor principal
│  8 ✓ · 3 → · 2 📋 · 1 ⚠️    │  ← Subtext con semáforo
└──────────────────────────────┘

Leyenda subtext:
✓ = Posicionados (en sitio)
→ = En camino (próximos)
📋 = Por salir (asignados)
⚠️ = Sin custodio (crítico)
```

### Lógica de Urgencia Visual

| Condición | Indicador |
|-----------|-----------|
| Sin servicios | Neutral, subtext "Sin servicios programados" |
| 100% posicionados | Verde (tendencia up) |
| Hay servicios sin custodio | Amarillo/Rojo según cantidad |
| Normal operativo | Neutral |

---

## Implementación Técnica

### 1. Nuevo Case en `useWidgetData.ts`

Agregar `shiftPulse` que consume directamente los datos de `servicios_planificados` con la ventana de ±8 horas:

```typescript
case 'shiftPulse': {
  // Ventana de ±8 horas (igual que Centro de Control)
  const ahora = new Date();
  const hace8h = new Date(ahora.getTime() - 8 * 60 * 60 * 1000);
  const en8h = new Date(ahora.getTime() + 8 * 60 * 60 * 1000);
  
  const { data } = await supabase
    .from('servicios_planificados')
    .select('hora_inicio_real, custodio_asignado, fecha_hora_cita')
    .gte('fecha_hora_cita', hace8h.toISOString())
    .lte('fecha_hora_cita', en8h.toISOString())
    .not('estado_planeacion', 'in', '(cancelado,completado)');
  
  // Calcular estados
  const enSitio = data.filter(s => s.hora_inicio_real).length;
  const sinCustodio = data.filter(s => !s.custodio_asignado).length;
  const total = data.length;
  // ... lógica de próximos vs asignados
  
  return {
    value: total > 0 ? `${total} servicios` : 'Sin servicios',
    subtext: total > 0 
      ? `${enSitio} ✓ · ${proximos} → · ${asignados} 📋${sinCustodio > 0 ? ` · ${sinCustodio} ⚠️` : ''}`
      : 'programados en turno',
    trendDirection: sinCustodio > 0 ? 'down' : enSitio === total ? 'up' : 'neutral'
  };
}
```

### 2. Registrar Nuevo Widget Type

En `roleHomeConfig.ts`, agregar `shiftPulse` a la lista de `WidgetType`.

### 3. Actualizar Configuración de Admin

Cambiar la configuración del rol `admin`:

```typescript
// ANTES
contextWidgets: [
  { type: 'monthlyGMVWithContext', label: 'GMV del Mes' },
  { type: 'activeCustodiansWithContext', label: 'Fuerza Activa' },
  { type: 'completionRateToday', label: 'Completitud Hoy' }  // ❌ No aporta valor
]

// DESPUÉS
contextWidgets: [
  { type: 'monthlyGMVWithContext', label: 'GMV del Mes' },
  { type: 'activeCustodiansWithContext', label: 'Fuerza Activa' },
  { type: 'shiftPulse', label: 'Turno Actual' }  // ✅ Contexto operativo real
]
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/home/useWidgetData.ts` | Agregar case `shiftPulse` con lógica de ventana ±8h |
| `src/config/roleHomeConfig.ts` | Agregar `shiftPulse` a `WidgetType` y actualizar config de `admin` |

---

## Resultado Esperado

En lugar de ver "Completitud: 0%" sin contexto, verás:

**Turno Actual**
- **14 servicios**
- `8 ✓ · 3 → · 2 📋 · 1 ⚠️`

Esto te dice inmediatamente: hay 14 servicios en el turno, 8 ya posicionados, 3 en camino, 2 por salir, y 1 crítico sin custodio asignado.
