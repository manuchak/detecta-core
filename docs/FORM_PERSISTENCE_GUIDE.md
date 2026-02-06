# Guía de Persistencia de Formularios

## Regla General

**TODO formulario con más de 3 campos DEBE implementar persistencia.**

Esta guía establece los criterios y patrones para implementar persistencia de formularios en el sistema Detecta.

---

## Niveles de Persistencia

### `light` - Formularios Simples

**Características:**
- Guardado con debounce (800ms por defecto)
- Sin eventos de visibilidad/pagehide
- Restauración manual

**Cuándo usar:**
- Dialogs de edición rápida (< 30 segundos para completar)
- Formularios de configuración
- Campos que no tienen impacto crítico si se pierden

**Ejemplos:**
- Editar nombre de cliente
- Cambiar estado de un registro
- Formularios de filtros/búsqueda

### `standard` - Formularios de Registro

**Características:**
- Todo lo de `light`, más:
- Guardado automático en `visibilitychange` y `pagehide`
- Reconciliación al volver a la pestaña
- Prompt de restauración automático
- Backup dual (localStorage + sessionStorage)

**Cuándo usar:**
- Formularios de creación de entidades
- Registros que toman 1-5 minutos
- Datos que el usuario no quiere perder

**Ejemplos:**
- Nuevo lead/candidato
- Registro de instalador
- Formularios de evaluación

### `robust` - Workflows Críticos

**Características:**
- Todo lo de `standard`, más:
- Parámetro URL para tracking de draft
- Detección de borradores "huérfanos" (sin URL param)
- Progress score para comparación de borradores
- IndexedDB para archivos (cuando aplique)

**Cuándo usar:**
- Procesos multi-paso (wizards)
- Formularios que toman > 5 minutos
- Datos críticos para facturación/operación
- Workflows donde perder datos causa re-trabajo significativo

**Ejemplos:**
- Creación de servicios
- Importación de Excel
- Devolución RMA
- Creación de cursos LMS

---

## Implementación Estándar

### Hook Principal: `useFormPersistence`

```typescript
import { useFormPersistence } from '@/hooks/useFormPersistence';

interface MyFormData {
  nombre: string;
  email: string;
  telefono: string;
  // ...
}

const INITIAL_DATA: MyFormData = {
  nombre: '',
  email: '',
  telefono: '',
};

function MyForm() {
  const {
    data,
    updateData,
    setData,
    hasDraft,
    hasUnsavedChanges,
    lastSaved,
    saveDraft,
    clearDraft,
    getTimeSinceSave,
    // Auto-restore prompt
    showRestorePrompt,
    pendingRestore,
    acceptRestore,
    rejectRestore,
    dismissRestorePrompt,
    previewText,
    moduleName,
  } = useFormPersistence<MyFormData>({
    key: 'my_form_unique_key',  // Clave única en localStorage
    initialData: INITIAL_DATA,
    level: 'standard',          // 'light' | 'standard' | 'robust'
    isMeaningful: (data) => Boolean(data.nombre || data.email),
    moduleName: 'Mi Formulario', // Para mostrar en prompt
    getPreviewText: (data) => data.nombre || 'Sin nombre',
  });

  // Usar data en lugar de useState local
  // Usar updateData en lugar de setData parcial

  const handleChange = (field: keyof MyFormData, value: string) => {
    updateData({ [field]: value });
  };

  const handleSubmit = async () => {
    // ... lógica de submit
    clearDraft(true); // Limpiar borrador después de éxito
  };

  return (
    <>
      {/* Prompt de restauración */}
      <DraftAutoRestorePrompt
        visible={showRestorePrompt}
        savedAt={lastSaved}
        previewText={previewText}
        moduleName={moduleName}
        onRestore={acceptRestore}
        onDiscard={rejectRestore}
        onDismiss={dismissRestorePrompt}
      />

      {/* Tu formulario */}
      <form>
        {/* ... */}
      </form>
    </>
  );
}
```

### Componentes de UI

#### Toast/Banner Flotante

```tsx
import { DraftAutoRestorePrompt } from '@/components/ui/DraftAutoRestorePrompt';

<DraftAutoRestorePrompt
  visible={showRestorePrompt}
  savedAt={lastSaved}
  previewText={previewText}
  moduleName="Creación de Servicio"
  onRestore={acceptRestore}
  onDiscard={rejectRestore}
  onDismiss={dismissRestorePrompt}
  position="bottom-right" // 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center-bottom'
/>
```

#### Banner Inline (dentro del formulario)

```tsx
import { DraftRestoreBanner } from '@/components/ui/DraftAutoRestorePrompt';

<DraftRestoreBanner
  visible={showRestorePrompt}
  savedAt={lastSaved}
  previewText={previewText}
  onRestore={acceptRestore}
  onDiscard={rejectRestore}
/>
```

---

## Opciones del Hook

| Opción | Tipo | Default | Descripción |
|--------|------|---------|-------------|
| `key` | `string` | **requerido** | Clave única en localStorage |
| `initialData` | `T` | **requerido** | Datos iniciales del formulario |
| `level` | `'light' \| 'standard' \| 'robust'` | `'light'` | Nivel de persistencia |
| `enabled` | `boolean` | `true` | Habilitar/deshabilitar |
| `ttl` | `number` | `86400000` (24h) | Tiempo de vida en ms |
| `debounceMs` | `number` | `800` | Debounce para autosave |
| `isMeaningful` | `(data: T) => boolean` | `() => true` | Función para determinar si vale la pena guardar |
| `validateConsistency` | `(data: T) => T` | `(d) => d` | Limpiar/validar datos al restaurar |
| `onRestore` | `(data: T) => void` | - | Callback al restaurar |
| `onSave` | `(data: T) => void` | - | Callback al guardar |
| `form` | `UseFormReturn<T>` | - | Instancia de react-hook-form para sync |
| `enableUrlParams` | `boolean` | `level === 'robust'` | Usar URL params para draft ID |
| `calculateProgress` | `(data: T) => number` | `() => 0` | Calcular score de progreso |
| `getPreviewText` | `(data: T) => string` | `() => ''` | Texto preview para prompt |
| `moduleName` | `string` | `'Formulario'` | Nombre del módulo para UI |

---

## Checklist para Nuevos Formularios

- [ ] ¿El formulario tiene más de 3 campos? → Implementar persistencia
- [ ] ¿Es un proceso multi-paso? → Usar nivel `robust`
- [ ] ¿Incluye archivos/imágenes? → Usar nivel `robust` + considerar IndexedDB
- [ ] ¿El usuario puede salir accidentalmente? → Mínimo nivel `standard`
- [ ] ¿Los datos son críticos para facturación? → Nivel `robust` obligatorio
- [ ] ¿Actualizar `DraftResumeContext.tsx` con la nueva entrada?

---

## Actualizar el Catálogo de Borradores

Cuando crees un nuevo formulario con persistencia, **debes agregar una entrada** en `src/contexts/DraftResumeContext.tsx`:

```typescript
// En DRAFT_CATALOG array:
{
  id: 'mi-nuevo-form',
  storageKey: 'mi_nuevo_form', // Debe coincidir con key del hook
  moduleName: 'Mi Nuevo Formulario',
  resumePath: '/ruta/al/formulario',
  isMeaningful: (data) => Boolean(data.campo1 || data.campo2),
  previewText: 'Continúa editando...',
},
```

---

## Pruebas de Verificación

Para cada formulario con persistencia, ejecutar:

### 1. Test de Navegación Externa
1. Llenar parcialmente el formulario
2. Abrir nueva pestaña, ir a otro sitio
3. Volver al formulario
4. ✅ Verificar que los datos persisten

### 2. Test de Cierre de Pestaña
1. Llenar parcialmente el formulario
2. Cerrar la pestaña
3. Abrir nueva pestaña, ir al mismo formulario
4. ✅ Verificar que aparece prompt de restauración

### 3. Test de Cambio de Visibilidad
1. Llenar parcialmente el formulario
2. Minimizar ventana o cambiar aplicación (móvil)
3. Volver a la aplicación
4. ✅ Verificar que los datos persisten

### 4. Test de Guardado Exitoso
1. Completar y enviar el formulario exitosamente
2. Verificar que el borrador se limpia (`clearDraft(true)`)
3. Volver al formulario
4. ✅ Verificar que NO hay prompt de restauración

---

## Migración desde usePersistedForm

El hook `usePersistedForm` está **deprecado**. Para migrar:

```typescript
// ANTES (deprecado)
const { formData, updateFormData, hasDraft, restoreDraft, clearDraft } = usePersistedForm({
  key: 'my_key',
  initialData: INITIAL,
  isMeaningfulDraft: (d) => Boolean(d.nombre),
});

// DESPUÉS
const { data, updateData, hasDraft, restoreDraft, clearDraft } = useFormPersistence({
  key: 'my_key',
  initialData: INITIAL,
  level: 'standard',
  isMeaningful: (d) => Boolean(d.nombre),
});

// Cambios de API:
// - formData → data
// - updateFormData → updateData
// - isMeaningfulDraft → isMeaningful
// - Agregar level según criticidad
```

---

## Troubleshooting

### El borrador no se restaura

1. Verificar que `key` sea único y consistente
2. Verificar que `isMeaningful` retorne `true` para los datos
3. Revisar TTL (default 24h)
4. Verificar en DevTools > Application > Local Storage

### El prompt aparece cuando no debería

1. Verificar que `clearDraft(true)` se llame después de submit exitoso
2. Verificar que `isMeaningful` descarte datos vacíos/irrelevantes

### Datos corruptos

1. El hook valida `version` del draft
2. Usar `validateConsistency` para limpiar datos legacy
3. En caso extremo, limpiar manualmente: `localStorage.removeItem('key')`

---

## Arquitectura Técnica

### Backup Dual

```
┌─────────────────┐     ┌──────────────────┐
│   localStorage  │     │  sessionStorage  │
│   (persistente) │     │  (sesión activa) │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
              ┌──────▼──────┐
              │   Restore   │
              │ (fallback)  │
              └─────────────┘
```

### Flujo de Detección de Borrador Huérfano

```
┌────────────────────────────────────────────────────────────┐
│ Usuario navega a /planeacion/nuevo-servicio                │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────────┐
│ useFormPersistence se inicializa                           │
│ loadFromStorage() encuentra borrador                       │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ ¿URL tiene   │
                    │ ?draft=id?   │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │ SÍ         │ NO         │
              ▼            ▼            │
       ┌─────────────┐   ┌─────────────┐│
       │ Auto-restore│   │ Show prompt ││
       └─────────────┘   └─────────────┘│
                                        │
                                        ▼
                         ┌──────────────────────┐
                         │ Usuario decide:      │
                         │ Restaurar / Descartar│
                         └──────────────────────┘
```
