

# Pegar Imagenes desde el Portapapeles en la Cronologia

## Problema

Actualmente para adjuntar una imagen hay que guardarla primero como archivo y luego subirla con el boton "Adjuntar foto". Esto es lento cuando se quiere pegar un screenshot o una imagen copiada de WhatsApp Web.

## Solucion

Agregar soporte para **pegar imagenes directamente** (Ctrl+V / Cmd+V) en el area del formulario de entrada de cronologia. Cuando el formulario esta abierto y el usuario pega una imagen del portapapeles, se captura automaticamente como si la hubiera seleccionado con el boton.

## Cambios

### Archivo: `src/components/monitoring/incidents/IncidentTimeline.tsx`

1. **Agregar listener de `paste`** en el contenedor del formulario:
   - Detectar `clipboardData.items` de tipo `image/*`
   - Convertir el item a `File` y asignarlo como `selectedImage`
   - Generar el preview con `URL.createObjectURL`
   - Si ya hay una imagen seleccionada, reemplazarla (revocando la URL anterior)

2. **Indicador visual**: Actualizar el texto del boton de adjuntar para indicar la opcion de pegar:
   - "Adjuntar foto o pegar (Ctrl+V)" en lugar de solo "Adjuntar foto"

3. **Reutilizar la logica existente**: El archivo pegado pasa por el mismo flujo de compresion y subida que ya existe para archivos seleccionados manualmente.

## Detalle tecnico

```text
Evento paste en el formulario
  --> clipboardData.items[i].type.startsWith('image/')
    --> item.getAsFile()
      --> setSelectedImage(file) + setImagePreview(URL.createObjectURL(file))
```

- Solo se activa cuando el formulario esta visible (`showForm === true`)
- Se valida que el tipo sea imagen (jpeg, png, webp)
- Compatible con: screenshots del sistema, imagenes copiadas de WhatsApp Web, imagenes copiadas del navegador

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/incidents/IncidentTimeline.tsx` | Agregar handler de paste + texto indicativo |

