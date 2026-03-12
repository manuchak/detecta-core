

# Mejora UX: Transición instantánea al marcar "En sitio"

## Problema
Al hacer clic en "En sitio", el botón muestra "Marcando..." pero no cambia al badge "Arribado" hasta que la mutación + refetch completan (~1-3s). Esto genera:
- Confusión visual (el usuario no sabe si funcionó)
- Clics repetidos en el botón

## Solución: Optimistic UI en StatusUpdateButton

Agregar estado local optimista dentro del componente. Al hacer clic en "En sitio":
1. Inmediatamente mostrar el badge "Arribado HH:mm" con la hora actual
2. Ejecutar la mutación en background
3. Si falla, revertir al botón "En sitio"

### Archivo: `src/components/planeacion/StatusUpdateButton.tsx`

- Agregar estado `optimisticArrival: string | null` 
- Al hacer clic en "mark_on_site", setear `optimisticArrival` con `HH:mm` actual antes de llamar `onStatusChange`
- Renderizar el badge "Arribado" cuando `optimisticArrival` está seteado O cuando `currentStatus === 'en_sitio'`
- En el `catch`, limpiar `optimisticArrival` para revertir
- Deshabilitar el botón durante la transición para prevenir doble-clic

La lógica de decisión cambia de:
```
canMarkOnSite = status in [programado, ...] 
canRevert = status === 'en_sitio'
```
A:
```
showArribado = optimisticArrival || status === 'en_sitio'
canMarkOnSite = !showArribado && status in [programado, ...]
```

No se requieren cambios en otros archivos — el refetch posterior sincroniza el estado real.

