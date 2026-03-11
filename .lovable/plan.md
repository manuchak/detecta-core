

# Análisis Profundo: Tres Preguntas Críticas del Workflow

## Pregunta 1: ¿Los planeadores pueden marcar "En Sitio" sin que desaparezca?

**Estado actual: FUNCIONA CORRECTAMENTE ✅**

Cuando Planeación marca "En Sitio", solo se escribe `hora_llegada_custodio` (tipo `time`). El `estado_planeacion` permanece en `confirmado`/`planificado`. La tarjeta del servicio sigue visible en el dashboard de Planeación con badge verde "En sitio". No desaparece.

---

## Pregunta 2: ¿Monitoreo solo ve servicios marcados "En Sitio" por Planeación?

**Estado actual: NO. Hay un gap importante ⚠️**

La query de servicios pendientes en Bitácora (Q1) filtra:
```
hora_inicio_real IS NULL
AND custodio_asignado IS NOT NULL  
AND estado_planeacion IN ('confirmado', 'planificado')
AND fecha_hora_cita BETWEEN inicio_día AND fin_día
```

**No verifica `hora_llegada_custodio`.** Esto significa que un monitorista puede ver y presionar "Iniciar" en un servicio donde el custodio **aún no ha llegado** al punto. El handoff Planeación→Monitoreo no está blindado.

**Fix propuesto:** Agregar filtro `.not('hora_llegada_custodio', 'is', null)` a Q1, y un guard en `iniciarServicio` que verifique `hora_llegada_custodio` antes de permitir el inicio.

---

## Pregunta 3: ¿100% de servicios planificados/en-sitio/no-finalizados SIEMPRE tienen monitorista?

**Estado actual: NO. Hay 4 brechas identificadas ⚠️**

### Brecha A: Ventana operativa de OrphanGuard es solo -60min a +4h
OrphanGuard Rule 1 solo auto-asigna servicios pendientes cuya cita está dentro de -60 minutos a +4 horas. Un servicio con cita a las 6am del día siguiente NO tiene monitorista asignado hasta ~2am (4h antes). Para rutas foráneas de 5 días, esto es aceptable para el inicio pero NO para la continuidad.

### Brecha B: Rule 4 ELIMINA asignaciones >4h en el futuro
Si un coordinador asigna manualmente un servicio con anticipación (ej: pernocta que sale mañana), OrphanGuard Rule 4 lo desactiva activamente. No hay distinción entre asignaciones automáticas y manuales.

### Brecha C: Servicios activos SÍ están cubiertos (Q2 + Rule 2) ✅
Los servicios ya iniciados (`hora_inicio_real` set, `hora_fin_real` null) no tienen filtro de fecha. OrphanGuard Rule 2 los detecta si no tienen asignación. Un servicio de 5 días en ruta siempre tendrá monitorista. **Esto funciona.**

### Brecha D: Gap entre turnos
Durante el handoff de turno, si los monitoristas salientes firman salida antes de que los entrantes activen heartbeat, hay una ventana (potencialmente 1-5 minutos) donde servicios activos quedan sin monitorista activo. OrphanGuard Rule 3 los reasigna al primer monitorista que entre, pero durante ese gap no hay cobertura.

---

## Plan de Blindaje (4 cambios)

### 1. Gate de visibilidad: Monitoreo solo ve "En Sitio"
**`useBitacoraBoard.ts` — Q1 (pendingQuery):** Agregar `.not('hora_llegada_custodio', 'is', null)` para que solo aparezcan servicios donde Planeación confirmó la llegada del custodio.

### 2. Guard de inicio: No iniciar sin "En Sitio"
**`useBitacoraBoard.ts` — `iniciarServicio`:** Verificar que `hora_llegada_custodio IS NOT NULL` antes de escribir `hora_inicio_real`. Si no está, mostrar toast de error.

### 3. Proteger asignaciones manuales de Rule 4
**`useOrphanGuard.ts` — Rule 4:** Agregar condición que excluya asignaciones donde `notas_handoff` contiene `'manual'` o donde `asignado_por` es distinto de `null` (asignación por coordinador). Solo limpiar asignaciones automáticas.

### 4. Suprimir alertas en pernocta
**`useBitacoraBoard.ts` — `computePhaseAndTimers`:** Si el evento activo es de tipo `pernocta`, no escalar `alertLevel` a `warning`/`critical`.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useBitacoraBoard.ts` | Gate Q1 + guard iniciarServicio + suppress pernocta alerts |
| `src/hooks/useOrphanGuard.ts` | Proteger asignaciones manuales en Rule 4 |

### Resumen de cobertura post-fix

```text
SERVICIO PLANIFICADO (custodio asignado)
  └── Sin hora_llegada_custodio → Solo visible en PLANEACIÓN
  └── Con hora_llegada_custodio → Visible en MONITOREO (Por Iniciar)
       └── OrphanGuard auto-asigna monitorista
       └── Monitorista inicia → En Curso
            └── 100% cubierto: Q2 sin filtro de fecha
            └── OrphanGuard Rule 2: reasigna si monitorista se va
            └── OrphanGuard Rule 3: reasigna si monitorista offline
            └── Pernocta: sin alertas falsas
            └── Multi-día: visible indefinidamente hasta hora_fin_real
```

