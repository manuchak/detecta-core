

# Reporte de Evolución de Tiempos de Servicio — 2 Vistas

## Vista 1: Tabla de Tiempos

Nueva pestaña "Tiempos" en el Centro de Monitoreo con una tabla que consolida la línea de tiempo completa de cada servicio.

**Columnas:**
| Folio | Cliente | Custodio | Cita (planeación) | Inicio (monitoreo) | Combustible | Baño | Descanso | Pernocta | Incidencia | Llegada Destino | Liberación | ΔOrigen (min) | ΔDestino (min) | ΔTotal (min) |

**Fuentes de datos:**
- `servicios_planificados`: `id_servicio` (folio), `nombre_cliente`, `custodio_asignado`, `fecha_hora_cita`, `hora_inicio_real`, `hora_fin_real`
- `servicio_eventos_ruta`: agrupado por `servicio_id` y `tipo_evento`, sumando `duracion_segundos` para cada tipo de evento especial. Timestamps de `inicio_servicio`, `llegada_destino`, `liberacion_custodio` extraídos directamente.

**Campos calculados:**
- **ΔOrigen** = minutos entre `fecha_hora_cita` y evento `inicio_servicio`
- **ΔDestino** = minutos entre evento `llegada_destino` y evento `liberacion_custodio`
- **ΔTotal** = ΔOrigen + ΔDestino

**Hook**: `useServiceTimesReport.ts` — un query que hace JOIN entre `servicios_planificados` y `servicio_eventos_ruta`, con filtros de fecha y cliente.

**Componente**: `ServiceTimesTable.tsx` — tabla con `@tanstack/react-table`, filtros por rango de fechas y cliente, exportable a Excel (xlsx ya instalado).

## Vista 2: Detalle de Bitácora con Mapa

Al hacer clic en una fila de la tabla, se abre un panel/modal de detalle a pantalla completa con 2 columnas:

**Columna izquierda — Mapa (Mapbox):**
- Ruta road-snapped usando `useBitacoraTraza` (ya existe)
- Marcador verde en origen con hora, marcador rojo en destino con hora
- Marcadores azules en puntos de checkpoint
- Marcadores naranjas/rojos en puntos de eventos especiales
- Tiempo total del trayecto mostrado como overlay

**Columna derecha — Cronología:**
- Timeline vertical con cada evento en orden cronológico
- Cada entrada muestra: hora, tipo, descripción, ubicación, fotos (thumbnails clickeables), duración
- Resumen al final con totales de paradas y tiempos

**Exportación PDF:**
- Evolución del `BitacoraGenerator.tsx` existente para incluir:
  - Mapa estático (Mapbox Static Images API con los puntos) como imagen en la primera página
  - Cronología completa con fotos embebidas
  - Tabla resumen de tiempos (ΔOrigen, ΔDestino, ΔTotal)
  - Header/footer del sistema de diseño existente (`ReportPage`)

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| `src/hooks/useServiceTimesReport.ts` | **Crear** — Query que cruza servicios + eventos, calcula deltas |
| `src/components/monitoring/tiempos/ServiceTimesTable.tsx` | **Crear** — Tabla principal con filtros |
| `src/components/monitoring/tiempos/ServiceDetailView.tsx` | **Crear** — Vista detalle 2 columnas (mapa + cronología) |
| `src/components/monitoring/tiempos/ServiceDetailMap.tsx` | **Crear** — Mapa Mapbox con ruta y marcadores de eventos |
| `src/components/monitoring/tiempos/ServiceTimesPanel.tsx` | **Crear** — Contenedor que alterna tabla ↔ detalle |
| `src/components/monitoring/tiempos/ServiceDetailPDF.tsx` | **Crear** — Documento PDF mejorado con mapa estático + cronología |
| `src/pages/Monitoring/MonitoringPage.tsx` | **Modificar** — Agregar tab "Tiempos" |

Sin cambios de base de datos — toda la información ya existe en `servicios_planificados` y `servicio_eventos_ruta`.

