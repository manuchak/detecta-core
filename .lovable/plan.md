

# Fix: Crear bucket "comprobantes-gastos" en Supabase Storage

## Problema
El hook `useCustodianExpenses.ts` sube fotos de comprobantes al bucket `comprobantes-gastos`, pero este bucket no existe en Supabase Storage, causando "Error: Bucket not found".

## Solución
Crear una migración SQL que:
1. Cree el bucket `comprobantes-gastos` como **público** (para usar `getPublicUrl`)
2. Agregue políticas RLS para que usuarios autenticados puedan subir archivos a su propia carpeta (`userId/...`) y leer cualquier archivo público

| Archivo | Cambio |
|---------|--------|
| Nueva migración SQL | `INSERT INTO storage.buckets` + políticas RLS para upload/select |

