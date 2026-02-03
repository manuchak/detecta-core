
# Fix: Flash de "Sin Datos de Custodios" - COMPLETADO ✅

## Solución Implementada

Se utilizó `isPending` de React Query v5 para detectar correctamente el estado inicial cuando el query está deshabilitado o aún no tiene datos.

**Cambios en `CustodianStep/index.tsx`:**
1. Extraído `isPending` del hook `useCustodiosConProximidad`
2. Creada variable consolidada `isLoadingOrPending = isLoading || isPending`
3. Actualizada condición de `NoCustodiansAlert` para usar `!isLoadingOrPending`
4. Actualizado `QuickStats` y `CustodianList` para usar el estado consolidado

**Comportamiento corregido:**
- Query deshabilitado → Muestra skeleton loader (antes: flash de "Sin datos")
- Query iniciando → Muestra skeleton loader (antes: flash de "Sin datos")
- Query completado sin datos → Muestra "Sin datos" (sin cambio)
- Query completado con datos → Muestra lista (sin cambio)
