

# Radar Operativo: 4 bloques equitativos con scroll independiente

## Situación actual
La lista de servicios tiene una zona fija de alertas (max 45% de altura) y el resto en un solo bloque con auto-scroll global. Los usuarios quieren ver las 4 categorías simultáneamente, cada una con su propio scroll.

## Propuesta

Reorganizar `RadarServicesList.tsx` para que los 4 grupos (Alertas, En Ruta, Por Iniciar, En Evento) ocupen cada uno **25% de la altura** del panel, con scroll independiente por bloque. El orden vertical según el sketch:

```text
┌──────────────────┐
│  ⚠ ALERTA        │ 25% — scroll propio
├──────────────────┤
│  EN RUTA          │ 25% — scroll propio
├──────────────────┤
│  POR INICIAR      │ 25% — scroll propio
├──────────────────┤
│  EN EVENTO        │ 25% — scroll propio
└──────────────────┘
```

### Cambios en `RadarServicesList.tsx`

1. **Eliminar** la lógica de zona fija de alertas vs zona scrollable — ahora todos los grupos son iguales
2. **Siempre renderizar** los 4 bloques aunque estén vacíos (mostrar "Sin servicios" en gris)
3. Cada bloque: `h-1/4` con `overflow-y-auto` y auto-scroll independiente por bloque
4. Reordenar GROUPS: Alerta → En Ruta → Por Iniciar → En Evento (según sketch)
5. El auto-scroll lento aplica individualmente a cada bloque que tenga contenido desbordante

| Archivo | Cambio |
|---------|--------|
| `RadarServicesList.tsx` | Layout de 4 bloques equitativos con scroll independiente |

