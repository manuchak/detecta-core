

# Fix: Alertas fijas en el Radar Operativo

## Problema
El auto-scroll del listado de servicios hace que las alertas (critical/warning) se desplacen junto con el resto, impidiendo que el equipo C4 las vea y atienda de forma inmediata.

## Solución
Dividir el panel en dos zonas:

```text
┌─────────────────────────┐
│ SERVICIOS (12)          │  ← Header (fijo)
├─────────────────────────┤
│ ⚠ ALERTA (2)           │  ← Zona fija, siempre visible
│  Simply Orange  ⏱ 52m  │     con fondo rojo sutil pulsante
│  Bimbo Norte   ⏱ 38m  │     max-height ~40% del panel
│                         │     scroll propio si hay muchas
├─────────────────────────┤
│ EN EVENTO (1)           │  ← Zona scrollable (auto-scroll)
│ EN RUTA (5)             │
│ POR INICIAR (4)         │
│  ...                    │
└─────────────────────────┘
```

## Cambio en `RadarServicesList.tsx`

1. Separar `groupedData` en dos: `alertGroup` (key=alerta) y `restGroups` (todo lo demás)
2. Renderizar `alertGroup` en un `div` fijo con:
   - `max-h-[40%] overflow-y-auto` (scroll propio si hay muchas alertas)
   - Fondo `bg-red-950/30` con borde inferior rojo para distinción visual
   - Animación `animate-pulse` sutil en el header del grupo cuando hay alertas critical
3. Renderizar `restGroups` en el `div ref={scrollRef}` existente con auto-scroll
4. El auto-scroll solo aplica a la zona inferior

## Archivo

| Archivo | Cambio |
|---------|--------|
| `src/components/monitoring/radar/RadarServicesList.tsx` | Separar alertas en zona fija superior |

