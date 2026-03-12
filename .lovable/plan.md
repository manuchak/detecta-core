

# Agregar estado "Finalizado" en vista de Planeación

## Problema actual
Cuando Monitoreo libera un servicio (`hora_fin_real`), el check de "Completado" en línea 48 tiene mayor prioridad que "En sitio" — el badge "Arribado HH:mm" desaparece, igual que pasaba con "En curso". Planeación pierde visibilidad del arribo.

## Solución
Misma lógica que ya aplicamos para "En monitoreo": mover el check de `hora_fin_real` **después** de `hora_llegada_custodio`, y agregar una propiedad `isCompleted` al status `en_sitio`.

### Cambios en `CompactServiceCard.tsx`

**getOperationalStatus**: Reordenar prioridades:
```
1. hora_llegada_custodio → en_sitio (con isBeingMonitored + isCompleted)
2. hora_fin_real sin hora_llegada → completado (caso edge)
3. hora_inicio_real sin hora_llegada → en_curso (caso edge)
4. resto...
```

**Badge rendering**: Agregar badge "Finalizado" (gris/slate) cuando `isCompleted` es true, reemplazando el badge "En monitoreo" (un servicio finalizado ya no está "en monitoreo").

### Cambios en `ScheduledServicesTabSimple.tsx`
Misma lógica: reordenar `hora_fin_real` después de `hora_llegada_custodio`, agregar `isCompleted` y badge secundario en la tabla.

**2 archivos, mismo patrón que el fix anterior.**

