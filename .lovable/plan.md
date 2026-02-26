

# Subida de Imagenes con Drag & Drop, Paste y Upload en el Editor de Texto LMS

## Problema
El editor de texto enriquecido (`RichTextEditor`) solo permite insertar imagenes por URL. Los usuarios necesitan poder subir imagenes directamente mediante:
- Drag & Drop (arrastrar archivos al editor)
- Copy & Paste (pegar imagenes del clipboard)
- Boton de Upload (seleccionar archivos desde el explorador)

## Solucion
Modificar el componente `RichTextEditor.tsx` para agregar soporte completo de subida de imagenes al bucket `lms-media` de Supabase Storage (que ya existe).

## Cambios

### Archivo unico: `src/components/lms/admin/RichTextEditor.tsx`

**1. Funcion de upload a Supabase Storage**
- Crear una funcion `uploadImage(file: File)` que suba al bucket `lms-media` en la ruta `contenido/{timestamp}_{nombre}`
- Comprimir la imagen usando Canvas API (max 1920x1080, quality 0.8) siguiendo el estandar del proyecto
- Retornar la URL publica via `getPublicUrl()`

**2. Drag & Drop**
- Registrar handler `handleDrop` en el contenedor del editor
- Interceptar archivos de tipo `image/*` del `DataTransfer`
- Subir cada imagen y ejecutar `editor.chain().focus().setImage({ src: publicUrl })`
- Mostrar estado de carga visual (overlay semitransparente con spinner)

**3. Paste desde clipboard**
- Registrar handler `handlePaste` en el editor
- Detectar `clipboardData.files` o `clipboardData.items` con tipo `image/*`
- Misma logica de upload e insercion

**4. Boton Upload en toolbar**
- Ampliar el popover actual de imagen: ademas del input de URL, agregar un boton "Subir imagen" que abre un `<input type="file" accept="image/*">`
- Al seleccionar archivo, ejecutar la misma funcion de upload
- Mostrar spinner mientras se sube

**5. Estado de carga visual**
- Mientras se sube una imagen, mostrar un overlay con "Subiendo imagen..." sobre el area del editor
- Deshabilitar el editor brevemente durante el upload para evitar conflictos

### Resultado para el usuario
- Puede arrastrar una imagen desde su escritorio al editor y se inserta automaticamente
- Puede copiar una imagen de cualquier lugar (otro sitio web, screenshot) y pegarla con Ctrl+V
- Puede hacer clic en el icono de imagen y elegir entre URL o subir archivo
- Las imagenes quedan almacenadas en Supabase Storage (bucket `lms-media`) con URL publica permanente

### Detalle tecnico

El bucket `lms-media` ya existe con limite de 150MB y es publico. La compresion via Canvas mantendra las imagenes en un tamano razonable (~400KB).

```tsx
// Ejemplo de la funcion de upload
async function uploadImageToStorage(file: File): Promise<string> {
  const compressed = await compressImage(file, 1920, 1080, 0.8);
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `contenido/${Date.now()}_${Math.random().toString(36).slice(2,8)}.${ext}`;
  
  const { error } = await supabase.storage.from('lms-media').upload(path, compressed);
  if (error) throw error;
  
  const { data } = supabase.storage.from('lms-media').getPublicUrl(path);
  return data.publicUrl;
}
```

El popover de imagen se ampliara con una seccion de upload:

```tsx
// Dentro del popover de imagen actual
<Input placeholder="URL de la imagen..." ... />
<Button onClick={insertImage}>Insertar por URL</Button>
<Separator />
<Button variant="outline" onClick={() => fileInputRef.current?.click()}>
  <Upload className="w-4 h-4" /> Subir imagen
</Button>
<input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFileSelect} />
```

Para drag & drop, el contenedor del editor tendra handlers:

```tsx
<div 
  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
  onDragLeave={() => setDragging(false)}
  onDrop={handleDrop}
>
  {dragging && <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary z-10 flex items-center justify-center">Suelta la imagen aqui</div>}
  <EditorContent editor={editor} />
</div>
```

Como `RichTextEditor` es el unico componente centralizado usado por los 3 editores del LMS (`LMSContenidoForm`, `ContenidoExpandedEditor`, `ContentEditor` del wizard), este cambio se aplica automaticamente a **todas** las interfaces de edicion sin modificar ningun otro archivo.
