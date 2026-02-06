

# Plan: Debugging y Acceso a Documentos de Custodio

## Diagnóstico

Hay dos rutas para subir documentos, y puede haber confusión sobre cuál usar:

| Ruta | Componente | ¿Requiere servicio? | Estado |
|------|------------|---------------------|--------|
| `/custodian/onboarding` | DocumentUploadStep | ❌ No | Debería funcionar |
| `/custodian/checklist/{id}` | StepDocuments + DocumentCard | ✅ Sí | Recién arreglado |

**Problema identificado**: Después del onboarding inicial, no hay acceso visible para actualizar documentos desde el dashboard. Solo se puede cuando vencen.

## Solución Propuesta

### 1. Agregar Logging de Debug en DocumentUploadStep

Para confirmar que el flujo de onboarding funciona correctamente:

```typescript
// src/components/custodian/onboarding/DocumentUploadStep.tsx

const handleSubmit = async () => {
  console.log('[DocumentUploadStep] Submit iniciado:', {
    hasFile: !!file,
    fileName: file?.name,
    fileSize: file?.size,
    fechaVigencia,
    tipoDocumento
  });
  
  if (!file || !fechaVigencia) {
    console.warn('[DocumentUploadStep] Faltan datos');
    return;
  }
  
  // ... resto del código
};
```

### 2. Agregar Toast de Feedback Inmediato

Para que el usuario vea que el flujo está ejecutándose:

```typescript
// Al inicio de handleSubmit
toast.info('Procesando documento...', { duration: 2000 });
```

### 3. Agregar Acceso a Documentos desde Dashboard (Nueva funcionalidad)

Crear un botón en el dashboard que permita al custodio ver/actualizar sus documentos en cualquier momento:

```typescript
// En QuickActionsGrid.tsx o MobileDashboardLayout.tsx
<Button onClick={() => navigate('/custodian/onboarding')}>
  <FileText className="w-4 h-4 mr-2" />
  Mis Documentos
</Button>
```

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Agregar logs y toasts de debug | Alta |
| `src/pages/custodian/CustodianOnboarding.tsx` | Agregar log al montar | Alta |
| `src/components/custodian/QuickActionsGrid.tsx` | Agregar botón "Mis Documentos" | Media |

## Prueba Recomendada

Para probar el flujo que NO requiere servicio:

1. Navega directamente a **`/custodian/onboarding`**
2. Toma foto de la licencia
3. Selecciona fecha de vigencia
4. Click en "Guardar documento"
5. Verificar en consola los logs `[DocumentUploadStep]`

## Verificación en Base de Datos

Después de probar, ejecutar:
```sql
SELECT * FROM documentos_custodio 
WHERE custodio_telefono LIKE '%551809%'
ORDER BY updated_at DESC;
```

