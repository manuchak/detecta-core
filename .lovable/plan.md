
# Plan: Corrección de Race Condition en Persistencia de Servicios

## Diagnóstico del Bug (Análisis como CTO)

### Síntomas Reportados
1. **Referencia Cliente (id_interno_cliente) se borra** al guardar como pendiente
2. **Horario del servicio se modifica** al editar la referencia

### Causa Raíz Identificada

El bug es un **Race Condition en la Hidratación de Estado** entre dos sistemas:

```text
┌────────────────────────────────────────────────────────────────┐
│  TIMELINE DEL BUG                                              │
├────────────────────────────────────────────────────────────────┤
│  T0: Usuario navega a ServiceStep                              │
│  T1: useServiceStepLogic se monta                              │
│      → useState(() => formData.idInterno || '')                │
│      → idInterno = '' (porque formData aún no tiene el draft)  │
│                                                                │
│  T2: useServiceCreation hidrata el draft desde localStorage    │
│      → setFormData(draftConIdInterno)                          │
│      → formData ahora tiene idInterno: "OT-2026-001234"        │
│                                                                │
│  T3: useServiceStepLogic useEffect se ejecuta                  │
│      → updateFormData({ idInterno: '', fecha: '2026-02-01' })  │
│      → ¡SOBRESCRIBE los valores del draft!                     │
│                                                                │
│  RESULTADO: id_interno_cliente = '' y fecha = HOY              │
└────────────────────────────────────────────────────────────────┘
```

### Archivos Involucrados

| Archivo | Problema |
|---------|----------|
| `useServiceCreation.tsx` | Hidratación asíncrona con `requestAnimationFrame` |
| `useServiceStepLogic.ts` | `useState` se inicializa ANTES de que el draft esté disponible |
| `useServiceStepLogic.ts` | `useEffect` sincroniza valores vacíos de vuelta al contexto |

---

## Solución Técnica

### Estrategia: "Hydration-Safe State Initialization"

En lugar de inicializar estados locales que compitan con la hidratación, el hook debe:
1. **Esperar** a que `isHydrated` sea `true` antes de inicializar valores
2. **Re-sincronizar** cuando `formData` cambie externamente (desde el draft)
3. **No sobrescribir** el contexto con valores default

### Cambios Requeridos

#### 1. Modificar `useServiceStepLogic.ts` - Inicialización Condicional

Agregar un guard que espere la hidratación antes de usar valores del formData:

```typescript
export function useServiceStepLogic() {
  const { formData, updateFormData, isHydrated } = useServiceCreation();
  
  // Track if we've synced from hydrated formData
  const [hasInitializedFromHydration, setHasInitializedFromHydration] = useState(false);
  
  // Initialize with empty/default values initially
  const [idInterno, setIdInterno] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  // ... otros estados
  
  // NUEVO: Sincronizar DESDE formData cuando la hidratación complete
  useEffect(() => {
    if (isHydrated && !hasInitializedFromHydration) {
      // Ahora es seguro leer del formData hidratado
      setIdInterno(formData.idInterno || '');
      setFecha(formData.fecha || format(new Date(), 'yyyy-MM-dd'));
      setHora(formData.hora || '');
      // ... otros campos
      
      setHasInitializedFromHydration(true);
    }
  }, [isHydrated, hasInitializedFromHydration, formData]);
  
  // MODIFICAR: Solo sincronizar HACIA formData después de la inicialización
  useEffect(() => {
    if (!hasInitializedFromHydration) return; // Guard crítico
    
    updateFormData({
      idInterno,
      fecha,
      hora,
      // ...
    });
  }, [/* dependencias */, hasInitializedFromHydration]);
}
```

#### 2. Exportar `isHydrated` desde `useServiceCreation`

Ya está exportado (línea 86, 451), pero verificar que se usa correctamente.

#### 3. Agregar Logging de Debug Temporal

Para validar la corrección durante QA:

```typescript
useEffect(() => {
  console.log('[ServiceStepLogic] Hydration state:', {
    isHydrated,
    hasInitializedFromHydration,
    formData_idInterno: formData.idInterno,
    local_idInterno: idInterno,
  });
}, [isHydrated, hasInitializedFromHydration, formData.idInterno, idInterno]);
```

---

## Cambios Adicionales (Bug del Horario en Edición)

### Problema Secundario: Modal de Edición

En `EditServiceForm.tsx`, cuando el usuario edita SOLO la referencia, el formulario envía TODOS los campos al guardar, incluyendo `fecha_hora_cita` que podría haber sido transformado por las funciones de timezone.

#### Solución: Enviar Solo Campos Modificados

```typescript
// En handleSave de EditServiceForm.tsx
const handleSave = async () => {
  // ... validaciones existentes
  
  // NUEVO: Calcular solo los campos que realmente cambiaron
  const changedFields: Partial<EditableService> = {};
  
  Object.keys(formData).forEach(key => {
    const k = key as keyof EditableService;
    if (formData[k] !== service[k]) {
      changedFields[k] = formData[k];
    }
  });
  
  // Solo enviar campos modificados
  await onSave(service.id, changedFields);
};
```

---

## Archivos a Modificar

| Archivo | Tipo de Cambio |
|---------|----------------|
| `src/pages/Planeacion/ServiceCreation/steps/ServiceStep/hooks/useServiceStepLogic.ts` | Refactorizar inicialización de estados |
| `src/components/planeacion/EditServiceForm.tsx` | Enviar solo campos modificados en handleSave |

---

## Validación Post-Implementación

### Escenarios de Test

1. **Crear servicio con referencia cliente**
   - Ingresar referencia "OT-2026-001234"
   - Guardar como pendiente
   - Verificar que la referencia persiste en la DB

2. **Editar servicio - solo referencia**
   - Abrir modal de edición
   - Modificar SOLO la referencia cliente
   - Guardar
   - Verificar que el horario NO cambió

3. **Draft con referencia**
   - Crear servicio parcial con referencia
   - Navegar fuera y volver
   - Verificar que la referencia se restaura del draft

4. **Race condition check**
   - Abrir servicio con draft guardado
   - Verificar en consola que la hidratación completa ANTES de la sincronización

---

## Impacto y Riesgos

| Aspecto | Evaluación |
|---------|------------|
| **Complejidad** | Media - Requiere entender el flujo de hidratación |
| **Riesgo de Regresión** | Bajo - Cambios aislados en lógica de inicialización |
| **Tiempo Estimado** | 2-3 horas de desarrollo + 1 hora de QA |
| **Dependencias** | Ninguna - Cambios internos al workflow de planeación |
