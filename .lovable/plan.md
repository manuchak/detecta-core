

# Fix: Nombres de monitoristas + Firma del entrante

## Problemas identificados

### 1. Nombres aparecen como UUIDs
La tabla `profiles` tiene RLS que solo permite a cada usuario ver **su propio** perfil (`profiles_users_view_own: id = auth.uid()`). No hay política para que monitoristas vean los perfiles de otros monitoristas. El hook `useMonitoristaAssignment` hace fallback a `user_id.slice(0, 8)` cuando no obtiene el `display_name`.

### 2. Solo firma el monitorista saliente
Actualmente hay un único `SignaturePad` en el paso de confirmación. El entrante también debe firmar para aceptar la recepción de servicios.

## Solución

### Migración SQL — Política de lectura en `profiles`
Permitir que usuarios con rol de monitoreo lean los perfiles de otros usuarios de monitoreo:

```sql
CREATE POLICY "monitoring_read_monitoring_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_monitoring_role()
  AND id IN (
    SELECT user_id FROM user_roles 
    WHERE role IN ('monitoring', 'monitoring_supervisor', 'coordinador_operaciones')
  )
);
```

> Nota: Usaremos una función `SECURITY DEFINER` para evitar recursión RLS en `user_roles`.

### `ShiftHandoffDialog.tsx` — Doble firma
- Agregar estado `firmaEntrante: string | null`
- En el paso 2 (Confirmar y Firmar), mostrar dos `SignaturePad`:
  - **Firma del saliente** (ya existe) con label "Firma del monitorista saliente"
  - **Firma del entrante** (nuevo) con label "Firma del monitorista entrante"
- El botón "Entregar Turno" requiere **ambas** firmas
- Pasar ambas firmas al payload y al PDF

### `useShiftHandoff.ts` — Persistir firma entrante
- Agregar `firma_entrante_data_url` al payload
- Guardar en `bitacora_entregas_turno`

### `HandoffActaPDF.tsx` — Mostrar ambas firmas
- Agregar bloque de firma del entrante junto a la del saliente

### Migración SQL adicional
- Agregar columna `firma_entrante_data_url text` a `bitacora_entregas_turno`

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Política RLS en `profiles` para monitoreo + columna `firma_entrante_data_url` |
| `ShiftHandoffDialog.tsx` | Doble `SignaturePad` (saliente + entrante), requiere ambas |
| `useShiftHandoff.ts` | Agregar `firma_entrante_data_url` al payload |
| `HandoffActaPDF.tsx` | Mostrar ambas firmas en el PDF |

