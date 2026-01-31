
# Plan: Filtro de Ventana Temporal Ajustable (±8h / ±12h / ±24h)

## Análisis de Factibilidad

El diseño actual tiene un título estático: **"Posicionamiento del Turno (±8 hrs)"**. Podemos reemplazar el texto fijo con un **segmented control** compacto que permite cambiar la ventana temporal sin afectar el layout.

## Diseño Visual Propuesto

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Posicionamiento del Turno   [±8h] [±12h] [±24h]        ⟳ 12:27    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐              │
│  │POSICIONADO│ │EN CAMINO │ │ POR SALIR│ │PENDIENTE │              │
│  │    6     │ │    0     │ │    0     │ │    0     │              │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘              │
└─────────────────────────────────────────────────────────────────────┘
```

**Componente elegido**: `ToggleGroup` de Radix UI (ya instalado) - compacto, accesible, y consistente con el design system.

---

## Cambios Técnicos

### 1. Modificar Hook `useServiciosTurno.ts`

Agregar parámetro `timeWindowHours` para hacer la ventana configurable:

```typescript
export const useServiciosTurno = (timeWindowHours: number = 8) => {
  return useQuery({
    queryKey: ['servicios-turno', timeWindowHours], // Invalidar cache al cambiar
    queryFn: async () => {
      const ahora = new Date();
      const desde = new Date(ahora.getTime() - timeWindowHours * 60 * 60 * 1000);
      const hasta = new Date(ahora.getTime() + timeWindowHours * 60 * 60 * 1000);
      // ... resto igual
    }
  });
};
```

### 2. Actualizar `ShiftSummaryCards.tsx`

Agregar el selector de ventana temporal en el header:

```typescript
interface ShiftSummaryCardsProps {
  // ... props existentes
  timeWindow: number;
  onTimeWindowChange: (hours: number) => void;
}

// En el header:
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <h2 className="text-lg font-semibold">Posicionamiento del Turno</h2>
    <ToggleGroup type="single" value={String(timeWindow)} onValueChange={...}>
      <ToggleGroupItem value="8">±8h</ToggleGroupItem>
      <ToggleGroupItem value="12">±12h</ToggleGroupItem>
      <ToggleGroupItem value="24">±24h</ToggleGroupItem>
    </ToggleGroup>
  </div>
  {/* timestamp */}
</div>
```

### 3. Actualizar `MonitoringPage.tsx`

Agregar estado y propagarlo:

```typescript
const [timeWindow, setTimeWindow] = useState(8);
const { data, isLoading, refetch, dataUpdatedAt } = useServiciosTurno(timeWindow);

<ShiftSummaryCards 
  timeWindow={timeWindow}
  onTimeWindowChange={setTimeWindow}
  // ... resto
/>
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useServiciosTurno.ts` | Agregar parámetro `timeWindowHours` |
| `src/components/monitoring/ShiftSummaryCards.tsx` | Agregar ToggleGroup en header |
| `src/pages/Monitoring/MonitoringPage.tsx` | Agregar estado `timeWindow` |

---

## Beneficios

- **Sin ruptura de diseño**: El toggle se integra naturalmente en el espacio del título
- **Performance**: Query key incluye la ventana, así que React Query cachea cada configuración independientemente
- **UX consistente**: Usa ToggleGroup de Radix UI que ya existe en el proyecto
- **Persistencia opcional**: Podría guardarse en localStorage para recordar preferencia del usuario
