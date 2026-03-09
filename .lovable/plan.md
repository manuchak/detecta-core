

# Acta de Entrega de Turno — Firma Digital + PDF + Guardián de Servicios Huérfanos

## Observación del usuario

Correcto: el plan original no incluía firma digital en el flujo de entrega de turno. Actualmente el handoff tiene 3 pasos (Contexto → Entrantes → Confirmar) y al confirmar solo inserta un registro JSON en `bitacora_entregas_turno`. No hay firma ni PDF.

## Plan actualizado

### 1. Firma digital en el paso de confirmación

**`ShiftHandoffDialog.tsx`** — Agregar un 4to paso "Firma" (o integrar en el paso Confirmar):
- Importar el `SignaturePad` existente (`@/components/custodian/checklist/SignaturePad`)
- Agregar estado `firmaEntrega: string | null`
- El botón "Entregar Turno" requiere firma (`disabled` si `!firmaEntrega`)
- Pasar la firma como parte del payload al `executeHandoff`

**`useShiftHandoff.ts`** — Agregar `firma_data_url` al `HandoffPayload` y guardarlo en `bitacora_entregas_turno`.

**Migración SQL** — Agregar columna `firma_data_url text` a `bitacora_entregas_turno`.

### 2. PDF del Acta de Entrega

**Nuevo: `src/components/monitoring/bitacora/pdf/HandoffActaPDF.tsx`**

Documento `@react-pdf/renderer` usando el design system existente:
- `ReportPage` + `ReportHeader` con título "Acta de Entrega de Turno"
- `SectionHeader` + `FieldRow` para datos generales (fecha, turno saliente/entrante, monitoristas)
- `DataTable` para servicios transferidos y servicios cerrados
- `DataTable` para incidentes abiertos heredados
- Notas generales
- Declaración normativa fija de aceptación y compromiso
- `SignatureBlock` con la firma capturada, email y timestamp

**`ShiftHandoffDialog.tsx`** — En `onSuccess` del handoff, generar y descargar el PDF automáticamente con `@react-pdf/renderer`'s `pdf().toBlob()`.

### 3. Guardián de servicios huérfanos + Tabla de anomalías

**Migración SQL** — Crear tabla `bitacora_anomalias_turno`:
```sql
create table public.bitacora_anomalias_turno (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  descripcion text,
  servicio_id text,
  monitorista_original text,
  monitorista_reasignado text,
  ejecutado_por uuid references auth.users(id),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);
```

**`CoordinatorCommandCenter.tsx`** — Consolidar en un único "OrphanGuard" `useEffect`:
1. Servicios pendientes a ≤2h → auto-asignar (ya existe)
2. Servicios activos sin asignación → auto-asignar inmediatamente
3. Servicios de monitorista offline (`!en_turno`) → reasignar round-robin + insertar anomalía en `bitacora_anomalias_turno`

**Nuevo: `AnomaliasBadge.tsx`** — Badge en la barra de alertas del coordinador mostrando anomalías del día.

### Archivos a modificar/crear

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Agregar `firma_data_url` a `bitacora_entregas_turno` + crear `bitacora_anomalias_turno` |
| `ShiftHandoffDialog.tsx` | Agregar `SignaturePad` al paso de confirmación, requerir firma, descargar PDF en onSuccess |
| `useShiftHandoff.ts` | Agregar `firma_data_url` al payload e insertarlo en la tabla |
| `bitacora/pdf/HandoffActaPDF.tsx` | **Nuevo** — PDF formal del acta usando design system |
| `CoordinatorCommandCenter.tsx` | Consolidar OrphanGuard con reasignación + log de anomalías |
| `coordinator/AnomaliasBadge.tsx` | **Nuevo** — Badge de anomalías recientes |

