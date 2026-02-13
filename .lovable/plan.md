

## Fix: Mejorar UI del visor de fotos y persistencia del detalle de checklist

### Problemas identificados

**1. Doble boton "X"**
El componente `DialogContent` (dialog.tsx linea 47) incluye un boton de cierre automatico de Radix. Ademas, el `PhotoLightbox` agrega su propio boton X (linea 154-160). Resultado: dos iconos de cierre superpuestos.

**2. Foto desborda el marco**
El `DialogContent` tiene un `style={{ zoom: 1.428571 }}` global (dialog.tsx linea 43). Cuando el lightbox usa `max-w-4xl h-[90vh]`, el zoom lo escala mas alla del viewport, causando que la imagen se salga del cuadro y requiera scroll.

**3. Thumbnails y metadatos cortados**
El mismo problema de zoom hace que el footer con thumbnails quede fuera del area visible.

**4. Perdida de contexto al cerrar**
El estado `servicioChecklistSeleccionado` y `isChecklistDetailOpen` son variables locales en `MonitoringPage`. No hay persistencia en URL ni proteccion contra perdida de contexto. Al cerrar el lightbox, el detail modal se mantiene. Pero al cerrar el detail modal por error o navegar, se pierde el servicio seleccionado sin forma de regresar.

### Solucion

| Problema | Archivo | Cambio |
|---|---|---|
| Doble X | `PhotoLightbox.tsx` | Eliminar el boton X manual (lineas 154-160) ya que `DialogContent` ya incluye uno |
| Foto desborda | `PhotoLightbox.tsx` | Anular el zoom heredado con `style={{ zoom: 1 }}` en el DialogContent del lightbox |
| Persistencia | `MonitoringPage.tsx` | Guardar el `servicioId` del checklist seleccionado en `useSearchParams` (patron `?tab=checklists&checklistId=XXX`). Al recargar o regresar, re-seleccionar automaticamente el servicio |

### Detalle tecnico

**1. PhotoLightbox - Eliminar X duplicado y corregir zoom**

```typescript
// Agregar style={{ zoom: 1 }} para anular el zoom global de DialogContent
<DialogContent 
  className="max-w-4xl h-[90vh] p-0 bg-background/95 backdrop-blur"
  style={{ zoom: 1 }}
>
  <div className="relative h-full flex flex-col" ...>
    {/* Header - ELIMINAR el boton X manual, ya que DialogContent lo incluye */}
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-3">
        {/* ...label y badge... */}
      </div>
      <div className="flex items-center gap-2">
        {/* Solo dejar "Ver en mapa", quitar el Button con X */}
      </div>
    </div>
    {/* resto sin cambios */}
  </div>
</DialogContent>
```

**2. MonitoringPage - Persistencia del checklist seleccionado en URL**

```typescript
// Al seleccionar un checklist, guardar en URL
const handleChecklistSelect = (servicio: ServicioConChecklist) => {
  setServicioChecklistSeleccionado(servicio);
  setIsChecklistDetailOpen(true);
  setSearchParams(prev => {
    prev.set('checklistId', servicio.servicioId);
    return prev;
  });
};

// Al cerrar, limpiar de URL
const handleChecklistDetailClose = (open: boolean) => {
  setIsChecklistDetailOpen(open);
  if (!open) {
    setSearchParams(prev => {
      prev.delete('checklistId');
      return prev;
    });
  }
};

// Al cargar, restaurar seleccion desde URL
useEffect(() => {
  const checklistId = searchParams.get('checklistId');
  if (checklistId && serviciosChecklist.length > 0) {
    const found = serviciosChecklist.find(s => s.servicioId === checklistId);
    if (found) {
      setServicioChecklistSeleccionado(found);
      setIsChecklistDetailOpen(true);
    }
  }
}, [serviciosChecklist]);
```

### Resultado esperado

- Una sola X de cierre en el visor de fotos
- La foto se muestra correctamente dentro del marco sin desbordar
- Los thumbnails y el contador son visibles sin scroll
- Si el usuario cierra el lightbox, regresa al detalle del checklist (ya funciona asi)
- Si el usuario refresca la pagina o regresa por navegacion, el detalle del checklist se restaura automaticamente desde la URL

