

# Plan Revisado: CxP Operativo + CxP Proveedores Externos

## Correcciones conceptuales aplicadas

1. **Armados internos vs armados de proveedores**: El sistema ya distingue `tipo_asignacion: 'interno' | 'proveedor'` en `asignacion_armados`. Los armados internos se pagan junto con custodios (CxP OCA). Los armados de proveedores externos (SEICSA, CUSAEM) se pagan vía CxP PE.
2. **SAMA = proveedor de candados/gadgets**, no de armados. Se excluye de CxP armados y se trata como proveedor de dispositivos.
3. **Cortes semanales lunes-domingo**: Todo CxP se genera por semana operativa (lun-dom). El wizard fuerza este patrón.
4. **Workflow de aprobación Finanzas**: Finanzas es el último filtro antes de generar el documento de dispersión. El flujo es: `borrador → revision_ops → aprobado_finanzas → dispersado → pagado`.

---

## Arquitectura de pestañas

| Pestaña | Contenido |
|---|---|
| **CxP OCA** (Operaciones Custodios y Armados) | Pagos a custodios + armados internos. Incluye: servicio base, estadías, casetas, hoteles, apoyos extraordinarios |
| **CxP PE** (Proveedores Externos) | Pagos a proveedores de armados externos (SEICSA, CUSAEM) + proveedores de gadgets (SAMA). Reutiliza la lógica existente de `cxp_proveedores_armados` |

---

## Base de datos

### Tabla 1: `reglas_estadias_cliente`
Reglas granulares de cortesía por cliente + tipo de servicio + ruta. Fallback: `pc_clientes.horas_cortesia`.

```sql
CREATE TABLE reglas_estadias_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES pc_clientes(id) ON DELETE CASCADE,
  tipo_servicio text,     -- 'local','foraneo','dedicado', NULL = default
  ruta_patron text,       -- 'CDMX-GDL', NULL = any
  horas_cortesia numeric NOT NULL DEFAULT 0,
  tarifa_hora_excedente numeric DEFAULT 0,
  tarifa_pernocta numeric DEFAULT 0,
  cobra_pernocta boolean DEFAULT false,
  notas text,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cliente_id, tipo_servicio, ruta_patron)
);
```

### Tabla 2: `solicitudes_apoyo_extraordinario`
Workflow: Coordinador Ops solicita → Finanzas aprueba → se paga → se incluye en CxP.

```sql
CREATE TABLE solicitudes_apoyo_extraordinario (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_custodia_id integer REFERENCES servicios_custodia(id),
  id_servicio text,
  custodio_id uuid,
  custodio_nombre text,
  cliente_nombre text,
  tipo_apoyo text NOT NULL,  -- 'regreso_base','traslado_destino','alimentacion','hospedaje','transporte_alterno','otro'
  motivo text NOT NULL,
  monto_solicitado numeric NOT NULL,
  monto_aprobado numeric,
  moneda text DEFAULT 'MXN',
  estado text DEFAULT 'pendiente' CHECK (estado IN ('pendiente','aprobado','rechazado','pagado','cancelado')),
  urgencia text DEFAULT 'normal' CHECK (urgencia IN ('baja','normal','alta','critica')),
  solicitado_por uuid,
  fecha_solicitud timestamptz DEFAULT now(),
  aprobado_por uuid,
  fecha_aprobacion timestamptz,
  motivo_rechazo text,
  metodo_pago text,
  referencia_pago text,
  fecha_pago timestamptz,
  pagado_por uuid,
  comprobante_url text,
  notas text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Tabla 3: `cxp_cortes_semanales`
Estado de cuenta semanal (lun-dom) para un custodio o armado interno. Es el "corte" que Finanzas aprueba antes de dispersar.

```sql
CREATE TABLE cxp_cortes_semanales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_operativo text NOT NULL CHECK (tipo_operativo IN ('custodio','armado_interno')),
  operativo_id uuid,          -- custodio_id o armado_id
  operativo_nombre text NOT NULL,
  
  -- Siempre lun-dom
  semana_inicio date NOT NULL, -- lunes
  semana_fin date NOT NULL,    -- domingo
  
  -- Desglose
  total_servicios integer DEFAULT 0,
  monto_servicios numeric DEFAULT 0,
  monto_estadias numeric DEFAULT 0,
  monto_casetas numeric DEFAULT 0,
  monto_hoteles numeric DEFAULT 0,
  monto_apoyos_extra numeric DEFAULT 0,
  monto_deducciones numeric DEFAULT 0,
  monto_total numeric DEFAULT 0,
  
  -- Workflow de aprobación
  estado text DEFAULT 'borrador' CHECK (estado IN (
    'borrador',           -- generado, en edición
    'revision_ops',       -- enviado a Coord Ops para validar servicios
    'aprobado_finanzas',  -- Finanzas aprobó, listo para dispersar
    'dispersado',         -- documento de dispersión generado
    'pagado',             -- pago confirmado
    'cancelado'
  )),
  
  -- Aprobaciones
  revisado_por uuid,
  fecha_revision timestamptz,
  aprobado_por uuid,
  fecha_aprobacion timestamptz,
  
  -- Dispersión
  documento_dispersion_url text,
  metodo_pago text,
  referencia_pago text,
  fecha_pago date,
  
  notas text,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

### Tabla 4: `cxp_cortes_detalle`
Líneas de detalle del corte semanal.

```sql
CREATE TABLE cxp_cortes_detalle (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corte_id uuid NOT NULL REFERENCES cxp_cortes_semanales(id) ON DELETE CASCADE,
  servicio_custodia_id integer REFERENCES servicios_custodia(id),
  concepto text NOT NULL, -- 'servicio','estadia','caseta','hotel','apoyo_extraordinario','deduccion'
  descripcion text,
  monto numeric NOT NULL DEFAULT 0,
  referencia_id text,
  created_at timestamptz DEFAULT now()
);
```

### RLS (todas las tablas nuevas)
- SELECT: `has_facturacion_role()` 
- INSERT/UPDATE/DELETE: `has_facturacion_write_role()`
- `solicitudes_apoyo_extraordinario` INSERT adicional: `has_monitoring_write_role()` (para que Coordinador Ops pueda crear)

---

## Workflows

### Workflow 1: Corte semanal (lun-dom) con aprobación Finanzas

```text
[Finanzas: "Generar Corte Semanal"]
  1. Selecciona semana (sistema sugiere semana pasada)
     - Fuerza lunes-domingo
  2. Selecciona tipo: Custodios | Armados Internos | Ambos
  3. Sistema auto-calcula por cada operativo:
     a. servicios_custodia completados en la semana → sum(costo_custodio)
     b. asignacion_armados tipo='interno' completados → sum(tarifa_acordada)
     c. detenciones WHERE pagable_custodio=true → calculo vs reglas_estadias_cliente
     d. casetas de servicios_custodia en la semana
     e. hoteles (gastos_extraordinarios tipo='hotel')
     f. apoyos extraordinarios aprobados en la semana
  4. Se genera corte en estado 'borrador'

[Coordinador Ops: revisa y valida]
  - Confirma que los servicios son correctos y efectivos
  - Puede marcar deducciones o excluir servicios
  - Estado → 'revision_ops'

[Finanzas: aprobación final]
  - Revisa montos consolidados
  - Aprueba → 'aprobado_finanzas'
  - Genera documento de dispersión (PDF) → 'dispersado'
  - Confirma pago → 'pagado'
```

### Workflow 2: Apoyos Extraordinarios

```text
[Coordinador Ops] crea solicitud:
  - Tipo: regreso_base | alimentacion | hospedaje | etc.
  - Monto, motivo, urgencia, servicio asociado
  - Estado: 'pendiente'

[Finanzas] aprueba/rechaza:
  - Revisa, ajusta monto si necesario
  - Aprueba → registra pago → se incluye en el corte semanal correspondiente
```

### Workflow 3: Estadías (cálculo automático)

```text
detenciones_servicio (ya registradas en bitácora)
  → Resolver regla de cortesía:
    1. reglas_estadias_cliente (cliente + tipo_servicio + ruta) [más específica]
    2. reglas_estadias_cliente (cliente + tipo_servicio, ruta=NULL)
    3. pc_clientes.horas_cortesia [fallback general]
  → Calcular excedente = horas_cobrables - cortesía
  → Se incluye como línea en el corte semanal
```

### Workflow 4: Casetas

```text
servicios_custodia.casetas (monto ya capturado en planeación)
  → Se lista por servicio completado
  → Se incluye automáticamente en el corte semanal como concepto 'caseta'
```

### Workflow 5: Hoteles/Pernoctas

```text
[Operaciones registra gasto hotel en gastos_extraordinarios_servicio con tipo='hotel']
  → Finanzas ve listado pendiente en sub-tab Hoteles
  → Al generar corte semanal, se incluyen automáticamente
```

---

## Frontend: Estructura de componentes

### CxP OCA (`src/pages/Facturacion/components/CxPOperativo/`)

```text
CxPOperativoTab.tsx              -- 5 sub-tabs
├── CortesSemanales/
│   ├── CortesPanel.tsx          -- Lista cortes + KPIs + filtro estado
│   ├── GenerarCorteDialog.tsx   -- Wizard: semana + tipo operativo → auto-calcula
│   └── DetalleCorteDrawer.tsx   -- Desglose por operativo con líneas de detalle
├── Estadias/
│   ├── EstadiasPanel.tsx        -- Estadías pendientes, cálculo visual
│   └── ReglasEstadiasConfig.tsx -- CRUD reglas por cliente/tipo/ruta
├── ApoyosExtraordinarios/
│   ├── ApoyosPanel.tsx          -- Lista solicitudes con filtros estado/urgencia
│   ├── SolicitudApoyoModal.tsx  -- Form para Coord Ops
│   └── AprobacionApoyoCard.tsx  -- Aprobar/rechazar + registrar pago
├── Casetas/
│   └── CasetasPanel.tsx         -- Servicios con casetas pendientes de reembolso
└── Hoteles/
    ├── HotelesPanel.tsx         -- Gastos tipo hotel pendientes
    └── RegistrarHotelModal.tsx  -- Registrar gasto hotel
```

### CxP PE (Proveedores Externos)
Renombrar tab existente. Expandir para distinguir proveedores de armados (SEICSA, CUSAEM) de proveedores de gadgets (SAMA). La lógica existente de `cxp_proveedores_armados` se mantiene.

---

## Hooks nuevos

| Hook | Responsabilidad |
|---|---|
| `useCxPCortesSemanales` | CRUD cortes, generación automática con cálculo de servicios/estadías/casetas/hoteles/apoyos |
| `useReglasEstadias` | CRUD reglas cortesía por cliente+tipo+ruta, resolución de regla más específica |
| `useApoyosExtraordinarios` | CRUD solicitudes, workflow aprobar/rechazar/pagar |
| `useHotelesPernocta` | Filtra `gastos_extraordinarios_servicio` WHERE tipo IN ('hotel','pernocta') |
| `useCasetasReembolso` | Query servicios completados con casetas > 0, estado reembolso |

---

## Cambios en FacturacionHub.tsx

Reemplazar la pestaña "CxP Proveedores" por 2 pestañas:
- **CxP OCA** (icono `UserCheck`) — Cortes semanales custodios + armados internos
- **CxP PE** (icono `Building2`) — Proveedores externos de armados + gadgets

---

## Archivos a crear/modificar

| Archivo | Acción |
|---|---|
| Migración SQL | 4 tablas + RLS + índices |
| `src/pages/Facturacion/components/CxPOperativo/` | ~12 componentes nuevos |
| `src/pages/Facturacion/hooks/useCxPCortesSemanales.ts` | Hook principal |
| `src/pages/Facturacion/hooks/useReglasEstadias.ts` | Reglas cortesía |
| `src/pages/Facturacion/hooks/useApoyosExtraordinarios.ts` | Workflow apoyos |
| `src/pages/Facturacion/hooks/useHotelesPernocta.ts` | Filtro hoteles |
| `src/pages/Facturacion/hooks/useCasetasReembolso.ts` | Casetas pendientes |
| `src/pages/Facturacion/FacturacionHub.tsx` | 2 tabs nuevas, quitar 1 |
| `src/pages/Facturacion/components/CxPProveedores/` | Renombrar a CxP PE |

