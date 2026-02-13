

## Dos mejoras: Nombre del analista en tarjetas + Filtro temporal en evaluaciones

### 1. Mostrar nombre del analista en vez del ID

**Problema**: Las tarjetas de leads muestran "ID: 30c9a3f" en vez del nombre real del analista asignado (como "Saul Lopez Diaz").

**Solucion**: La tabla `profiles` ya tiene `display_name` vinculado por `id`. Hay dos opciones para resolver esto:

**Opcion A (elegida): JOIN en el query del hook**
Modificar `useSimpleLeads.ts` para hacer un LEFT JOIN con `profiles` via la relacion `asignado_a`:

```
select: `*, approval:lead_approval_process(...), assigned_profile:profiles!asignado_a(display_name)`
```

Esto trae el nombre del analista directamente sin queries adicionales.

**Cambios en archivos**:

| Archivo | Cambio |
|---|---|
| `src/hooks/useSimpleLeads.ts` | Agregar join con profiles en el select |
| `src/components/leads/LeadsTable.tsx` (linea 744-745) | Reemplazar `ID: {lead.asignado_a?.slice(-8)}` por el display_name del profile |

En `LeadsTable.tsx`, la linea 745 cambiara de:
```
<span className="text-xs ...">ID: {lead.asignado_a?.slice(-8)}</span>
```
a:
```
<span className="text-xs ...">{lead.assigned_profile?.display_name || lead.asignado_a?.slice(-8)}</span>
```

**Nota tecnica**: Si Supabase no reconoce la FK `asignado_a -> profiles.id` automaticamente, se usara un approach alternativo: cargar los profiles una sola vez con `get_users_with_roles_secure` y hacer el mapeo en el frontend con un `Map<userId, displayName>`.

---

### 2. Filtro temporal en evaluaciones (conteo del breadcrumb)

**Problema**: Las evaluaciones SIERCP entraron en produccion esta semana, pero el breadcrumb muestra **254 evaluaciones pendientes** (legacy) cuando en realidad solo hay **5 recientes** (ultimos 15 dias).

**Dato actual**:
- Total `candidatos_custodios`: 441
- Con estado 'aprobado' o 'en_evaluacion': 254
- Creados en ultimos 15 dias con ese estado: **5**

**Cambio**: Agregar el mismo filtro de 15 dias al query de evaluaciones en `useSupplyPipelineCounts.ts`:

```tsx
supabase
  .from('candidatos_custodios')
  .select('*', { count: 'exact', head: true })
  .in('estado_proceso', ['aprobado', 'en_evaluacion'])
  .gte('created_at', cutoffISO)  // <-- agregar esto
```

**Archivo**: `src/hooks/useSupplyPipelineCounts.ts` (linea 32-34)

---

### Resultado esperado

- Las tarjetas de leads mostraran "Saul Lopez Diaz" en vez de "ID: 30c9a3f"
- El breadcrumb de Evaluaciones mostrara **5** en vez de **254**
- Sin cambios en la base de datos, solo logica de frontend

