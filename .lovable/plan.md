
# Plan: Facturación como Grupo Independiente en Sidebar

## Situación Actual

Facturación está configurado dentro del grupo **"operations"**, pero debe ser un grupo separado como Dashboard, Operaciones, etc.

## Cambios a Realizar

### Archivo: `src/config/navigationConfig.ts`

#### 1. Agregar nuevo grupo "facturacion" en `navigationGroups`

```typescript
export const navigationGroups: NavigationGroup[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'supply', label: 'Supply & Talento', icon: Users },
  { id: 'operations', label: 'Operaciones', icon: CalendarCheck },
  { id: 'facturacion', label: 'Facturación', icon: Receipt },  // NUEVO
  { id: 'monitoring', label: 'Monitoreo & Soporte', icon: Radio },
  { id: 'system', label: 'Sistema', icon: Settings, defaultCollapsed: true },
];
```

#### 2. Cambiar el módulo facturacion de `group: 'operations'` a `group: 'facturacion'`

```typescript
{
  id: 'facturacion',
  label: 'Facturación',
  icon: Receipt,
  path: '/facturacion',
  group: 'facturacion',  // Cambiado de 'operations'
  roles: ['admin', 'owner', 'bi', 'facturacion_admin', 'facturacion', 'finanzas_admin', 'finanzas', 'coordinador_operaciones'],
  children: [...]
}
```

## Resultado Visual en Sidebar

```text
DASHBOARD
├── Ejecutivo
└── KPIs

SUPPLY & TALENTO
├── Pipeline
└── ...

OPERACIONES
├── Planeación
├── Servicios
├── WMS
└── ...

FACTURACIÓN          ← NUEVO GRUPO INDEPENDIENTE
├── Dashboard BI
└── Servicios

MONITOREO & SOPORTE
└── ...

SISTEMA ▾
└── ...
```

## Roles con Acceso

| Rol | Nivel de Acceso |
|-----|-----------------|
| `admin` | Completo |
| `owner` | Completo |
| `bi` | Completo |
| `facturacion_admin` | Completo |
| `finanzas_admin` | Completo |
| `facturacion` | Limitado (consulta) |
| `finanzas` | Limitado (consulta) |
| `coordinador_operaciones` | Completo |
