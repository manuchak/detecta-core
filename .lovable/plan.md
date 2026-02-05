
# Plan: Exponer Gestión de Checklists en Navegación de Monitoreo

## Diagnóstico

| Hallazgo | Detalle |
|----------|---------|
| **Tab existe** | Código implementado en `MonitoringPage.tsx` líneas 105-190 |
| **Sin datos** | Tabla `checklist_servicio` tiene 0 registros |
| **No visible en nav** | El módulo de Checklists no aparece como sub-item en el sidebar |
| **Acceso interno** | Solo accesible haciendo clic en el tab dentro del Centro de Control |

## Problema

El operador de monitoreo debe navegar manualmente al tab "Checklists" dentro del Centro de Control. Si no hay datos visibles o el tab no destaca, puede parecer que el módulo no existe.

## Solución: Agregar Sub-Módulo de Checklists en Navegación

Exponer el tab de Checklists como un enlace directo en el sidebar para mayor visibilidad.

### Archivo: `src/config/navigationConfig.ts`

Agregar child al módulo `monitoring`:

```typescript
// Líneas 351-372 - Modificar children del módulo monitoring
{
  id: 'monitoring',
  label: 'Monitoreo',
  icon: Activity,
  path: '/monitoring',
  group: 'monitoring',
  children: [
    {
      id: 'monitoring_general',
      label: 'Centro de Control',
      path: '/monitoring',
      icon: Activity
    },
    {
      id: 'monitoring_checklists',    // ← NUEVO
      label: 'Checklists',
      path: '/monitoring?tab=checklists',
      icon: ClipboardList
    },
    {
      id: 'incidentes_rrss',
      label: 'Incidentes RRSS',
      path: '/incidentes-rrss',
      roles: ['admin', 'owner', 'bi', 'monitoring_supervisor'],
      icon: Globe
    }
  ]
}
```

### Archivo: `src/pages/Monitoring/MonitoringPage.tsx`

Leer query param para activar tab automáticamente:

```typescript
// Agregar al inicio del componente
import { useSearchParams } from 'react-router-dom';

// Dentro del componente
const [searchParams] = useSearchParams();
const tabFromUrl = searchParams.get('tab');

// Modificar estado inicial
const [activeTab, setActiveTab] = useState(
  tabFromUrl === 'checklists' ? 'checklists' : 'posicionamiento'
);

// Effect para sincronizar con URL
useEffect(() => {
  if (tabFromUrl === 'checklists') {
    setActiveTab('checklists');
  }
}, [tabFromUrl]);
```

## Resultado Esperado

Sidebar del grupo Monitoreo:
```text
📊 Monitoreo
  ├── Centro de Control
  ├── Checklists ← Nuevo enlace directo
  └── Incidentes RRSS
```

Al hacer clic en "Checklists", navegará a `/monitoring?tab=checklists` y activará el tab automáticamente.

## Nota sobre Datos

La tabla `checklist_servicio` actualmente está vacía. Los datos se llenarán cuando:
1. Un custodio complete su primer checklist desde el portal `/custodian`
2. El flujo de guardado (`useServiceChecklist.ts`) ejecute correctamente el `upsert`

El módulo de monitoreo mostrará "0 servicios" hasta que existan registros.

## Testing

- [ ] Verificar que el link "Checklists" aparece en el sidebar de Monitoreo
- [ ] Confirmar que `/monitoring?tab=checklists` activa el tab correcto
- [ ] Validar que roles `monitoring` y `monitoreo` pueden ver el nuevo sub-módulo
- [ ] Probar inserción manual de un checklist para verificar visualización
