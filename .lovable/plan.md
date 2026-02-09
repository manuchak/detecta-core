

# Ocultar tarjeta de Ingresos en el portal de custodios

## Contexto
La tarjeta "Ingresos Totales" se muestra actualmente a los custodios en su dashboard. Se ocultara hasta que los datos esten debidamente auditados.

## Cambios

### 1. `src/pages/custodian/CustodianDashboard.tsx` (lineas 117-128)
- Eliminar (o comentar) el bloque `<Card>` de "Ingresos Totales" que muestra `stats.ingresos_totales`
- El grid de stats pasara de 3 tarjetas a 2 (Servicios Completados + Kilometros Recorridos)

### 2. `src/pages/admin/CustodianPortalAdmin.tsx` (lineas 209-218)
- Eliminar (o comentar) el bloque `<Card>` de "Ingresos" que muestra `mockStats.ingresos_totales`
- Vista admin tambien se alinea para no mostrar datos no auditados

Los hooks (`useCustodianServices`, `useCustodianEngagement`) seguiran calculando `ingresos_totales` internamente sin cambios, para que cuando se reactive el feature solo haya que descomentar las tarjetas.

