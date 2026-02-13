

## Rediseño: Happy Index basado en actividad operativa

### Problema actual

La logica de loyalty/health usa `dias_sin_contacto` basado exclusivamente en `cs_touchpoints` (tabla vacia). Resultado: 80/80 clientes = "En Riesgo". Mientras tanto, hay 108 clientes con 2,410 servicios activos en 90 dias, GMV de millones, y 0 quejas la mayoria.

### Nuevo modelo: Happy Index multi-señal

El "ultimo contacto" debe ser la fecha mas reciente entre:
- Ultimo servicio prestado (señal mas fuerte, ya existe en los datos)
- Ultimo touchpoint formal (cuando existan)

Ademas, la clasificacion de stage debe considerar **frecuencia de servicio** y **tendencia de GMV** como indicadores positivos, no solo la ausencia de problemas.

### Señales operativas a incorporar

| Señal | Fuente | Peso en salud |
|---|---|---|
| Dias desde ultimo servicio | servicios_custodia.fecha_hora_cita | Reemplaza dias_sin_contacto como primario |
| Frecuencia de servicios (90d) | COUNT servicios 90d | Indicador de engagement |
| Tendencia GMV (mes actual vs anterior) | SUM cobro_cliente por mes | Crecimiento = salud positiva |
| Quejas abiertas | cs_quejas | Señal negativa (mantener) |
| CAPAs pendientes | cs_capa | Señal negativa (mantener) |
| Touchpoints formales | cs_touchpoints | Complementario cuando existan |

### Cambios tecnicos

**Archivo 1: `src/hooks/useCSLoyaltyFunnel.ts`**

1. **dias_sin_contacto** (lineas 145-152): Usar `MAX(ultimo_servicio, ultimo_touchpoint)` como ultimo contacto real
2. **calculateStage** (lineas 40-83): Ajustar umbrales para que un cliente con servicios recientes y sin quejas no caiga en "en_riesgo"
   - En Riesgo: quejas >= 2 OR (dias_sin_contacto > 60 AND dias_sin_servicio > 60)
   - Leal: >= 6 meses, 0 quejas, servicio o contacto en ultimos 30 dias
   - Promotor: leal + CSAT >= 4.5 (cuando existe) + 0 CAPAs
   - Activo: servicio en ultimos 60 dias, sin quejas graves

**Archivo 2: `src/hooks/useCSRetentionMetrics.ts`**

1. **diasPromedioSinContacto** (lineas 84-92): Incorporar fecha de ultimo servicio por cliente como fallback/complemento al touchpoint
2. Esto corrige el KPI "Dias promedio sin contacto" que hoy muestra 999

**Archivo 3: `src/hooks/useCSHealthScores.ts`**

1. **useCSClientesConQuejas** (lineas 56-85): Agregar fetch de servicios por cliente para calcular `diasSinContacto` usando la fecha de ultimo servicio
2. Agregar campo `servicios_recientes` (count 90d) y `gmv_tendencia` (up/down/stable) al objeto retornado para enriquecer los semaforos de salud
3. Ajustar la logica de riesgo:
   - critico: quejas >= 3 OR (sin servicio > 60 dias AND sin touchpoint > 60 dias)
   - alto: quejas >= 2 OR sin actividad > 30 dias
   - medio: quejas >= 1
   - bajo: default (tiene servicios recientes, sin quejas)

### Resultado esperado con datos reales

| Cliente | Hoy (roto) | Despues (corregido) |
|---|---|---|
| ASTRA ZENECA (345 svcs, $2.8M, 0 quejas) | En Riesgo | Leal/Promotor |
| SIEGFRIED RHEIN (182 svcs, $810K, 0 quejas) | En Riesgo | Leal |
| LOGER (151 svcs, $2.3M, 0 quejas) | En Riesgo | Leal |
| Cliente sin servicios 90d + 2 quejas | En Riesgo | En Riesgo (correcto) |
| Cliente nuevo, 3 servicios, 0 quejas | En Riesgo | Nuevo/Activo |

La distribucion del funnel pasara de 100% "En Riesgo" a una distribucion realista basada en la actividad operativa real de cada cliente.
