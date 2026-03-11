

# Bug: Evaluación Midot de Sergio Zuñiga no se guarda

## Causa raíz

El formulario `MidotResultForm.tsx` tiene un **fallo silencioso** en la subida del PDF (líneas 64-67). Cuando el upload a Supabase Storage falla, el código simplemente hace `return` sin mostrar ningún mensaje al usuario:

```typescript
if (uploadError) {
  setUploading(false);
  return; // ← Fallo silencioso: no hay toast ni feedback
}
```

Esto hace que al presionar "Guardar Evaluación", el botón vuelve a su estado normal como si nada hubiera pasado, sin registrar la evaluación ni informar del error.

Adicionalmente, el PDF se marca como **obligatorio** para evaluaciones nuevas (`disabled={isSubmitting || !pdfReady}`), lo que significa que si el upload falla, toda la operación se aborta silenciosamente.

## Corrección

### Archivo: `src/components/recruitment/midot/MidotResultForm.tsx`

1. **Agregar toast de error** cuando la subida del PDF falla (línea 64-67):
   ```typescript
   if (uploadError) {
     setUploading(false);
     toast({ title: 'Error', description: 'No se pudo subir el PDF: ' + uploadError.message, variant: 'destructive' });
     return;
   }
   ```

2. **Agregar toast de error** en el catch general (línea 100-103) como respaldo:
   ```typescript
   } catch (error: any) {
     setUploading(false);
     console.error('Error saving midot:', error);
   }
   ```

Esto hará visible el error real (probablemente un problema de permisos en el bucket de storage o path inválido) y permitirá diagnosticar y resolver el bloqueo específico.

### Archivos impactados

| Archivo | Cambio |
|---|---|
| `src/components/recruitment/midot/MidotResultForm.tsx` | Agregar feedback de error en upload fallido |

