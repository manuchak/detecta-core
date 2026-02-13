

## Fix: Filtrar alertas de evaluaciones para excluir datos legacy

### Problema

El hook `useSupplyPipelineAlerts` consulta `candidatos_custodios` sin filtro de fecha, incluyendo registros historicos antiguos que generan 250 warnings falsos. Estos candidatos existian antes de que el sistema de evaluaciones se implementara y no representan trabajo pendiente real.

### Solucion

Agregar un filtro de `created_at` de 30 dias al query de alertas de evaluaciones. Esto:
- Excluye datos legacy pre-existentes
- Mantiene la deteccion de candidatos genuinamente estancados (7/15/30 dias sin actividad)
- Se alinea con el cutoff operativo del pipeline

Se usa 30 dias (no 7) porque las alertas necesitan detectar candidatos que llevan tiempo sin avanzar -- un candidato creado hace 20 dias sin movimiento SI es una alerta valida, pero uno creado hace 6 meses no lo es.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/hooks/useSupplyPipelineAlerts.ts` linea 43-45 | Agregar `.gte('created_at', cutoff30d)` al query de `candidatos_custodios` |

### Detalle tecnico

```typescript
// ANTES (sin filtro de fecha)
supabase
  .from('candidatos_custodios')
  .select('id, nombre, updated_at')
  .in('estado_proceso', ['aprobado', 'en_evaluacion'])

// DESPUES (con cutoff de 30 dias)
const cutoff30d = new Date();
cutoff30d.setDate(cutoff30d.getDate() - 30);

supabase
  .from('candidatos_custodios')
  .select('id, nombre, updated_at')
  .in('estado_proceso', ['aprobado', 'en_evaluacion'])
  .gte('created_at', cutoff30d.toISOString())
```

### Resultado esperado

El badge de warning en "Evaluaciones" bajara de 250 a solo los candidatos recientes (ultimos 30 dias) que genuinamente estan estancados en el proceso.
