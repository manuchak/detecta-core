

# Auto-skip de Checklist para Servicios de Retorno

## Contexto
Cuando Planeación crea un servicio de retorno, guarda `[RETORNO]` en el campo `observaciones` de `servicios_planificados`. Sin embargo, el portal del custodio no consulta ese campo ni tiene lógica para distinguir retornos — siempre muestra el botón "Iniciar Checklist Pre-Servicio".

Para un retorno, el vehículo ya fue inspeccionado en el servicio de ida; repetir el checklist es redundante.

## Solución

Detectar si el servicio es retorno usando el tag `[RETORNO]` en observaciones, y auto-completar el checklist (o saltarlo) mostrando un badge informativo en lugar del botón.

### Cambios

**1. `src/hooks/useNextService.ts`**
- Agregar `observaciones` al SELECT de `servicios_planificados`
- Exponer un campo booleano `isRetorno` derivado de `observaciones?.includes('[RETORNO]')`
- Agregar `isRetorno` al tipo `CustodianService` y al return

**2. `src/components/custodian/NextServiceCard.tsx`**
- Recibir `isRetorno?: boolean` en props
- Cuando `isRetorno && !checklistCompleted`: mostrar un badge verde "Checklist no requerido (retorno)" en lugar del botón de iniciar checklist
- Cuando `isRetorno && checklistCompleted`: mostrar el badge normal de completado

**3. `src/components/custodian/MobileDashboardLayout.tsx`**
- Pasar `isRetorno` del resultado de `useNextService` al `NextServiceCard`

### Archivos afectados
1. `src/hooks/useNextService.ts` — agregar `observaciones` al query, derivar `isRetorno`
2. `src/components/custodian/NextServiceCard.tsx` — UI condicional para retornos
3. `src/components/custodian/MobileDashboardLayout.tsx` — pasar prop `isRetorno`

