
# Plan: Mejora de Fuente de Datos - Tablero de Facturacion

## Diagnostico del Problema

### Hallazgos Criticos

1. **ID Servicio Truncado**
   - Actualmente: `{s.id_servicio?.substring(0, 7)}...` muestra "EMEDEME..." en lugar del folio completo
   - El folio Saphiro/Planeacion (ej: "EMEDEME-234") se corta arbitrariamente

2. **Ambiguedad en Campo "Fecha"**
   - La columna "Fecha" muestra `fecha_hora_cita` pero no esta etiquetado claramente
   - Existen multiples fechas relevantes que deben diferenciarse

3. **Tipos de Datos Incorrectos en `servicios_custodia`**
   - `hora_presentacion`, `hora_inicio_custodia`, `hora_arribo`, `hora_finalizacion` son tipo `DATE` (pierden componente de hora)
   - `created_at` es tipo `TEXT` en lugar de `TIMESTAMPTZ`
   - `fecha_hora_asignacion` es tipo `DATE` en lugar de `TIMESTAMPTZ`

4. **Datos de Planeacion Incompletos**
   - La vista actual solo trae `id_interno_cliente` de `servicios_planificados`
   - Faltan: `created_at` (fecha recepcion), `fecha_asignacion`, datos de armado/proveedor

---

## Arquitectura de Fechas Propuesta

```text
TIMELINE COMPLETO DE UN SERVICIO
================================

[PLANEACION]                                    [EJECUCION]
    |                                                |
    v                                                v
+----------------+    +------------------+    +-----------------+    +----------------+    +----------------+
| Fecha Recepcion|    | Fecha Asignacion |    | Fecha Cita      |    | Inicio Servicio|    | Fin Servicio   |
| (sp.created_at)|    | (sp.fecha_asign.)|    | (sc.fecha_cita) |    | (sc.hora_inicio)|   | (sc.hora_fin)  |
+----------------+    +------------------+    +-----------------+    +----------------+    +----------------+
       ^                      ^                      ^                      ^                     ^
       |                      |                      |                      |                     |
   Cuando llega          Cuando se             FECHA ANCLA            Cuando inicia         Cuando termina
   el servicio          asigna custodio        DEL REPORTE            la custodia           la custodia
```

### Definicion de Cada Fecha

| Campo | Origen | Descripcion | Tipo Actual | Tipo Correcto |
|-------|--------|-------------|-------------|---------------|
| **fecha_recepcion** | `servicios_planificados.created_at` | Cuando se recibio/creo el servicio | TIMESTAMPTZ | OK |
| **fecha_asignacion** | `servicios_planificados.fecha_asignacion` | Cuando se asigno custodio | TIMESTAMPTZ | OK |
| **fecha_hora_cita** | `servicios_custodia.fecha_hora_cita` | Fecha/hora programada (ANCLA) | TIMESTAMPTZ | OK |
| **hora_presentacion** | `servicios_custodia.hora_presentacion` | Cuando custodio llega a sitio | DATE | TIMESTAMPTZ |
| **hora_inicio_custodia** | `servicios_custodia.hora_inicio_custodia` | Inicio real del servicio | DATE | TIMESTAMPTZ |
| **hora_arribo** | `servicios_custodia.hora_arribo` | Llegada a destino | DATE | TIMESTAMPTZ |
| **hora_finalizacion** | `servicios_custodia.hora_finalizacion` | Fin del servicio | DATE | TIMESTAMPTZ |

---

## Cambios Requeridos

### 1. Migracion SQL: Correccion de Tipos de Datos

```sql
-- Convertir campos DATE a TIMESTAMPTZ para preservar horas
ALTER TABLE servicios_custodia 
  ALTER COLUMN hora_presentacion TYPE timestamptz USING hora_presentacion::timestamptz,
  ALTER COLUMN hora_inicio_custodia TYPE timestamptz USING hora_inicio_custodia::timestamptz,
  ALTER COLUMN hora_arribo TYPE timestamptz USING hora_arribo::timestamptz,
  ALTER COLUMN hora_finalizacion TYPE timestamptz USING hora_finalizacion::timestamptz,
  ALTER COLUMN fecha_hora_asignacion TYPE timestamptz USING fecha_hora_asignacion::timestamptz;

-- Convertir created_at de TEXT a TIMESTAMPTZ
ALTER TABLE servicios_custodia 
  ALTER COLUMN created_at TYPE timestamptz USING created_at::timestamptz;
```

### 2. Nueva Vista SQL: `vw_servicios_facturacion_v2`

```sql
CREATE OR REPLACE VIEW vw_servicios_facturacion_v2 AS
SELECT 
  -- IDENTIFICACION (sin truncar)
  sc.id,
  sc.id_servicio AS folio_saphiro,        -- Folio completo
  sp.id_servicio AS folio_planeacion,     -- ID de planeacion (UUID o folio)
  sc.folio_cliente,
  sp.id_interno_cliente AS referencia_cliente,
  
  -- TIMELINE PLANEACION
  sp.created_at AS fecha_recepcion,       -- Cuando se creo el servicio
  sp.fecha_asignacion,                    -- Cuando se asigno custodio
  sp.fecha_asignacion_armado,             -- Cuando se asigno armado
  
  -- TIMELINE OPERATIVO (FECHA ANCLA)
  sc.fecha_hora_cita,                     -- FECHA PRINCIPAL del servicio
  sc.hora_presentacion,                   -- Custodio en sitio
  sc.hora_inicio_custodia,                -- Inicio real
  sc.hora_arribo,                         -- Llegada destino
  sc.hora_finalizacion,                   -- Fin servicio
  
  -- DURACION CALCULADA
  sc.duracion_servicio,
  CASE 
    WHEN sc.hora_inicio_custodia IS NOT NULL AND sc.hora_finalizacion IS NOT NULL 
    THEN sc.hora_finalizacion - sc.hora_inicio_custodia
    ELSE NULL 
  END AS duracion_calculada,
  sc.tiempo_retraso,
  
  -- CLIENTE
  sc.nombre_cliente,
  sc.comentarios_adicionales,
  
  -- RUTA Y UBICACION
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.local_foraneo,
  
  -- KILOMETRAJE
  sc.km_teorico,
  sc.km_recorridos,
  sc.km_extras,
  sc.km_auditado,
  CASE 
    WHEN COALESCE(sc.km_teorico, 0) > 0 
    THEN ROUND(((sc.km_recorridos - sc.km_teorico) / sc.km_teorico * 100)::numeric, 1)
    ELSE NULL 
  END AS desviacion_km_pct,
  
  -- CUSTODIO (desde planeacion + ejecucion)
  COALESCE(sp.custodio_asignado, sc.nombre_custodio) AS nombre_custodio,
  sp.custodio_id,
  sc.telefono AS telefono_custodio,
  sc.auto AS vehiculo_custodio,
  sc.placa AS placa_custodio,
  
  -- ARMADO (desde planeacion + ejecucion)
  COALESCE(sp.armado_asignado, sc.nombre_armado) AS nombre_armado,
  sp.armado_id,
  sc.telefono_armado,
  sp.tipo_asignacion_armado,               -- 'interno' o 'proveedor'
  sc.proveedor AS proveedor_armado,
  sp.requiere_armado,
  
  -- TRANSPORTE (desde ejecucion)
  sc.tipo_unidad,
  sc.tipo_carga,
  sc.nombre_operador_transporte,
  sc.telefono_operador,
  sc.placa_carga AS matricula_unidad,
  
  -- TRACKING
  sc.gadget,
  sc.tipo_gadget,
  
  -- FINANCIERO
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente) AS cobro_cliente,
  sc.costo_custodio,
  sc.casetas,
  COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0) AS margen_bruto,
  CASE 
    WHEN COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) > 0 
    THEN ROUND((COALESCE(sp.tarifa_acordada, sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0)) 
         / COALESCE(sp.tarifa_acordada, sc.cobro_cliente) * 100, 1)
    ELSE 0 
  END AS porcentaje_margen,
  
  -- ESTADO
  sc.estado AS estado_ejecucion,
  sp.estado_planeacion,
  sc.tipo_servicio,
  
  -- METADATA
  sc.creado_via,
  sc.creado_por,
  sc.created_at AS fecha_creacion_sc,
  sc.updated_time AS fecha_actualizacion

FROM servicios_custodia sc
LEFT JOIN servicios_planificados sp 
  ON sc.id_servicio = sp.id_servicio 
  OR sc.id_servicio = sp.id_servicio::text;
```

### 3. Actualizacion del Hook `useServiciosFacturacion`

Actualizar la interface para incluir los nuevos campos:

```typescript
export interface ServicioFacturacion {
  // Identificacion completa
  id: number;
  folio_saphiro: string;           // ID completo (EMEDEME-234)
  folio_planeacion: string | null;
  folio_cliente: string;
  referencia_cliente: string | null;
  
  // Timeline Planeacion
  fecha_recepcion: string | null;
  fecha_asignacion: string | null;
  fecha_asignacion_armado: string | null;
  
  // Timeline Operativo
  fecha_hora_cita: string;         // FECHA ANCLA
  hora_presentacion: string | null;
  hora_inicio_custodia: string | null;
  hora_arribo: string | null;
  hora_finalizacion: string | null;
  duracion_servicio: string | null;
  duracion_calculada: string | null;
  tiempo_retraso: string | null;
  
  // ... resto de campos
}
```

### 4. Actualizacion del Componente `ServiciosConsulta.tsx`

**A. Columna ID sin truncar:**

```tsx
// ANTES
<TableCell className="font-mono py-2">
  {s.id_servicio?.substring(0, 7)}...
</TableCell>

// DESPUES
<TableCell className="font-mono py-2 min-w-[120px]">
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="cursor-help">{s.folio_saphiro}</span>
    </TooltipTrigger>
    <TooltipContent>
      <p>Folio Saphiro: {s.folio_saphiro}</p>
      {s.referencia_cliente && <p>Ref. Cliente: {s.referencia_cliente}</p>}
    </TooltipContent>
  </Tooltip>
</TableCell>
```

**B. Columnas de Fecha Clarificadas:**

```tsx
// Header con etiquetas claras
<TableHead className="text-xs">Fecha Cita</TableHead>        // fecha_hora_cita
<TableHead className="text-xs">Recepcion</TableHead>         // fecha_recepcion
<TableHead className="text-xs">Asignacion</TableHead>        // fecha_asignacion

// Celdas con formato consistente
<TableCell>
  {s.fecha_hora_cita 
    ? format(new Date(s.fecha_hora_cita), 'dd/MM/yy HH:mm', { locale: es })
    : '-'
  }
</TableCell>
```

**C. Nuevo Grupo de Columnas "Planeacion":**

```tsx
const COLUMN_GROUP_LABELS = {
  basic: { label: 'Basico', icon: null },
  timeline: { label: 'Timeline', icon: <Clock /> },
  planeacion: { label: 'Planeacion', icon: <Calendar /> },  // NUEVO
  operativo: { label: 'Operativo', icon: <Users /> },
  bi: { label: 'BI', icon: <BarChart3 /> },
};

// Columnas de Planeacion
{isGroupVisible('planeacion') && (
  <>
    <TableHead>Recepcion</TableHead>
    <TableHead>Asignacion</TableHead>
    <TableHead>Asig. Armado</TableHead>
    <TableHead>Estado Plan</TableHead>
  </>
)}
```

---

## Estructura de Archivos a Modificar

```
supabase/migrations/
└── YYYYMMDD_improve_facturacion_data.sql    # Nueva migracion

src/pages/Facturacion/
├── hooks/
│   └── useServiciosFacturacion.ts           # Actualizar interface y query
└── components/
    └── ServiciosConsulta.tsx                # Actualizar UI columnas
```

---

## Resumen de Entregables

| Cambio | Descripcion | Impacto |
|--------|-------------|---------|
| **Migracion tipos** | Convertir DATE a TIMESTAMPTZ | Preserva horas en timeline |
| **Nueva vista SQL** | `vw_servicios_facturacion_v2` | Todos los campos necesarios |
| **ID sin truncar** | Mostrar folio completo | Identificacion clara |
| **Fechas etiquetadas** | "Fecha Cita", "Recepcion", etc. | Sin ambiguedad |
| **Grupo Planeacion** | Nueva seccion de columnas | Datos de asignacion visibles |
| **Tooltip en IDs** | Muestra referencia cliente | Contexto adicional |

---

## Seccion Tecnica

### Consideraciones de Migracion

La conversion de DATE a TIMESTAMPTZ puede perder precision si los datos originales no tienen componente de hora. Se recomienda:

```sql
-- Verificar datos antes de migrar
SELECT 
  COUNT(*) as total,
  COUNT(hora_inicio_custodia) as con_inicio,
  COUNT(hora_finalizacion) as con_fin
FROM servicios_custodia
WHERE fecha_hora_cita >= '2026-01-01';
```

### Join Mejorado

El JOIN entre tablas usa OR para manejar diferentes formatos de ID:

```sql
LEFT JOIN servicios_planificados sp 
  ON sc.id_servicio = sp.id_servicio 
  OR sc.id_servicio = sp.id_servicio::text
```

Esto cubre casos donde `id_servicio` puede ser UUID o folio legible.

### Exportacion Excel

Actualizar el mapeo de exportacion para incluir nuevos campos con etiquetas claras:

```typescript
const exportData = filteredServicios.map(s => ({
  'Folio Saphiro': s.folio_saphiro,
  'Referencia Cliente': s.referencia_cliente || '',
  'Fecha Cita': formatDateTime(s.fecha_hora_cita),
  'Fecha Recepcion': formatDateTime(s.fecha_recepcion),
  'Fecha Asignacion': formatDateTime(s.fecha_asignacion),
  // ...
}));
```
