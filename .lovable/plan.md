

## Fix: Ranking no aparece - columna incorrecta

### Causa raiz

El hook `useFleetRanking.ts` referencia la columna `precio_venta` que **no existe** en la tabla `servicios_custodia`. La query falla con error 400:

```
column servicios_custodia.precio_venta does not exist
```

La columna correcta es `costo_custodio`. Al fallar la query, el hook retorna `null` y el badge de ranking no se renderiza.

### Solucion

**Archivo: `src/pages/PerfilesOperativos/hooks/useFleetRanking.ts`**

1. Cambiar `precio_venta` por `costo_custodio` en el `.select()` (linea 31)
2. Cambiar la referencia `r.precio_venta` por `r.costo_custodio` en la agregacion (linea 47)

Son solo 2 lineas. Con este cambio la query dejara de fallar, calculara el ranking correctamente y el badge aparecera en la ficha del custodio.

### Resultado esperado

La ficha mostrara un badge adicional entre el Rating y los Servicios:
- Icono de medalla/trofeo con posicion (ej: `#12 de 85`)
- Color segun percentil (dorado/plata/bronce/gris)
