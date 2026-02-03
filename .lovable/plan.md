
# Plan: Agregar Eliminacion de Rutas en Desuso al Modulo de Rutas

## Contexto

El modulo de rutas tiene dos vistas principales:
1. **Pendientes** - Ya tiene funcionalidad de eliminar rutas (individual y masiva)
2. **Todas las Rutas** (MatrizPreciosTab) - Solo permite ver y editar, NO eliminar

El componente `DeleteRouteDialog` ya existe con soft-delete, motivos obligatorios y auditoria, pero solo esta conectado a "Pendientes".

## Solucion Propuesta

Extender `MatrizPreciosTab.tsx` para incluir:
1. Filtros de actividad (como en Zonas Base) para identificar rutas sin uso
2. Seleccion multiple de rutas
3. Accion de eliminar (individual y masiva)
4. Reutilizar el `DeleteRouteDialog` existente

## Cambios Tecnicos

### Archivo: `src/pages/Planeacion/components/MatrizPreciosTab.tsx`

**1. Agregar imports necesarios:**
```typescript
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash2, MoreHorizontal, Calendar } from 'lucide-react';
import { DeleteRouteDialog } from './routes/DeleteRouteDialog';
```

**2. Agregar nuevos estados:**
```typescript
const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
const [routesToDelete, setRoutesToDelete] = useState<MatrizPrecio[]>([]);
const [activityFilter, setActivityFilter] = useState<string>('all');
```

**3. Agregar filtro de actividad en la seccion de filtros:**
- Opciones: Todos, Ultimos 60 dias, 90 dias, 120 dias, +120 dias sin uso
- El filtro se basara en `fecha_vigencia` para determinar antiguedad

**4. Agregar columna de checkbox para seleccion:**
```typescript
{
  id: 'select',
  header: ({ table }) => (
    <Checkbox 
      checked={selectedRoutes.size === filteredPrecios.length}
      onCheckedChange={handleSelectAll}
    />
  ),
  cell: ({ row }) => (
    <Checkbox 
      checked={selectedRoutes.has(row.original.id)}
      onCheckedChange={(checked) => handleSelectRoute(row.original.id, checked)}
    />
  ),
}
```

**5. Modificar columna de acciones:**
- Agregar menu dropdown con opcion "Eliminar ruta"
- Mostrar solo si `hasPermission === true`

**6. Agregar botones de accion masiva en el header:**
```typescript
{selectedRoutes.size > 0 && (
  <Button 
    variant="outline"
    onClick={() => setRoutesToDelete(selectedRoutesData)}
    className="gap-2 text-destructive"
  >
    <Trash2 className="h-4 w-4" />
    Eliminar ({selectedRoutes.size})
  </Button>
)}
```

**7. Agregar el DeleteRouteDialog al final del componente:**
```typescript
<DeleteRouteDialog
  open={routesToDelete.length > 0}
  onOpenChange={(open) => !open && setRoutesToDelete([])}
  routes={routesToDelete}
  onSuccess={() => {
    setSelectedRoutes(new Set());
    handleRouteUpdated();
  }}
/>
```

### Integracion con DeleteRouteDialog

El dialogo existente ya maneja:
- Motivos de eliminacion obligatorios
- Opcion "Sin servicios en +120 dias"
- Soft delete (activo = false)
- Registro de nota de auditoria
- Invalidacion de queries

Solo se necesita adaptar la interfaz `MatrizPrecio` para ser compatible con `PendingPriceRoute` agregando campos opcionales.

## Flujo de Usuario

1. Usuario navega a Planeacion > Rutas > Todas las Rutas
2. Aplica filtro de actividad "+120 dias" para ver rutas antiguas
3. Selecciona las rutas a eliminar (individual o multiple)
4. Hace clic en "Eliminar"
5. Selecciona motivo obligatorio (ej: "Sin servicios en +120 dias")
6. Confirma eliminacion
7. Las rutas se desactivan con nota de auditoria

## Resultado Esperado

- Filtro visual para identificar rutas en desuso
- Eliminacion individual desde menu de acciones
- Eliminacion masiva con checkboxes
- Trazabilidad con motivos y fechas
- Consistencia con el flujo existente en "Pendientes"
