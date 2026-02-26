

# Analisis Fishbone: "Eliminar" navega al curso en vez de confirmar

```text
                                    PROBLEMA
                              "Eliminar" navega
                              al detalle del curso
                                    |
    --------------------------------|--------------------------------
    |                |              |              |                 |
  EVENTO         SHEET           DIALOG        COMPONENTE        ZOOM
  BUBBLING       OVERLAY        INVISIBLE      ESTRUCTURA       CONFLICTO
    |                |              |              |                 |
    |                |              |              |                 |
 ActionItem      Al cerrar       AlertDialog    CursoCard div    LMS zoom=1
 no tiene        Sheet, el       zoom=1.428    tiene onClick    vs AlertDialog
 e.stopProp      overlay         pero LMS      ={onVer} en     zoom=1.428571
 en onClick      dispara         esta en       el contenedor   (ya corregido)
    |            mouseup en      zoom=1        raiz (L339)
    |            el card             |              |
    |                |              |              |
    +--- CAUSA 1 ---+-- CAUSA 2 --+-- CAUSA 3 ---+
```

## Causa Raiz Principal: CAUSA 1 - Event Bubbling en ActionItem

El componente `ActionItem` (linea 457-466) tiene un `<button onClick={onClick}>` simple. Cuando el usuario hace clic en "Eliminar":

1. El `onClick` del `ActionItem` dispara `handleAction(onEliminar)`
2. `handleAction` cierra el Sheet y programa la accion con `setTimeout(150ms)`
3. **PERO** el evento click del boton burbujea hacia arriba a traves del DOM
4. El Sheet se esta cerrando, su overlay desaparece
5. El click llega al div padre `CursoCard` (linea 338-339) que tiene `onClick={onVer}`
6. `onVer` navega al detalle del curso inmediatamente
7. Cuando el `setTimeout` ejecuta `onEliminar` 150ms despues, ya estamos en otra pagina

## Causa Secundaria: falta `e.stopPropagation()` en ActionItem

El `ActionItem` recibe `onClick: () => void` (sin evento). Nunca llama `e.stopPropagation()`, asi que el click siempre burbujea al padre.

## Solucion

### Archivo: `src/components/lms/admin/LMSCursosLista.tsx`

**Cambio 1**: Modificar `ActionItem` para recibir el evento y detener propagacion:

```typescript
function ActionItem({ icon, label, onClick, className, disabled }: { 
  icon: React.ReactNode; 
  label: string; 
  onClick: () => void; 
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        onClick();
      }}
      disabled={disabled}
      className={`...`}
    >
      {icon}
      {label}
    </button>
  );
}
```

**Cambio 2**: Agregar `e.stopPropagation()` tambien en el `SheetContent` wrapper para prevenir cualquier click interno de burbujear:

```typescript
<SheetContent side="right" className="w-[280px] sm:w-[320px]" 
  onClick={(e) => e.stopPropagation()}>
```

Estos dos cambios cortan la propagacion del evento en dos niveles, asegurando que ningun clic dentro del Sheet llegue al `CursoCard`.

