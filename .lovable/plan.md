

# Rediseño del Layout del Formulario de Incidentes

## Problema

El layout actual en modo creacion usa `max-w-4xl` (896px) en una sola columna, desperdiciando ~40% del ancho de pantalla disponible. Todo se apila verticalmente forzando scroll innecesario mientras el espacio horizontal queda vacio.

## Solucion: Layout de 2 columnas siempre

Usar un grid de 2 columnas (60/40) tanto en creacion como en edicion, distribuyendo las secciones para aprovechar todo el ancho:

```text
+----------------------------------+------------------------+
| Vincular Servicio                | Controles y Atribucion |
+----------------------------------+                        |
| Datos Generales                  |                        |
|  [Tipo] [Severidad] [Cliente]    +------------------------+
|  [Ubicacion/Zona + Mapa]         | Cronologia de Eventos  |
|  [Descripcion]                   |                        |
+----------------------------------+                        |
| Resolucion (solo al editar)      |                        |
+----------------------------------+------------------------+
```

## Cambios en el archivo

**`src/components/monitoring/incidents/IncidentReportForm.tsx`**

1. **Eliminar `max-w-4xl`** - Quitar la restriccion de ancho maximo
2. **Usar `grid-cols-1 lg:grid-cols-5` siempre** - Columna izquierda 3/5 (60%), derecha 2/5 (40%)
3. **Columna izquierda**: Vincular Servicio + Datos Generales (+ Resolucion si edita)
4. **Columna derecha**: Controles y Atribucion + Cronologia de Eventos
5. Ambas columnas visibles tanto en creacion como en edicion

### Detalle del grid

| Antes | Despues |
|---|---|
| `grid-cols-1 max-w-4xl` (creacion) | `grid-cols-1 lg:grid-cols-5` siempre |
| `grid-cols-1 lg:grid-cols-3` (edicion) | Mismo grid, col derecha agrega card Resolucion |
| Controles debajo de Descripcion | Controles en columna derecha |
| Cronologia debajo de Controles | Cronologia en columna derecha debajo de Controles |

Solo se modifica un archivo: `src/components/monitoring/incidents/IncidentReportForm.tsx`, lineas 543-777 (la estructura del grid).
