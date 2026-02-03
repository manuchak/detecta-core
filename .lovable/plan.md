
# Plan: Sistema de Asignacion Flexible para Edicion de Servicios

## Problema Identificado

El sistema actual impone un flujo secuencial rigido: **Custodio -> Armado**. Esto no refleja la realidad operativa donde un armado puede confirmar antes que un custodio.

### Puntos de Bloqueo Actuales

| Archivo | Linea | Logica Restrictiva |
|---------|-------|-------------------|
| `useSmartEditSuggestions.ts` | 66-77 | Fuerza "Asignar Custodio Primero" cuando hay armado pendiente |
| `PendingAssignmentModal.tsx` | 66-84 | `currentStep` solo inicia en 'armed' si `hasCustodio=true` |
| `PendingAssignmentModal.tsx` | 689 | Renderiza `SimplifiedArmedAssignment` solo si `custodianAssigned || service?.custodio_asignado` |

## Solucion Propuesta: Asignacion Flexible con Tabs

### Concepto UI/UX

Transformar el modal de asignacion de un flujo lineal a una **vista de pestanas** que permita asignar cualquier recurso en cualquier orden:

```text
┌─────────────────────────────────────────────────────────────────────┐
│  Asignar Personal - SRV-2024-1234                                   │
│  Cliente: Empresa ABC | Ruta: CDMX -> Toluca | 14:00                │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                        │
│  │   👤 Custodio    │  │   🛡️ Armado      │                        │
│  │   ○ Pendiente    │  │   ○ Pendiente    │                        │
│  └──────────────────┘  └──────────────────┘                        │
│                           ↑ Tab activa                              │
├─────────────────────────────────────────────────────────────────────┤
│  [Contenido de asignacion de armado]                                │
│                                                                     │
│  - Lista de armados disponibles                                     │
│  - Punto de encuentro                                               │
│  - Hora de encuentro                                                │
└─────────────────────────────────────────────────────────────────────┘
│  [Completar Asignacion]          [Guardar y Continuar Despues]      │
└─────────────────────────────────────────────────────────────────────┘
```

### Indicadores de Estado Visual

```tsx
// Tab indicators (semanticos)
<TabsTrigger value="custodian">
  <User className="h-4 w-4" />
  Custodio
  {hasCustodio 
    ? <CheckCircle className="h-3 w-3 text-success" />
    : <Circle className="h-3 w-3 text-muted-foreground" />
  }
</TabsTrigger>

<TabsTrigger value="armed">
  <Shield className="h-4 w-4" />
  Armado
  {hasArmado 
    ? <CheckCircle className="h-3 w-3 text-success" />
    : service.requiere_armado 
      ? <AlertCircle className="h-3 w-3 text-warning" />
      : null
  }
</TabsTrigger>
```

## Cambios Tecnicos

### 1. useSmartEditSuggestions.ts - Eliminar Restriccion de Orden

**Antes (lineas 66-77):**
```tsx
// CASO ESPECIAL: Requiere armado pero no hay custodio
else if (needsArmedAssignment && !hasCustodio) {
  heroSuggestion = {
    mode: 'custodian_only',
    title: 'Asignar Custodio Primero',
    description: 'Debes asignar un custodio antes de asignar el armado',
    ...
  };
}
```

**Despues:**
```tsx
// CASO: Ambos pendientes - mostrar como acciones paralelas
if (needsArmedAssignment && !hasCustodio) {
  // Hero suggestion: la mas critica segun contexto
  heroSuggestion = {
    mode: 'flexible_assign',
    title: 'Asignar Personal',
    description: 'Asigna custodio y/o armado en cualquier orden',
    priority: 'high',
    icon: 'Users',
    color: 'blue',
    estimatedTime: '3 min',
    consequences: [
      'Puedes asignar el armado primero si ya confirmo disponibilidad',
      'El custodio puede asignarse despues'
    ]
  };
}
```

### 2. PendingAssignmentModal.tsx - Flujo Flexible con Tabs

**Nuevo estado:**
```tsx
// Reemplazar currentStep por activeTab (semanticamente mas claro)
const [activeTab, setActiveTab] = useState<'custodian' | 'armed'>(() => {
  // Determinar tab inicial segun modo o contexto
  if (mode === 'direct_armed') return 'armed';
  if (mode === 'direct_custodian') return 'custodian';
  // Auto: priorizar el que falta
  return hasCustodio ? 'armed' : 'custodian';
});
```

**Nuevo render con Tabs:**
```tsx
<Tabs value={activeTab} onValueChange={setActiveTab}>
  <TabsList className="grid w-full grid-cols-2">
    <TabsTrigger value="custodian" className="relative">
      <User className="h-4 w-4 mr-2" />
      Custodio
      <AssignmentIndicator assigned={!!service?.custodio_asignado} />
    </TabsTrigger>
    <TabsTrigger value="armed" disabled={!service?.requiere_armado}>
      <Shield className="h-4 w-4 mr-2" />
      Armado
      <AssignmentIndicator 
        assigned={!!service?.armado_asignado} 
        required={service?.requiere_armado}
      />
    </TabsTrigger>
  </TabsList>

  <TabsContent value="custodian">
    {/* Lista de custodios - SIN CAMBIOS */}
  </TabsContent>

  <TabsContent value="armed">
    {/* SimplifiedArmedAssignment - AHORA SIN RESTRICCION */}
    <SimplifiedArmedAssignment
      serviceData={serviceData}
      onComplete={handleArmedGuardAssignmentComplete}
      // NUEVO: No requiere custodio previo
      allowWithoutCustodian={true}
    />
  </TabsContent>
</Tabs>
```

### 3. SimplifiedArmedAssignment.tsx - Permitir Asignacion Sin Custodio

**Agregar prop:**
```tsx
interface SimplifiedArmedAssignmentProps {
  // ... existentes
  allowWithoutCustodian?: boolean;
}
```

**Modificar warning de custodio hibrido:**
```tsx
{/* Solo mostrar warning si HAY custodio y es hibrido */}
{serviceData.custodio_asignado && custodioIsHybrid && (
  <Alert className="border-warning bg-warning/5">...</Alert>
)}

{/* Nuevo: Info cuando no hay custodio asignado */}
{!serviceData.custodio_asignado && (
  <Alert className="border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20">
    <Info className="h-4 w-4 text-blue-600" />
    <AlertTitle>Custodio pendiente</AlertTitle>
    <AlertDescription>
      Puedes asignar el armado primero. El custodio se asignara posteriormente.
    </AlertDescription>
  </Alert>
)}
```

### 4. Nuevo Componente: AssignmentStatusBadges

```tsx
// src/components/planeacion/AssignmentStatusBadges.tsx
export function AssignmentStatusBadges({ service }: { service: EditableService }) {
  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={service.custodio_asignado ? 'success' : 'outline'}
        className="gap-1"
      >
        <User className="h-3 w-3" />
        {service.custodio_asignado || 'Pendiente'}
      </Badge>
      
      {service.requiere_armado && (
        <Badge 
          variant={service.armado_asignado ? 'success' : 'warning'}
          className="gap-1"
        >
          <Shield className="h-3 w-3" />
          {service.armado_asignado || 'Pendiente'}
        </Badge>
      )}
    </div>
  );
}
```

### 5. EditWorkflowContext - Nuevo Modo Flexible

```tsx
// Agregar nuevo EditMode
export type EditMode = 
  | 'basic_info'
  | 'custodian_only'
  | 'armed_only'
  | 'flexible_assign'  // NUEVO
  | 'add_armed'
  | 'remove_armed';
```

### 6. SmartEditModal.tsx - Actualizar Logica de Acciones

**Modificar getQuickActions():**
```tsx
// Cuando ambos faltan (o solo armado falta sin custodio)
if (needsArmedAssignment || needsCustodianAssignment) {
  actions.push({
    id: 'flexible_assign',
    title: needsCustodianAssignment && needsArmedAssignment 
      ? 'Asignar Personal' 
      : needsArmedAssignment 
        ? 'Asignar Armado' 
        : 'Asignar Custodio',
    description: 'Asigna recursos en cualquier orden',
    icon: Users,
    color: 'info',
    priority: 'high',
    action: () => {
      // Ir directamente al tab correcto
      setAssignmentMode(needsArmedAssignment && !needsCustodianAssignment 
        ? 'direct_armed' 
        : 'auto');
      setCurrentView('direct_assign');
    }
  });
}
```

## Diagrama de Flujo Nuevo vs Anterior

```text
FLUJO ANTERIOR (Secuencial Rigido)
──────────────────────────────────
Servicio sin asignar
       │
       ▼
┌──────────────┐
│ Paso 1:      │    ← OBLIGATORIO PRIMERO
│ Custodio     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Paso 2:      │    ← Solo si requiere armado
│ Armado       │
└──────────────┘


FLUJO NUEVO (Flexible con Tabs)
───────────────────────────────
Servicio sin asignar
       │
       ▼
┌───────────────────────────────┐
│  ┌─────────┐   ┌─────────┐   │
│  │Custodio │   │ Armado  │   │  ← Usuario elige orden
│  │  ○      │   │   ○     │   │
│  └────┬────┘   └────┬────┘   │
│       │             │        │
│       ▼             ▼        │
│   Asignar       Asignar      │
│   cuando        cuando       │
│   confirme      confirme     │
└───────────────────────────────┘
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `useSmartEditSuggestions.ts` | Eliminar restriccion, agregar modo `flexible_assign` |
| `PendingAssignmentModal.tsx` | Convertir a sistema de Tabs, eliminar guard en linea 689 |
| `SimplifiedArmedAssignment.tsx` | Agregar prop `allowWithoutCustodian`, UI info |
| `EditWorkflowContext.tsx` | Agregar modo `flexible_assign` |
| `SmartEditModal.tsx` | Actualizar logica de acciones |
| `AssignmentStatusBadges.tsx` | **NUEVO** - Componente de indicadores |

## Beneficios

1. **Flexibilidad Operativa**: Asignar en el orden que la realidad dicte
2. **UX Mejorada**: Indicadores claros de estado de cada asignacion
3. **Consistencia**: Mismo patron visual que el flujo de creacion base
4. **Auditabilidad**: Sigue registrando quien asigno y cuando
5. **Retrocompatibilidad**: El flujo secuencial sigue funcionando si el usuario lo prefiere

## Riesgos y Mitigaciones

| Riesgo | Mitigacion |
|--------|------------|
| Usuario deja armado sin custodio | Alert visual + estado `parcialmente_asignado` |
| Armado asignado a servicio sin custodio en produccion | Logica de backend acepta este estado, UI lo muestra claramente |
| Confusion sobre orden | Onboarding tooltip en primera vez |
