

## Plan: Corregir invalidaciones de cache post-indisponibilidad en todos los flujos

### Diagnostico

Se encontraron 2 inconsistencias que pueden causar bugs de asignacion al propagar a produccion:

---

### Problema 1: Modales con insert directo sin invalidacion de cache

`PendingAssignmentModal` y `ReassignmentModal` hacen `supabase.from('custodio_indisponibilidades').insert()` directamente, sin usar el hook `useCustodioIndisponibilidades`. Esto significa que despues de registrar una indisponibilidad, **no se invalida ningun cache** y el custodio sigue apareciendo como disponible en la misma lista.

| Flujo | Metodo de insert | Invalida cache? |
|---|---|---|
| CustodianStep (crear servicio) | `crearIndisponibilidad.mutateAsync()` (hook) | Si (parcial) |
| PendingAssignmentModal | `supabase.from().insert()` directo | No |
| ReassignmentModal | `supabase.from().insert()` directo | No |

**Fix**: Agregar invalidaciones manuales despues del insert exitoso en ambos modales, o idealmente refactorizar para usar el hook compartido. La solucion mas segura y con menor riesgo de regresion es agregar las invalidaciones inline.

---

### Problema 2: Hook `useCustodioIndisponibilidades` no invalida la query de asignacion

El `onSuccess` del mutation `crearIndisponibilidad` invalida:
- `custodio-indisponibilidades` 
- `custodios`
- `custodios-operativos-disponibles`

Pero **no invalida** `custodios-con-proximidad-equitativo`, que es la query key usada por los 3 flujos de asignacion. Esto significa que incluso en CustodianStep (que usa el hook), la lista de custodios no se refresca automaticamente.

**Fix**: Agregar `custodios-con-proximidad-equitativo` al `onSuccess` del hook.

---

### Resumen de tipos en tipoMapping

Los 3 flujos mapean los mismos 5 tipos. La tabla acepta 7 valores. No es un bug bloqueante porque el fallback es `'otro'`, pero conviene agregar los 2 faltantes para completitud:

| Valor UI | Valor DB | Mapeado? |
|---|---|---|
| emergencia_familiar | familiar | Si |
| falla_mecanica | falla_mecanica | Si |
| enfermedad | enfermedad | Si |
| capacitacion | capacitacion | Si |
| otro | otro | Si |
| personal | personal | No (cae a 'otro') |
| mantenimiento | mantenimiento | No (cae a 'otro') |

---

### Cambios por archivo

| Archivo | Cambio | Riesgo |
|---|---|---|
| `src/hooks/useCustodioIndisponibilidades.ts` (~linea 87-89) | Agregar invalidacion de `custodios-con-proximidad-equitativo` en `onSuccess` de `crearIndisponibilidad` | Bajo |
| `src/components/planeacion/PendingAssignmentModal.tsx` (~linea 267-274) | Agregar invalidaciones de cache despues del insert exitoso | Bajo |
| `src/components/planeacion/ReassignmentModal.tsx` (~linea 284-291) | Agregar invalidaciones de cache despues del insert exitoso | Bajo |

### Detalle tecnico

**1. useCustodioIndisponibilidades.ts** - Agregar al `onSuccess` de `crearIndisponibilidad`:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
  queryClient.invalidateQueries({ queryKey: ['custodios'] });
  queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });
  queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
  toast.success('Indisponibilidad registrada correctamente');
},
```

**2. PendingAssignmentModal.tsx y ReassignmentModal.tsx** - Agregar despues de `if (error) throw error`:

```typescript
if (error) throw error;

// Invalidate caches so custodian lists refresh
queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });
```

(Nota: ambos modales ya tienen acceso a `queryClient` via `useQueryClient`)

### Validacion pre-deploy

Despues de aplicar estos cambios, el estado de invalidacion queda:

| Flujo | Invalida indisponibilidades | Invalida proximidad-equitativo | Invalida mat. view |
|---|---|---|---|
| CustodianStep (via hook) | Si | Si (nuevo) | Si |
| PendingAssignmentModal | Si (nuevo) | Si (nuevo) | Si (nuevo) |
| ReassignmentModal | Si (nuevo) | Si (nuevo) | Si (nuevo) |
| CambioEstatus (Supply) | N/A | Si (fix anterior) | Si (fix anterior) |

