

## Integrar la pagina de Candidatos (/leads) al UX del Supply Pipeline

### Diagnostico

La pagina `/leads` (renderizada por `LeadsListPage.tsx`) ya tiene un diseno relativamente moderno con tabs de navegacion, filtros inline y metricas en popover. Sin embargo, **no esta conectada visualmente al pipeline de Supply** que si tienen las paginas de Aprobaciones, Evaluaciones y Liberacion. Especificamente:

1. **Falta el `SupplyPipelineBreadcrumb`**: Las otras 3 etapas del pipeline (Approvals, Evaluaciones, Liberacion) muestran un breadcrumb con conteos en vivo y alertas de envejecimiento. La pagina de Candidatos no lo tiene, lo que la desconecta del flujo.

2. **La pagina de Candidatos no aparece en el breadcrumb**: El componente `SupplyPipelineBreadcrumb` define 4 pasos (Aprobaciones, Evaluaciones, Liberacion, Operativos) pero **no incluye "Candidatos"** como primer paso del pipeline, aunque logicamente es la entrada al embudo.

3. **La tabla es densa y poco mobile-friendly**: `LeadsTable.tsx` usa una tabla HTML con 9 columnas que no se adapta bien a pantallas pequenas, contrario al estandar de supply que prioriza card layouts en mobile.

### Cambios Propuestos

#### 1. Agregar "Candidatos" como primer paso del pipeline breadcrumb
**Archivo**: `src/components/leads/supply/SupplyPipelineBreadcrumb.tsx`
- Agregar un nuevo paso al inicio del array `steps`: `{ key: 'candidatos', label: 'Candidatos', path: '/leads', icon: UserPlus }`
- Agregar el conteo correspondiente usando los datos existentes de `useSupplyPipelineCounts` o `useLeadsCounts`

#### 2. Integrar el breadcrumb en LeadsListPage
**Archivo**: `src/pages/Leads/LeadsListPage.tsx`
- Importar y renderizar `SupplyPipelineBreadcrumb` al inicio de la pagina, igual que en Approvals, Evaluaciones y Liberacion
- Esto conecta visualmente la pagina al flujo del pipeline

#### 3. Refinar el header para consistencia con el resto del pipeline
**Archivo**: `src/pages/Leads/LeadsListPage.tsx`
- Ajustar el header para que siga el mismo patron visual que Evaluaciones (icono + titulo + descripcion)
- Mantener los botones de accion existentes (Metricas, Metas, Filtros, Nuevo)

### Seccion Tecnica

**SupplyPipelineBreadcrumb.tsx** - Agregar candidatos al pipeline:
```tsx
const steps = [
  { key: 'candidatos', label: 'Candidatos', path: '/leads', icon: UserPlus },
  { key: 'aprobaciones', label: 'Aprobaciones', path: '/leads/approvals', icon: CheckCircle2 },
  { key: 'evaluaciones', label: 'Evaluaciones', path: '/leads/evaluaciones', icon: ClipboardCheck },
  { key: 'liberacion', label: 'Liberacion', path: '/leads/liberacion', icon: Rocket },
  { key: 'operativos', label: 'Operativos', path: null, icon: Users },
];
```

**useSupplyPipelineCounts.ts** - Agregar conteo de candidatos:
```tsx
// Agregar query para total de leads activos
const candidatos = await supabase
  .from('leads')
  .select('*', { count: 'exact', head: true });

return {
  candidatos: candidatos.status === 'fulfilled' ? candidatos.value.count : null,
  aprobaciones: ...,
  // ...resto igual
};
```

**LeadsListPage.tsx** - Integrar breadcrumb:
```tsx
import { SupplyPipelineBreadcrumb } from '@/components/leads/supply/SupplyPipelineBreadcrumb';

return (
  <div className="space-y-4 p-6">
    <SupplyPipelineBreadcrumb />
    <header>...</header>
    {/* resto del contenido */}
  </div>
);
```

### Resultado Esperado

La pagina de Candidatos se integrara visualmente al pipeline de Supply con el mismo breadcrumb de navegacion que ya usan Aprobaciones, Evaluaciones y Liberacion, mostrando conteos en vivo en cada etapa y permitiendo al usuario navegar entre todas las fases del embudo desde cualquier punto.

