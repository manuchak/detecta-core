

## Fix: Bug que impide cargar candidatos

### Causa raiz

El ultimo cambio agrego `assigned_profile:profiles!asignado_a(display_name)` al query de `useSimpleLeads.ts`. Supabase requiere una FK (foreign key) para resolver JOINs con la sintaxis `!column_name`, pero la tabla `leads` **no tiene ninguna FK definida** — ni hacia `profiles` ni hacia ninguna otra tabla.

Por eso el query falla con un error de PostgREST y los candidatos no cargan.

### Solucion

Usar un enfoque alternativo: quitar el JOIN problemático y resolver los nombres de analistas con un query separado.

#### Paso 1: Revertir el JOIN en `useSimpleLeads.ts`

Quitar `assigned_profile:profiles!asignado_a(display_name)` del select query, dejandolo como estaba antes:

```tsx
.select(`
  *,
  approval:lead_approval_process(
    final_decision,
    current_stage,
    analyst_id,
    phone_interview_completed
  )
`, { count: 'exact' })
```

#### Paso 2: Cargar nombres de analistas por separado

Despues de obtener los leads, extraer los IDs unicos de `asignado_a`, hacer un query a `profiles` para obtener los `display_name`, y crear un Map para busqueda rapida:

```tsx
// Extraer IDs unicos de analistas
const analystIds = [...new Set(data.filter(l => l.asignado_a).map(l => l.asignado_a))];

// Cargar nombres si hay IDs
let analystMap = new Map();
if (analystIds.length > 0) {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', analystIds);
  profiles?.forEach(p => analystMap.set(p.id, p.display_name));
}

// Agregar display_name a cada lead
const typedLeads = data.map(lead => ({
  ...lead,
  assigned_profile: lead.asignado_a ? { display_name: analystMap.get(lead.asignado_a) || null } : null
}));
```

#### Paso 3: Mantener el cambio en LeadsTable.tsx

El cambio en la UI ya es correcto — muestra `assigned_profile?.display_name` con fallback al ID truncado. No requiere cambios adicionales.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useSimpleLeads.ts` | Quitar JOIN, agregar query separado a profiles, mapear nombres |

### Resultado

- Los candidatos volveran a cargar correctamente
- Las tarjetas mostraran el nombre del analista (ej: "Saul Lopez Diaz") en vez del ID
- Sin necesidad de crear FK en la base de datos

