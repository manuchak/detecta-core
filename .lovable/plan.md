
# Evaluacion Critica de UI del Formulario de Incidentes

## Hallazgos del Analisis

### 1. Mapa NO interactivo (problema critico)
El mapa en `LocationPicker.tsx` se inicializa con `interactive: false` (linea 64). Esto significa que el usuario **no puede hacer clic para mover el marcador**. Solo funciona como vista previa estatica. Para un reporte de incidentes donde la ubicacion exacta es crucial, esto es una limitacion severa.

**Solucion**: Hacer el mapa interactivo, permitir clic para reposicionar el marcador, y hacer geocodificacion inversa para actualizar la direccion automaticamente.

### 2. "Atribuible a la operacion" - Contexto insuficiente
El checkbox "Atribuible a la operacion" esta aislado en la columna derecha sin explicacion. Un usuario operativo no necesariamente sabe que implica marcar esto (responsabilidad interna vs. factor externo). Ademas, esta separado de los datos principales del incidente cuando logicamente es parte de la clasificacion.

**Solucion**: Agregar un tooltip o texto de ayuda que explique: "Marcar si el incidente fue causado o pudo prevenirse por acciones operativas internas". Mover la seccion de Controles y Atribucion debajo de la descripcion en la columna principal, ya que es parte del flujo natural de reporte.

### 3. Layout de columna derecha desaprovechada
En modo creacion (no edicion), la columna derecha solo muestra "Controles y Atribucion" - una card pequena con un checkbox, 6 botones de controles, y un textarea. No justifica una columna completa del 33% del ancho. La seccion de "Resolucion" solo aparece al editar.

**Solucion**: Reorganizar en layout de una sola columna con secciones colapsables, o integrar Controles dentro de la seccion de Datos Generales como un bloque adicional.

### 4. Mapa ocupa solo 50% del ancho
El LocationPicker esta dentro de un `grid-cols-2` junto con "Cliente", lo que limita el mapa a la mitad del ancho disponible. Para un mapa con marcador, esto es demasiado estrecho.

**Solucion**: Dar al mapa el ancho completo de la seccion, y poner Cliente en la misma fila que Tipo/Severidad (que ya tiene espacio).

### 5. Altura del mapa insuficiente
El mapa tiene `h-32` (128px). Es demasiado pequeno para distinguir ubicaciones con precision, especialmente si se quiere hacer interactivo con clic.

**Solucion**: Aumentar a `h-48` (192px) minimo.

---

## Plan de Implementacion

### Archivo 1: `LocationPicker.tsx` - Mapa interactivo con clic

- Cambiar `interactive: false` a `interactive: true`
- Agregar evento `click` al mapa que:
  1. Mueve el marcador a la posicion clickeada
  2. Ejecuta `reverseGeocode(lat, lng)` para obtener la direccion
  3. Llama `onChange({ zona: address, lat, lng })` para actualizar el formulario
- Aumentar altura del mapa de `h-32` a `h-48`
- Agregar cursor crosshair al mapa para indicar que es clickeable
- Agregar texto de ayuda debajo: "Haz clic en el mapa para ajustar la ubicacion"

### Archivo 2: `IncidentReportForm.tsx` - Reorganizacion de layout

- **Mover "Cliente"** al grid de Tipo/Severidad (hacer grid-cols-3 o poner Cliente como campo adicional)
- **Dar ancho completo al LocationPicker** (sacarlo del grid-cols-2)
- **Integrar "Controles y Atribucion"** dentro de la columna principal, despues de Descripcion, como parte del flujo natural
  - Agregar tooltip al checkbox "Atribuible a la operacion" con texto explicativo
- **Eliminar layout de 3 columnas** en modo creacion; usar 1 columna principal con secciones apiladas
- Mantener la columna lateral solo cuando se edita (para Resolucion)

### Resumen de cambios por archivo

| Archivo | Cambios |
|---|---|
| `src/components/monitoring/incidents/LocationPicker.tsx` | Mapa interactivo con clic, reverse geocode, h-48, cursor crosshair, texto de ayuda |
| `src/components/monitoring/incidents/IncidentReportForm.tsx` | Layout reorganizado: 1 columna principal, Controles integrado, mapa ancho completo, tooltip en "Atribuible", Cliente reubicado |

### Lo que NO se cambia (funciona bien)
- Guia de clasificacion (desplegable informativa - buen patron)
- Vinculacion de servicio (auto-fill es excelente UX)
- Cronologia de eventos (buena implementacion)
- Persistencia de borradores (ya blindada en iteracion anterior)
- Descripcion y selects con ejemplos contextuales
