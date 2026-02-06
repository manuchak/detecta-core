
# Plan: Agregar Opción de Editar Teléfono en Pantalla de Error

## ✅ COMPLETADO

## Cambios Implementados

Se integró el componente `PhoneUpdatePrompt` en la pantalla de error de teléfono inválido en `CustodianOnboarding.tsx`:

1. ✅ Import del componente `PhoneUpdatePrompt`
2. ✅ Estados `showPhonePrompt` y `phoneError`
3. ✅ Handler `handlePhoneUpdate` que actualiza el perfil y recarga
4. ✅ Botón "Actualizar mi teléfono" en la UI de error
5. ✅ Dialog modal para ingresar teléfono con formato +52

## Flujo Final

```text
Teléfono inválido → Click "Actualizar" → Dialog +52 → Guardar → Refetch → Wizard documentos
```
