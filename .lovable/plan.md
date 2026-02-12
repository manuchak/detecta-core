

## Diagnostico: Custodios inactivos aparecen como disponibles en asignacion

### Hallazgos del analisis

Se analizaron los 3 flujos de asignacion de Planeacion y se encontraron **2 problemas** que causan que custodios marcados como inactivos por Supply sigan apareciendo:

---

### Problema 1: Cache key mismatch (invalidacion rota)

Cuando Supply cambia el estatus de un custodio via `useCambioEstatusOperativo`, el hook intenta invalidar el cache:

```text
Invalida:  ['custodios-con-proximidad']
Query real: ['custodios-con-proximidad-equitativo', ...]
```

El prefijo **no coincide**, por lo tanto React Query nunca invalida la cache de los flujos de asignacion. Los 3 flujos afectados (ServiceCreation, PendingAssignment, Reassignment) usan `useCustodiosConProximidad` con la key `custodios-con-proximidad-equitativo`.

Ademas, `staleTime` es de 2 minutos y `refetchOnWindowFocus` esta deshabilitado, lo que agrava el problema: si un planificador tiene el modal abierto, los datos no se refrescan.

**Fix**: Corregir la key de invalidacion en `useCambioEstatusOperativo.ts`:

```typescript
// Antes (no matchea)
queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });

// Despues (matchea correctamente)
queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
```

---

### Problema 2: Vista materializada desactualizada

El hook `useCustodios` (usado en TrackingDashboard y vistas de configuracion) lee de la vista materializada `custodios_operativos_disponibles`. Esta vista es un **snapshot estatico** que solo se refresca en eventos especificos (liberacion de custodios). 

Cuando Supply cambia `estado = 'inactivo'`, la vista materializada **no se refresca**, asi que sigue mostrando al custodio como disponible hasta el proximo refresh manual.

**Fix**: Agregar `REFRESH MATERIALIZED VIEW CONCURRENTLY custodios_operativos_disponibles` como parte del flujo de cambio de estatus. Esto se puede hacer con un trigger en `custodios_operativos` o invocando el refresh desde el hook despues de la mutacion.

---

### Resumen de cambios por archivo

| Archivo | Cambio | Impacto |
|---|---|---|
| `src/hooks/useCambioEstatusOperativo.ts` | Corregir query key de invalidacion de `'custodios-con-proximidad'` a `'custodios-con-proximidad-equitativo'` | Los 3 flujos de asignacion veran datos frescos |
| `src/hooks/useCambioEstatusOperativo.ts` | Agregar invalidacion de `'custodios-operativos-disponibles'` (materializada) | TrackingDashboard y config views |
| `src/hooks/useCambioEstatusOperativo.ts` | Llamar `supabase.rpc('refresh_custodios_operativos_disponibles')` despues de cambio de estatus | Vista materializada actualizada en tiempo real |

### Detalle tecnico del cambio

En `useCambioEstatusOperativo.ts`, reemplazar el bloque de invalidaciones (~lineas 107-116):

```typescript
// Antes
await queryClient.refetchQueries({ queryKey: ['operative-profiles'] });
queryClient.invalidateQueries({ queryKey: ['custodios'] });
queryClient.invalidateQueries({ queryKey: ['armados'] });
queryClient.invalidateQueries({ queryKey: ['operative-profile'] });
queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad'] });

// Despues
await queryClient.refetchQueries({ queryKey: ['operative-profiles'] });
queryClient.invalidateQueries({ queryKey: ['custodios'] });
queryClient.invalidateQueries({ queryKey: ['armados'] });
queryClient.invalidateQueries({ queryKey: ['operative-profile'] });
queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });

// Refresh materialized view so it reflects the status change
supabase.rpc('refresh_custodios_operativos_disponibles').then(({ error }) => {
  if (error) console.warn('Error refreshing materialized view:', error);
});
```

### Nota importante

La invalidacion de cache solo afecta al **mismo navegador**. Si Supply cambia el estatus en su maquina, el planificador en otra maquina vera los datos actualizados hasta que su `staleTime` de 2 minutos expire o reabra el modal. El RPC `get_custodios_activos_disponibles` ya filtra correctamente por `estado = 'activo'`, asi que al re-fetchear los datos seran correctos. El cambio propuesto asegura que al menos dentro del mismo equipo (si alguien con ambos roles opera), la invalidacion sea inmediata, y que la vista materializada este al dia para cualquier consulta subsecuente.

