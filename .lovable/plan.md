
# Plan: Formulario de Edición de Datos para Perfiles Operativos

## Contexto del Problema

Los listados legacy tienen errores de llenado que necesitan corregirse. Actualmente solo se puede editar zona y preferencia vía `QuickEditSheet`. Se requiere un formulario completo para roles autorizados (coordinador_operaciones, admin, owner).

## Propuesta UX

**Patrón: Sheet lateral con formulario completo**

Expandir la funcionalidad existente de edición con un nuevo botón "Editar datos" visible solo para roles autorizados, que abre un formulario completo.

```
┌────────────────────────────────────────────────┐
│ ✏️ Editar Perfil Operativo                     │
├────────────────────────────────────────────────┤
│ 📋 Datos de Contacto                           │
│ ┌──────────────────────────────────────────┐  │
│ │ Nombre completo                           │  │
│ │ [Juan Pérez González____________]        │  │
│ └──────────────────────────────────────────┘  │
│ ┌────────────────┐ ┌──────────────────────┐  │
│ │ Teléfono       │ │ Email                │  │
│ │ [5512345678___]│ │ [email@ejemplo.com]  │  │
│ └────────────────┘ └──────────────────────┘  │
│                                                │
│ 📍 Ubicación                                   │
│ ┌──────────────────────────────────────────┐  │
│ │ Zona base: [CDMX ▼]                      │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ⚙️ Configuración (solo custodios)              │
│ ┌──────────────────────────────────────────┐  │
│ │ ☑ Experiencia en seguridad               │  │
│ │ ☑ Vehículo propio                        │  │
│ └──────────────────────────────────────────┘  │
│                                                │
│ ⚔️ Configuración Armado (solo armados)        │
│ ┌──────────────────────────────────────────┐  │
│ │ Tipo: [Interno ▼]                        │  │
│ │ Licencia: [_______________]              │  │
│ │ Vencimiento: [📅 Seleccionar]            │  │
│ └──────────────────────────────────────────┘  │
│                                                │
├────────────────────────────────────────────────┤
│ [Cancelar]              [💾 Guardar Cambios]  │
└────────────────────────────────────────────────┘
```

## Cambios Técnicos

### 1. Crear Hook `useUpdateOperativeProfile.ts`

Hook genérico para actualizar tanto custodios como armados:

```typescript
interface UpdateOperativeParams {
  id: string;
  tipo: 'custodio' | 'armado';
  data: Partial<CustodioUpdateData | ArmadoUpdateData>;
}

interface CustodioUpdateData {
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  experiencia_seguridad: boolean | null;
  vehiculo_propio: boolean | null;
  certificaciones: string[] | null;
}

interface ArmadoUpdateData {
  nombre: string;
  telefono: string | null;
  email: string | null;
  zona_base: string | null;
  tipo_armado: string;
  licencia_portacion: string | null;
  fecha_vencimiento_licencia: string | null;
  experiencia_anos: number | null;
}
```

- Determinar tabla según tipo (custodios_operativos / armados_operativos)
- Ejecutar update con Supabase
- Invalidar query `['operative-profile', tipo, id]`
- Toast de confirmación

### 2. Crear `EditOperativeProfileSheet.tsx`

Componente Sheet con formulario React Hook Form + Zod:

**Campos comunes (siempre visibles):**
- Nombre (requerido, min 3 chars)
- Teléfono (requerido, min 10 dígitos)
- Email (opcional, validación formato)
- Zona base (select con estados)

**Campos específicos custodio (condicional):**
- Experiencia en seguridad (switch)
- Vehículo propio (switch)
- Certificaciones (tag input)

**Campos específicos armado (condicional):**
- Tipo de armado (select: Interno/Externo/Freelance)
- Licencia de portación (text)
- Fecha vencimiento licencia (date picker)
- Años de experiencia (number input)

### 3. Actualizar `InformacionPersonalTab.tsx`

- Agregar estado `showEditSheet`
- Agregar botón "Editar datos" junto a la tarjeta "Datos de Contacto"
- Visible solo para roles `DATA_CORRECTION_ROLES`
- Importar e integrar el nuevo Sheet

### 4. Opcional: Actualizar constantes

Reusar `DATA_CORRECTION_ROLES` ya definida en `accessControl.ts`:
```typescript
// Ya existe
export const DATA_CORRECTION_ROLES = [
  'admin',
  'owner',
  'coordinador_operaciones'
] as const;
```

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/hooks/useUpdateOperativeProfile.ts` | **Crear** - Hook de actualización genérico |
| `src/pages/PerfilesOperativos/components/EditOperativeProfileSheet.tsx` | **Crear** - Formulario de edición |
| `src/pages/PerfilesOperativos/components/tabs/InformacionPersonalTab.tsx` | Modificar - Agregar botón y Sheet |

## Validaciones con Zod

```typescript
const custodioSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  zona_base: z.string().optional(),
  experiencia_seguridad: z.boolean().nullable(),
  vehiculo_propio: z.boolean().nullable(),
});

const armadoSchema = z.object({
  nombre: z.string().min(3, 'Nombre muy corto'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  zona_base: z.string().optional(),
  tipo_armado: z.enum(['interno', 'externo', 'freelance']),
  licencia_portacion: z.string().optional(),
  fecha_vencimiento_licencia: z.string().optional(),
  experiencia_anos: z.number().min(0).max(50).optional(),
});
```

## Flujo de Usuario

```
Usuario con rol autorizado → Perfil Operativo → Tab Información
        ↓
Ve botón "✏️ Editar datos" en tarjeta Datos de Contacto
        ↓
Click → Abre Sheet lateral con formulario
        ↓
Modifica campos necesarios → Validación en tiempo real
        ↓
Click "Guardar" → Update en BD → Toast éxito → Sheet cierra
        ↓
Perfil se refresca automáticamente con datos actualizados
```

## Resultado Esperado

- Daniela Castañeda (coordinador_operaciones) puede corregir datos erróneos de carga
- Admin y Owner también tienen acceso
- Formulario diferenciado según tipo (custodio vs armado)
- Validación robusta para mantener integridad de datos
- UI consistente con el resto de la aplicación (Sheet pattern)
