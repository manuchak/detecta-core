

# Plan: Eliminar Scroll Innecesario en Sidebar

## Diagnóstico Refinado

El sidebar muestra scroll incluso con espacio disponible porque:

1. **`SidebarContent`** tiene `overflow-auto` siempre activo
2. **Header del sidebar** (botón de colapso) ocupa ~48px adicionales
3. **Footer condicional** (Vista Rápida) añade ~80px cuando hay stats
4. **Distribución flexbox** no está optimizada para el contenido real

### Cálculo del Espacio

```text
Altura total disponible: calc(100svh - 3.5rem)  ≈ ~564px (viewport 900px)

Actualmente usado:
- Header (toggle):     ~48px
- Content (grupos):    variable
- Footer (stats):      ~80px (cuando existe)
─────────────────────────────────
Espacio efectivo para navegación: ~436px
```

## Solución Propuesta

### 1. Reestructurar Layout del Sidebar

**Archivo**: `src/components/navigation/UnifiedSidebar.tsx`

Cambiar la estructura para usar mejor el espacio vertical:

```text
ANTES                          DESPUÉS
┌─────────────────┐            ┌─────────────────┐
│ [◀] toggle      │ 48px       │ Grupos de       │
│─────────────────│            │ navegación      │
│ Grupos (scroll) │ flex-1     │ (sin scroll     │
│                 │            │  si caben)      │
│─────────────────│            │                 │
│ Vista Rápida    │ ~80px      │─────────────────│
└─────────────────┘            │ [◀] [⚙]        │ 48px
                               └─────────────────┘
```

**Cambios específicos**:
- Mover toggle de colapso al footer (junto con stats condensados)
- Eliminar header del sidebar, ganando 48px
- Footer compacto: toggle + stats en una línea

### 2. Optimizar SidebarContent

**Archivo**: `src/components/ui/sidebar.tsx` (línea 405)

Cambiar comportamiento de overflow:

```tsx
// ANTES
"overflow-auto group-data-[collapsible=icon]:overflow-hidden"

// DESPUÉS  
"overflow-y-auto overflow-x-hidden scrollbar-thin group-data-[collapsible=icon]:overflow-hidden"
```

Y agregar clases CSS para ocultar scrollbar cuando no es necesaria.

### 3. Footer Rediseñado

**Archivo**: `src/components/navigation/UnifiedSidebar.tsx`

Nuevo footer compacto que combina toggle + stats:

```tsx
<SidebarFooter className="border-t border-sidebar-border p-2 mt-auto">
  <div className="flex items-center justify-between">
    {/* Stats condensados en chips */}
    {!isCollapsed && stats && (
      <div className="flex gap-1.5 flex-wrap">
        {stats.criticalAlerts > 0 && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-destructive/10 text-destructive">
            {stats.criticalAlerts} alertas
          </span>
        )}
        {/* ... más stats como chips */}
      </div>
    )}
    
    {/* Toggle siempre visible */}
    <Button variant="ghost" size="icon" onClick={toggleSidebar}>
      <ChevronLeft className={cn("h-4 w-4", isCollapsed && "rotate-180")} />
    </Button>
  </div>
</SidebarFooter>
```

### 4. Grupos Más Compactos

Reducir espaciado vertical entre elementos:

| Elemento | Actual | Propuesto |
|----------|--------|-----------|
| `SidebarGroupLabel` padding | `py-1.5` | `py-1` |
| `SidebarMenuItem` gap | `space-y-0.5` | `space-y-px` |
| Separadores entre grupos | `my-2` | `my-1` |
| `SidebarMenuButton` padding | `py-2.5` | `py-2` |

### 5. CSS para Scrollbar Inteligente

**Archivo**: `src/index.css`

```css
/* Ocultar scrollbar cuando no es necesaria */
[data-sidebar="content"] {
  scrollbar-gutter: stable;
}

[data-sidebar="content"]::-webkit-scrollbar {
  width: 4px;
}

[data-sidebar="content"]::-webkit-scrollbar-thumb {
  background: transparent;
  border-radius: 2px;
}

[data-sidebar="content"]:hover::-webkit-scrollbar-thumb {
  background: hsl(var(--sidebar-border));
}
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/navigation/UnifiedSidebar.tsx` | Reestructurar: eliminar header, footer compacto, reducir espaciado |
| `src/components/ui/sidebar.tsx` | Optimizar overflow en SidebarContent |
| `src/index.css` | Estilos de scrollbar condicional |

## Resultado Esperado

- **Sin scroll** cuando todos los grupos caben en el viewport
- **Scroll suave** solo cuando el contenido excede el espacio
- **Scrollbar invisible** hasta hacer hover
- **~50px más** de espacio vertical para navegación
- Footer siempre visible con toggle accesible

## Verificación

1. Con todos los grupos colapsados: sin scroll
2. Con 1-2 grupos expandidos: sin scroll (si caben)
3. Con muchos grupos expandidos: scroll visible solo al hacer hover
4. Toggle de colapso siempre accesible en footer

