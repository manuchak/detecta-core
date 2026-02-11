

## Plan: Actualizar límite del bucket lms-media a 150MB

### Problema
El frontend ya permite archivos de hasta 150MB, pero el bucket `lms-media` en Supabase tiene un limite de 100MB (104,857,600 bytes). El video de 111MB es rechazado a nivel de storage.

### Solucion
Un solo cambio: actualizar el `file_size_limit` del bucket `lms-media` en la base de datos de produccion.

### Cambio necesario

**Migracion SQL** que ejecute:

```sql
UPDATE storage.buckets 
SET file_size_limit = 157286400  -- 150MB en bytes
WHERE id = 'lms-media';
```

157,286,400 = 150 * 1024 * 1024

### Resumen

| Que | Antes | Despues |
|---|---|---|
| Bucket `lms-media` file_size_limit | 100MB | 150MB |

Un solo cambio en una migracion SQL. El frontend ya esta configurado correctamente en 150MB.

