

# Mostrar Folio + Cliente en Tarjetas de Equipo en Turno

## Problema
Actualmente las tarjetas de monitoristas solo muestran el nombre del cliente. El coordinador necesita ver el folio del servicio junto al cliente para identificar rápidamente qué servicios están asignados.

## Cambios

### 1. `CoordinatorCommandCenter.tsx` — Enriquecer `serviceLabelMap`
Cambiar la construcción del mapa para incluir folio + cliente:
```ts
// Antes:  `${s.nombre_cliente || s.id_servicio.slice(0, 8)}`
// Después: `${s.id_servicio} — ${s.nombre_cliente || ''}`
```
Esto ya se propaga automáticamente a `MonitoristaCard` y `AbandonedServicesSection`.

### 2. `MonitoristaCard.tsx` — Ajustar layout de la línea de servicio
En la fila de cada assignment (línea ~111), separar visualmente folio y cliente:
- Parsear el label por el separador ` — `
- Mostrar folio en `font-mono font-medium` y cliente en texto normal
- Ambos en la misma línea, truncados si no caben

| Archivo | Cambio |
|---------|--------|
| `CoordinatorCommandCenter.tsx` | serviceLabelMap incluye `id_servicio — nombre_cliente` |
| `MonitoristaCard.tsx` | Renderizar folio + cliente con estilos diferenciados |

