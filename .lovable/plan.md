
# Plan: Agregar Opción de Editar Teléfono en Pantalla de Error

## Problema Identificado

La pantalla de "Teléfono no válido" en `/custodian/onboarding` solo muestra el error pero no permite al usuario corregirlo. Actualmente dice "Contacta a soporte", lo cual es mala experiencia de usuario.

## Solución

Integrar el componente `PhoneUpdatePrompt` (que ya existe) en la pantalla de error para que el custodio pueda actualizar su teléfono directamente.

## Cambios en CustodianOnboarding.tsx

### 1. Agregar Imports

```typescript
import PhoneUpdatePrompt from '@/components/custodian/PhoneUpdatePrompt';
```

### 2. Agregar Estados

```typescript
const [showPhonePrompt, setShowPhonePrompt] = useState(false);
const [phoneError, setPhoneError] = useState<string | null>(null);
```

### 3. Agregar Función de Actualización

```typescript
const handlePhoneUpdate = async (newPhone: string): Promise<boolean> => {
  setPhoneError(null);
  const success = await updateProfile({ phone: newPhone });
  
  if (success) {
    toast.success('Teléfono actualizado correctamente');
    await refetch(); // Recargar perfil para validar de nuevo
    return true;
  } else {
    setPhoneError('No se pudo actualizar el teléfono. Intenta de nuevo.');
    return false;
  }
};
```

### 4. Modificar UI de Error (líneas 152-186)

Cambiar de:
```typescript
<p className="text-sm text-muted-foreground">
  Contacta a soporte para actualizar tu información de contacto.
</p>
<Button variant="outline" onClick={() => navigate('/custodian')}>
  Volver al inicio
</Button>
```

A:
```typescript
<Button onClick={() => setShowPhonePrompt(true)} className="w-full">
  <Phone className="w-4 h-4 mr-2" />
  Actualizar mi teléfono
</Button>
<Button variant="ghost" onClick={() => navigate('/custodian')} className="w-full">
  Volver al inicio
</Button>

{/* Dialog para actualizar teléfono */}
<PhoneUpdatePrompt
  open={showPhonePrompt}
  onOpenChange={setShowPhonePrompt}
  currentPhone={profile?.phone}
  onPhoneUpdated={handlePhoneUpdate}
  errorMessage={phoneError}
/>
```

## Flujo Esperado

```text
┌─────────────────────────────────────┐
│   Custodio entra a /onboarding      │
│   con teléfono "Sin telefono"       │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│   Ve pantalla de error:             │
│   "Teléfono no válido"              │
│   ┌───────────────────────────┐     │
│   │ Actualizar mi teléfono    │ ←── Nuevo botón
│   └───────────────────────────┘     │
└─────────────────┬───────────────────┘
                  │ Click
                  ▼
┌─────────────────────────────────────┐
│   Dialog PhoneUpdatePrompt          │
│   - Input con formato +52           │
│   - Validación 10 dígitos           │
│   - Botón "Guardar y continuar"     │
└─────────────────┬───────────────────┘
                  │ Submit
                  ▼
┌─────────────────────────────────────┐
│   1. updateProfile() → Supabase     │
│   2. refetch() → Recargar perfil    │
│   3. isPhoneValid() → true          │
│   4. Mostrar wizard de documentos   │
└─────────────────────────────────────┘
```

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/custodian/CustodianOnboarding.tsx` | Integrar PhoneUpdatePrompt en pantalla de error |

## Beneficio

El custodio puede resolver el problema por sí mismo sin necesidad de contactar a soporte, mejorando significativamente la experiencia de usuario y reduciendo fricción en el onboarding.
