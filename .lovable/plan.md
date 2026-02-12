

## Plan: Habilitar acceso completo de Supply y Supply Admin a evaluaciones de candidatos

### Problemas detectados

Se encontraron 4 puntos donde los roles `supply` y/o `supply_admin` estan excluidos de features de evaluacion de candidatos:

1. **Ruta `/leads/evaluaciones`**: El rol `supply` no puede acceder a la pagina (403)
2. **Sidebar de navegacion**: El item "Evaluaciones" no aparece para el rol `supply`
3. **Calibracion interna**: El rol `supply_lead` no puede ver los resultados de calibracion del equipo
4. **Panel de aval (candidatos ambar)**: `supply_admin` no puede dar aval a candidatos con semaforo ambar

### Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/App.tsx` | Agregar `'supply'` al array de `allowedRoles` de la ruta `/leads/evaluaciones` |
| `src/config/navigationConfig.ts` | Agregar `'supply'` al array `roles` del child `leads_evaluaciones` |
| `src/hooks/useSIERCPResults.ts` | Expandir `isAdmin` para incluir `supply_lead` (solo lectura de calibracion) |
| `src/components/recruitment/psychometrics/PsychometricEvaluationTab.tsx` | Agregar `supply_admin` a la variable `isCoordinador` para el panel de aval |

### Detalle de cada cambio

**App.tsx** (linea ~412):
```
// Antes
allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones']}
// Despues
allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones']}
```

**navigationConfig.ts** (linea ~173):
```
// Antes
roles: ['admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones']
// Despues
roles: ['admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones']
```

**useSIERCPResults.ts** (linea ~41):
```
// Antes
const isAdmin = userRole === 'admin' || userRole === 'owner' || userRole === 'supply_admin';
// Despues
const isAdmin = userRole === 'admin' || userRole === 'owner' || userRole === 'supply_admin' || userRole === 'supply_lead';
```

**PsychometricEvaluationTab.tsx** (linea ~25):
```
// Antes
const isCoordinador = userRole === 'coordinador_operaciones' || userRole === 'admin' || userRole === 'owner';
// Despues
const isCoordinador = userRole === 'coordinador_operaciones' || userRole === 'admin' || userRole === 'owner' || userRole === 'supply_admin';
```

### Nota de seguridad

Los permisos de eliminacion de resultados de calibracion (`deleteResult`) seguiran restringidos a admin, owner y supply_admin, ya que la funcion `deleteResult` valida `isAdmin` internamente. El rol `supply_lead` solo obtiene visibilidad de lectura. El rol `supply` obtiene acceso a la pagina de evaluaciones y la tabla de invitaciones, sin acceso a calibracion ni eliminacion.

