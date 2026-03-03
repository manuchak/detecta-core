

# Agregar todos los módulos al Acceso Rápido de /home

## Problema

La sección "Acceso Rápido" del admin solo muestra 6 módulos: Dashboard BI, Candidatos, Planeación, Monitoreo, Inventario, Configuración. Faltan módulos como Facturación, CRM, Legal, Customer Success, Rutas, LMS, Seguridad, Perfiles, Estrategia, Tickets, Servicios, Instaladores, etc.

## Cambios

### Archivo: `src/config/roleHomeConfig.ts`

1. Agregar las definiciones de módulos faltantes al objeto `MODULES`:

| ID | Label | Ruta | Icono |
|---|---|---|---|
| `facturacion` | Facturación | `/facturacion` | `Receipt` |
| `crm` | CRM Hub | `/crm` | `Building2` |
| `legal` | Legal | `/legal` | `Scale` |
| `customerSuccess` | Customer Success | `/customer-success` | `HeartHandshake` |
| `rutas` | Rutas | `/rutas` | `Route` |
| `lms` | Capacitación | `/lms` | `GraduationCap` |
| `seguridad` | Seguridad | `/seguridad` | `ShieldCheck` |
| `perfiles` | Perfiles | `/perfiles-operativos` | `UserCog` |
| `estrategia` | Estrategia | `/recruitment-strategy` | `Target` |

2. Actualizar `admin.modules` para incluir **todos** los módulos del sistema:

```typescript
modules: [
  'bi', 'leads', 'planeacion', 'services', 'monitoring',
  'wms', 'facturacion', 'crm', 'customerSuccess', 'legal',
  'rutas', 'lms', 'seguridad', 'perfiles', 'estrategia',
  'tickets', 'installers', 'incidentes', 'reports', 'settings'
]
```

3. Actualizar `owner.modules` de forma similar (tiene los mismos privilegios).

### Archivo: `src/components/home/ModuleGrid.tsx`

Ajustar el grid para acomodar más módulos: cambiar a `grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8` para que todos quepan sin scroll excesivo.

## Resultado

- Admin y Owner ven acceso directo a todos los módulos del sistema (~20 módulos)
- Otros roles mantienen sus módulos actuales sin cambios
- Grid se adapta responsivamente al mayor número de módulos

