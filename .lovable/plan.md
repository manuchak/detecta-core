

# Plan: Tabla de Detalle de Servicios BI con Timeline Completo

## Hallazgos Clave

### 1. Campo de Folio Interno del Cliente
El equipo de Planeación llena el campo **`id_interno_cliente`** en la tabla `servicios_planificados`. Este es el folio/referencia con el que el cliente identifica el servicio y es **crítico para facturación**.

**Problema actual:** Este campo NO está siendo transferido a `servicios_custodia` ni expuesto en la vista `vw_servicios_facturacion`.

### 2. Timestamps del Journey del Servicio

| Evento | Campo en DB | Tipo |
|--------|-------------|------|
| Servicio creado | `created_at` | timestamp |
| Fecha/hora cita | `fecha_hora_cita` | timestamptz |
| Asignación custodio | `fecha_hora_asignacion` | date |
| Presentación custodio | `hora_presentacion` | date |
| Inicio custodia | `hora_inicio_custodia` | date |
| Arribo destino | `hora_arribo` | date |
| Finalización | `hora_finalizacion` | date |
| Duración total | `duracion_servicio` | interval |
| Retraso | `tiempo_retraso` | interval |
| Última actualización | `updated_time` | timestamptz |

---

## Arquitectura de la Solución

### Vista Enriquecida de Servicios (3 niveles de columnas)

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Buscar...] [Estado▼] [Cliente▼] [Tipo▼] [Proveedor▼]    Columnas: [Basico][Operativo][Timeline][BI] │
├───────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ID │ Folio │Fecha│Cliente│ Ruta  │Custodio│Present│Inicio│Arribo│Fin│Duracion│Cobro│Costo│Margen│Est│
├────┼───────┼─────┼───────┼───────┼────────┼───────┼──────┼──────┼───┼────────┼─────┼─────┼──────┼───┤
│T00.│OT-123 │08/01│ Bimbo │CDMX-GD│Felix S.│ 05:30 │05:45 │11:20 │12:│ 06:45  │$8.5K│$3.2K│$5.3K │ ✓ │
│SII.│RF-456 │08/01│Nestle │CDMX-QR│Irving V│ 04:00 │04:15 │05:10 │05:│ 01:15  │$3.2K│$1.5K│$1.7K │ ✓ │
└────┴───────┴─────┴───────┴───────┴────────┴───────┴──────┴──────┴───┴────────┴─────┴─────┴──────┴───┘
```

---

## Cambios Requeridos

### 1. Vista SQL: `vw_servicios_facturacion`

Agregar campos desde `servicios_planificados` (para obtener `id_interno_cliente`) y todos los timestamps de `servicios_custodia`:

```sql
CREATE OR REPLACE VIEW vw_servicios_facturacion AS
SELECT 
  -- Identificación
  sc.id,
  sc.id_servicio,
  sc.folio_cliente,
  sp.id_interno_cliente,  -- NUEVO: Folio interno del cliente
  
  -- Tiempos del journey
  sc.fecha_hora_cita,
  sc.fecha_hora_asignacion,
  sc.hora_presentacion,
  sc.hora_inicio_custodia,
  sc.hora_arribo,
  sc.hora_finalizacion,
  sc.duracion_servicio,
  sc.tiempo_retraso,
  sc.created_at,
  sc.updated_time,
  
  -- Cliente
  sc.nombre_cliente,
  sc.comentarios_adicionales,
  
  -- Ruta
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.local_foraneo,
  
  -- Kilometraje
  sc.km_teorico,
  sc.km_recorridos,
  sc.km_extras,
  sc.km_auditado,
  CASE 
    WHEN COALESCE(sc.km_teorico, 0) > 0 THEN 
      ROUND(((COALESCE(sc.km_recorridos, 0) - sc.km_teorico) / sc.km_teorico * 100)::numeric, 1)
    ELSE NULL 
  END as desviacion_km,
  
  -- Recursos
  sc.nombre_custodio,
  sc.telefono as telefono_custodio,
  sc.nombre_armado,
  sc.telefono_armado,
  sc.proveedor,
  sc.requiere_armado,
  
  -- Transporte
  sc.tipo_unidad,
  sc.tipo_carga,
  sc.nombre_operador_transporte,
  sc.placa_carga,
  
  -- Tracking
  sc.gadget,
  sc.tipo_gadget,
  
  -- Financiero
  sc.cobro_cliente,
  sc.costo_custodio,
  sc.casetas,
  COALESCE(sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0) as margen_bruto,
  CASE 
    WHEN COALESCE(sc.cobro_cliente, 0) > 0 THEN 
      ROUND((COALESCE(sc.cobro_cliente, 0) - COALESCE(sc.costo_custodio, 0)) / sc.cobro_cliente * 100, 1)
    ELSE 0 
  END as porcentaje_margen,
  
  -- Estado y tipo
  sc.estado,
  sc.tipo_servicio,
  sc.estado_planeacion,
  
  -- Origen del registro
  sc.creado_via,
  sc.creado_por,
  
  -- Cliente datos adicionales
  c.rfc as cliente_rfc,
  c.email as cliente_email,
  c.forma_pago_preferida

FROM servicios_custodia sc
LEFT JOIN servicios_planificados sp ON sc.id_servicio = sp.id_servicio
LEFT JOIN clientes c ON LOWER(sc.nombre_cliente) = LOWER(c.nombre);
```

### 2. Interface TypeScript: `ServicioFacturacion`

```typescript
export interface ServicioFacturacion {
  // Identificación
  id: number;
  id_servicio: string;
  folio_cliente: string;
  id_interno_cliente: string | null;  // NUEVO: Folio interno
  
  // Timeline completo
  fecha_hora_cita: string;
  fecha_hora_asignacion: string | null;
  hora_presentacion: string | null;
  hora_inicio_custodia: string | null;
  hora_arribo: string | null;
  hora_finalizacion: string | null;
  duracion_servicio: string | null;
  tiempo_retraso: string | null;
  created_at: string;
  updated_time: string | null;
  
  // Cliente
  nombre_cliente: string;
  comentarios_adicionales: string | null;
  
  // Ruta
  ruta: string;
  origen: string;
  destino: string;
  local_foraneo: string;
  
  // Kilometraje
  km_teorico: number | null;
  km_recorridos: number;
  km_extras: string | null;
  km_auditado: boolean | null;
  desviacion_km: number | null;
  
  // Recursos
  nombre_custodio: string;
  telefono_custodio: string | null;
  nombre_armado: string | null;
  telefono_armado: string | null;
  proveedor: string | null;
  requiere_armado: boolean;
  
  // Transporte
  tipo_unidad: string | null;
  tipo_carga: string | null;
  nombre_operador_transporte: string | null;
  placa_carga: string | null;
  
  // Tracking
  gadget: string | null;
  tipo_gadget: string | null;
  
  // Financiero
  cobro_cliente: number;
  costo_custodio: number;
  casetas: string | null;
  margen_bruto: number;
  porcentaje_margen: number;
  
  // Estado
  estado: string;
  tipo_servicio: string;
  estado_planeacion: string | null;
  
  // Origen
  creado_via: string | null;
  creado_por: string;
  
  // Cliente adicional
  cliente_rfc: string | null;
  cliente_email: string | null;
  forma_pago_preferida: string | null;
}
```

### 3. Tabla Enriquecida: `ServiciosConsulta.tsx`

#### Grupos de Columnas con Toggle

| Grupo | Columnas | Descripción |
|-------|----------|-------------|
| **Básico** | ID, Folio Interno, Fecha Cita, Cliente, Ruta, Cobro, Costo, Margen, Estado | Vista por defecto |
| **Timeline** | Presentación, Inicio, Arribo, Fin, Duración, Retraso | Journey del servicio |
| **Operativo** | Custodio, Armado, Proveedor, Tipo Unidad, Km Teórico/Real | Recursos y ejecución |
| **BI** | % Margen, Desv. Km, Canal, Estado Plan, Km Auditado | Análisis avanzado |

#### Formato Condicional para Timeline

```
• Retraso > 30 min     → Fondo rojo suave
• Retraso > 15 min     → Fondo amarillo suave  
• A tiempo o adelanto  → Fondo verde suave
• Desviación km > 20%  → Icono de alerta
```

#### Búsqueda Expandida

Buscar por:
- ID servicio
- Folio interno del cliente (`id_interno_cliente`)
- Nombre cliente
- Folio cliente (`folio_cliente`)
- Nombre custodio
- Ruta

---

## Archivos a Modificar

| Archivo | Acción | Cambios |
|---------|--------|---------|
| `vw_servicios_facturacion` | **SQL** | Agregar JOIN con servicios_planificados, incluir 20+ campos nuevos |
| `useServiciosFacturacion.ts` | Modificar | Extender interface con 30+ campos |
| `ServiciosConsulta.tsx` | Reescribir | Toggle de columnas, timeline, formato condicional |

---

## Columnas Detalladas de Timeline

| Columna | Descripción | Formato |
|---------|-------------|---------|
| **Folio Interno** | ID que usa el cliente para facturar | `OT-2026-001234` |
| **Fecha Cita** | Hora programada del servicio | `dd/MM HH:mm` |
| **Asignación** | Cuándo se asignó el custodio | `dd/MM HH:mm` |
| **Presentación** | Hora que llegó el custodio al punto | `HH:mm` |
| **Inicio** | Hora que inició la custodia | `HH:mm` |
| **Arribo** | Hora de llegada al destino | `HH:mm` |
| **Fin** | Hora de finalización | `HH:mm` |
| **Duración** | Tiempo total del servicio | `HH:mm:ss` |
| **Retraso** | Diferencia vs hora programada | `+15m` / `-5m` |

---

## Beneficios para Facturación

1. **Folio Interno**: Permite cruzar con sistemas del cliente para conciliación
2. **Timeline completo**: Auditoría de tiempos para resolver disputas
3. **Retrasos visibles**: Identificar servicios con penalizaciones
4. **Duración real vs estimada**: Base para ajustes de tarifas
5. **Exportación enriquecida**: Excel con datos completos para auditoría

---

## Sección Técnica

### Query para JOIN con servicios_planificados

El `id_interno_cliente` vive en `servicios_planificados`. El JOIN se hace por `id_servicio`:

```sql
LEFT JOIN servicios_planificados sp ON sc.id_servicio = sp.id_servicio
```

### Formateo de Timestamps en Frontend

Los campos `hora_*` en servicios_custodia son tipo `date` (no timestamp), por lo que se formatean directamente. Para `tiempo_retraso` (interval), usar el parser existente:

```typescript
import { parsePostgresInterval, formatTiempoRetrasoDisplay } from '@/utils/timeUtils';

// Ejemplo de uso
const retrasoDisplay = formatTiempoRetrasoDisplay(servicio.tiempo_retraso);
// Output: "15m tarde" o "5m antes" o "A tiempo"
```

### Implementación del Toggle de Columnas

```typescript
const [visibleGroups, setVisibleGroups] = useState<Set<string>>(
  new Set(['basic'])
);

const COLUMN_GROUPS = {
  basic: ['id_servicio', 'id_interno_cliente', 'fecha_hora_cita', 'nombre_cliente', 'ruta', 'cobro_cliente', 'costo_custodio', 'margen_bruto', 'estado'],
  timeline: ['hora_presentacion', 'hora_inicio_custodia', 'hora_arribo', 'hora_finalizacion', 'duracion_servicio', 'tiempo_retraso'],
  operativo: ['nombre_custodio', 'nombre_armado', 'proveedor', 'tipo_unidad', 'km_teorico', 'km_recorridos'],
  bi: ['porcentaje_margen', 'desviacion_km', 'creado_via', 'estado_planeacion', 'km_auditado']
};
```

