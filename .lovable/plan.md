

## Fix: Aplicar filtro de antigüedad al conteo de Candidatos en el breadcrumb

### Diagnostico

El query del breadcrumb en `useSupplyPipelineCounts.ts` filtra por estado y asignacion, pero **no tiene filtro de fecha**. Por eso muestra 1,154 en vez de un numero accionable.

Desglose real de leads sin asignar:

| Antiguedad | Cantidad |
|---|---|
| Ultimos 7 dias | 36 |
| 8-15 dias | 99 |
| 16-30 dias | 0 |
| Mas de 30 dias | 1,019 (legacy muerto) |

Los 1,019 leads legacy nunca fueron tocados (su `updated_at` tampoco cambio). Con un corte de 30 dias da 135, pero la realidad operativa es que un lead sin contactar despues de 15 dias ya esta frio.

### Cambio propuesto

#### Archivo: `src/hooks/useSupplyPipelineCounts.ts`

Agregar filtro `.gte('created_at', cutoffISO)` al query de candidatos:

```
const cutoff = new Date();
cutoff.setDate(cutoff.getDate() - 15);
const cutoffISO = cutoff.toISOString();

supabase
  .from('leads')
  .select('*', { count: 'exact', head: true })
  .is('asignado_a', null)
  .not('estado', 'in', '("rechazado","inactivo","custodio_activo")')
  .gte('created_at', cutoffISO)
```

Esto reducira el conteo del breadcrumb de **1,154 a ~36-135** dependiendo del corte elegido.

#### Archivo: RPC `get_leads_counts` (migracion SQL)

La RPC que alimenta los tabs tambien necesita el mismo corte. La migracion anterior uso `WHERE created_at >= cutoff OR estado NOT IN (...)` que es demasiado permisiva (el OR deja pasar todo). Corregir a:

```sql
WHERE created_at >= cutoff
```

Sin el OR, para que los tabs (Por Contactar, Listos, En Proceso, Archivo) solo muestren leads recientes.

### Decision de corte temporal

Se propone **15 dias** como corte para la etapa de Candidatos, porque:
- Un lead sin contactar despues de 15 dias esta frio
- Da un numero mas cercano a lo operativamente real (~36-135)
- Los leads mas viejos no desaparecen de la BD, solo del tablero accionable

### Resultado esperado

- Breadcrumb Candidatos: **~36** (en vez de 1,154)
- Tab "Por Contactar": numero equivalente y consistente
- Datos historicos intactos en la base de datos

