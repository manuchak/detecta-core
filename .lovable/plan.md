

# Fix: Mostrar Nombres Reales de Custodios + Detalle de Servicios

## Problema
`id_custodio` en `servicios_custodia` es un código numérico (ej. "1279"), no un UUID. El diálogo busca nombres en `candidatos_custodios` usando estos códigos como UUID → no encuentra nada → fallback a "Custodio 1279". Pero el campo `nombre_custodio` ya existe en `servicios_custodia`.

## Cambios

### 1. `GenerarCortesMasivosDialog.tsx` — Usar `nombre_custodio` directamente

En `useOperativosConServicios`:
- Agregar `nombre_custodio` al SELECT de `servicios_custodia`
- Eliminar la query a `candidatos_custodios` (innecesaria)
- Construir el nombre del grouped map directamente: tomar el `nombre_custodio` del primer servicio de cada grupo
- Agregar row expandible: al hacer click en un operativo, mostrar la lista de sus servicios (servicio_id, ruta, fecha, costo_custodio, casetas)

### 2. Detalle expandible por custodio

Cada fila del diálogo será expandible (click o chevron) mostrando:
- Lista de servicios: ID servicio, fecha_hora_cita, origen/destino, costo_custodio, casetas
- Esto responde directamente a "voy a poder ver el detalle de qué le voy a pagar"

### Archivos
| Archivo | Cambio |
|---------|--------|
| `GenerarCortesMasivosDialog.tsx` | Usar `nombre_custodio` de `servicios_custodia`, eliminar query a `candidatos_custodios`, agregar filas expandibles con detalle de servicios |

