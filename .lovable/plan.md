

## Agregar Customer Success al Menu Lateral (Sidebar)

### Cambio Principal

Se agrega Customer Success como un nuevo grupo en la navegacion lateral (`UnifiedSidebar`), con 6 sub-secciones que corresponden a las tabs del modulo. Esto sigue exactamente el mismo patron que los demas modulos (Facturacion, LMS, Monitoreo, etc.).

### Archivo a Modificar

**`src/config/navigationConfig.ts`**

1. Importar el icono `HeartHandshake` de lucide-react
2. Agregar un nuevo grupo `'customer-success'` al array `navigationGroups` (despues de `facturacion` y antes de `monitoring`):
   - id: `'customer-success'`
   - label: `'Customer Success'`
   - icon: `HeartHandshake`
3. Agregar un nuevo modulo al array `navigationModules` con:
   - id: `'customer-success'`
   - label: `'Customer Success'`
   - icon: `HeartHandshake`
   - path: `'/customer-success'`
   - group: `'customer-success'`
   - roles: `['admin', 'owner', 'customer_success', 'ejecutivo_ventas', 'coordinador_operaciones']`
   - children con 6 sub-secciones:

| Sub-seccion | id | path | Icono |
|---|---|---|---|
| Dashboard | `cs_dashboard` | `/customer-success` | `LayoutDashboard` |
| Retencion | `cs_retencion` | `/customer-success?tab=retencion` | `TrendingUp` |
| Quejas | `cs_quejas` | `/customer-success?tab=quejas` | `ClipboardList` |
| Clientes | `cs_clientes` | `/customer-success?tab=clientes` | `Users` |
| CAPA | `cs_capa` | `/customer-success?tab=capa` | `CheckCircle2` |
| Mejora Continua | `cs_mejora` | `/customer-success?tab=mejora` | `BarChart3` |

### Archivo Adicional a Modificar

**`src/pages/CustomerSuccess/CustomerSuccessPage.tsx`**

Integrar `useSearchParams` para que las sub-secciones del sidebar controlen la tab activa (siguiendo el patron estandar del proyecto con `?tab=`). Actualmente el componente usa `Tabs defaultValue="dashboard"` sin sincronizacion con la URL. Se cambiara a un `Tabs` controlado donde el valor viene de `searchParams.get('tab') || 'dashboard'`.

### Resultado

El equipo de Customer Success vera en el sidebar izquierdo:

```text
CUSTOMER SUCCESS
  > Dashboard
  > Retencion
  > Quejas
  > Clientes
  > CAPA
  > Mejora Continua
```

Cada sub-seccion navega directamente a la tab correspondiente sin recargar la pagina.
