

# Plan: Rechazo de Documentos por Supply

## Problema

El equipo de supply (ej. Mariana) revisa los documentos subidos por custodios desde el portal, pero solo puede "Verificar" o "Desmarcar". No existe la opcion de **rechazar** un documento indicando el motivo (foto borrosa, documento equivocado, informacion incorrecta), ni forma de que el custodio sepa que debe volver a subir.

## Solucion

Agregar un estado "rechazado" a los documentos del custodio, un boton de rechazo con motivo obligatorio en la interfaz de supply, y un indicador visual en el portal del custodio para que sepa que debe corregir su documento.

## Cambios

### 1. Migracion: Agregar columna `rechazado` y `motivo_rechazo`

Agregar dos columnas a `documentos_custodio`:
- `rechazado` (boolean, default false) - indica si fue rechazado por staff
- `motivo_rechazo` (text, nullable) - razon del rechazo
- `rechazado_por` (uuid, nullable) - quien rechazo
- `fecha_rechazo` (timestamptz, nullable) - cuando se rechazo

Logica: un documento puede estar en 3 estados:
- **Pendiente**: `verificado = false AND rechazado = false`
- **Verificado**: `verificado = true`
- **Rechazado**: `rechazado = true`

Al rechazar, se pone `verificado = false` automaticamente. Al verificar, se limpia `rechazado = false`.

### 2. Hook: Agregar mutacion de rechazo (`useVerifyDocument.ts`)

Agregar `useRejectDocument` al mismo archivo, que:
- Recibe `docId`, `motivo_rechazo` y `rechazadoPor`
- Hace UPDATE: `rechazado = true`, `verificado = false`, `motivo_rechazo`, `rechazado_por`, `fecha_rechazo`
- Invalida el cache de documentos del custodio
- Muestra toast de confirmacion

### 3. UI Supply: Boton "Rechazar" con dialogo de motivo (`DocumentacionTab.tsx`)

En la seccion de documentos del custodio (portal), agregar:
- Boton rojo "Rechazar" junto al boton "Verificar" (solo visible para documentos no verificados y no rechazados)
- Al hacer clic, abre un `AlertDialog` con un textarea para el motivo (obligatorio)
- Opciones rapidas como chips: "Foto ilegible", "Documento incorrecto", "Fecha no visible", "Documento vencido"
- Boton "Confirmar Rechazo"
- Si el documento ya esta rechazado, mostrar badge rojo "Rechazado" con el motivo visible

### 4. UI Custodio: Indicador de rechazo en portal

En `StepDocuments.tsx` y el portal del custodio:
- Si un documento tiene `rechazado = true`, mostrarlo con borde rojo y el motivo del rechazo
- El boton cambia a "Volver a subir" para que el custodio corrija
- Al subir nuevo documento, se limpia el estado de rechazo automaticamente

### 5. Stats: Incluir rechazados en las metricas

Actualizar `useCustodianDocStats` para incluir:
- `rechazados`: documentos con `rechazado = true`
- Mostrar tarjeta adicional en el resumen de DocumentacionTab

## Detalle Tecnico

### Migracion SQL

```sql
ALTER TABLE public.documentos_custodio 
  ADD COLUMN IF NOT EXISTS rechazado boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS motivo_rechazo text,
  ADD COLUMN IF NOT EXISTS rechazado_por uuid,
  ADD COLUMN IF NOT EXISTS fecha_rechazo timestamptz;
```

### Nuevo hook `useRejectDocument`

```ts
export function useRejectDocument(telefono: string | null) {
  return useMutation({
    mutationFn: async ({ docId, motivoRechazo, rechazadoPor }) => {
      await supabase.from('documentos_custodio').update({
        rechazado: true,
        verificado: false,
        motivo_rechazo: motivoRechazo,
        rechazado_por: rechazadoPor,
        fecha_rechazo: new Date().toISOString()
      }).eq('id', docId);
    }
  });
}
```

### Flujo de estados

```text
[Custodio sube doc] --> Pendiente
     |
     +--> [Supply verifica] --> Verificado
     |
     +--> [Supply rechaza + motivo] --> Rechazado
              |
              +--> [Custodio ve motivo, sube nuevo] --> Pendiente (ciclo)
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Agregar columnas rechazado, motivo_rechazo, rechazado_por, fecha_rechazo |
| `src/pages/PerfilesOperativos/hooks/useVerifyDocument.ts` | Agregar `useRejectDocument`, limpiar rechazo al verificar |
| `src/pages/PerfilesOperativos/components/tabs/DocumentacionTab.tsx` | Boton rechazar con dialog de motivo, badges de estado, chips rapidos |
| `src/pages/PerfilesOperativos/hooks/useCustodianDocsForProfile.ts` | Agregar `rechazados` a stats |
| `src/components/custodian/checklist/StepDocuments.tsx` | Mostrar motivo de rechazo y boton "Volver a subir" |

