

# Fix: Eliminar curso navega en vez de confirmar

## Problema

Hay dos problemas encadenados:

1. **Navegacion accidental**: El componente `CursoCard` tiene `onClick={onVer}` en el div contenedor (linea 339). Cuando se cierra el Sheet tras hacer clic en "Eliminar", el evento burbujea al card y dispara la navegacion al detalle del curso.

2. **AlertDialog invisible**: El `AlertDialog` de confirmacion de eliminacion se abre en `LMSCursosLista` (linea 208), pero como las paginas LMS tienen zoom reset a 1.0 y el `AlertDialogContent` hereda de `DialogContent` que tiene `style={{ zoom: 1.428571 }}`, el dialogo se renderiza fuera de escala o invisible.

## Solucion

### 1. Evitar navegacion al cerrar Sheet (`LMSCursosLista.tsx`)

En la funcion `handleAction` del `CursoCard`, agregar un pequeño `setTimeout` para que la accion se ejecute DESPUES de que el Sheet se cierre completamente y los eventos se resuelvan:

```typescript
const handleAction = (action: () => void) => {
  setSheetOpen(false);
  // Delay action to prevent click bubbling to parent card
  setTimeout(() => action(), 150);
};
```

### 2. Corregir zoom del AlertDialog para LMS (`LMSCursosLista.tsx`)

Reemplazar el `AlertDialog` estandar por uno con `AlertDialogContent` que sobreescriba el zoom a 1.0 usando `style={{ zoom: 1 }}`, ya que las paginas LMS resetean el zoom global:

```typescript
<AlertDialogContent style={{ zoom: 1 }}>
```

### Archivos a modificar

- **`src/components/lms/admin/LMSCursosLista.tsx`**: 
  - Cambiar `handleAction` para usar `setTimeout`
  - Agregar `style={{ zoom: 1 }}` al `AlertDialogContent` de eliminacion (linea 209)

Esto resuelve ambos problemas: el curso no navegara al hacer clic en eliminar, y el dialogo de confirmacion sera visible correctamente.
