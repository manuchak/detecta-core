
# Diagnóstico Forense: Bug de "Edición Contextual" Rompe el Flujo

## Problema Reportado

Cuando el usuario Axel hace clic en "Continuar" en el modal de "Confirmar Cambios" con "Edición Contextual" seleccionada, el sistema cierra todo y regresa a la página principal en lugar de continuar con el flujo de asignación.

---

## Causa Raíz Identificada

El modo `flexible_assign` no está manejado en ningún switch del `ContextualEditModal.tsx`, causando que caiga en comportamiento `default` que termina cerrando el modal incorrectamente.

### Flujo Actual (Buggeado)

```text
1. PendingAssignmentModal abre ContextualEditModal (showContextualEdit=true)
2. useSmartEditSuggestions detecta: sin custodio + sin armado + pendiente
   → heroSuggestion = { mode: 'flexible_assign', title: 'Asignar Personal' }
3. Usuario hace clic en "Asignar Personal"
   → handleEditModeSelect('flexible_assign', ...)
   → switch NO tiene case para 'flexible_assign'
   → CAE EN DEFAULT → setCurrentView('preview')
4. Se muestra vista "Confirmar Cambios" con "Edición Contextual"
   (ContextualFeedback.tsx default case)
5. Usuario hace clic en "Continuar"
   → handleProceed()
   → selectedEditMode !== 'basic_info'
   → ejecuta handleDirectAction()
6. En handleDirectAction:
   → switch NO tiene case para 'flexible_assign'  
   → CAE EN DEFAULT → toast.info('Acción en desarrollo')
   → NO HACE RETURN
   → await new Promise(...) // espera 1.5s
   → onOpenChange(false)  // ⚠️ CIERRA TODO
7. En PendingAssignmentModal:
   → hasInteracted === false (nunca se marcó)
   → onOpenChange(false) se propaga al padre
   → Modal se cierra completamente
   → Usuario regresa a página principal
```

### Diagrama del Bug

```text
┌─────────────────────────────────────────────────────────┐
│ ContextualEditModal                                      │
│                                                          │
│  handleEditModeSelect('flexible_assign')                 │
│         │                                                │
│         ▼                                                │
│  switch(mode) {                                          │
│    case 'custodian_only': ...                            │
│    case 'armed_only': ...                                │
│    case 'add_armed': ...                                 │
│    case 'remove_armed': ...                              │
│    case 'basic_info': ...                                │
│    default: ← 'flexible_assign' CAE AQUI                 │
│      setCurrentView('preview')                           │
│  }                                                       │
│                                                          │
│  handleProceed() → handleDirectAction()                  │
│         │                                                │
│         ▼                                                │
│  switch(selectedEditMode) {                              │
│    ...                                                   │
│    default: ← 'flexible_assign' CAE AQUI                 │
│      toast.info('Acción en desarrollo')                  │
│      // NO return                                        │
│  }                                                       │
│  await sleep(1500)                                       │
│  onOpenChange(false) ← CIERRA TODO                       │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Solucion Propuesta

### Fix 1: Agregar case para `flexible_assign` en `handleEditModeSelect`

El modo `flexible_assign` deberia comportarse igual que `custodian_only` - llamar a `onStartReassignment` para que `PendingAssignmentModal` muestre los tabs de asignacion.

```typescript
// ContextualEditModal.tsx - handleEditModeSelect
case 'flexible_assign':
  // Flexible assign mode - let parent show assignment tabs
  console.log('[ContextualEditModal] 🔄 Flexible assign mode - starting assignment flow');
  if (!onStartReassignment) {
    toast.error('No se pudo iniciar el flujo de asignación');
    return;
  }
  
  if (service) {
    // Start with custodian tab (default), armed tab will be available
    onStartReassignment('custodian', service);
  }
  break;
```

### Fix 2: Agregar case para `flexible_assign` en `handleDirectAction`

Como respaldo, si por alguna razon llega a `handleDirectAction`:

```typescript
// ContextualEditModal.tsx - handleDirectAction
case 'flexible_assign':
  if (onStartReassignment) {
    onStartReassignment('custodian', service);
  } else {
    toast.error('No se pudo iniciar el flujo de asignación');
  }
  return; // IMPORTANTE: return para no cerrar modal
```

### Fix 3: Agregar feedback en `ContextualFeedback.tsx`

Agregar case especifico para `flexible_assign` en lugar de mostrar "Edición Contextual":

```typescript
case 'flexible_assign':
  return {
    icon: <User className="h-4 w-4 text-blue-600" />,
    title: 'Asignación Flexible',
    description: 'Asigna custodio y armado en el orden que prefieras',
    details: [
      'Puedes empezar por custodio o por armado',
      'Ambas asignaciones son requeridas',
      'El servicio se completará cuando ambos estén asignados'
    ],
    estimatedTime: '3 minutos',
    color: 'blue'
  };
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/planeacion/ContextualEditModal.tsx` | Agregar case `flexible_assign` en `handleEditModeSelect` y `handleDirectAction` |
| `src/components/planeacion/ContextualFeedback.tsx` | Agregar case `flexible_assign` con feedback apropiado |

---

## Flujo Corregido

```text
1. PendingAssignmentModal abre ContextualEditModal
2. heroSuggestion = { mode: 'flexible_assign' }
3. Usuario hace clic en "Asignar Personal"
   → handleEditModeSelect('flexible_assign', ...)
   → case 'flexible_assign': onStartReassignment('custodian', service)
4. PendingAssignmentModal:
   → handleStartReassignment('custodian', ...)
   → hasInteracted = true
   → showContextualEdit = false
   → activeTab = 'custodian'
5. Se muestra PendingAssignmentModal con tabs
6. Usuario puede asignar custodio → automaticamente pasa a tab armado
7. Usuario asigna armado → servicio completo
8. Modal se cierra correctamente
```

---

## Impacto

- **Usuarios afectados**: Planificadores que editan servicios sin custodio ni armado asignado
- **Severidad**: Alta - bloquea flujo critico de asignacion
- **Riesgo de regresion**: Bajo - cambios aislados en switches

---

## Notas Tecnicas

- El modo `flexible_assign` fue agregado en la arquitectura de "Flexible Resource Assignment" pero no se implemento correctamente en el `ContextualEditModal`
- El `SmartEditModal` maneja `flexible_assign` correctamente porque usa acciones directas con callbacks
- El `ContextualEditModal` asume que todos los modos pasan por la vista preview, pero `flexible_assign` deberia saltar directamente al flujo de asignacion
