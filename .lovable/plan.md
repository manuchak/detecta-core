

## Fix: Documentos del portal custodio no aparecen en perfil operativo

### Causa raiz

Se encontraron **2 bugs** que impiden que los documentos subidos por custodios en el portal se muestren en el perfil operativo:

---

### Bug 1: Phone format mismatch (bloqueante)

Los telefonos se almacenan con formatos distintos en cada tabla:

| Tabla | Campo | Valor Alvaro Toriz |
|---|---|---|
| `custodios_operativos` | `telefono` | `5578774920` (sin espacios) |
| `documentos_custodio` | `custodio_telefono` | `55 7877 4920` (con espacios) |

Esto es sistematico - todos los registros en `documentos_custodio` tienen espacios, y todos en `custodios_operativos` no los tienen. La query actual usa `.eq()` (match exacto), por lo que **nunca encuentra documentos**.

**Fix**: Normalizar el telefono antes de la query. Crear una funcion helper que elimine espacios, guiones y prefijos (+52) para hacer la comparacion. Como no podemos modificar los datos existentes en ambas tablas, la solucion mas segura es hacer la normalizacion en la query del lado cliente usando un approach de "traer por patron":

Reemplazar `.eq('custodio_telefono', telefono)` por una query que normalice ambos lados. Dado que Supabase no soporta `replace()` directo en filtros, la solucion optima es normalizar el telefono de entrada para matchear el formato de la tabla destino, o usar un RPC.

La solucion mas pragmatica: normalizar el telefono del perfil operativo al formato que usa `documentos_custodio`. Pero como los formatos varian (hay con +52, sin +52, con espacios), lo mas robusto es extraer solo digitos y comparar los ultimos 10.

**Implementacion**: Usar `.ilike()` con un patron que matchee los ultimos 10 digitos, o crear un RPC que normalice.

Solucion elegida: Extraer los ultimos 10 digitos del telefono del perfil y buscar con un patron flexible usando una funcion RPC simple, o alternativamente hacer una query que traiga todos los docs y filtre en cliente (dado que el volumen por custodio es bajo).

La solucion mas limpia y sin necesidad de RPC: normalizar en el hook eliminando caracteres no numericos y buscando con los ultimos 10 digitos via `.like()`:

```typescript
// Normalizar: "5578774920" -> "%5578774920"  
// Matchea contra: "55 7877 4920" porque Supabase like no ignora espacios

// Mejor approach: traer TODOS los docs cuyo telefono normalizado coincida
// Usar .or() con multiples formatos o un filtro post-fetch
```

Dado las limitaciones de PostgREST, la solucion mas robusta es un **RPC** que compare telefonos normalizados:

```sql
CREATE OR REPLACE FUNCTION get_documentos_custodio_by_phone(p_telefono text)
RETURNS SETOF documentos_custodio
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM documentos_custodio
  WHERE regexp_replace(custodio_telefono, '[^0-9]', '', 'g') 
    LIKE '%' || RIGHT(regexp_replace(p_telefono, '[^0-9]', '', 'g'), 10)
  ORDER BY updated_at DESC;
$$;
```

---

### Bug 2: Column name mismatch (documentos no se visualizan)

La interfaz TypeScript `CustodianDocument` define `archivo_url`, pero la columna real en la tabla es `foto_url`:

| Interfaz (codigo) | Tabla real (DB) |
|---|---|
| `archivo_url` | `foto_url` |
| `fecha_vencimiento` | `fecha_vigencia` |

El `select('*')` trae los datos correctos del DB, pero al castear como `CustodianDocument`, el codigo accede a `doc.archivo_url` que no existe en el objeto, resultando en `undefined`. El enlace "Ver documento" nunca aparece.

**Fix**: Corregir la interfaz `CustodianDocument` para reflejar los nombres reales de las columnas, y actualizar las referencias en `DocumentacionTab.tsx`.

---

### Cambios por archivo

| Archivo | Cambio |
|---|---|
| `src/pages/PerfilesOperativos/hooks/useCustodianDocsForProfile.ts` | (1) Corregir interfaz: `archivo_url` a `foto_url`, `fecha_vencimiento` a `fecha_vigencia`. (2) Reemplazar query `.eq()` por llamada RPC con normalizacion de telefono. |
| `src/pages/PerfilesOperativos/components/tabs/DocumentacionTab.tsx` | Actualizar referencias de `doc.archivo_url` a `doc.foto_url` y `doc.fecha_vencimiento` a `doc.fecha_vigencia` en lineas 192, 211, 221. |
| SQL Migration | Crear funcion RPC `get_documentos_custodio_by_phone` que normalice telefonos antes de comparar. |

### Detalle tecnico

**1. Corregir interfaz y query en `useCustodianDocsForProfile.ts`**:

```typescript
export interface CustodianDocument {
  id: string;
  custodio_telefono: string;
  tipo_documento: string;
  numero_documento: string | null;
  fecha_emision: string | null;
  fecha_vigencia: string | null;  // era "fecha_vencimiento"
  foto_url: string | null;        // era "archivo_url"
  verificado: boolean;
  verificado_por: string | null;
  fecha_verificacion: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export function useCustodianDocsForProfile(telefono: string | null) {
  return useQuery({
    queryKey: ['custodian-docs-profile', telefono],
    queryFn: async () => {
      if (!telefono) return [];
      
      const { data, error } = await supabase
        .rpc('get_documentos_custodio_by_phone', { p_telefono: telefono });
      
      if (error) {
        console.error('Error fetching custodian documents:', error);
        return [];
      }
      
      return data as CustodianDocument[];
    },
    enabled: !!telefono,
    refetchOnWindowFocus: false
  });
}
```

**2. Actualizar `DocumentacionTab.tsx`** - cambiar todas las referencias:
- `doc.archivo_url` -> `doc.foto_url` (lineas 221, 222)
- `doc.fecha_vencimiento` -> `doc.fecha_vigencia` (lineas 192, 211 y en el hook de stats)

**3. SQL Migration** - Crear RPC:

```sql
CREATE OR REPLACE FUNCTION get_documentos_custodio_by_phone(p_telefono text)
RETURNS SETOF documentos_custodio
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT * FROM documentos_custodio
  WHERE regexp_replace(custodio_telefono, '[^0-9]', '', 'g') 
    LIKE '%' || RIGHT(regexp_replace(p_telefono, '[^0-9]', '', 'g'), 10)
  ORDER BY updated_at DESC;
$$;
```

**4. Actualizar stats hook** - El calculo de `porVencer` en `useCustodianDocStats` tambien usa `fecha_vencimiento`, debe cambiar a `fecha_vigencia`.

### Impacto

Despues de estos cambios:
- Los 3 documentos de Alvaro Toriz (licencia, tarjeta circulacion, poliza) apareceran en su perfil
- Los enlaces para ver/descargar documentos funcionaran correctamente
- La normalizacion de telefono cubrira todos los formatos existentes (+52, con espacios, sin espacios)
- No se requieren cambios en el portal custodio ni en los modales de asignacion

