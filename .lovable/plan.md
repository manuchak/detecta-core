
## Plan: Aumentar limite de video a 150MB

### Cambios necesarios

Hay **2 puntos** donde se debe actualizar el limite:

#### 1. Frontend - MediaUploader (limite visual y validacion)

**Archivo:** `src/components/lms/admin/wizard/MediaUploader.tsx` (linea 25)

Cambiar el maxSize de video de 100MB a 150MB:

```
// Antes:
maxSize: 100 * 1024 * 1024, // 100MB

// Despues:
maxSize: 150 * 1024 * 1024, // 150MB
```

Esto actualiza tanto la validacion del archivo como el texto mostrado en la UI ("Max 150MB").

#### 2. Supabase Storage - Limite del bucket

**Archivo:** `supabase/config.toml` (linea 30)

El limite actual del storage es `50MiB`, que bloquea cualquier archivo mayor a 50MB a nivel de servidor. Se debe aumentar a 150MB:

```
// Antes:
file_size_limit = "50MiB"

// Despues:
file_size_limit = "150MiB"
```

### Resumen

| Archivo | Cambio |
|---|---|
| `src/components/lms/admin/wizard/MediaUploader.tsx` | maxSize: 100MB a 150MB |
| `supabase/config.toml` | file_size_limit: 50MiB a 150MiB |

Dos cambios simples y el video de 111MB podra subirse sin problema.
