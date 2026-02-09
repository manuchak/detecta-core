
# Unificar UI de "Cambiar Armado" en todos los flujos de edicion

## Problema actual

Hay **3 puntos de entrada** para editar un servicio, y cada uno maneja la opcion de armado de forma diferente:

| Componente | Donde aparece | "Cambiar Armado" | "Remover Armado" |
|---|---|---|---|
| **SmartEditModal** (analysis view) | Click en servicio desde lista | Solo si `isComplete` (linea 136) | Solo si `requiere_armado` (linea 168) - separado de "Cambiar" |
| **QuickEditActions** | Panel lateral de acciones | Solo si `isComplete && hasArmado` (linea 180) | Siempre si `requiere_armado` (linea 217) - separado de "Cambiar" |
| **ContextualEditModal** (via useSmartEditSuggestions) | Edicion contextual | Solo aparece como sugerencia secundaria si `hasArmado` | Aparece como sugerencia si `requiere_armado` |

### Inconsistencias encontradas

1. **"Cambiar Armado" no aparece cuando mas se necesita**: En SmartEditModal y QuickEditActions, "Cambiar Armado" solo se muestra si el servicio esta `isComplete` (custodio Y armado asignados). Pero el caso de CUSAEM es justamente cuando HAY armado asignado pero necesita cambiarse -- y el servicio podria no estar "completo" por otras razones.

2. **"Remover Armado" aparece sin "Cambiar Armado" al lado**: Cuando un servicio tiene `requiere_armado=true` pero `isComplete=false`, solo se ve "Remover Armado". El planificador no tiene la opcion de cambiar, solo de eliminar.

3. **Falta "Cambiar Armado" como opcion en useSmartEditSuggestions cuando hasArmado y no isComplete**: El hook genera la sugerencia de "Cambiar Armado" (linea 86) correctamente cuando `hasArmado`, pero SmartEditModal filtra por `isComplete` antes de mostrarlo.

## Solucion

Hacer que **"Cambiar Armado" aparezca siempre que haya un armado asignado** (`hasArmado`), independientemente de si el servicio esta completo. Y agruparlo visualmente junto a "Remover Armado".

### Archivo 1: `src/components/planeacion/SmartEditModal.tsx`

**Cambio en lineas 119-150** (seccion de "Reassignment options"):

Actualmente la condicion es `if (isComplete)`. Cambiar a mostrar cada boton segun su propia condicion:

```typescript
// Cambiar custodio: visible si hay custodio asignado (no requiere isComplete)
if (hasCustodio) {
  actions.push({
    id: 'change_custodian',
    title: 'Cambiar Custodio',
    description: `Actual: ${service.custodio_asignado}`,
    icon: User,
    color: 'info' as const,
    priority: 'medium' as const,
    action: () => { ... }
  });
}

// Cambiar armado: visible si hay armado asignado (no requiere isComplete)
if (hasArmado) {
  actions.push({
    id: 'change_armed',
    title: 'Cambiar Armado',
    description: `Actual: ${service.armado_asignado}`,
    icon: Shield,
    color: 'info' as const,
    priority: 'medium' as const,
    action: () => { ... }
  });
}
```

### Archivo 2: `src/components/planeacion/QuickEditActions.tsx`

**Cambio en lineas 163-196** (seccion "Personnel Changes"):

Actualmente envuelto en `{isComplete && (<>...</>)}`. Separar las condiciones:

```typescript
{/* Cambiar Custodio: visible si hay custodio */}
{hasCustodio && (
  <Button variant="outline" className="apple-button-secondary justify-start h-auto p-4"
    onClick={() => handleQuickEdit('custodian_only', 'Cambiar custodio asignado')}>
    <User className="h-4 w-4 mr-3" />
    <div className="text-left">
      <div className="apple-text-callout">Cambiar Custodio</div>
      <div className="apple-text-caption text-muted-foreground">
        Actual: {service.custodio_asignado}
      </div>
    </div>
  </Button>
)}

{/* Cambiar Armado: visible si hay armado asignado */}
{hasArmado && (
  <Button variant="outline" className="apple-button-secondary justify-start h-auto p-4"
    onClick={() => handleQuickEdit('armed_only', 'Cambiar armado asignado')}>
    <Shield className="h-4 w-4 mr-3" />
    <div className="text-left">
      <div className="apple-text-callout">Cambiar Armado</div>
      <div className="apple-text-caption text-muted-foreground">
        Actual: {service.armado_asignado}
      </div>
    </div>
  </Button>
)}
```

Esto tambien elimina la duplicacion donde "Cambiar Armado" y "Remover Armado" tenian condiciones diferentes e incongruentes.

### Archivo 3: Sin cambios en `useSmartEditSuggestions.ts`

El hook ya genera correctamente "Cambiar Armado" cuando `hasArmado` (linea 86) y "Cambiar Custodio" cuando `hasCustodio` (linea 79). La logica de sugerencias ya es correcta.

### Archivo 4: Sin cambios en `ContextualEditModal.tsx`

Los handlers `armed_only` y `custodian_only` ya estan correctamente implementados (lineas 107-128) y llaman a `onStartReassignment` correctamente.

## Resultado

En los 3 flujos de edicion, el planificador vera consistentemente:

```text
+-----------------------------------------+
| Accion Prioritaria (si aplica)          |
+-----------------------------------------+
| Opciones Adicionales:                   |
|  [Cambiar Custodio]  <- si hay custodio |
|  [Cambiar Armado]    <- si hay armado   |
|  [Remover Armado]    <- si requiere     |
|  [Editar Informacion]                   |
+-----------------------------------------+
```

Cuando CUSAEM cambie un armado de ultimo minuto, "Cambiar Armado" sera visible sin importar el estado general del servicio.
