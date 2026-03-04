

## Plan: Agregar reset individual y total de capacitación

### Cambios necesarios

**1. Hook `useCapacitacion.ts` — Agregar 2 mutaciones nuevas**

- `resetearModulo`: Recibe `modulo_id`, elimina el registro de `progreso_capacitacion` para ese candidato+módulo. No toca documentos.
- `resetearTodaCapacitacion`: Elimina todos los registros de `progreso_capacitacion` del candidato, elimina el documento `constancia_capacitacion` de `documentos_candidato`, y opcionalmente limpia el archivo de storage.

Ambas mutaciones invalidan queries de progreso tras ejecutarse y muestran toast de confirmación.

**2. UI en `TrainingTab.tsx` — Botones de reset**

- **Por módulo**: En cada card de módulo completado, agregar un botón/icono discreto (RotateCcw) que permita resetear ese módulo individual. Solo visible si el módulo está completado.
- **Reset total**: Junto al botón "Completar Capacitación" en el header, agregar un botón "Resetear Capacitación" (con AlertDialog de confirmación) que limpia todo el progreso del candidato.
- Ambas acciones requieren confirmación con AlertDialog antes de ejecutarse.

**3. Seguridad**
- Solo usuarios con rol supply/admin pueden ver y ejecutar los botones de reset (ya controlado por acceso a la página de evaluaciones).
- No se requiere migración SQL adicional — las operaciones son DELETE sobre tablas existentes con RLS ya configurado.

