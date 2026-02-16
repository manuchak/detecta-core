
# Cerrar incidente desde la lista principal (con control de rol)

## Resumen

Agregar un boton "Cerrar" directamente en cada tarjeta de la lista de incidentes (IncidentListPanel), visible solo para roles autorizados (coordinador_operaciones, admin, owner). Al hacer clic se muestra un AlertDialog de confirmacion antes de ejecutar el cierre.

## Cambios

### 1. `src/components/monitoring/incidents/IncidentListPanel.tsx`

- Importar `useUpdateIncidente` del hook existente
- Importar `useAuth` para obtener el `userRole` del usuario actual
- Importar `AlertDialog` de Radix para confirmacion
- Importar iconos `Lock` y `XCircle` de lucide
- Definir constante local con roles autorizados para cerrar: `['admin', 'owner', 'coordinador_operaciones']`
- En cada fila de incidente cuyo estado NO sea `cerrado`:
  - Si el usuario tiene rol autorizado, renderizar un boton icono "Cerrar" (XCircle) al final de la fila
  - El boton abre un AlertDialog: "Confirmar cierre de incidente - Esta accion cambiara el estado a cerrado y registrara la fecha de resolucion. No se puede revertir."
  - Al confirmar, llamar `updateIncidente.mutateAsync({ id, estado: 'cerrado', fecha_resolucion: new Date().toISOString() })`
  - Mostrar toast de exito/error
- El boton debe usar `e.stopPropagation()` para no disparar el `handleEdit` del row

### 2. `src/components/monitoring/incidents/IncidentReportForm.tsx`

- Aplicar la misma restriccion de rol al boton "Cerrar incidente" existente dentro del formulario
- Importar `useAuth` y verificar que el rol este en la lista autorizada antes de renderizar el boton

## Roles autorizados para cerrar

- `admin`
- `owner`
- `coordinador_operaciones`

Estos roles ya estan definidos como roles de alta autoridad en `accessControl.ts`. Se usara una constante local en el componente para mantener la logica clara y no contaminar el archivo central con una constante muy especifica.

## Flujo del usuario

1. Ve la lista de incidentes
2. En incidentes no cerrados, aparece un boton con icono X (solo si tiene rol autorizado)
3. Hace clic, se abre dialogo de confirmacion
4. Confirma: el incidente pasa a estado "cerrado" con fecha de resolucion = ahora
5. La lista se refresca automaticamente (invalidateQueries ya configurado en useUpdateIncidente)
