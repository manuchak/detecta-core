
# Plan: Corregir Espacio Vertical en Módulo de Facturación

## Problema Identificado

El módulo de facturación muestra mucho espacio vacío debajo de los gráficos y tablas porque no está utilizando el sistema de compensación de viewport del proyecto.

### Causa Raíz
El proyecto opera a **70% zoom** y tiene variables CSS que compensan esta escala:
- `--vh-full` = `100vh × 1.4286` (altura real del viewport)
- `--content-height-with-tabs` = altura para contenido con tabs

Los componentes de facturación usan `100vh` directo en vez de `var(--vh-full)`, causando que el contenido no aproveche todo el espacio vertical disponible.

## Archivos a Modificar

| Archivo | Problema | Solución |
|---------|----------|----------|
| `FacturacionDashboard.tsx` | Usa `100vh-340px` | Cambiar a `var(--vh-full)-340px` |
| `ServiciosPorFacturarTab.tsx` | Sin altura dinámica en tabla | Agregar `h-[calc(var(--vh-full)-420px)]` |
| `FacturasListTab.tsx` | Sin altura dinámica en tabla | Agregar `h-[calc(var(--vh-full)-420px)]` |

## Cambios Específicos

### 1. FacturacionDashboard.tsx (línea 85)
```tsx
// ANTES
<div className="h-[calc(100vh-340px)] min-h-[300px]">

// DESPUÉS
<div className="h-[calc(var(--vh-full)-340px)] min-h-[300px]">
```

### 2. ServiciosPorFacturarTab.tsx
Envolver la tabla de clientes en un contenedor con scroll y altura dinámica:
```tsx
// ANTES: Card sin altura fija

// DESPUÉS: Card con scroll interno
<Card>
  <CardContent className="p-0">
    <div className="overflow-auto h-[calc(var(--vh-full)-420px)] min-h-[300px]">
      <Table>...</Table>
    </div>
  </CardContent>
</Card>
```

### 3. FacturasListTab.tsx
Misma solución para la tabla de facturas emitidas:
```tsx
<Card>
  <CardContent className="p-0">
    <div className="overflow-auto h-[calc(var(--vh-full)-420px)] min-h-[300px]">
      <Table>...</Table>
    </div>
  </CardContent>
</Card>
```

## Cálculo de Alturas

El offset de 340px-420px considera:
- TopBar: ~56px
- Header del módulo: ~56px  
- Tabs: ~44px
- KPIs: ~80px
- Toolbar/filtros: ~48px
- Padding: ~40px

**Total aproximado**: 320-420px dependiendo del tab

## Resultado Esperado

| Antes | Después |
|-------|---------|
| Gráficos con ~300px fijos | Gráficos que llenan el viewport |
| Tablas sin scroll con espacio vacío | Tablas con scroll interno que aprovechan altura |
| Contenido no se adapta al zoom | Contenido compensa automáticamente el 70% zoom |

## Referencia de Implementación Correcta

El patrón ya está implementado correctamente en `ServiciosConsulta.tsx` (línea 379):
```tsx
<div className="rounded-md border border-border/50 overflow-auto h-[calc(var(--vh-full)-340px)] min-h-[300px]">
```

Solo se necesita replicar este patrón en los demás componentes del módulo.
