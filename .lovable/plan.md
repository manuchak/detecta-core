

## Sincerar los conteos del Pipeline: Mostrar solo lo accionable

### Problema

El pipeline muestra conteos brutos de la base de datos (9,069 candidatos, 254 evaluaciones, etc.) cuando lo que cada stakeholder necesita ver es su trabajo pendiente real. Esto genera ansiedad, confusion y paralisis en los analistas.

### Vision por Stakeholder (validada)

| Etapa | Quien la usa | Que necesita ver | Metrica accionable |
|---|---|---|---|
| Candidatos | Coordinador Supply | Leads nuevos por asignar a analistas | **Sin asignar** (~135) |
| Aprobaciones | Analista individual | MIS leads asignados pendientes de decision | **Mis leads activos** (variable por analista) |
| Evaluaciones | Analista / Coordinador | Candidatos aprobados en proceso de evaluacion | **En evaluacion activa** |
| Liberacion | Coordinador | Candidatos listos o en proceso de liberacion | **En proceso** (no liberados ni rechazados) |
| Operativos | Planeacion | Personal activo disponible | **Activos** |

### Cambios Propuestos

#### 1. Redefinir los conteos del breadcrumb para que sean accionables
**Archivo**: `src/hooks/useSupplyPipelineCounts.ts`

Cambiar las queries para que cada conteo refleje el trabajo pendiente real, no el total historico:

```
candidatos:   leads sin asignar + estado activo (no rechazado/inactivo/custodio_activo)
aprobaciones: leads asignados con decision pendiente (final_decision IS NULL)
evaluaciones: candidatos_custodios en estado 'aprobado' o 'en_evaluacion' (ya esta correcto)
liberacion:   custodio_liberacion no liberados ni rechazados (ya esta correcto)
operativos:   custodios_operativos activos (ya esta correcto)
```

#### 2. Actualizar el badge del header en LeadsListPage
**Archivo**: `src/pages/Leads/LeadsListPage.tsx`

El badge junto a "Candidatos" debe mostrar el conteo de leads sin asignar (lo accionable), no el total historico. Opcionalmente mostrar "135 por asignar" en lugar de "9,069".

#### 3. Ajustar los tabs de navegacion en Candidatos
**Archivo**: `src/components/leads/LeadsNavigationTabs.tsx`

Los tabs "Por Contactar", "Listos", "En Proceso", "Archivo" ya segmentan correctamente. Pero el tab default ("Por Contactar") deberia reflejar solo leads sin asignar activos, que es la accion primaria del coordinador.

#### 4. Filtrar la RPC get_leads_counts para excluir legacy quemado
Crear o ajustar la funcion RPC `get_leads_counts` para que los conteos que alimentan los tabs tambien reflejen solo datos accionables (excluyendo leads con mas de 30 dias sin actividad, o bien leads ya procesados).

### Seccion Tecnica

**useSupplyPipelineCounts.ts** - Queries accionables:
```tsx
// ANTES (total bruto):
supabase.from('leads').select('*', { count: 'exact', head: true })

// DESPUES (solo accionables - sin asignar y con estado activo):
supabase
  .from('leads')
  .select('*', { count: 'exact', head: true })
  .is('asignado_a', null)
  .not('estado', 'in', '("rechazado","inactivo","custodio_activo")')

// Aprobaciones - leads asignados pendientes de decision:
supabase
  .from('leads')
  .select('*', { count: 'exact', head: true })
  .not('asignado_a', 'is', null)
  .is('final_decision', null)
```

**LeadsListPage.tsx** - Badge contextual:
```tsx
// Mostrar "por asignar" en lugar del total
<Badge variant="outline">
  {counts?.uncontacted || 0} por asignar
</Badge>
```

**useLeadsCounts / get_leads_counts** - Necesita revision de la funcion RPC en Supabase para confirmar que los conteos de los tabs tambien filtren datos legacy. Si la RPC no tiene filtro de antiguedad, se agrega un filtro de 30 dias o de estado activo.

### Resultado Esperado

- El breadcrumb mostrara: **Candidatos (135)** en lugar de Candidatos (9,069)
- Aprobaciones mostrara leads asignados pendientes de decision, no todos los aprobados historicos
- Cada analista vera volumenes de trabajo realistas y manejables
- Los datos historicos permanecen intactos en la base de datos para reporting
- Zero data deletion requerida

