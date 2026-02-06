
# Plan: Panel de Administración de Templates WhatsApp

## Resumen

Crear un panel completo de administración de templates de WhatsApp dentro de Settings → WhatsApp Kapso que permita visualizar los 34 templates diseñados, su estado de aprobación en Meta, y enviar mensajes de prueba a números específicos.

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────┐
│                    Settings → WhatsApp Kapso                     │
├─────────────────────────────────────────────────────────────────┤
│  [Conexión] [Templates] [Webhook]  ← Tabs internos              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Templates Panel                                             ││
│  │ ┌─────────────────────────────────────────────────────────┐││
│  │ │ Filtros: [Categoría ▼] [Estado ▼] [Buscar...]         │││
│  │ └─────────────────────────────────────────────────────────┘││
│  │                                                            ││
│  │ ┌─ Servicios y Planeación (7) ──────────────────────────┐ ││
│  │ │ ▼ servicio_asignado        ●Aprobado    [Probar]     │ ││
│  │ │ ▼ servicio_reasignado      ○Pendiente   [Probar]     │ ││
│  │ │ ...                                                   │ ││
│  │ └───────────────────────────────────────────────────────┘ ││
│  │                                                            ││
│  │ ┌─ Checklist y GPS (5) ──────────────────────────────────┐││
│  │ │ ...                                                     │││
│  │ └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

### 1. Migración SQL - Nueva tabla para tracking de status

**Archivo:** Migración SQL (ejecutar en Supabase)

La tabla `whatsapp_templates` actual no tiene campos para Meta. Agregaremos campos nuevos:

```sql
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS meta_status TEXT DEFAULT 'not_submitted';
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS meta_template_id TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS variable_count INTEGER DEFAULT 0;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS has_buttons BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS button_count INTEGER DEFAULT 0;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS meta_category TEXT DEFAULT 'UTILITY';
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMPTZ;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS last_test_phone TEXT;
ALTER TABLE whatsapp_templates ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
```

---

### 2. Nuevo Componente Principal

**Archivo:** `src/components/settings/kapso/WhatsAppTemplatesPanel.tsx`

Componente principal que muestra todos los templates organizados por categoría.

**Funcionalidades:**
- Lista colapsable por categoría (8 grupos)
- Cada template muestra: nombre, estado, botón de prueba
- Filtros por categoría y estado de aprobación
- Búsqueda por nombre de template
- Contador de templates por estado

**Props:**
```typescript
interface WhatsAppTemplatesPanelProps {
  // No props - autónomo con su propio estado
}
```

**Estado interno:**
- `templates`: Array de templates desde BD
- `filter`: { category: string, status: string, search: string }
- `expandedCategories`: Set<string> para controlar acordeones
- `selectedTemplate`: Template para modal de prueba

---

### 3. Componente de Tarjeta de Template

**Archivo:** `src/components/settings/kapso/TemplateCard.tsx`

Tarjeta individual para cada template.

**Contenido visual:**
```text
┌────────────────────────────────────────────────────────┐
│ 📋 servicio_asignado                                   │
│ ┌────────────────────────────────────────────────────┐│
│ │ Categoría: UTILITY  │  Variables: 6  │  Botones: 2 ││
│ └────────────────────────────────────────────────────┘│
│                                                        │
│ Estado: [●] Aprobado                    [🔍] [▶ Test] │
│                                                        │
│ ▼ Preview (expandible)                                │
│ ┌────────────────────────────────────────────────────┐│
│ │ Hola {{1}},                                        ││
│ │ Tienes un nuevo servicio asignado:                 ││
│ │ 📅 {{2}} ⏰ {{3}}                                  ││
│ │ ...                                                 ││
│ └────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface TemplateCardProps {
  template: WhatsAppTemplateRecord;
  onTest: (template: WhatsAppTemplateRecord) => void;
  onUpdateStatus: (templateName: string, status: MetaApprovalStatus) => void;
}
```

---

### 4. Modal de Prueba de Template

**Archivo:** `src/components/settings/kapso/TemplateTestDialog.tsx`

Dialog para enviar pruebas de templates a números específicos.

**Contenido:**
```text
┌─────────────────────────────────────────────────────────┐
│ 🧪 Probar Template: servicio_asignado                   │
│─────────────────────────────────────────────────────────│
│                                                         │
│ Número de prueba: [+52 55 1234 5678_______]            │
│                                                         │
│ Variables del template:                                 │
│ ┌─────────────────────────────────────────────────────┐│
│ │ {{1}} custodio_nombre: [Juan Pérez________]        ││
│ │ {{2}} fecha:           [15 de febrero____]         ││
│ │ {{3}} hora:            [09:00____________]         ││
│ │ {{4}} cliente:         [Grupo Carso______]         ││
│ │ {{5}} origen:          [CDMX Centro______]         ││
│ │ {{6}} destino:         [Santa Fe_________]         ││
│ └─────────────────────────────────────────────────────┘│
│                                                         │
│ ⚠️ Solo funciona si el template está aprobado en Meta  │
│                                                         │
│               [Cancelar]  [📤 Enviar Prueba]           │
└─────────────────────────────────────────────────────────┘
```

**Props:**
```typescript
interface TemplateTestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: WhatsAppTemplateRecord | null;
  onSend: (phone: string, variables: Record<string, string>) => Promise<void>;
}
```

---

### 5. Hook para Gestión de Templates

**Archivo:** `src/hooks/useWhatsAppTemplatesAdmin.ts`

Hook para operaciones CRUD y testing de templates.

**Funciones exportadas:**
```typescript
export const useWhatsAppTemplatesAdmin = () => {
  // Queries
  const { data: templates, isLoading } = useQuery(...);
  
  // Mutations
  const updateStatus = useMutation(...);
  const sendTest = useMutation(...);
  const syncFromMeta = useMutation(...);
  const seedTemplates = useMutation(...);
  
  // Computed
  const templatesByCategory = useMemo(...);
  const statusCounts = useMemo(...);
  
  return {
    templates,
    isLoading,
    templatesByCategory,
    statusCounts,
    updateStatus,
    sendTest,
    syncFromMeta,
    seedTemplates
  };
};
```

---

### 6. Modificar KapsoConfig.tsx

**Archivo:** `src/components/settings/KapsoConfig.tsx`

Agregar tabs internos para organizar: Conexión, Templates, Webhook.

**Cambios:**
- Envolver contenido actual en un Tab "Conexión"
- Agregar Tab "Templates" con el nuevo panel
- El Tab "Webhook" queda con la configuración actual de URLs

```typescript
<Tabs defaultValue="conexion">
  <TabsList>
    <TabsTrigger value="conexion">Conexión</TabsTrigger>
    <TabsTrigger value="templates">Templates (34)</TabsTrigger>
    <TabsTrigger value="webhook">Webhook</TabsTrigger>
  </TabsList>
  
  <TabsContent value="conexion">
    {/* Contenido actual de prueba de conexión */}
  </TabsContent>
  
  <TabsContent value="templates">
    <WhatsAppTemplatesPanel />
  </TabsContent>
  
  <TabsContent value="webhook">
    {/* Configuración de webhook actual */}
  </TabsContent>
</Tabs>
```

---

### 7. Tipos Adicionales

**Archivo:** `src/types/kapso.ts` (actualizar)

Agregar tipos para el panel de administración:

```typescript
export type MetaApprovalStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface WhatsAppTemplateRecord {
  id: string;
  name: string;
  content: string;
  category: string;
  meta_status: MetaApprovalStatus;
  meta_template_id?: string;
  meta_category: 'UTILITY' | 'MARKETING';
  variable_count: number;
  has_buttons: boolean;
  button_count: number;
  is_active: boolean;
  last_test_at?: string;
  last_test_phone?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export const TEMPLATE_CATEGORIES = {
  servicios: { label: 'Servicios y Planeación', icon: 'Truck', count: 7 },
  checklist: { label: 'Checklist y GPS', icon: 'ClipboardCheck', count: 5 },
  tickets: { label: 'Tickets de Soporte', icon: 'Ticket', count: 5 },
  onboarding: { label: 'Onboarding Custodios', icon: 'UserPlus', count: 4 },
  siercp: { label: 'Evaluaciones SIERCP', icon: 'Brain', count: 3 },
  lms: { label: 'LMS y Capacitación', icon: 'GraduationCap', count: 4 },
  leads: { label: 'Adquisición de Leads', icon: 'Target', count: 3 },
  supply: { label: 'Supply y Operaciones', icon: 'Users', count: 3 }
} as const;
```

---

### 8. Función de Seed de Templates

**Archivo:** `src/utils/seedWhatsAppTemplates.ts`

Función para poblar la tabla con los 34 templates definidos en `TEMPLATE_CONFIGS`:

```typescript
export const getTemplateSeeds = (): Omit<WhatsAppTemplateRecord, 'id' | 'created_at' | 'updated_at'>[] => {
  return Object.entries(TEMPLATE_CONFIGS).map(([name, config]) => ({
    name: config.name,
    content: TEMPLATE_CONTENT[name] || '',
    category: getCategoryForTemplate(name),
    meta_status: 'not_submitted',
    meta_category: config.category,
    variable_count: config.variableCount,
    has_buttons: config.hasButtons,
    button_count: config.buttonCount || 0,
    is_active: true
  }));
};
```

---

## Flujo de Datos

```text
┌─────────────┐      ┌──────────────────┐      ┌─────────────────┐
│  Supabase   │◄────►│useWhatsAppAdmin  │◄────►│TemplatesPanel   │
│whatsapp_    │      │      Hook        │      │                 │
│ templates   │      └────────┬─────────┘      └────────┬────────┘
└─────────────┘               │                         │
                              │                         │
                   ┌──────────▼─────────┐    ┌─────────▼────────┐
                   │ kapso-send-template │    │ TemplateTestDialog│
                   │   Edge Function    │    │                  │
                   └────────────────────┘    └──────────────────┘
```

---

## Estados de Aprobación Visual

| Estado | Badge | Color | Acción |
|--------|-------|-------|--------|
| not_submitted | Sin enviar | Gris | Botón "Crear en Meta" |
| pending | Pendiente | Amarillo | Spinner, "Revisar en Meta" |
| approved | Aprobado | Verde | Botón "Probar" habilitado |
| rejected | Rechazado | Rojo | Mostrar razón, "Editar y reenviar" |

---

## Resumen de Tareas

| # | Tarea | Archivo |
|---|-------|---------|
| 1 | Ejecutar migración SQL para nuevos campos | Supabase SQL Editor |
| 2 | Actualizar tipos en kapso.ts | `src/types/kapso.ts` |
| 3 | Crear hook de administración | `src/hooks/useWhatsAppTemplatesAdmin.ts` |
| 4 | Crear componente TemplateCard | `src/components/settings/kapso/TemplateCard.tsx` |
| 5 | Crear modal TemplateTestDialog | `src/components/settings/kapso/TemplateTestDialog.tsx` |
| 6 | Crear panel WhatsAppTemplatesPanel | `src/components/settings/kapso/WhatsAppTemplatesPanel.tsx` |
| 7 | Actualizar KapsoConfig con tabs | `src/components/settings/KapsoConfig.tsx` |
| 8 | Crear función de seed | `src/utils/seedWhatsAppTemplates.ts` |

---

## Notas Técnicas

- Los templates se almacenan en la tabla `whatsapp_templates` existente, extendida con campos de Meta
- El contenido de los templates se guarda como texto plano con placeholders `{{n}}`
- Al abrir el panel por primera vez, se ejecuta un seed automático si no hay templates
- El botón de prueba usa el hook `useKapsoTemplates` ya existente para enviar
- La sincronización con Meta es manual (no hay API de Meta disponible en Kapso para status automático)
