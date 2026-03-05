

# Diagnóstico: 93 servicios fantasma en la Bitácora

## Hallazgo

Los 93 servicios en "En Curso" **sí fueron iniciados** (alguien hizo clic en "Iniciar" en la bitácora), pero **92 de 93 no tienen ni un solo evento registrado** — ni checkpoints, ni llegada a destino, ni liberación. Solo se les asignó `hora_inicio_real` y quedaron flotando.

El equipo de monitoreo está iniciando los servicios pero no completa el flujo operativo (registrar checkpoints → llegada destino → liberar custodio). Como `hora_fin_real` nunca se establece, permanecen en la columna "En Curso" indefinidamente hasta que el cleanup de 48h los recoge.

Los 93 servicios actuales tienen < 48 horas de antigüedad, por lo que el cleanup aún no los toca.

## Solución propuesta: Reducir ventana activa + auto-cierre más agresivo

| Cambio | Detalle |
|---|---|
| **Reducir ventana activa de 7 días a 24 horas** | En `useBitacoraBoard.ts` Q2 (línea 94), cambiar el filtro de `7 * 24 * 3600_000` a `24 * 3600_000`. Servicios con > 24h sin cerrar desaparecen del tablero. |
| **Reducir umbral del cleanup de 48h a 18h** | En la función SQL `cerrar_servicios_estancados`, cambiar `interval '48 hours'` a `interval '18 hours'`. Los servicios sin actividad en 18h se cierran automáticamente. |
| **Agregar auto-cierre al cambio de turno** | Cuando el monitorista hace "Cambio de Turno", cerrar automáticamente todos los servicios activos sin eventos en las últimas 6 horas, asumiendo que ya terminaron. |

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useBitacoraBoard.ts` | Línea 94: ventana de 7 días → 24 horas |
| SQL Migration | Actualizar `cerrar_servicios_estancados` y `detectar_servicios_estancados` con umbral de 18h |

Esto eliminaría inmediatamente ~85 de los 93 servicios del tablero (los que tienen > 24h) y el cleanup automático cerraría los que tienen > 18h de inactividad.

