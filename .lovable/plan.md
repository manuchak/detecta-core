

## Rediseno completo: Checklist Detail y Photo Lightbox

### Diagnostico raiz

**1. Foto se sale del lightbox**
El `DialogContent` base (dialog.tsx linea 40) aplica `grid` como layout. Los componentes intentan sobreescribir con `flex flex-col` en className, pero la especificidad de Tailwind no garantiza que `flex` gane sobre `grid`. Ademas, el `style={{ zoom: 1.428571 }}` en dialog.tsx linea 43 se aplica hardcoded, y aunque `{...props}` lo sobreescribe, hay un conflicto potencial. La solucion real es usar `overflow-hidden` en el DialogContent y asegurar que el contenedor de imagen tenga dimensiones absolutas, no relativas a flex.

**2. Tabs fue peor que scroll**
El layout por tabs oculta informacion critica detras de clics, obligando al operador a cambiar entre pestanas para tener una vision completa. En un proceso de seguridad, toda la informacion debe estar visible de un vistazo.

### Solucion: Layout de 3 columnas "Dashboard Compacto"

Reemplazar tabs con un layout denso que muestre todo en una sola pantalla sin scroll:

```text
+--------------------------------------------------------------+
| MONTE ROSAS SPORTS           Completo  [WhatsApp] [X]       |
| Folio: MOTSMRS-522 | 13 feb 05:00 | CRISTHIAN AGUILAR      |
| LAZARO CARDENAS -> TULTITLAN                                  |
|--------------------------------------------------------------|
| FOTOS              | VEHICULO        | OBSERVACIONES         |
| [Frontal][Lat.Izq] | ✅ Llantas      | Sin observaciones     |
| [Trasera][Lat.Der] | ✅ Luces        | registradas           |
|                    | ✅ Frenos       |                       |
|                    | ✅ Espejos      | FIRMA                 |
|                    | ✅ Limpiabrisas | [imagen firma]        |
|                    | ✅ Carroceria   |                       |
|                    |-----------------|                       |
|                    | EQUIPO          | Completado el         |
|                    | ✅ Gato         | 13 feb a las 04:32    |
|                    | ✅ Llanta ref.  |                       |
|                    | ✅ Triangulos   |                       |
|                    | ✅ Extintor     |                       |
|                    |-----------------|                       |
|                    | ⛽ 3/4 [====  ] |                       |
+--------------------------------------------------------------+
```

Beneficios:
- Todo visible sin scroll ni cambio de pestana
- Las fotos son thumbnails clickeables que abren el lightbox
- La columna central concentra toda la inspeccion (6 vehiculares + 4 equipamiento + combustible = 11 items compactos)
- La columna derecha muestra observaciones, firma y metadata

### Solucion: Lightbox con zoom

Para la foto en detalle:
- Corregir el overflow eliminando la clase `grid` base del DialogContent usando `!flex` o sobreescribiendola correctamente
- Agregar capacidad de zoom: doble clic alterna entre vista ajustada (object-contain) y zoom 2x con paneo
- Boton de zoom visible en el header

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `ChecklistDetailModal.tsx` | Reescribir: eliminar Tabs, implementar layout 3 columnas con CSS grid. Header compacto fijo + grid `grid-cols-[1fr_auto_1fr]` para fotos/inspeccion/observaciones |
| `PhotoLightbox.tsx` | Corregir overflow con `!flex !flex-col overflow-hidden` en DialogContent. Agregar estado de zoom (1x/2x) con doble clic y paneo cuando esta en zoom |

### Detalle tecnico

**ChecklistDetailModal - Layout 3 columnas:**

```typescript
<DialogContent 
  className="max-w-5xl h-[85vh] p-0 !flex !flex-col overflow-hidden [&>button:last-child]:hidden"
  style={{ zoom: 1 }}
>
  {/* Header compacto - shrink-0 */}
  <div className="p-4 pb-3 border-b shrink-0">
    {/* titulo, folio, badge, X, info servicio, alertas */}
  </div>

  {/* Body - 3 columnas */}
  <div className="flex-1 min-h-0 grid grid-cols-3 gap-0 overflow-hidden">
    {/* Col 1: Fotos - grid 2x2 */}
    <div className="p-4 border-r overflow-auto">
      <h4 className="text-xs font-semibold uppercase mb-2">Fotos</h4>
      <div className="grid grid-cols-2 gap-2">
        {/* 4 thumbnails clickeables */}
      </div>
    </div>

    {/* Col 2: Inspeccion + Equipo + Combustible */}
    <div className="p-4 border-r overflow-auto">
      <h4 className="text-xs font-semibold uppercase mb-2">Inspeccion</h4>
      {/* 6 items vehiculares - grid compacto */}
      {/* separador */}
      {/* 4 items equipamiento */}
      {/* barra combustible */}
    </div>

    {/* Col 3: Observaciones + Firma */}
    <div className="p-4 overflow-auto">
      <h4 className="text-xs font-semibold uppercase mb-2">Observaciones</h4>
      {/* texto observaciones */}
      {/* firma */}
      {/* metadata fecha */}
    </div>
  </div>
</DialogContent>
```

**PhotoLightbox - Fix overflow + Zoom:**

```typescript
// Estado de zoom
const [zoomed, setZoomed] = useState(false);
const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

// Doble clic toggle zoom
const handleDoubleClick = () => {
  setZoomed(prev => !prev);
  setPanPosition({ x: 0, y: 0 });
};

// Drag para paneo cuando esta en zoom
const handleMouseMove = (e: React.MouseEvent) => {
  if (!zoomed || !isDragging) return;
  setPanPosition(prev => ({
    x: prev.x + e.movementX,
    y: prev.y + e.movementY,
  }));
};

<DialogContent
  className="max-w-4xl h-[90vh] p-0 !flex !flex-col overflow-hidden 
             bg-background/95 backdrop-blur [&>button:last-child]:hidden"
  style={{ zoom: 1 }}
>
  {/* Header con boton zoom */}
  {/* Image container */}
  <div className="flex-1 min-h-0 relative flex items-center justify-center overflow-hidden">
    <img
      className={cn(
        "max-h-full max-w-full rounded-lg transition-transform cursor-zoom-in",
        zoomed && "scale-[2] cursor-grab"
      )}
      style={zoomed ? { transform: `scale(2) translate(${panPosition.x}px, ${panPosition.y}px)` } : undefined}
      onDoubleClick={handleDoubleClick}
    />
  </div>
  {/* Thumbnails footer */}
</DialogContent>
```

### Resultado esperado

- Al abrir el detalle del checklist, el operador ve fotos, inspeccion y observaciones en una sola pantalla sin scroll
- Las fotos son thumbnails compactos que al hacer clic abren el lightbox fullscreen
- En el lightbox, la foto se contiene correctamente dentro del dialog
- Doble clic en la foto alterna zoom 2x con capacidad de paneo para evaluar detalles
- Toda la informacion critica de seguridad esta accesible de un vistazo
