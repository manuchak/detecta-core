
# Compatibilizar Panel de Perfiles Operativos para Armados

## Problema
El `PerfilForense` (panel admin de perfiles operativos) muestra las mismas 10 pestanas para custodios y armados. Varias pestanas dependen de datos exclusivos de custodios (`pc_custodio_id`, `custodio_rechazos`, `checklist_servicio.custodio_telefono`, etc.) y muestran datos vacios, irreales o errores para armados. Los tabs que SI son compatibles son:

| Tab | Custodio | Armado | Notas |
|-----|----------|--------|-------|
| Informacion | OK | OK | Ya maneja ambos tipos |
| Performance | OK | Vacio/incorrecto | Queries usan `custodio_id`, `custodio_rechazos` |
| Economics | OK | OK | Ya tiene branch separado |
| Evaluaciones | OK | OK | Ya usa `ArmadoEvaluacionesTab` |
| Documentacion | OK | Vacio | Depende de `candidatoId` (pc_custodio_id) |
| LMS/Capacitacion | OK | Vacio | Depende de `candidatoId` |
| Cumplimiento | OK | Vacio | Queries de checklist y docs por telefono custodio |
| Historico | OK | Parcial | Usa nombre para buscar, funciona parcialmente |
| Calificaciones | OK | Incorrecto | Depende de Performance (custodio-specific) |
| Notas | OK | OK | Ya acepta `operativoTipo` |

## Solucion
Ocultar las pestanas que no aplican para armados y ajustar las que pueden funcionar con datos correctos.

### Cambios en `src/pages/PerfilesOperativos/PerfilForense.tsx`

**1. Ocultar tabs no compatibles para armados**

Cuando `tipo === 'armado'`, ocultar las siguientes pestanas que no tienen datos relevantes:
- **Documentacion** (depende de pipeline de candidatos custodios)
- **Capacitacion/LMS** (depende de `pc_custodio_id`)
- **Cumplimiento** (checklists y docs son custodio-only)
- **Calificaciones** (rating system construido sobre metricas de custodio)

**2. Adaptar Performance para armados**

La pestana Performance para armados mostrara un estado intermedio claro indicando que el sistema de performance scoring esta basado en metricas de custodios y que para armados se visualizan los datos disponibles del tab Economics. Se ocultara esta pestana para armados ya que las metricas (puntualidad, rechazos, checklists) no aplican a su modelo operativo.

**3. Resultado: tabs visibles por tipo**

```text
Custodio (10 tabs):
  Info | Performance | Economics | Evaluaciones | Docs | LMS | Cumplimiento | Historico | Ratings | Notas

Armado (6 tabs):
  Info | Economics | Evaluaciones | Historico | Notas
```

Esto elimina la confusion de ver pestanas vacias o con datos de "costo_custodio" etiquetados como "ingresos" en contextos donde no aplican.

### Detalle tecnico

En `PerfilForense.tsx`, se envolvera cada `TabsTrigger` y `TabsContent` en una condicion basada en `tipo`:

```tsx
const isCustodio = tipo === 'custodio';

// En TabsList - solo mostrar tabs aplicables
{isCustodio && (
  <TabsTrigger value="performance">...</TabsTrigger>
)}
// ... mismo patron para documentacion, capacitacion, cumplimiento, calificaciones

// En TabsContent - mismo patron condicional
{isCustodio && (
  <TabsContent value="performance">...</TabsContent>
)}
```

Si el tab activo guardado en URL no existe para armados, se hara fallback a `'info'`:

```tsx
const validArmadoTabs = ['info', 'economics', 'evaluaciones', 'historico', 'notas'];
const resolvedTab = tipo === 'armado' && !validArmadoTabs.includes(activeTab) 
  ? 'info' 
  : activeTab;
```

### Archivo unico a modificar
`src/pages/PerfilesOperativos/PerfilForense.tsx` - condicionar visibilidad de tabs segun tipo operativo y agregar fallback de tab activo.
