

## Fix: Visibilidad completa de servicios para custodios

### Diagnostico

Paulo tiene servicio METSMSS-16 asignado hoy en `servicios_planificados` con `custodio_telefono = 7204496776`, pero su app muestra "Sin servicios pendientes" y stats en 0.

Dos problemas raiz:

1. **`useNextService` no usa `normalizePhone`**: Fue omitido en el fix anterior. Usa `replace(/[\s-]/g, '')` que no maneja codigos de pais (+52). Aunque para Paulo funciona, es inconsistente.

2. **`useCustodianServices` solo consulta `servicios_custodia` (legacy)**: Las estadisticas del dashboard (Servicios, Km, Ingresos) y la lista de servicios recientes ignoran completamente `servicios_planificados`. Como los servicios nuevos se crean en la tabla de planeacion, los custodios ven 0 en todo.

### Cambios

**1. `src/hooks/useNextService.ts`**
- Importar y usar `normalizePhone` en lugar del inline `replace`
- Consistencia con el patron centralizado

**2. `src/hooks/useCustodianServices.ts`**
- Agregar query a `servicios_planificados` usando `custodio_telefono`
- Unificar resultados de ambas tablas (legacy + planificados) eliminando duplicados por `id_servicio`
- Recalcular stats combinando ambas fuentes
- Mapear campos de `servicios_planificados` al formato esperado (`estado_planeacion` a `estado`, etc.)

### Resultado

- Paulo (y todos los custodios) veran sus servicios del sistema de planeacion en el dashboard
- Stats reflejaran actividad real de ambas fuentes
- El card "Proximo servicio" tambien usara normalizacion centralizada
- Servicios recientes mostraran data de ambas tablas, ordenados por fecha
