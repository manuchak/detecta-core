
# Persistencia de Screenshots en la Cronologia del Evento

## Problema

Cuando se agrega una imagen (screenshot o foto) a una entrada de cronologia en un incidente **nuevo** (no editado), la imagen se pierde al cambiar de pagina o refrescar. Esto ocurre porque:

1. Las imagenes se guardan como objetos `File` en el estado (`imagenFile`)
2. Los objetos `File` y las URLs `blob:` **no son serializables** -- no pueden guardarse en localStorage/sessionStorage
3. La funcion `serializeTimelineEntries` explicitamente elimina `imagenFile` e `imagenPreview`, dejando solo un flag `hadImage: true`
4. Al restaurar, las entradas llegan sin imagen y el usuario ve el toast "fotos que no pudieron restaurarse"

## Solucion

Convertir las imagenes a **base64 data URLs** antes de persistir en localStorage/sessionStorage. Al restaurar, reconstruir los objetos `File` desde el base64 para que puedan subirse a Supabase Storage cuando se registre el incidente.

## Cambios

### Archivo: `src/components/monitoring/incidents/IncidentReportForm.tsx`

1. **Agregar funcion `fileToBase64`**: Convierte un `File` a string base64 data URL usando `FileReader`

2. **Modificar `serializeTimelineEntries`**: Hacerla `async` para que pueda convertir cada `imagenFile` a base64 antes de serializar. Se almacena junto con el `type` y `name` del archivo original

3. **Modificar `deserializeTimelineEntries`**: Reconstruir objetos `File` desde el base64 guardado, y usar el mismo base64 como `imagenPreview` (en lugar de blob URL)

4. **Actualizar `persistLocalEntries`**: Hacerlo `async` para acomodar la serializacion asincrona

5. **Eliminar toast de "fotos que no pudieron restaurarse"**: Ya no aplica porque las fotos SI se restauran

## Detalle tecnico

```text
Al agregar entrada con imagen:
  File --> fileToBase64() --> data:image/png;base64,... 
  --> se guarda en localStorage junto con name y type

Al restaurar:
  base64 --> new File([blob], name, {type}) --> imagenFile restaurado
  base64 --> imagenPreview (se usa directamente como src de <img>)

Al enviar incidente:
  imagenFile (File reconstruido) --> uploadEvidenciaImage() --> Supabase Storage
```

### Consideraciones de tamano

- Las fotos ya pasan por compresion Canvas API (~400KB)
- Un screenshot tipico en base64 ocupa ~500KB-1MB
- localStorage tiene un limite de ~5-10MB por dominio
- Con el TTL de 72h existente, los datos se limpian automaticamente
- Se limita a maximo 5 imagenes almacenadas para evitar exceder el limite

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/incidents/IncidentReportForm.tsx` | Serializar/deserializar imagenes como base64, eliminar toast de imagenes perdidas |
