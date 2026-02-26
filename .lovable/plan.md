

# Corregir menu de acciones de cursos: Mixto (Desktop + Mobile)

## Problema

El menu de 3 puntos en las tarjetas de curso no se muestra al hacer clic. El problema es una combinacion de:

1. El `.apple-card` aplica `transform: translateY(-1px)` en hover, creando un nuevo stacking context que interfiere con el posicionamiento del dropdown
2. El sistema de zoom global (`html { zoom: 0.7 }`) con la compensacion `[data-radix-popper-content-wrapper] { zoom: 1.428571 }` puede causar que el menu se posicione fuera del viewport o debajo de otros elementos
3. El click en la tarjeta (`onClick={onVer}`) compite con el click del trigger del dropdown

## Solucion: Patron mixto

- **Desktop**: Mantener DropdownMenu pero con `modal={true}` y asegurar que el portal se renderice correctamente con z-index alto
- **Mobile**: Reemplazar por un Sheet (panel lateral derecho) con las opciones listadas de forma clara y grande

## Archivos a modificar

### 1. `src/components/lms/admin/LMSCursosLista.tsx`

Cambios en el componente `CursoCard`:
- Importar `useIsMobile`, `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`
- Agregar estado `actionsOpen` para controlar el Sheet en mobile
- En mobile: reemplazar `DropdownMenu` por un `Sheet` con side="right"
- En desktop: mantener `DropdownMenu` pero agregar `modal={false}` y wrappear el trigger con `onPointerDown={(e) => e.stopPropagation()}` para evitar conflicto con el click de la card
- Mover `e.stopPropagation()` al `onMouseDown` del trigger button en vez del div contenedor
- Agregar el nombre del curso en el header del Sheet mobile para dar contexto

### 2. Correccion del conflicto de click

El div que envuelve el dropdown tiene `onClick={e => e.stopPropagation()}` pero el problema real es que el evento de pointer-down en la card activa hover/transform antes de que el dropdown tenga chance de abrirse. Se corregira con:
- `onPointerDown={(e) => e.stopPropagation()}` en el boton trigger
- `onMouseDown={(e) => e.stopPropagation()}` en el boton trigger

### Vista mobile (Sheet)

```text
+----------------------------------+
|  X   Acciones                    |
|      "Onboarding Custodia"       |
|----------------------------------|
|  > Ver detalles                  |
|  > Editar                        |
|  > Publicar / Despublicar        |
|  > Duplicar                      |
|  --------------------------------|
|  > Archivar                      |
|  --------------------------------|
|  > Eliminar (rojo)               |
+----------------------------------+
```

## Resultado esperado

- En desktop: el menu de 3 puntos abre un dropdown flotante sin problemas de z-index
- En mobile: el menu abre un panel lateral limpio con todas las opciones bien visibles
- Los dialogs de confirmacion (eliminar, archivar) siguen funcionando igual

