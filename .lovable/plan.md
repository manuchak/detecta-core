
# Plan: Acceso a Rutas en Sidebar + Estrategia de Colapso de Grupos

## Problema Identificado

1. **Rutas sin acceso directo**: El módulo de Rutas existe como sub-tab de Planeación pero no tiene entrada en el sidebar principal
2. **Sobrecarga visual**: 5 grupos con 16 módulos totales pueden saturar visualmente el sidebar

---

## Análisis de Módulos por Grupo

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     DISTRIBUCIÓN ACTUAL DE MÓDULOS                       │
├──────────────────────┬──────────────────────────────────────────────────┤
│ Dashboard (2)        │ Dashboard, CRM Hub                               │
├──────────────────────┼──────────────────────────────────────────────────┤
│ Supply & Talento (3) │ Pipeline, Estrategia, Perfiles                   │
├──────────────────────┼──────────────────────────────────────────────────┤
│ Operaciones (4)      │ Planeación, Servicios, Instaladores, WMS         │
│                      │ + Rutas (NUEVO - a agregar)                      │
├──────────────────────┼──────────────────────────────────────────────────┤
│ Monitoreo (2)        │ Monitoreo, Tickets                               │
├──────────────────────┼──────────────────────────────────────────────────┤
│ Sistema (5)          │ Capacitación, Admin, Herramientas, Docs, Config  │
└──────────────────────┴──────────────────────────────────────────────────┘
```

---

## Propuesta de Solución

### Parte 1: Agregar "Rutas" al Sidebar

Agregar módulo "Rutas" en navigationConfig.ts dentro del grupo Operaciones, como acceso directo a `/planeacion?tab=routes`:

| Campo | Valor |
|-------|-------|
| **id** | `routes` |
| **label** | `Rutas` |
| **icon** | `ArrowLeftRight` o `Route` |
| **path** | `/planeacion?tab=routes` |
| **group** | `operations` |
| **roles** | `admin`, `owner`, `coordinador_operaciones`, `planificador` |

---

### Parte 2: Estrategia de Colapso de Grupos

Dado el análisis, recomiendo **colapsar por defecto el grupo "Sistema"** ya que:
- Es el grupo con más módulos (5)
- Contiene herramientas de administración usadas con menor frecuencia
- Los grupos operativos (Supply, Operaciones, Monitoreo) son de uso diario

**Implementación técnica**: Modificar UnifiedSidebar para soportar grupos colapsables por defecto:

```text
┌─────────────────────────────────────────────────────┐
│  SIDEBAR PROPUESTO                                  │
├─────────────────────────────────────────────────────┤
│  ▼ Dashboard                                        │
│     Dashboard                                       │
│     CRM Hub                                         │
│                                                     │
│  ▼ Supply & Talento                                 │
│     Pipeline                                        │
│     Estrategia                                      │
│     Perfiles                                        │
│                                                     │
│  ▼ Operaciones                                      │
│     Planeación                                      │
│     Rutas  [127]  ← NUEVO con badge                 │
│     Servicios                                       │
│     Instaladores                                    │
│     WMS                                             │
│                                                     │
│  ▼ Monitoreo & Soporte                              │
│     Monitoreo                                       │
│     Tickets                                         │
│                                                     │
│  ► Sistema  (5)   ← COLAPSADO por defecto           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/config/navigationConfig.ts` | Agregar módulo "Rutas" en grupo operations |
| `src/components/navigation/UnifiedSidebar.tsx` | Implementar grupos colapsables con `defaultCollapsed` |

---

## Detalles Técnicos

### 1. Nuevo módulo en navigationConfig.ts

```typescript
{
  id: 'routes',
  label: 'Rutas',
  icon: ArrowLeftRight,
  path: '/planeacion?tab=routes',
  group: 'operations',
  roles: ['admin', 'owner', 'coordinador_operaciones', 'planificador'],
}
```

### 2. Grupos colapsables en navigationGroups

```typescript
export interface NavigationGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  defaultCollapsed?: boolean;  // ← NUEVO
}

export const navigationGroups: NavigationGroup[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'supply', label: 'Supply & Talento', icon: Users },
  { id: 'operations', label: 'Operaciones', icon: CalendarCheck },
  { id: 'monitoring', label: 'Monitoreo & Soporte', icon: Radio },
  { id: 'system', label: 'Sistema', icon: Settings, defaultCollapsed: true },
];
```

### 3. UnifiedSidebar con colapso de grupos

```typescript
// Estado para grupos colapsados
const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => {
  return navigationGroups
    .filter(g => g.defaultCollapsed)
    .map(g => g.id);
});

// Toggle de grupo
const toggleGroupCollapse = (groupId: string) => {
  setCollapsedGroups(prev => 
    prev.includes(groupId) 
      ? prev.filter(id => id !== groupId)
      : [...prev, groupId]
  );
};

// Renderizado con chevron en header de grupo
{!isCollapsed && (
  <SidebarGroupLabel 
    className="px-3 py-1.5 cursor-pointer flex items-center justify-between"
    onClick={() => toggleGroupCollapse(group.id)}
  >
    <span>{group.label}</span>
    <ChevronDown className={cn(
      "h-3 w-3 transition-transform",
      collapsedGroups.includes(group.id) && "-rotate-90"
    )} />
  </SidebarGroupLabel>
)}
```

---

## Badge Dinámico para Rutas Pendientes

Agregar badge en el sidebar que muestre rutas con precios pendientes:

```typescript
// En UnifiedSidebar, usar hook existente
const { data: routesStats } = useRoutesStats();

// En renderModule, mostrar badge si es el módulo 'routes'
{module.id === 'routes' && (routesStats?.pendingPrices || 0) > 0 && (
  <Badge variant="destructive" className="ml-auto h-5 min-w-5 text-[10px]">
    {routesStats.pendingPrices}
  </Badge>
)}
```

---

## Flujo de Usuario Mejorado

```text
1. Usuario abre sidebar
2. Ve grupos principales expandidos (Dashboard, Supply, Ops, Monitoreo)
3. Ve "Rutas [127]" con badge rojo indicando pendientes
4. Clic en Rutas → navega a /planeacion?tab=routes
5. Grupo "Sistema" colapsado → clic para expandir si necesita
```

---

## Beneficios

| Beneficio | Impacto |
|-----------|---------|
| **Acceso directo a Rutas** | 1 clic vs 2 (antes: Planeación → tab Rutas) |
| **Visibilidad de pendientes** | Badge siempre visible en sidebar |
| **Menor carga cognitiva** | Sistema colapsado reduce ruido visual |
| **Escalabilidad** | Patrón reutilizable para futuros grupos grandes |

