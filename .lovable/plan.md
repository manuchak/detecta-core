
# Plan: Baja Masiva por Inactividad (+90 días)

## ✅ IMPLEMENTADO

## Contexto

El sistema ya calcula automáticamente `dias_sin_actividad` y clasifica custodios en niveles de actividad. Los que tienen +90 días sin servicio aparecen como `nivel_actividad: 'sin_actividad'`.

## Archivos Creados/Modificados

| Archivo | Estado |
|---------|--------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | ✅ Modificado - checkboxes + barra de acciones |
| `src/pages/PerfilesOperativos/components/BajaMasivaModal.tsx` | ✅ Nuevo - modal de confirmación |
| `src/hooks/useBajaMasiva.ts` | ✅ Nuevo - hook para procesar baja en lote |

## Flujo de Usuario

1. Ir a Perfiles Operativos > Custodios
2. Filtrar por "Sin actividad (+90d)"
3. Seleccionar custodios con checkbox (o "Seleccionar todos")
4. Clic en "Dar de baja masiva"
5. Confirmar en modal
6. Sistema procesa y mueve custodios a tab "Bajas"
