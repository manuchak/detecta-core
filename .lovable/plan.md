

# Plan: Corrección de Flujo de Documentos para Custodios sin Teléfono Válido

## Diagnóstico Confirmado

El usuario de prueba `prurbsi@pruebs.com` tiene en la base de datos:
- **phone**: `"Sin telefono"` (string literal, no un número real)
- **role**: `custodio` ✓

Esto causa que el flujo de subida falle silenciosamente porque:
1. El hook `useCustodianDocuments` recibe `"Sin telefono"` como `custodioTelefono`
2. Pasa el check `if (!custodioTelefono)` porque no es null/undefined
3. PERO falla en la validación de 8 dígitos cuando intenta subir
4. El error NO se muestra porque el flujo no llega al submit o el código actualizado no está cargado

## Solución Propuesta

### 1. Corregir el Teléfono del Usuario de Prueba (Inmediato - Manual)

Ejecutar en SQL:
```sql
UPDATE profiles 
SET phone = '+52 55 1234 5678'  -- O un número de prueba válido
WHERE email = 'prurbsi@pruebs.com';
```

### 2. Validar Teléfono al Montar CustodianOnboarding (Código)

Agregar validación anticipada en `CustodianOnboarding.tsx` para detectar teléfonos inválidos ANTES de permitir el flujo:

```typescript
// En CustodianOnboarding.tsx

const isPhoneValid = (phone: string | undefined) => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  return digitsOnly.length >= 8;
};

const phoneValid = isPhoneValid(profile?.phone);

// Mostrar alerta si teléfono inválido
if (!profileLoading && !phoneValid) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">Teléfono no válido</h2>
            <p className="text-muted-foreground">
              Para subir documentos necesitas un número de teléfono válido.
              Tu número actual: "{profile?.phone || 'No registrado'}"
            </p>
            <p className="text-sm text-muted-foreground">
              Contacta a soporte para actualizar tu información.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 3. Agregar Toast de Debug Visible al Montar

Para confirmar que el código nuevo está cargado:

```typescript
// En CustodianOnboarding.tsx useEffect
useEffect(() => {
  console.log('[CustodianOnboarding] Componente montado - v3', {
    hasProfile: !!profile,
    phone: profile?.phone,
    phoneValid: isPhoneValid(profile?.phone),
    documentsCount: documents.length
  });
  
  // Toast visible para confirmar código actualizado
  if (profile) {
    toast.info(`Teléfono: ${profile.phone}`, { duration: 3000 });
  }
}, [profile, documents]);
```

### 4. Mejorar Flujo de Registro para Evitar "Sin telefono"

Revisar `/auth/registro-custodio` y la edge function `create-custodian-account` para asegurar que:
- El campo teléfono sea obligatorio con validación de formato
- No se permita guardar strings como "Sin telefono"

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/pages/custodian/CustodianOnboarding.tsx` | Agregar validación de teléfono al montar, mostrar alerta si inválido | Alta |
| Base de datos (manual) | Corregir teléfono de usuario de prueba | Alta |
| `src/pages/auth/CustodianRegistration.tsx` | Revisar que no permita "Sin telefono" | Media |

## Verificación Post-Implementación

1. Corregir teléfono del usuario de prueba
2. Refrescar la app en el dispositivo Android
3. Verificar que aparece toast con el teléfono
4. Verificar que aparecen logs `[CustodianOnboarding] v3` en consola
5. Intentar subir documento y verificar flujo completo

## Notas

- El código de debugging agregado anteriormente (v2) debería estar funcionando, pero si no aparecen los logs significa que el dispositivo de prueba tiene una versión cacheada
- El toast con el teléfono servirá como verificación visual de que el código nuevo está activo

