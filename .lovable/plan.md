
## Mostrar gadgets asignados en las tarjetas de servicios (CompactServiceCard)

### Problema

Cuando el equipo de planeacion carga servicios con gadgets (GPS portatil, candado satelital, GPS con caja imantada), esa informacion no se muestra en las tarjetas de la vista de servicios del dia. Los planificadores necesitan ver rapidamente que gadgets tiene asignado cada servicio sin tener que abrir el detalle.

### Solucion

Agregar una fila condicional en la tarjeta compacta que muestre los gadgets asignados con iconos y etiquetas compactas (badges), visible solo cuando el servicio tiene gadgets.

### Cambios

**1. Base de datos: Actualizar RPC `get_real_planned_services_summary`**

Agregar `gadgets_cantidades` al JSON que devuelve la funcion para que el frontend reciba la informacion.

Linea a agregar en el `jsonb_build_object`:
```sql
'gadgets_cantidades', COALESCE(sp.gadgets_cantidades, '[]'::jsonb)
```

**2. Frontend: `src/hooks/useScheduledServices.ts`**

Agregar el campo `gadgets_cantidades` al tipo `ScheduledService`:
```typescript
gadgets_cantidades?: Array<{ tipo: string; cantidad: number }>;
```

**3. Frontend: `src/components/planeacion/CompactServiceCard.tsx`**

Agregar una nueva fila condicional (Row 4) despues de la fila de armado que muestre los gadgets asignados como badges compactos:

- Icono `Cpu` para GPS, `Lock` para candados
- Etiquetas cortas: "GPS", "GPS Imantado", "Candado"
- Cantidad si es mayor a 1 (ej: "2x GPS")
- Solo se muestra si el servicio tiene gadgets (array no vacio)

Ejemplo visual en la tarjeta:
```text
MERCED  00:00  EMEDEHE-243    En sitio
SAN LORENZO, CUAUTI... -> ANTONIO RAMON MARTINEZ ROJAS
  GPS Portatil  Candado Satelital          <-- nueva fila
```

### Detalle tecnico

Mapa de etiquetas para los tipos de gadget:
| Tipo DB | Etiqueta corta | Icono |
|---|---|---|
| `gps_portatil` | GPS | Cpu |
| `gps_portatil_caja_imantada` | GPS Imantado | Cpu |
| `candado_satelital` | Candado | Lock |

Los badges usaran estilo compacto con fondo semitransparente (`bg-cyan-100/60 text-cyan-700`) para diferenciarse visualmente de los badges de estado existentes.
