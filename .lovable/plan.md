

# Corregir 3 bugs en ReferenceForm de Referencias

## Problema reportado por Supply
Al capturar referencias, el formulario presenta 3 problemas:
1. Datos de una referencia anterior (ej. telefono) aparecen al abrir una nueva
2. Campos de empresa/cargo se envian aunque la referencia sea personal
3. No se puede escribir "NA" o dejar vacio el email porque el navegador exige formato con @

## Correcciones

### Archivo: `src/components/recruitment/references/ReferenceForm.tsx`

**Fix 1 - Limpiar borrador al abrir el dialog:**
Agregar un `useEffect` que detecte cuando `isOpen` cambia a `true` y, si no hay un borrador significativo guardado, resetee el formulario a `INITIAL_REFERENCE_DATA` con `setData()`. Esto evita que datos viejos de otra referencia aparezcan en un formulario nuevo.

**Fix 2 - No enviar empresa/cargo en referencias personales:**
En `handleSubmit`, condicionar los campos `empresa_institucion` y `cargo_referencia` para que solo se incluyan cuando `tipoReferencia === 'laboral'`. Si es personal, se envian como `undefined`.

**Fix 3 - Relajar validacion de email:**
Cambiar el `type="email"` del input a `type="text"` y agregar un placeholder que indique que es opcional (ej. "Correo electronico o N/A"). Esto permite que el equipo de Supply escriba "NA", "No tiene", o simplemente lo deje vacio sin que el navegador bloquee el envio.

## Resumen
- **1 archivo modificado** (`ReferenceForm.tsx`)
- **Sin riesgo** para otros formularios - los cambios son locales
- **Retrocompatible** - los datos existentes no se afectan

