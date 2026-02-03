
# Plan: Cambiar Filtro de Actividad por Defecto

## Problema Identificado

El filtro de actividad en `CustodiosDataTable.tsx` tiene como valor por defecto `'activo'` (línea 90):

```typescript
const [activityFilter, setActivityFilter] = useState<string>('activo');
```

Esto significa que por defecto solo muestra custodios con servicios en los últimos 30 días, no todos los custodios con estado "activo" en el sistema.

## Confusión de Términos

| Concepto | Significado Actual |
|----------|-------------------|
| `estado: activo` | El custodio está empleado/disponible |
| `nivel_actividad: activo` | Tuvo servicios en últimos 30 días |

Santos Galeana tiene `estado: activo` pero probablemente `nivel_actividad: sin_actividad` porque no ha tenido servicios recientes.

## Solución Propuesta

Cambiar el valor por defecto del filtro de actividad a `'all'` para mostrar todos los custodios activos por defecto.

### Cambios

**Archivo: `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx`**

```typescript
// ANTES (línea 90)
const [activityFilter, setActivityFilter] = useState<string>('activo');

// DESPUÉS
const [activityFilter, setActivityFilter] = useState<string>('all');
```

**Archivo: `src/pages/PerfilesOperativos/components/ArmadosDataTable.tsx`**

Aplicar el mismo cambio para consistencia.

## Resultado Esperado

- Al entrar a la pestaña Custodios, se muestran los 106 custodios activos
- Santos Galeana (y otros sin actividad reciente) aparecen en el listado
- El usuario puede filtrar por actividad si lo desea, pero no es el default
