

# Proyecto: Limpieza de Servicios Zombi

## Problema

La query de servicios activos (7 días) devuelve ~286 registros. En la realidad operativa, probablemente hay 5-15 servicios genuinamente activos en un momento dado. Los ~270 restantes son servicios que se iniciaron (`hora_inicio_real` IS NOT NULL) pero nunca se cerraron formalmente (`hora_fin_real` IS NULL, `estado_planeacion` != 'completado').

## Solución: 2 componentes

### 1. Función SQL de cierre masivo de servicios estancados

Crear una función RPC `cerrar_servicios_estancados` que:
- Identifique servicios con `hora_inicio_real` > 48h sin actividad reciente en `servicio_eventos_ruta`
- Los marque como `estado_planeacion = 'completado'` y `hora_fin_real = now()`
- Inserte un evento `fin_servicio` con descripción "Cerrado automáticamente por inactividad"
- Retorne un resumen de cuántos registros se cerraron

Lógica de identificación: un servicio es "estancado" si:
- `hora_inicio_real` no es null
- `hora_fin_real` es null
- No tiene ningún evento en `servicio_eventos_ruta` en las últimas 48 horas
- Y su `hora_inicio_real` tiene más de 48 horas de antigüedad

### 2. Panel de limpieza en AdministrationHub

Agregar una nueva pestaña "Servicios Estancados" al hub de administración con:
- Conteo de servicios estancados detectados
- Lista de los servicios con: id_servicio, cliente, custodio, fecha inicio, última actividad
- Botón "Cerrar todos" que ejecuta la función RPC
- Log del resultado

### Archivos a modificar/crear

| Archivo | Cambio |
|---|---|
| Migration SQL | Crear función `cerrar_servicios_estancados` |
| `src/hooks/useStaleServiceCleanup.ts` | Nuevo hook para consultar y ejecutar limpieza |
| `src/components/administration/StaleServiceCleanup.tsx` | Nuevo componente UI |
| `src/pages/Administration/AdministrationHub.tsx` | Agregar pestaña |

