

## Plan: Corregir mapeo de tipo_indisponibilidad en modales de asignacion

### Causa raiz

La UI (`ReportUnavailabilityCard`) envia `emergencia_familiar` como valor de `tipo`, pero la tabla `custodio_indisponibilidades` tiene un CHECK constraint que solo acepta: `falla_mecanica`, `enfermedad`, `familiar`, `personal`, `mantenimiento`, `capacitacion`, `otro`.

El flujo de **creacion de servicio** (CustodianStep) ya tiene un mapeo correcto:
```
'emergencia_familiar' -> 'familiar'
```

Pero los modales **PendingAssignmentModal** y **ReassignmentModal** pasan `data.tipo` directamente sin mapear, lo que causa el error de CHECK constraint cuando el planificador selecciona "Emergencia familiar".

### Solucion

Agregar el mismo mapeo de tipos que ya existe en CustodianStep a los dos modales afectados.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/planeacion/PendingAssignmentModal.tsx` (~linea 236-254) | Agregar mapeo de `emergencia_familiar` a `familiar` antes del insert |
| `src/components/planeacion/ReassignmentModal.tsx` (~linea 253-271) | Agregar mapeo identico |

### Detalle del cambio (identico en ambos archivos)

Agregar antes del insert:
```typescript
// Map UI types to DB-compatible values
const tipoMapping: Record<string, string> = {
  'emergencia_familiar': 'familiar',
  'falla_mecanica': 'falla_mecanica',
  'enfermedad': 'enfermedad',
  'capacitacion': 'capacitacion',
  'otro': 'otro',
};
const tipoDb = tipoMapping[data.tipo] || 'otro';
const motivoDb = data.motivo?.trim() || tipoDb;
```

Y cambiar en el insert:
```typescript
tipo_indisponibilidad: tipoDb,  // en vez de data.tipo
motivo: motivoDb,               // en vez de data.motivo || 'Sin especificar'
```

### Verificacion de acceso por rol

- **RLS**: La politica `usuarios_autenticados_pueden_insertar_indisponibilidad` permite INSERT a cualquier usuario autenticado (with_check: true). Planificadores y coordinadores estan cubiertos.
- **Columnas**: El fix anterior ya corrigio los nombres de columna. Este cambio solo agrega el mapeo de valores faltante.
- **CustodianStep**: Ya funciona correctamente con el mapeo existente.

### Resumen del estado por punto de entrada

| Punto de entrada | Mapeo de tipo | Columnas correctas | Estado |
|---|---|---|---|
| Crear servicio (CustodianStep) | Ya tiene mapeo | Ya correctas | Funciona |
| Asignacion pendiente (PendingAssignmentModal) | Falta mapeo | Corregidas en commit anterior | Este fix |
| Reasignacion (ReassignmentModal) | Falta mapeo | Corregidas en commit anterior | Este fix |
