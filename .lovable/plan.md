
# Plan Completo: Sistema Unificado de Persistencia de Formularios

## Inventario Exhaustivo de Formularios del Sistema

### Categoría 1: Workflows Multi-Paso (CRÍTICOS - Requieren `robust`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 1 | **ServiceCreation** | `src/pages/Planeacion/ServiceCreation/hooks/useServiceCreation.tsx` | Custom (buggy) | `robust` | **MIGRAR** |
| 2 | **RequestCreationWorkflow** (legacy) | `src/pages/Planeacion/components/RequestCreationWorkflow.tsx` | `usePersistedForm` | `robust` | Actualizar nivel |
| 3 | **LMSCursoWizard** | `src/components/lms/admin/LMSCursoWizard.tsx` | `usePersistedForm` | `robust` | Actualizar nivel |
| 4 | **DevolucionWizard** | `src/pages/WMS/components/DevolucionWizard.tsx` | `useFormPersistence` standard | `robust` | Actualizar nivel |
| 5 | **ImportWizard** | `src/pages/Planeacion/components/ImportWizard.tsx` | Ninguna | `robust` | **AGREGAR** |
| 6 | **ImportWizardEnhanced** | `src/components/maintenance/ImportWizardEnhanced.tsx` | Ninguna | `robust` | **AGREGAR** |
| 7 | **ExcelImportWizard** | `src/pages/Planeacion/components/ExcelImportWizard.tsx` | Ninguna | `robust` | **AGREGAR** |
| 8 | **ChecklistWizard** | `src/components/custodian/checklist/ChecklistWizard.tsx` | Ninguna | `robust` | **AGREGAR** |

### Categoría 2: Formularios de Registro/Creación (Requieren `standard`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 9 | **EnhancedLeadForm** | `src/components/leads/EnhancedLeadForm.tsx` | `usePersistedForm` | `standard` | OK - Verificar |
| 10 | **LeadForm** | `src/components/leads/LeadForm.tsx` | Ninguna | `standard` | **AGREGAR** |
| 11 | **RegistroInstaladorFormularioRobusto** | `src/pages/Installers/components/RegistroInstaladorFormularioRobusto.tsx` | `useFormPersistence` | `standard` | OK - Verificar |
| 12 | **RegistroInstaladorDialog** | `src/pages/Installers/components/RegistroInstaladorDialog.tsx` | Ninguna | `standard` | **AGREGAR** |
| 13 | **ProgramarInstalacionDialog** | `src/pages/Installers/components/ProgramarInstalacionDialog.tsx` | Ninguna | `standard` | **AGREGAR** |
| 14 | **ServicioForm** | `src/pages/Services/components/ServicioForm.tsx` | `usePersistedForm` | `robust` | Actualizar nivel |
| 15 | **FormularioServicioCompleto** | `src/components/servicios/FormularioServicioCompleto.tsx` | `usePersistedForm` | `robust` | Actualizar nivel |
| 16 | **CustodioDialog** | `src/pages/Planeacion/components/CustodioDialog.tsx` | Ninguna | `standard` | **AGREGAR** |
| 17 | **ClienteDialog** | `src/pages/Planeacion/components/ClienteDialog.tsx` | Ninguna | `standard` | **AGREGAR** |
| 18 | **ServicioDialog** | `src/pages/Planeacion/components/ServicioDialog.tsx` | `useFormPersistence` | `standard` | OK |

### Categoría 3: Formularios de Evaluación/Entrevista (Requieren `standard`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 19 | **ManualInterviewDialog** | `src/components/recruitment/interview/ManualInterviewDialog.tsx` | `useFormPersistence` | `standard` | OK |
| 20 | **StructuredInterviewForm** | `src/components/recruitment/interview/StructuredInterviewForm.tsx` | `useFormPersistence` | `standard` | OK - Verificar |
| 21 | **ReferenceForm** | `src/components/recruitment/references/ReferenceForm.tsx` | `useFormPersistence` | `standard` | OK |
| 22 | **ToxicologyResultForm** | `src/components/recruitment/toxicology/ToxicologyResultForm.tsx` | Ninguna | `standard` | **AGREGAR** |
| 23 | **RiskChecklistForm** | `src/components/recruitment/risk/RiskChecklistForm.tsx` | `useFormPersistence` | `standard` | OK - Verificar |
| 24 | **CandidateEvaluationPanel** | `src/components/recruitment/CandidateEvaluationPanel.tsx` | Ninguna | `standard` | **AGREGAR** |

### Categoría 4: Formularios Operativos (Requieren `light` o `standard`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 25 | **EditOperativeProfileSheet** | `src/pages/PerfilesOperativos/components/EditOperativeProfileSheet.tsx` | Ninguna | `light` | **AGREGAR** |
| 26 | **CambioEstatusModal** | `src/components/operatives/CambioEstatusModal.tsx` | Ninguna | `light` | **AGREGAR** |
| 27 | **AplicarSancionModal** | `src/components/operatives/AplicarSancionModal.tsx` | Ninguna | `light` | **AGREGAR** |
| 28 | **ReportUnavailabilityCard** | `src/components/custodian/ReportUnavailabilityCard.tsx` | Ninguna | `light` | **AGREGAR** |
| 29 | **RecordMaintenanceDialog** | `src/components/custodian/RecordMaintenanceDialog.tsx` | Ninguna | `light` | **AGREGAR** |

### Categoría 5: Formularios Administrativos/Config (Requieren `light`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 30 | **PricesManager** | `src/components/admin/landing/PricesManager.tsx` | Ninguna | `light` | **AGREGAR** |
| 31 | **TestimonialsManager** | `src/components/admin/landing/TestimonialsManager.tsx` | Ninguna | `light` | OPCIONAL |
| 32 | **HeroManager** | `src/components/admin/landing/HeroManager.tsx` | Ninguna | `light` | OPCIONAL |
| 33 | **FaqManager** | `src/components/admin/landing/FaqManager.tsx` | Ninguna | `light` | OPCIONAL |
| 34 | **AddPermissionDialog** | `src/components/settings/permissions/AddPermissionDialog.tsx` | Ninguna | `light` | OPCIONAL |

### Categoría 6: Formularios WMS (Requieren `standard`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 35 | **RecepcionDialog** | `src/pages/WMS/components/RecepcionDialog.tsx` | Ninguna | `standard` | **AGREGAR** |
| 36 | **NuevaMarcaDialog** | `src/pages/WMS/components/NuevaMarcaDialog.tsx` | Ninguna | `light` | OPCIONAL |
| 37 | **AsignarGPSDialog** | `src/pages/Planeacion/components/AsignarGPSDialog.tsx` | Ninguna | `standard` | **AGREGAR** |
| 38 | **DevolucionDialog** | `src/pages/Planeacion/components/DevolucionDialog.tsx` | Ninguna | `standard` | **AGREGAR** |

### Categoría 7: Formularios de Facturación/Cobranza (Requieren `standard`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 39 | **RegistrarPagoModal** | `src/pages/Facturacion/components/CuentasPorCobrar/RegistrarPagoModal.tsx` | Ninguna | `standard` | **AGREGAR** |
| 40 | **SeguimientoCobranzaModal** | `src/pages/Facturacion/components/CuentasPorCobrar/SeguimientoCobranzaModal.tsx` | Ninguna | `standard` | **AGREGAR** |
| 41 | **PromesaPagoModal** | `src/pages/Facturacion/components/CobranzaWorkflow/PromesaPagoModal.tsx` | Ninguna | `standard` | **AGREGAR** |

### Categoría 8: Formularios de Planeación (Requieren `standard`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 42 | **ContextualMeetingPointsTab** | `src/pages/Planeacion/components/configuration/ContextualMeetingPointsTab.tsx` | Ninguna | `light` | **AGREGAR** |
| 43 | **RegistrarPagoDialog** | `src/pages/Planeacion/components/configuration/pagos/RegistrarPagoDialog.tsx` | Ninguna | `light` | **AGREGAR** |
| 44 | **PendingAssignmentModal** | `src/components/planeacion/PendingAssignmentModal.tsx` | Ninguna | `standard` | **AGREGAR** |
| 45 | **EditServiceModal** | `src/components/planeacion/EditServiceModal.tsx` | Ninguna | `light` | **AGREGAR** |

### Categoría 9: Formularios LMS (Requieren `standard`)

| # | Formulario | Archivo | Persistencia Actual | Nivel Recomendado | Acción |
|---|------------|---------|---------------------|-------------------|--------|
| 46 | **LMSCursoForm** | `src/components/lms/admin/LMSCursoForm.tsx` | Ninguna | `standard` | **AGREGAR** |
| 47 | **LMSModuloForm** | `src/components/lms/admin/LMSModuloForm.tsx` | Ninguna | `light` | **AGREGAR** |

---

## Resumen de Acciones Requeridas

| Acción | Cantidad |
|--------|----------|
| **MIGRAR** (implementación custom → hook unificado) | 1 |
| **AGREGAR** (sin persistencia → agregar hook) | 32 |
| **ACTUALIZAR** (cambiar nivel de persistencia) | 5 |
| **VERIFICAR** (ya tienen persistencia, confirmar funcionamiento) | 7 |
| **OPCIONAL** (formularios simples, baja prioridad) | 5 |
| **OK** (funcionando correctamente) | 4 |
| **TOTAL** | 47 formularios |

---

## Cambios Técnicos al Hook Principal

### 1. Agregar Backup Dual (localStorage + sessionStorage)

```typescript
// src/hooks/useFormPersistence.ts - Línea 220
const saveToStorage = useCallback((dataToSave: T, forceDraftId?: string) => {
  if (!enabled || !isMeaningful(dataToSave)) return;
  
  try {
    const currentDraftId = forceDraftId || draftId || generateDraftId();
    const draft: StoredDraft<T> = {
      data: dataToSave,
      savedAt: new Date().toISOString(),
      draftId: currentDraftId,
      progressScore: calculateProgress(dataToSave),
      version: STORAGE_VERSION,
    };
    
    // NUEVO: Backup dual para robustez
    localStorage.setItem(key, JSON.stringify(draft));
    sessionStorage.setItem(`${key}_session_backup`, JSON.stringify(draft));
    
    // ... resto igual
  } catch (e) {
    console.warn(`[useFormPersistence] Failed to save:`, e);
  }
}, [/* deps */]);
```

### 2. Agregar Carga desde Backup en Inicialización

```typescript
// src/hooks/useFormPersistence.ts - Función loadFromStorage
const loadFromStorage = useCallback((): StoredDraft<T> | null => {
  try {
    // Intentar localStorage primero
    let stored = localStorage.getItem(key);
    
    // NUEVO: Fallback a sessionStorage backup
    if (!stored) {
      stored = sessionStorage.getItem(`${key}_session_backup`);
      if (stored) {
        console.log(`[useFormPersistence] Restored from session backup: ${key}`);
      }
    }
    
    if (!stored) return null;
    
    const parsed: StoredDraft<T> = JSON.parse(stored);
    
    // Validaciones existentes...
    if (parsed.version !== STORAGE_VERSION) {
      clearBothStorages();
      return null;
    }
    
    if (isExpired(parsed.savedAt, ttl)) {
      clearBothStorages();
      return null;
    }
    
    return parsed;
  } catch (e) {
    console.warn(`[useFormPersistence] Failed to load:`, e);
    return null;
  }
}, [key, ttl]);
```

### 3. Agregar Auto-Detección de Borrador Sin URL

```typescript
// src/hooks/useFormPersistence.ts - Nueva función
const detectOrphanDraft = useCallback((): StoredDraft<T> | null => {
  // Buscar borradores que coincidan con el patrón de key pero sin URL param
  const stored = loadFromStorage();
  
  if (stored && !isExpired(stored.savedAt, ttl)) {
    // Si hay borrador pero no hay URL param, es un borrador "huérfano"
    if (enableUrlParams && level === 'robust') {
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('draft') && stored.draftId) {
        return stored; // Borrador huérfano encontrado
      }
    }
    return stored;
  }
  return null;
}, [loadFromStorage, ttl, enableUrlParams, level]);
```

### 4. Nuevo Estado para Prompt de Restauración

```typescript
// src/hooks/useFormPersistence.ts - Nuevos estados
const [pendingRestore, setPendingRestore] = useState<StoredDraft<T> | null>(null);
const [showRestorePrompt, setShowRestorePrompt] = useState(false);

// En retorno del hook
return {
  // ... existentes
  pendingRestore,
  showRestorePrompt,
  acceptRestore: () => { /* restaurar desde pendingRestore */ },
  rejectRestore: () => { /* limpiar y empezar fresco */ },
};
```

---

## Nuevo Componente: DraftAutoRestorePrompt

```typescript
// src/components/ui/DraftAutoRestorePrompt.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, RotateCcw, X, FileText } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DraftAutoRestorePromptProps {
  visible: boolean;
  savedAt: Date | null;
  previewText?: string;
  moduleName: string;
  onRestore: () => void;
  onDiscard: () => void;
  onDismiss: () => void;
}

export function DraftAutoRestorePrompt({
  visible,
  savedAt,
  previewText,
  moduleName,
  onRestore,
  onDiscard,
  onDismiss,
}: DraftAutoRestorePromptProps) {
  if (!visible) return null;

  const timeAgo = savedAt
    ? formatDistanceToNow(savedAt, { addSuffix: true, locale: es })
    : 'hace un momento';

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <Card className="w-80 shadow-lg border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <FileText className="h-4 w-4" />
            {moduleName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Tienes un borrador sin terminar guardado <strong>{timeAgo}</strong>
          </p>
          
          {previewText && (
            <p className="text-xs text-muted-foreground truncate italic">
              "{previewText}"
            </p>
          )}
          
          <div className="flex gap-2">
            <Button 
              size="sm" 
              onClick={onRestore}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Restaurar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onDiscard}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Descartar
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={onDismiss}
              className="px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Actualización del DraftResumeContext

El catálogo de borradores existente necesita actualizarse con todos los nuevos formularios:

```typescript
// src/contexts/DraftResumeContext.tsx - Agregar entradas faltantes
const DRAFT_CATALOG: DraftInfo[] = [
  // ... existentes ...
  
  // NUEVOS - Facturación
  {
    id: 'facturacion-pago',
    storageKey: 'facturacion_registrar_pago',
    moduleName: 'Registro de Pago',
    resumePath: '/facturacion',
    isMeaningful: (data) => data && (data.monto || data.tipo_pago),
  },
  {
    id: 'cobranza-seguimiento',
    storageKey: 'cobranza_seguimiento',
    moduleName: 'Seguimiento de Cobranza',
    resumePath: '/facturacion',
    isMeaningful: (data) => data && (data.notas || data.tipo_accion),
  },
  
  // NUEVOS - Evaluaciones
  {
    id: 'toxicology-result',
    storageKey: 'toxicology_result',
    moduleName: 'Resultado Toxicológico',
    resumePath: '/recruitment',
    isMeaningful: (data) => data && data.resultado,
  },
  
  // ... agregar los 32 restantes ...
];
```

---

## Archivos a Modificar

### Fase 1: Infraestructura (Semana 1)

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/hooks/useFormPersistence.ts` | Backup dual, auto-detección, estados de prompt | ALTA |
| `src/components/ui/DraftAutoRestorePrompt.tsx` | **CREAR** nuevo componente | ALTA |
| `src/contexts/DraftResumeContext.tsx` | Actualizar catálogo con 32 nuevos formularios | ALTA |
| `src/hooks/usePersistedForm.ts` | Agregar deprecation warning, migrar a useFormPersistence | MEDIA |

### Fase 2: Migración ServiceCreation (Semana 1)

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/pages/Planeacion/ServiceCreation/hooks/useServiceCreation.tsx` | Migrar a `useFormPersistence` nivel `robust` | CRÍTICA |
| `src/pages/Planeacion/ServiceCreation/ServiceCreationLayout.tsx` | Agregar `DraftAutoRestorePrompt` | CRÍTICA |

### Fase 3: Formularios Críticos (Semana 2)

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/pages/Planeacion/components/ImportWizard.tsx` | Agregar `useFormPersistence` robust | ALTA |
| `src/components/maintenance/ImportWizardEnhanced.tsx` | Agregar `useFormPersistence` robust | ALTA |
| `src/components/custodian/checklist/ChecklistWizard.tsx` | Agregar `useFormPersistence` robust | ALTA |
| `src/pages/WMS/components/DevolucionWizard.tsx` | Actualizar a nivel `robust` | ALTA |
| `src/components/lms/admin/LMSCursoWizard.tsx` | Actualizar a nivel `robust` | ALTA |

### Fase 4: Formularios de Registro (Semana 2-3)

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/components/leads/LeadForm.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Installers/components/RegistroInstaladorDialog.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Installers/components/ProgramarInstalacionDialog.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Planeacion/components/CustodioDialog.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Planeacion/components/ClienteDialog.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/components/recruitment/toxicology/ToxicologyResultForm.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/components/recruitment/CandidateEvaluationPanel.tsx` | Agregar `useFormPersistence` standard | MEDIA |

### Fase 5: Formularios Operativos (Semana 3)

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/pages/PerfilesOperativos/components/EditOperativeProfileSheet.tsx` | Agregar `useFormPersistence` light | BAJA |
| `src/components/operatives/CambioEstatusModal.tsx` | Agregar `useFormPersistence` light | BAJA |
| `src/components/operatives/AplicarSancionModal.tsx` | Agregar `useFormPersistence` light | BAJA |
| `src/components/custodian/ReportUnavailabilityCard.tsx` | Agregar `useFormPersistence` light | BAJA |
| `src/components/custodian/RecordMaintenanceDialog.tsx` | Agregar `useFormPersistence` light | BAJA |

### Fase 6: Formularios WMS/Facturación (Semana 3-4)

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/pages/WMS/components/RecepcionDialog.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Planeacion/components/AsignarGPSDialog.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Planeacion/components/DevolucionDialog.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Facturacion/components/CuentasPorCobrar/RegistrarPagoModal.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Facturacion/components/CuentasPorCobrar/SeguimientoCobranzaModal.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/pages/Facturacion/components/CobranzaWorkflow/PromesaPagoModal.tsx` | Agregar `useFormPersistence` standard | MEDIA |

### Fase 7: Formularios Restantes (Semana 4)

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/pages/Planeacion/components/configuration/ContextualMeetingPointsTab.tsx` | Agregar `useFormPersistence` light | BAJA |
| `src/pages/Planeacion/components/configuration/pagos/RegistrarPagoDialog.tsx` | Agregar `useFormPersistence` light | BAJA |
| `src/components/planeacion/PendingAssignmentModal.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/components/planeacion/EditServiceModal.tsx` | Agregar `useFormPersistence` light | BAJA |
| `src/components/lms/admin/LMSCursoForm.tsx` | Agregar `useFormPersistence` standard | MEDIA |
| `src/components/lms/admin/LMSModuloForm.tsx` | Agregar `useFormPersistence` light | BAJA |

---

## Documentación: Criterios para Formularios Futuros

### Archivo: `docs/FORM_PERSISTENCE_GUIDE.md`

```markdown
# Guía de Persistencia de Formularios

## Regla General
TODO formulario con más de 3 campos DEBE implementar persistencia.

## Niveles de Persistencia

### `light` - Formularios Simples
- Dialogs de edición rápida (< 30 segundos para completar)
- Formularios de configuración
- Campos que no tienen impacto crítico si se pierden

### `standard` - Formularios de Registro
- Formularios de creación de entidades
- Registros que toman 1-5 minutos
- Datos que el usuario no quiere perder

### `robust` - Workflows Críticos
- Procesos multi-paso
- Formularios que toman > 5 minutos
- Datos críticos para facturación/operación

## Implementación Estándar

```typescript
import { useFormPersistence } from '@/hooks/useFormPersistence';

const MyForm = () => {
  const persistence = useFormPersistence<MyFormData>({
    key: 'my_form_unique_key', // Clave única en localStorage
    initialData: INITIAL_DATA,
    level: 'standard', // 'light' | 'standard' | 'robust'
    isMeaningful: (data) => Boolean(data.campo1 || data.campo2),
  });

  const { data, updateData, hasDraft, clearDraft } = persistence;

  // Usar data en lugar de useState local
  // Usar updateData en lugar de setData
};
```

## Checklist para Nuevos Formularios

- [ ] ¿El formulario tiene más de 3 campos? → Implementar persistencia
- [ ] ¿Es un proceso multi-paso? → Usar nivel `robust`
- [ ] ¿Incluye archivos/imágenes? → Usar nivel `robust` + considerar IndexedDB
- [ ] ¿El usuario puede salir accidentalmente? → Mínimo nivel `standard`
- [ ] ¿Los datos son críticos para facturación? → Nivel `robust` obligatorio
- [ ] ¿Actualizar `DraftResumeContext.tsx` con la nueva entrada?
```

---

## Verificación Post-Implementación

Para cada formulario migrado, ejecutar estas pruebas:

1. **Test de Navegación Externa**
   - Llenar parcialmente el formulario
   - Abrir nueva pestaña, ir a otro sitio
   - Volver al formulario
   - ✅ Verificar que los datos persisten

2. **Test de Cierre de Pestaña**
   - Llenar parcialmente el formulario
   - Cerrar la pestaña
   - Abrir nueva pestaña, ir al mismo formulario
   - ✅ Verificar que aparece prompt de restauración

3. **Test de Cambio de Visibilidad**
   - Llenar parcialmente el formulario
   - Minimizar ventana o cambiar aplicación (móvil)
   - Volver a la aplicación
   - ✅ Verificar que los datos persisten

4. **Test de Guardado Exitoso**
   - Completar y enviar el formulario
   - Verificar que el borrador se limpia
   - Volver al formulario
   - ✅ Verificar que NO hay prompt de restauración

---

## Cronograma de Implementación

| Semana | Fase | Formularios | Entregables |
|--------|------|-------------|-------------|
| 1 | Infraestructura | - | Hook mejorado, DraftAutoRestorePrompt |
| 1 | ServiceCreation | 1 | Migración crítica completada |
| 2 | Wizards | 7 | Todos los wizards con robust |
| 2-3 | Registro | 7 | Formularios de creación |
| 3 | Operativos | 5 | Formularios operativos |
| 3-4 | WMS/Facturación | 6 | Formularios de inventario y pagos |
| 4 | Restantes | 6 | Formularios de baja prioridad |
| 4 | Documentación | - | Guía para futuros desarrollos |

**Total: 32 formularios nuevos + 1 migración + 5 actualizaciones = 38 cambios**
