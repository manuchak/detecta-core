# Plan: Corrección de Flujo de Documentos para Custodios sin Teléfono Válido

## ✅ IMPLEMENTADO

### Cambios Realizados

1. **`CustodianOnboarding.tsx`** - Validación anticipada de teléfono:
   - Función `isPhoneValid()` que verifica mínimo 8 dígitos
   - Pantalla de error clara si teléfono es inválido (muestra el valor actual)
   - Toast visible al montar mostrando el teléfono detectado
   - Logs v3 con información completa de debugging

### Pendiente (Manual)

Para probar el flujo completo, ejecuta en SQL:
```sql
UPDATE profiles 
SET phone = '+52 55 1234 5678'
WHERE email = 'prurbsi@pruebs.com';
```

### Verificación

1. El usuario verá un toast `📱 Teléfono: "Sin telefono"` 
2. Verá pantalla de error "Teléfono no válido" con el valor actual
3. Después de corregir en BD y refrescar, podrá subir documentos

