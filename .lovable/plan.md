
# Plan: Correccion de Fuente de Timestamps en Vista de Facturacion

## Diagnostico

Tras analizar la base de datos, encontre el problema raiz:

### Datos Corruptos en `servicios_custodia`
| Campo | Valor Actual | Problema |
|-------|--------------|----------|
| `hora_inicio_custodia` | `2026-02-03 00:00:00+00` | Solo almacena DATE, tiempo siempre 00:00 |
| `hora_finalizacion` | `2026-02-04 00:00:00+00` | Mismo problema |
| `hora_presentacion` | NULL | Sin datos |
| `hora_arribo` | NULL | Sin datos |
| `duracion_servicio` | NULL | Nunca calculado |

### Datos Correctos en `servicios_planificados`
| Campo | Cobertura | Calidad |
|-------|-----------|---------|
| `hora_inicio_real` | 735/827 (89%) | Timestamps completos con hora real |
| `hora_fin_real` | 0/827 (0%) | Nunca se pobla |
| `hora_llegada_custodio` | 8/827 (1%) | Tipo TIME (sin fecha) |

### Por que la UI muestra "18:00"
La vista usa `sc.hora_inicio_custodia` que es `00:00 UTC`. Al convertir a CDMX (-6h), se muestra como 18:00 del dia anterior.

---

## Solucion

### 1. Actualizar Vista SQL `vw_servicios_facturacion`

Cambiar las fuentes de datos para usar timestamps reales:

```sql
CREATE OR REPLACE VIEW vw_servicios_facturacion AS
SELECT 
  -- ... campos existentes ...
  
  -- TIMELINE CORREGIDO
  -- Presentacion: combinar fecha_cita + hora_llegada si existe
  CASE 
    WHEN sp.hora_llegada_custodio IS NOT NULL 
    THEN (sc.fecha_hora_cita::date + sp.hora_llegada_custodio)::timestamptz
    ELSE sc.hora_presentacion
  END AS hora_presentacion,
  
  -- Inicio: usar hora_inicio_real de planeacion (89% cobertura)
  COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) AS hora_inicio_custodia,
  
  -- Arribo: mantener de custodia
  sc.hora_arribo,
  
  -- Fin: usar updated_time para finalizados, o hora_fin_real si existe
  CASE 
    WHEN sc.estado = 'Finalizado' AND sp.hora_fin_real IS NULL 
    THEN sc.updated_time  -- Proxy: momento de finalizacion
    ELSE COALESCE(sp.hora_fin_real, sc.hora_finalizacion)
  END AS hora_finalizacion,
  
  -- Duracion: recalcular con datos corregidos
  CASE 
    WHEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) IS NOT NULL 
     AND (
       (sc.estado = 'Finalizado' AND sc.updated_time IS NOT NULL) 
       OR sp.hora_fin_real IS NOT NULL
     )
    THEN 
      COALESCE(
        sp.hora_fin_real, 
        CASE WHEN sc.estado = 'Finalizado' THEN sc.updated_time ELSE NULL END
      ) - COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia)
    ELSE NULL
  END AS duracion_calculada,
  
  -- ... resto de campos ...
```

### 2. Campos Afectados

| Campo UI | Fuente Anterior | Fuente Nueva |
|----------|-----------------|--------------|
| Present. | `sc.hora_presentacion` | `fecha_cita + sp.hora_llegada_custodio` |
| Inicio | `sc.hora_inicio_custodia` (corrupto) | `sp.hora_inicio_real` (89% cobertura) |
| Fin | `sc.hora_finalizacion` (corrupto) | `sc.updated_time` para finalizados |
| Duracion | Calculada con datos corruptos | Recalculada con datos reales |

### 3. Archivos a Modificar

```
supabase/migrations/
└── YYYYMMDD_fix_facturacion_timestamps.sql

src/pages/Facturacion/
├── hooks/useServiciosFacturacion.ts    (sin cambios - interface ya correcta)
└── components/ServiciosConsulta.tsx    (sin cambios - UI ya correcta)
```

---

## Migracion SQL Completa

```sql
-- Actualizar vista con fuentes de timestamp corregidas
DROP VIEW IF EXISTS vw_servicios_facturacion;

CREATE VIEW vw_servicios_facturacion AS
SELECT 
  sc.id,
  sc.id_servicio AS folio_saphiro,
  sc.id_servicio,
  sp.id_servicio AS folio_planeacion,
  sc.folio_cliente,
  sp.id_interno_cliente AS referencia_cliente,
  sp.id_interno_cliente,
  
  -- Timeline Planeacion
  sp.created_at AS fecha_recepcion,
  sp.fecha_asignacion,
  sp.fecha_asignacion_armado,
  
  -- Timeline Operativo CORREGIDO
  sc.fecha_hora_cita,
  sc.fecha_hora_asignacion,
  
  -- Presentacion: combinar fecha con hora si existe
  CASE 
    WHEN sp.hora_llegada_custodio IS NOT NULL 
    THEN (sc.fecha_hora_cita::date + sp.hora_llegada_custodio)::timestamptz
    ELSE sc.hora_presentacion
  END AS hora_presentacion,
  
  -- Inicio: preferir hora_inicio_real de planeacion
  COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) AS hora_inicio_custodia,
  
  -- Arribo
  sc.hora_arribo,
  
  -- Fin: usar updated_time como proxy para finalizados
  CASE 
    WHEN sc.estado = 'Finalizado' AND sp.hora_fin_real IS NULL 
    THEN sc.updated_time
    ELSE COALESCE(sp.hora_fin_real, sc.hora_finalizacion)
  END AS hora_finalizacion,
  
  -- Duracion original
  sc.duracion_servicio,
  
  -- Duracion calculada con datos corregidos
  CASE 
    WHEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) IS NOT NULL 
     AND (
       (sc.estado = 'Finalizado' AND sc.updated_time IS NOT NULL) 
       OR sp.hora_fin_real IS NOT NULL
     )
    THEN 
      COALESCE(
        sp.hora_fin_real, 
        CASE WHEN sc.estado = 'Finalizado' THEN sc.updated_time ELSE NULL END
      ) - COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia)
    ELSE NULL
  END AS duracion_calculada,
  
  sc.tiempo_retraso,
  sc.nombre_cliente,
  sc.comentarios_adicionales,
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.local_foraneo,
  sc.km_teorico,
  sc.km_recorridos,
  sc.km_extras,
  sc.km_auditado,
  
  CASE 
    WHEN COALESCE(sc.km_teorico, 0) > 0 
    THEN ROUND(((sc.km_recorridos - sc.km_teorico) / sc.km_teorico * 100)::numeric, 1)
    ELSE NULL 
  END AS desviacion_km,
  
  COALESCE(sp.custodio_asignado, sc.nombre_custodio) AS nombre_custodio,
  sp.custodio_id,
  sc.telefono AS telefono_custodio,
  sc.auto AS vehiculo_custodio,
  sc.placa AS placa_custodio,
  COALESCE(sp.armado_asignado, sc.nombre_armado) AS nombre_armado,
  sp.armado_id,
  sc.telefono_armado,
  sp.tipo_asignacion_armado,
  sc.proveedor,
  COALESCE(sp.requiere_armado, sc.requiere_armado) AS requiere_armado,
  sc.tipo_unidad,
  sc.tipo_carga,
  sc.nombre_operador_transporte,
  sc.telefono_operador,
  sc.placa_carga,
  sc.gadget,
  sc.tipo_gadget,
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente) AS cobro_cliente,
  sc.costo_custodio,
  sc.casetas,
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0) AS margen_bruto,
  CASE 
    WHEN COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) > 0 
    THEN ROUND(
      (COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0)) 
      / COALESCE(sp.tarifa_acordada, sc.cobro_cliente) * 100, 1
    )
    ELSE 0 
  END AS porcentaje_margen,
  sc.estado,
  sp.estado_planeacion,
  sc.tipo_servicio,
  sc.creado_via,
  sc.creado_por,
  sc.created_at,
  sc.updated_time

FROM servicios_custodia sc
LEFT JOIN servicios_planificados sp 
  ON sc.id_servicio = sp.id_servicio;
```

---

## Resultado Esperado

Antes (corrupto):
| Present. | Inicio | Arribo | Fin | Duracion |
|----------|--------|--------|-----|----------|
| - | 18:00 | - | 18:00 | - |

Despues (corregido):
| Present. | Inicio | Arribo | Fin | Duracion |
|----------|--------|--------|-----|----------|
| 08:30 | 09:15 | - | 15:12 | 5h 57m |

---

## Seccion Tecnica

### Logica de COALESCE para Timestamps

```text
hora_inicio = COALESCE(
  sp.hora_inicio_real,      -- Preferir: timestamp real de planeacion (89% coverage)
  sc.hora_inicio_custodia   -- Fallback: legacy (solo si no hay dato en planeacion)
)

hora_fin = CASE 
  WHEN estado = 'Finalizado' AND sp.hora_fin_real IS NULL 
  THEN sc.updated_time      -- Proxy: momento de cambio a Finalizado
  ELSE COALESCE(sp.hora_fin_real, sc.hora_finalizacion)
END
```

### Consideraciones

1. **Cobertura de datos**: `hora_inicio_real` tiene 89% cobertura, pero servicios antiguos pueden no tener dato
2. **Proxy de finalizacion**: `updated_time` es aproximado pero mas preciso que el DATE corrupto
3. **hora_llegada_custodio**: Es tipo TIME, se combina con fecha_cita para crear timestamp completo
