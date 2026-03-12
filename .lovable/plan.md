

# Plan Integral: Finance Overview con datos reales + Apoyos correctos

## Problema

El dashboard de Finanzas muestra datos **teóricos** (cobro_cliente/costo_custodio de servicios) como si fueran ingresos/egresos reales. Las tablas financieras (`facturas`, `pagos`, cortes dispersados) aun no tienen registros, así que mostrar estos datos como "Ingresos" y "Egresos" es incorrecto. Además, "Apoyos Pendientes" filtra por `estado = 'pendiente'` (pre-Ops) cuando Finanzas necesita ver los `aprobado` (aprobados por Ops, pendientes de autorización Finanzas).

## Solución

Redefinir las 3 métricas del banner y las 3 attention cards para reflejar la realidad del negocio. Como las tablas financieras están vacías, usar un enfoque **honesto**: mostrar lo real (aunque sea $0) con etiquetas claras.

## Cambios por archivo

### 1. `useFinanceOverview.ts` — Queries reales

**Interface**: Renombrar campos para claridad:
- `facturadoMTD` (de tabla `facturas`, estado != cancelada, fecha_emision en mes)
- `cobradoMTD` (de tabla `pagos`, fecha_pago en mes, estado confirmado)  
- `egresadoMTD` (de `cxp_cortes_semanales` con estado `dispersado` o `pagado`, semana en mes)
- `gmvMTD` (mantener el cálculo actual de cobro_cliente como referencia operativa)
- Apoyos: filtrar `.eq('estado', 'aprobado')` en vez de `'pendiente'`
- Aging: query real a `facturas` donde `fecha_vencimiento < hoy - 60 días` y estado != 'pagada'/'cancelada'

**Queries paralelas** (reemplazar serviciosMTD/serviciosPrev):
```
facturas MTD → supabase.from('facturas').select(...)
pagos MTD → supabase.from('pagos').select(...)  
cortes dispersados → ya existe, solo filtrar por estado
servicios (GMV) → mantener para referencia
apoyos → cambiar filtro a 'aprobado'
```

Comparación vs mes anterior: misma lógica con fechas del mes previo para facturado/cobrado/egresado.

### 2. `PLBanner.tsx` — Etiquetas reales

| Antes | Después |
|-------|---------|
| Ingresos MTD | **Facturado MTD** |
| Egresos MTD | **Egresado MTD** |
| Margen Operativo | **Cobrado MTD** |

Nota al pie: "vs mes anterior, misma fecha" se mantiene. Se agrega línea secundaria con GMV como referencia: "GMV: $X.XM" en texto pequeño debajo del Facturado.

### 3. `AttentionCards.tsx` — Datos y etiquetas correctas

| Card | Antes | Después |
|------|-------|---------|
| Aging >60 días | Hardcoded 0 | Query real a `facturas` con vencimiento >60d |
| Apoyos Pendientes | `estado='pendiente'`, "por aprobar" | `estado='aprobado'`, título **"Apoyos por Autorizar"**, subtítulo "aprobadas por Ops, pendientes Finanzas" |
| CxP por Dispersar | Sin cambio | Sin cambio |

## Nota importante

Dado que `facturas` y `pagos` tienen 0 registros actualmente, Facturado, Cobrado y Aging mostrarán $0 / "—". Esto es correcto — el dashboard reflejará datos reales conforme se opere el flujo financiero completo.

