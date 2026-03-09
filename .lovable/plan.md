

# Plan: Integrar Cálculo Automático de Estadías en Generación de Cortes

## Problema

El generador de cortes (`useCreateCxPCorte`) busca estadías en `detenciones_servicio` (tabla vacía). Mientras tanto, hay 14 servicios esta semana con más de 4 horas en destino (datos reales de eventos de ruta), incluyendo uno de 12.7 horas. Estos no se incluyen en los cortes.

**Datos de la semana 02-08 Mar:**

| Custodio | Servicio | Horas en destino |
|----------|----------|-----------------|
| Fernando Nava | LOERLLO-377 | 12.7h |
| Rodrigo Becerril | ASCAAST-1518 | 8.4h |
| Marcos Martínez | MGESCAB-1 | 8.2h |
| Israel Lona | SIINSRH-782 | 6.4h |
| José Luis Mendoza | ASCAAST-1522 | 6.3h |
| ...y 9 más con >4h | | |

Ninguno fue incluido en los cortes porque `detenciones_servicio` está vacía.

## Solución

Modificar `useCreateCxPCorte` en `useCxPCortesSemanales.ts` para que, **además** de consultar `detenciones_servicio`, calcule estadías automáticamente desde `servicio_eventos_ruta` (igual que `useEstadiasCalculadas`).

### Lógica de cálculo

Para cada servicio del custodio en la semana:
1. Buscar eventos `llegada_destino` y `liberacion_custodio`
2. Calcular delta en horas
3. Aplicar umbral mínimo de cortesía (usar `CXP_TARIFA_ESTADIA_HORA` existente, con un umbral de 4 horas por defecto como piso)
4. Si excede, agregar detalle de tipo `estadia` al corte

### Cambios

| Archivo | Cambio |
|---------|--------|
| `useCxPCortesSemanales.ts` | En la sección de estadías (líneas 175-200), agregar query a `servicio_eventos_ruta` para calcular horas en destino cuando `detenciones_servicio` no tiene registros. Usar `CXP_TARIFA_ESTADIA_HORA` y un umbral configurable (4h default). |
| `GenerarCortesMasivosDialog.tsx` | En `useOperativosConServicios`, replicar el cálculo de estadías desde eventos de ruta para que la previsualización muestre el monto estimado incluyendo estadías. |

### Detalle técnico del cálculo en el corte

```text
Para cada servicio del custodio:
  1. Query: servicio_eventos_ruta WHERE servicio_id IN (ids) 
     AND tipo_evento IN ('llegada_destino', 'liberacion_custodio')
  2. Para cada par llegada/liberación:
     delta_hrs = (liberación - llegada) / 3600000
     excedente = max(0, delta_hrs - UMBRAL_CORTESIA_CUSTODIO)
     if excedente > 0:
       monto = excedente * CXP_TARIFA_ESTADIA_HORA
       → agregar detalle concepto='estadia'
```

Esto se ejecuta **solo si** no hay registros en `detenciones_servicio` para esos servicios, evitando duplicar cobros cuando sí existen detenciones manuales.

