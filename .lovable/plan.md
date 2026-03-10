

# Agregar "Tráfico" como tipo de parada en el sistema de monitoreo

## Problema
El menú de eventos especiales (Combustible, Baño, Descanso, Pernocta, Incidencia) no incluye "Tráfico", que es una parada operativa común que los monitoristas necesitan registrar.

## Análisis de impacto en facturación
- **Sin impacto en cobros**: Las paradas por tráfico NO son cobrables al cliente ni pagables al custodio. El hook `usePreFacturaInteligente` solo factura `pernocta` y `estadia` (delta llegada→liberación). Tráfico no altera esos cálculos.
- **Sin impacto en estadías**: El cálculo de estadías (`useEstadiasCalculadas`) se basa en el delta entre `llegada_destino` y `liberacion_custodio`, no en eventos intermedios.
- **Sí aparecerá en reportes de tiempos**: Se agregará como columna en la tabla de Tiempos y en los PDFs, lo cual da visibilidad operativa sin afectar montos.

## Archivos a modificar (10 archivos)

### 1. Tipos y definiciones centrales
- **`src/hooks/useEventosRuta.ts`** — Agregar `'trafico'` al type `TipoEventoRuta` y al mapa `EVENTO_ICONS` con icono `🚧` y color chart-4.
- **`src/hooks/useBitacoraBoard.ts`** — Agregar `'trafico'` al type `SpecialEventType` y al array `SPECIAL_EVENT_TYPES`.
- **`src/hooks/useServiciosTurnoLive.ts`** — Mismo cambio: agregar `'trafico'` al type y array de eventos especiales (Radar).

### 2. UI de Bitácora (menú de eventos y tarjetas)
- **`src/components/monitoring/bitacora/ServiceCardActive.tsx`** — Agregar entrada `{ tipo: 'trafico', icon: <Construction>, label: 'Tráfico' }` al array `SPECIAL_EVENTS`. Importar `Construction` de lucide-react.
- **`src/components/monitoring/bitacora/ServiceCardSpecialEvent.tsx`** — Agregar `'trafico'` al array `ROUTINE_TYPES` (paradas rutinarias que no escalan alerta).
- **`src/components/monitoring/bitacora/EventTracker.tsx`** — Agregar `'trafico'` al array `EVENT_TYPES`.

### 3. Reportes y PDFs
- **`src/hooks/useServiceTimesReport.ts`** — Agregar `'trafico'` al type `EventoTipo`, al array `SPECIAL_EVENTS`, y al interface `ServiceTimeRow` con campo `trafico: number`. Agregar `sumDuration('trafico')` en el builder.
- **`src/components/monitoring/tiempos/ServiceTimesTable.tsx`** — Agregar columna `🚧` para tráfico entre descanso y pernocta.
- **`src/components/monitoring/tiempos/ServiceDetailPDF.tsx`** — Agregar `trafico: 'Parada — Tráfico'` al `LABEL_MAP` y fila `🚧 Tráfico` en la tabla de resumen.
- **`src/components/monitoring/bitacora/BitacoraGenerator.tsx`** — Agregar `trafico: 'Parada — Tráfico'` al `LABEL_MAP`.

### 4. Detenciones (Facturación) — Solo etiqueta
- **`src/pages/Facturacion/hooks/useDetenciones.ts`** — Agregar `'trafico'` al type `TipoDetencion` y `trafico: 'Tráfico'` al mapa `TIPOS_DETENCION` para consistencia, con `cobrable_cliente: false` por defecto.

No se requieren migraciones SQL (la columna `tipo_evento` en `servicio_eventos_ruta` es `text`, acepta cualquier valor).

