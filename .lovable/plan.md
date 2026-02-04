

# Plan: Agregar Módulo Facturación al Sidebar

## Diagnóstico

El módulo de Facturación fue agregado a:
- ✅ `GlobalNav.tsx` (barra superior) - Sí aparece ahí
- ❌ `navigationConfig.ts` (sidebar lateral) - **Falta agregar**

El usuario está viendo el sidebar (`UnifiedSidebar`), que lee su configuración desde `navigationConfig.ts`.

---

## Solución

### Cambio 1: Agregar icono Receipt al import

```typescript
// src/config/navigationConfig.ts - línea 1-31
import { 
  // ... iconos existentes ...
  Receipt  // NUEVO
} from 'lucide-react';
```

### Cambio 2: Agregar módulo Facturación

Agregar después del módulo `wms` en el grupo **operations**:

```typescript
{
  id: 'facturacion',
  label: 'Facturación',
  icon: Receipt,
  path: '/facturacion',
  group: 'operations',  // Agrupado con Operaciones
  roles: [
    'admin', 
    'owner', 
    'bi',
    'facturacion_admin', 
    'facturacion',
    'finanzas_admin',
    'finanzas',
    'coordinador_operaciones'
  ],
  children: [
    {
      id: 'facturacion_dashboard',
      label: 'Dashboard BI',
      path: '/facturacion',
      icon: LayoutDashboard
    },
    {
      id: 'facturacion_servicios',
      label: 'Servicios',
      path: '/facturacion?tab=servicios',
      icon: FileText
    }
  ]
}
```

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/config/navigationConfig.ts` | Agregar import de `Receipt` + módulo facturación |

---

## Resultado Esperado

El módulo de Facturación aparecerá en el sidebar dentro del grupo **OPERACIONES**, con:
- Icono de Receipt (recibo)
- Submenús: Dashboard BI, Servicios
- Acceso restringido a roles de facturación/finanzas

```text
OPERACIONES
├── Planeación
├── Servicios
├── Instaladores
├── Rutas
├── WMS
└── Facturación ← NUEVO
    ├── Dashboard BI
    └── Servicios
```

