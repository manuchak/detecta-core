

# Mapa expandible con doble clic

## Problema

El mapa inline de 192px es demasiado pequeno para seleccionar ubicaciones con precision. Hacer clic o arrastrar el marcador en un area tan reducida es incomodo.

## Solucion

Agregar un **Dialog de mapa expandido** que se abre al hacer doble clic en el mapa inline (o con un boton "Expandir"). El dialog mostrara un mapa grande (~80vh) con la misma funcionalidad: clic para mover marcador, arrastrar marcador, reverse geocode automatico. Al cerrar el dialog, las coordenadas se sincronizan de vuelta al formulario.

```text
+------------------------------------------+
|  [X]  Seleccionar Ubicacion              |
+------------------------------------------+
|  [📍 Buscar direccion...            X ]  |
|  +------------------------------------+  |
|  |                                    |  |
|  |         MAPA GRANDE               |  |
|  |         (~70vh)                    |  |
|  |                                    |  |
|  |            📍                      |  |
|  |                                    |  |
|  +------------------------------------+  |
|  Direccion actual: Blvd Heroes...        |
|           [Confirmar ubicacion]          |
+------------------------------------------+
```

## Cambios

**Archivo unico: `src/components/monitoring/incidents/LocationPicker.tsx`**

1. Agregar estado `isExpanded` (boolean)
2. Agregar listener `dblclick` en el mapa inline que setea `isExpanded = true`
3. Agregar boton "Expandir" (icono Maximize2) sobre el mapa como alternativa al doble clic
4. Renderizar un `Dialog` cuando `isExpanded = true`:
   - Contenido: barra de busqueda + mapa Mapbox a `h-[70vh]` + direccion actual + boton "Confirmar"
   - El mapa del dialog es una **segunda instancia** de Mapbox (ref separada: `expandedMapRef`, `expandedMarkerRef`)
   - Se inicializa con las mismas coordenadas y zoom del mapa inline
   - Soporta clic para mover marcador + drag del marcador + reverse geocode (misma logica)
   - Incluye barra de busqueda con geocoding (reutiliza `handleSearch`/`handleSelect`)
5. Al hacer clic en "Confirmar" o cerrar el dialog:
   - Se llama `onChange` con las coordenadas finales del mapa expandido
   - Se actualiza el mapa inline para reflejar la nueva posicion
6. Texto de ayuda del mapa inline cambia a: "Doble clic para expandir el mapa"

### Detalles tecnicos

- Se usa el componente `Dialog` existente de `@/components/ui/dialog.tsx` (ya tiene el zoom 1.428571 en el style)
- El `DialogContent` usara `max-w-4xl` para dar ancho suficiente al mapa
- Se necesitan refs separadas para los dos mapas (inline y expandido) para evitar conflictos
- El mapa expandido se inicializa en un `useEffect` que depende de `isExpanded`
- Al cerrar, se llama `expandedMapRef.current?.remove()` para limpiar

