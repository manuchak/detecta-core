

## Mejora UI: Visor de Fotos y Detalle de Checklist

### Problema 1: Foto desborda el lightbox

La imagen se sale del cuadro porque el contenedor flex (`flex-1`) no tiene `min-h-0`. Sin esto, flexbox no puede reducir el hijo por debajo de su contenido intrinseco, causando overflow.

Ademas, el boton X automatico de Radix (`absolute right-4 top-4` en dialog.tsx) se posiciona encima del boton "Ver en mapa" en el header del lightbox.

**Solucion - PhotoLightbox.tsx:**
- Agregar `min-h-0` al contenedor de imagen para que flex lo constraina correctamente
- Ocultar el boton X de Radix con `[&>button:last-child]:hidden` en el DialogContent y agregar un boton X propio posicionado correctamente en el header

### Problema 2: ChecklistDetailModal requiere demasiado scroll

Actualmente el modal apila verticalmente: Info + Fotos + Inspeccion + Equipamiento + Observaciones + Firma. Esto obliga a hacer scroll extenso para revisar todo el checklist, lo cual es problematico en un proceso critico de seguridad.

**Solucion - Redisenar con Tabs:**

Reemplazar el scroll vertical con un layout de tabs horizontales que muestre una seccion a la vez:

```text
+--------------------------------------------------+
| MONTE ROSAS SPORTS          Checklist Completo  X |
| Folio: MOTSMRS-522                                |
|---------------------------------------------------|
| Cita: 13 feb 05:00  |  Custodio: CRISTHIAN A.    |
| Ruta: LAZARO C. -> TULTITLAN                      |
|---------------------------------------------------|
| [Fotos]  [Inspeccion]  [Observaciones]            |
|---------------------------------------------------|
|                                                    |
|   (contenido del tab activo sin scroll)            |
|                                                    |
+--------------------------------------------------+
```

| Tab | Contenido |
|---|---|
| Fotos | Galeria 2x2 con thumbnails clickeables + alertas |
| Inspeccion | Grid de items vehiculares + combustible + equipamiento (combinados en una sola vista compacta) |
| Observaciones | Texto de observaciones + firma del custodio + metadata de fecha |

Beneficios:
- Elimina el scroll vertical completo
- Cada seccion ocupa el espacio disponible sin desbordar
- El operador puede saltar directamente a la seccion que necesita revisar
- El header con info del servicio permanece siempre visible

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/checklist/PhotoLightbox.tsx` | Agregar `min-h-0` al contenedor de imagen, ocultar X de Radix y agregar X propio en el header |
| `src/components/monitoring/checklist/ChecklistDetailModal.tsx` | Redisenar con Tabs (usando Radix Tabs ya instalado) en lugar de scroll vertical. Mantener header fijo con info del servicio, contenido por tabs debajo |

### Detalle tecnico

**PhotoLightbox - Fix overflow y X:**

```typescript
<DialogContent 
  className="max-w-4xl h-[90vh] p-0 bg-background/95 backdrop-blur [&>button:last-child]:hidden"
  style={{ zoom: 1 }}
>
  <div className="relative h-full flex flex-col">
    {/* Header con X propio */}
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        {/* label + badge */}
      </div>
      <div className="flex items-center gap-2">
        {/* "Ver en mapa" button */}
        <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
          <X className="h-5 w-5" />
        </Button>
      </div>
    </div>
    
    {/* Image container - min-h-0 es la clave */}
    <div className="flex-1 min-h-0 relative flex items-center justify-center p-4">
      <img className="max-h-full max-w-full object-contain" />
    </div>
    
    {/* Footer con thumbnails */}
  </div>
</DialogContent>
```

**ChecklistDetailModal - Tabs layout:**

```typescript
<DialogContent className="max-w-3xl h-[85vh] p-0 flex flex-col">
  {/* Header fijo - siempre visible */}
  <div className="p-6 pb-4 border-b shrink-0">
    {/* Nombre, folio, badge estado */}
    {/* Info servicio: cita, custodio, ruta */}
    {/* Alertas (si hay) */}
  </div>
  
  {/* Tabs - ocupan el resto del espacio */}
  <Tabs defaultValue="fotos" className="flex-1 min-h-0 flex flex-col">
    <TabsList className="mx-6 shrink-0">
      <TabsTrigger value="fotos">Fotos</TabsTrigger>
      <TabsTrigger value="inspeccion">Inspeccion</TabsTrigger>
      <TabsTrigger value="observaciones">Observaciones</TabsTrigger>
    </TabsList>
    
    <TabsContent value="fotos" className="flex-1 min-h-0 overflow-auto p-6">
      {/* Galeria 2x2 */}
    </TabsContent>
    
    <TabsContent value="inspeccion" className="flex-1 min-h-0 overflow-auto p-6">
      {/* Items vehiculares + combustible + equipamiento */}
    </TabsContent>
    
    <TabsContent value="observaciones" className="flex-1 min-h-0 overflow-auto p-6">
      {/* Observaciones + firma + metadata */}
    </TabsContent>
  </Tabs>
</DialogContent>
```

