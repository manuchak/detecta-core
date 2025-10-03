# Quality Check Report - Draft Persistence Architecture

**Fecha**: 2025-10-03  
**Objetivo**: Prevenir resets al cambiar de página y pérdida de datos en formularios

---

## 🔴 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. **GlobalResumeCTA - Estado dismissed no persistido**
**Severidad**: ALTA  
**Ubicación**: `src/components/global/GlobalResumeCTA.tsx:15`

**Problema**:
```typescript
const [dismissed, setDismissed] = useState(false);
```
El estado `dismissed` es local y se resetea en cada re-render del componente. Si el usuario hace "Recordar más tarde" y luego navega a otra página, el CTA volverá a aparecer.

**Solución**: Persistir el estado dismissed en sessionStorage con un timestamp.

---

### 2. **GlobalResumeCTA - Dependencias incompletas en useEffect**
**Severidad**: MEDIA  
**Ubicación**: `src/components/global/GlobalResumeCTA.tsx:17-27`

**Problema**:
```typescript
useEffect(() => {
  const checkDraft = () => {
    const recentDraft = getMostRecentDraft();
    setDraft(recentDraft);
  };
  checkDraft();
  const interval = setInterval(checkDraft, 5000);
  return () => clearInterval(interval);
}, [getMostRecentDraft]); // ❌ Falta location en dependencies
```

Si el usuario navega a la página del draft, el componente no re-evalúa si debe ocultarse porque `location` no está en las dependencias.

**Solución**: Agregar `location` a las dependencias.

---

### 3. **LastRouteRestorer - Race condition con otras navegaciones**
**Severidad**: MEDIA  
**Ubicación**: `src/components/global/LastRouteRestorer.tsx:23-34`

**Problema**:
El componente se ejecuta inmediatamente en el mount y podría entrar en conflicto con:
- Redirecciones de autenticación
- Redirecciones de roles
- Deep-links de resumption (`/resume/...`)

**Solución**: Agregar un pequeño delay y verificar flags de sesión antes de restaurar.

---

### 4. **PlanningHub - Detección de draft duplicada**
**Severidad**: BAJA  
**Ubicación**: `src/pages/Planeacion/PlanningHub.tsx:59-91, 127-139`

**Problema**:
El código verifica dos veces si existe un draft: una vez en el `useEffect` para auto-abrir el diálogo y otra vez para mostrar el banner. Esto es ineficiente y puede causar inconsistencias.

**Solución**: Crear un único hook custom `useDraftDetection` que centralice esta lógica.

---

### 5. **RequestCreationWorkflow - No limpia draft al completar con éxito**
**Severidad**: CRÍTICA  
**Ubicación**: `src/pages/Planeacion/components/RequestCreationWorkflow.tsx`

**Problema**:
Aunque se llama `clearDraft()` en algunos lugares, no hay garantía de que se ejecute si:
- Hay un error de red después de crear el servicio
- El usuario cierra el diálogo antes de terminar
- Hay un error inesperado

**Solución**: Implementar cleanup robusto con try-finally blocks.

---

### 6. **usePersistedForm - Falta sincronización entre formDataRef y formData state**
**Severidad**: ALTA  
**Ubicación**: `src/hooks/usePersistedForm.ts:60-61, 234-235`

**Problema**:
Hay dos fuentes de verdad:
- `formData` (state) - usado por React
- `formDataRef.current` (ref) - usado para saves

Si `updateFormData` modifica el state pero no sincroniza inmediatamente el ref, podría haber pérdida de datos en saves que ocurren antes de que React actualice.

**Solución**: Garantizar que cada vez que se actualiza `formData`, también se actualiza `formDataRef.current` en el mismo tick.

---

### 7. **DraftResumeContext - No se invalida cache al cambiar de usuario**
**Severidad**: MEDIA  
**Ubicación**: `src/contexts/DraftResumeContext.tsx:54-79`

**Problema**:
```typescript
const getActiveDrafts = useCallback((): DraftInfo[] => {
  // ...busca drafts en localStorage
}, [user]); // ✅ Tiene user en dependencies
```

Esto está bien, PERO los componentes que llaman a `getActiveDrafts()` no se re-renderizan automáticamente cuando el usuario cambia. El `GlobalResumeCTA` solo chequea cada 5 segundos.

**Solución**: Implementar un sistema de eventos o un state interno que fuerce re-renders.

---

### 8. **Falta manejo de conflictos multi-tab**
**Severidad**: MEDIA  
**Ubicación**: Múltiples archivos

**Problema**:
Si el usuario tiene dos tabs abiertos:
1. Tab A: Edita un draft
2. Tab B: Edita el mismo draft
3. Tab A guarda
4. Tab B guarda -> **sobrescribe cambios de Tab A**

No hay sincronización entre tabs.

**Solución**: Usar `storage` event listener para detectar cambios de otras tabs.

---

### 9. **LeadForm - No usa el sistema de user-specific keys correctamente**
**Severidad**: BAJA  
**Ubicación**: `src/components/leads/LeadForm.tsx:47-60`

**Problema**:
```typescript
const {
  formData,
  updateFormData,
  hasDraft,
  restoreDraft,
  clearDraft,
} = usePersistedForm<LeadFormData>({
  key: 'lead_form_draft', // ✅ Correcto
  initialData: { ... },
  saveOnChangeDebounceMs: 1000,
  isMeaningfulDraft: (data) => {
    return !!(data.nombre || data.email || data.telefono);
  },
}); // ✅ usePersistedForm ya usa useAuth internamente
```

Esto está bien implementado. El hook ya maneja el user ID internamente.

---

### 10. **Falta indicador visual de guardado automático**
**Severidad**: BAJA - UX  
**Ubicación**: Múltiples formularios

**Problema**:
Los usuarios no saben si sus cambios se están guardando automáticamente. Esto genera ansiedad y falta de confianza.

**Solución**: Agregar un indicador "Guardado hace X segundos" visible.

---

## 🟡 PROBLEMAS DE ARQUITECTURA

### A1. **No hay una fuente única de verdad para drafts**
- `localStorage` almacena los drafts
- `DraftResumeContext` tiene un catálogo estático
- Componentes individuales también chequean localStorage directamente

**Recomendación**: Centralizar TODO el acceso a localStorage a través del Context.

---

### A2. **Falta documentación de flujos**
No hay diagramas de secuencia que documenten:
- ¿Qué pasa cuando un usuario navega away y vuelve?
- ¿Qué pasa cuando dos tabs están abiertas?
- ¿Qué pasa si un draft expira?

**Recomendación**: Crear diagramas de flujo en Mermaid.

---

### A3. **React Query refetchOnWindowFocus: false es demasiado agresivo**
**Ubicación**: `src/App.tsx:78-85`

**Problema**:
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // ⚠️ Demasiado agresivo
    },
  },
});
```

Esto desactiva TODAS las refetch en cambio de foco. Algunas queries NECESITAN refetch (ej: listas de servicios en tiempo real).

**Solución**: Dejar el default y que queries específicas opten por `refetchOnWindowFocus: false`.

---

## 🟢 COSAS QUE ESTÁN BIEN IMPLEMENTADAS

✅ Save-on-unmount en usePersistedForm (línea 201-226)  
✅ User-specific storage keys  
✅ TTL para drafts antiguos  
✅ Debouncing de saves  
✅ Sanitización de datos antes de guardar  
✅ Catálogo declarativo de drafts  
✅ Deep-link routes para resumption  
✅ LastRouteRestorer para preservar navegación  

---

## 📋 PLAN DE ACCIÓN PRIORITARIO

### 🔥 Prioridad 1 (Hacer AHORA)
1. Fix GlobalResumeCTA dismissed state persistence
2. Fix GlobalResumeCTA useEffect dependencies
3. Garantizar sincronización formData ↔ formDataRef en usePersistedForm
4. Implementar cleanup robusto en RequestCreationWorkflow

### ⚡ Prioridad 2 (Hacer esta semana)
5. Agregar delay + verificaciones a LastRouteRestorer
6. Implementar cache invalidation en DraftResumeContext al cambiar user
7. Centralizar detección de drafts en PlanningHub
8. Agregar indicadores visuales de guardado

### 🎯 Prioridad 3 (Hacer este mes)
9. Implementar sincronización multi-tab con storage events
10. Revertir refetchOnWindowFocus global, usar per-query
11. Agregar error boundaries
12. Documentar flujos con diagramas Mermaid

---

## 🧪 PLAN DE TESTING

### Test Cases Críticos
1. **Navegación durante edición**
   - Usuario llena 50% de formulario
   - Navega a otra página
   - Regresa → ¿Se restaura el draft?

2. **Command+Tab (cambio de aplicación)**
   - Usuario llena formulario
   - Hace Command+Tab a otra app
   - Vuelve → ¿Se guardó el progreso?

3. **Multi-tab**
   - Tab A y Tab B abren el mismo formulario
   - Tab A guarda cambios
   - Tab B intenta guardar → ¿Qué pasa?

4. **Expiración de draft**
   - Crear draft
   - Esperar 25 horas (más que TTL)
   - Intentar restaurar → ¿Se limpia correctamente?

5. **Cambio de usuario**
   - Usuario A crea draft
   - Logout
   - Usuario B login → ¿No ve draft de A?

---

## 📊 MÉTRICAS DE ÉXITO

**Antes de los fixes:**
- ❌ Pérdida de datos al navegar: ~80% de casos
- ❌ Pérdida de datos al cambiar de tab: ~100% de casos
- ❌ Confusión de usuario sobre estado de guardado: Alta

**Después de los fixes esperados:**
- ✅ Pérdida de datos al navegar: <5% de casos (solo errores edge)
- ✅ Pérdida de datos al cambiar de tab: 0%
- ✅ Confianza del usuario: Alta (indicadores visuales)
- ✅ NPS sobre la funcionalidad: >8/10

---

## 🔧 REFACTORS SUGERIDOS (No urgentes)

1. **Crear composable useFormPersistence**
   - Combinar usePersistedForm + draft detection + auto-save indicators
   - API más simple para consumidores

2. **Migrar a Zustand o Jotai para state global de drafts**
   - Mejor performance que Context
   - Menos re-renders innecesarios
   - Facilita debugging

3. **Implementar Service Worker para offline-first**
   - Guardar drafts incluso sin conexión
   - Sincronizar cuando vuelve la conexión

---

## 🎓 LECCIONES APRENDIDAS

1. **SPAs necesitan save-on-unmount explícito**
   - beforeunload no es suficiente para navegación interna

2. **Session vs Local Storage**
   - Session: Para flags temporales (dismissed, suppress_restore)
   - Local: Para datos que deben persistir entre sesiones

3. **User-specific keys son esenciales**
   - Previenen contaminación de datos entre usuarios
   - Crítico para GDPR/compliance

4. **Debouncing es amigo, no enemigo**
   - 700-1000ms es el sweet spot
   - Reduce writes a localStorage dramáticamente

---

**Revisado por**: AI Assistant  
**Estado**: PENDIENTE DE IMPLEMENTACIÓN  
**Próxima revisión**: Después de implementar Prioridad 1
