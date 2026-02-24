

# Fix: Mapa no ocupa el 100% del espacio disponible

## Diagnostico

En el screenshot se ve claramente que el mapa termina a ~60% de la altura disponible, con espacio vacio debajo. La leyenda aparece fuera del area visual del mapa.

La causa es que en una correccion anterior se elimino `h-full` del wrapper del mapa. Sin `h-full`, el contenedor solo crece hasta `min-h-[420px]` y no se estira para llenar la celda del grid (que si tiene `gridTemplateRows: '1fr'`).

## Correccion

### Archivo: `src/components/security/routes/RouteRiskIntelligence.tsx` (linea 35)

Restaurar `h-full` en el wrapper del mapa para que se estire al 100% de la celda del grid:

```
// Antes:
<div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[420px]" style={{ zoom: 1 }}>

// Despues:
<div className="relative rounded-lg overflow-hidden border bg-muted/10 min-h-[420px] h-full" style={{ zoom: 1 }}>
```

Esto es seguro porque ahora el grid padre tiene `gridTemplateRows: '1fr'` que le da una altura explicita a la celda, por lo que `h-full` se resuelve correctamente (a diferencia de antes cuando la fila era `auto`).

## Resultado esperado

El mapa ocupara el 100% de la altura disponible en el tab, desde el header de estadisticas hasta el borde inferior de la pagina.
