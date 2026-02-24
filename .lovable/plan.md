

# Fix: Habilitar PDF de Incidentes para Monitoristas

## Diagnostico

La funcionalidad de crear incidentes y descargar PDFs **ya existe** en la interfaz. Los monitoristas (role `monitoring`) tienen acceso completo:

- **RLS**: La funcion `es_staff_incidentes()` incluye el rol `monitoring` -- pueden leer, crear, actualizar y eliminar incidentes y cronologia.
- **UI**: El boton "Nuevo Reporte" y el icono de descarga PDF estan disponibles sin restriccion de rol.

### Bug encontrado: Tabla incorrecta en la descarga PDF desde la lista

En `IncidentListPanel.tsx` linea 74, el codigo que descarga el PDF desde la lista de incidentes consulta una tabla que **no existe**:

```text
INCORRECTO:  supabase.from('incidentes_cronologia')   <-- tabla inexistente (plural)
CORRECTO:    supabase.from('incidente_cronologia')     <-- tabla real (singular)
```

Esto causa que el PDF se genere con **cronologia vacia** (0 entradas en la timeline), porque la query falla silenciosamente o retorna datos vacios.

Nota: Dentro del formulario de edicion (`IncidentReportForm.tsx`), el PDF funciona correctamente porque usa el hook `useIncidenteCronologia` que apunta a la tabla correcta.

## Cambio requerido

### Archivo: `src/components/monitoring/incidents/IncidentListPanel.tsx`

Linea 74: Corregir el nombre de la tabla de `'incidentes_cronologia'` a `'incidente_cronologia'`.

```typescript
// ANTES
const { data: cronologia } = await supabase
  .from('incidentes_cronologia')   // BUG: tabla inexistente
  .select('*')
  .eq('incidente_id', inc.id)
  .order('timestamp', { ascending: true });

// DESPUES
const { data: cronologia } = await supabase
  .from('incidente_cronologia')    // CORRECTO: tabla real
  .select('*')
  .eq('incidente_id', inc.id)
  .order('timestamp', { ascending: true });
```

## Resultado esperado

- Los monitoristas podran descargar PDFs completos (con cronologia, evidencias fotograficas y firmas) directamente desde el icono de descarga en la lista de incidentes.
- La creacion de incidentes ya funciona correctamente y no requiere cambios.
