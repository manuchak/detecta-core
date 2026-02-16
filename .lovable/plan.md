
# Analisis de Persistencia - Formulario de Reporte de Incidentes

## Estado Actual

El formulario ya implementa `useFormPersistence` con nivel **robust**, lo cual cubre:

- Backup dual (localStorage + sessionStorage)
- TTL de 72 horas
- Debounce de 300ms
- URL params con draft ID (`?draft=xxx`)
- `DraftRestoreBanner` + `DraftIndicator` en header
- Guardado en `beforeunload` y `visibilitychange`
- Verificacion `isMeaningful` (requiere tipo o descripcion)
- Preview text para el prompt de restauracion

## Brechas Detectadas

### 1. Cronologia local: persistencia fragil (CRITICO)
Las entradas de cronologia locales se guardan en `localStorage` manualmente (lineas 146-164), pero:
- **Sin backup en sessionStorage** (a diferencia del formulario principal que usa backup dual)
- **Sin TTL ni limpieza automatica** - se quedan para siempre si no se limpian
- **Los archivos de imagen (`imagenFile`) no se serializan** - `JSON.stringify(File)` produce `{}`, asi que las fotos adjuntas se pierden al recargar
- **Las URLs de preview (`imagenPreview`) son blob URLs** que se invalidan al recargar la pagina

### 2. Estado del servicio vinculado no persistido (ALTO)
- `idServicioInput` (el texto del input de busqueda) se pierde al recargar
- El objeto `servicio` (resultado de la busqueda) no se persiste - el usuario debe buscar de nuevo
- Esto afecta campos auto-rellenados como `cliente_nombre` y `zona`

### 3. Sin dialogo de confirmacion al salir (MEDIO)
- El boton "Atras" (`onBack`) no verifica si hay cambios sin guardar
- El usuario puede perder datos haciendo click en la flecha de retroceso sin darse cuenta
- `confirmDiscard` existe en el hook pero no se usa

### 4. Memory leak de blob URLs (BAJO)
- Las `imagenPreview` creadas con `URL.createObjectURL` en las entradas locales nunca se revocan al desmontar el componente o al descartar

## Plan de Correccion

### Archivo: `src/components/monitoring/incidents/IncidentReportForm.tsx`

**Correccion 1 - Persistir idServicioInput en el formulario:**
- Agregar `idServicioInput` como campo dentro de `ExtendedFormData` (ya existe `id_servicio_texto` pero el input visual no se sincroniza)
- Sincronizar `idServicioInput` con `form.setValue` para que se persista automaticamente

**Correccion 2 - Backup dual para cronologia local:**
- Agregar guardado en `sessionStorage` para las entradas de cronologia, replicando el patron del hook principal
- Agregar TTL de 72h alineado con el formulario
- Al serializar, omitir `imagenFile` y `imagenPreview` (no serializables), pero preservar la descripcion y metadata

**Correccion 3 - Confirmacion al salir:**
- Envolver `onBack` con una verificacion: si `hasDraft` o `hasUnsavedChanges` o `localTimelineEntries.length > 0`, mostrar dialogo de confirmacion antes de navegar

**Correccion 4 - Limpieza de blob URLs:**
- Agregar `useEffect` de cleanup que revoque todas las `imagenPreview` blob URLs al desmontar

### Resumen de cambios

| Brecha | Severidad | Archivo | Cambio |
|---|---|---|---|
| Cronologia sin backup dual | Critico | IncidentReportForm.tsx | Agregar sessionStorage + TTL |
| Imagenes no serializables | Critico | IncidentReportForm.tsx | Omitir File/blob al serializar, advertir al restaurar |
| Servicio no persistido | Alto | IncidentReportForm.tsx | Sincronizar idServicioInput via form |
| Sin confirmacion al salir | Medio | IncidentReportForm.tsx | Guard en onBack con confirmDiscard |
| Memory leak blob URLs | Bajo | IncidentReportForm.tsx | useEffect cleanup al desmontar |

Solo se modifica **1 archivo**: `IncidentReportForm.tsx`
