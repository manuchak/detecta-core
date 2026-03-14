

# Evaluación Post-Blindaje: ¿Se necesita otro ciclo QA?

## Veredicto: No se requiere un ciclo QA completo

Las 3 rondas de hardening cubrieron los 3 módulos críticos de escritura. Un análisis de regresión rápido es suficiente.

### Riesgo de regresión identificado: Falsos positivos en `assertRowsAffected`

En las deactivaciones (ej. `assignService` línea 206-211), el patrón actual hace `.update({ activo: false }).eq('activo', true).select('id')` pero **no aplica `assertRowsAffected` al resultado de deactivación** — solo al insert posterior. Esto es **correcto**: si no hay asignaciones previas, deactivar 0 filas es legítimo. No hay regresión aquí.

El patrón es consistente en `autoDistribute`, `reassignService`, `handoffTurno` — todos toleran 0 filas en deactivación y solo validan el insert.

### Conclusión: No hay regresiones ni gaps nuevos

Los 3 archivos blindados (`useBitacoraBoard`, `useServiciosPlanificados`, `useMonitoristaAssignment`) usan el patrón correctamente:
- Updates de negocio: `.select('id')` + `assertRowsAffected` (falla si RLS bloquea)
- Deactivaciones previas: `.select('id')` solo para logging, sin assert (tolera 0 filas)
- Inserts: `.select('id')` + assert, con tolerancia a `23505` (duplicate constraint)

**No se necesita plan de trabajo adicional.**

---

## ¿Necesitan los monitoristas hacer refresh?

**Sí, es obligatorio e inmediato.**

Todas las correcciones son código cliente (hooks de React compilados en el bundle JS). Un navegador con sesión activa sigue ejecutando el bundle anterior. Las protecciones RLS, el retry de eventos, y la validación post-liberación **no existen** para usuarios que no refresquen.

### Acción recomendada

No hay forma de forzar un refresh remotamente. Las opciones son:

1. **Comunicación directa**: Notificar a coordinadores y monitoristas que recarguen el navegador (Ctrl+Shift+R)
2. **Implementar version-check automático** (mejora futura): Un mecanismo que compare la versión del bundle actual con la desplegada y muestre un banner "Nueva versión disponible — recargar" cuando detecte diferencia

La opción 1 es inmediata y suficiente. La opción 2 es una mejora de infraestructura que se puede implementar después si se desea.

