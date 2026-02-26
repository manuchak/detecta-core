

# Unificar Invitaciones: Custodios y Armados en una sola interfaz

## Problema
La pagina de invitaciones (`CustodianInvitationsPage`) solo genera links para custodios. Ya existe la tabla `armado_invitations` y la pagina de registro `ArmadoSignup`, pero no hay forma de crear invitaciones de armados desde el admin.

## Solucion
Agregar un selector "Tipo de operativo" (Custodio / Armado) en la pagina existente que cambie el comportamiento de los 3 tabs (Individual, Masivo, Historial).

## Cambios

### 1. Nuevo hook: `src/hooks/useArmadoInvitations.ts`
- Clonar la estructura de `useCustodianInvitations.ts`
- Apuntar queries a tabla `armado_invitations` en lugar de `custodian_invitations`
- Cambiar `getInvitationLink` para generar URL `/auth/registro-armado?token=...`
- Misma logica de create, bulk, resend, renew
- No enviar email por ahora (no existe edge function `send-armado-invitation`), solo generar el link

### 2. Modificar: `src/pages/Admin/CustodianInvitationsPage.tsx`
- Renombrar titulo a "Invitaciones de Operativos"
- Agregar un `ToggleGroup` o `Select` arriba de los tabs para elegir entre "Custodio" y "Armado"
- Estado local `operativeType: 'custodio' | 'armado'`
- Pasar `operativeType` como prop a los componentes hijos

### 3. Modificar: `src/components/admin/GenerateCustodianInvitation.tsx`
- Aceptar prop `operativeType: 'custodio' | 'armado'`
- Usar `useCustodianInvitations` o `useArmadoInvitations` segun el tipo
- Cambiar textos: "Invitar Custodio" -> "Invitar Armado" cuando corresponda
- Placeholder del nombre: "Nombre del custodio" -> "Nombre del armado"

### 4. Modificar: `src/components/admin/BulkInvitationWizard.tsx`
- Aceptar prop `operativeType`
- Usar el hook correspondiente segun tipo
- Ajustar textos y template de descarga

### 5. Modificar: `src/components/admin/CustodianInvitationsList.tsx`
- Aceptar prop `operativeType`
- Consultar `armado_invitations` cuando tipo sea armado
- Misma tabla, mismos filtros

## Flujo del usuario admin

1. Abre la pagina de Invitaciones
2. Ve un selector arriba: **Custodio** | **Armado**
3. Selecciona "Armado"
4. En tab Individual: llena nombre/email/telefono -> genera link de `/auth/registro-armado?token=xxx`
5. Copia el link y lo envia al armado (WhatsApp, email manual, etc.)
6. El armado abre el link -> ve `ArmadoSignup` -> se registra -> obtiene rol `armado` -> entra a `/armado`

## Detalle tecnico

El selector de tipo se implementara como un `ToggleGroup` encima de los tabs:

```tsx
const [operativeType, setOperativeType] = useState<'custodio' | 'armado'>('custodio');

<ToggleGroup type="single" value={operativeType} onValueChange={v => v && setOperativeType(v)}>
  <ToggleGroupItem value="custodio">Custodio</ToggleGroupItem>
  <ToggleGroupItem value="armado">Armado</ToggleGroupItem>
</ToggleGroup>
```

El hook de armados sera una copia simplificada del de custodios, apuntando a `armado_invitations` y sin la logica de email automatico (se puede agregar despues).

### Archivos nuevos (1)
- `src/hooks/useArmadoInvitations.ts`

### Archivos modificados (4)
- `src/pages/Admin/CustodianInvitationsPage.tsx` - selector de tipo + props
- `src/components/admin/GenerateCustodianInvitation.tsx` - prop tipo + hook dinamico
- `src/components/admin/BulkInvitationWizard.tsx` - prop tipo + hook dinamico
- `src/components/admin/CustodianInvitationsList.tsx` - prop tipo + query dinamica
