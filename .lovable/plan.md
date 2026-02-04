

# Plan: Sistema Completo de Facturacion y Cobranza

## Vision General

Transformar el modulo actual (Dashboard BI) en un sistema completo de gestion de facturacion y cuentas por cobrar, con la generacion de CFDI marcada como "Proximamente".

---

## Arquitectura de Tabs Propuesta

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Receipt] Facturacion y Cobranza          [Feb 01-28] [7d] [30d] [Mes]  [Refresh]           │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ [Dashboard] [Servicios] [Cuentas x Cobrar] [Clientes] [Facturas ✨Proximo]                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

| Tab | Estado | Descripcion |
|-----|--------|-------------|
| **Dashboard** | Existente | KPIs financieros y charts |
| **Servicios** | Existente | Tabla BI de servicios con timeline |
| **Cuentas x Cobrar** | NUEVO | Aging report, estados de cuenta, cobranza |
| **Clientes** | NUEVO | Gestion de datos fiscales y condiciones |
| **Facturas** | NUEVO + Badge | Generacion CFDI (deshabilitado con badge "Proximo") |

---

## 1. Nuevas Tablas de Base de Datos

### Tabla: `facturas`

Almacena facturas emitidas (preparacion para CFDI):

```sql
CREATE TABLE facturas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificacion
  numero_factura TEXT UNIQUE NOT NULL, -- FAC-2026-00001
  uuid_sat TEXT,                        -- UUID del CFDI (futuro)
  
  -- Cliente
  cliente_id UUID REFERENCES pc_clientes(id),
  cliente_nombre TEXT NOT NULL,
  cliente_rfc TEXT NOT NULL,
  cliente_email TEXT,
  
  -- Montos
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  iva NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda TEXT DEFAULT 'MXN',
  tipo_cambio NUMERIC(8,4) DEFAULT 1,
  
  -- Fechas
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  
  -- Estado
  estado TEXT DEFAULT 'pendiente', -- pendiente, pagada, parcial, cancelada, vencida
  
  -- CFDI (futuro)
  cfdi_version TEXT DEFAULT '4.0',
  uso_cfdi TEXT DEFAULT 'G03',
  forma_pago TEXT,
  metodo_pago TEXT,
  
  -- Metadata
  notas TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: `factura_partidas`

Detalle de servicios incluidos en cada factura:

```sql
CREATE TABLE factura_partidas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factura_id UUID REFERENCES facturas(id) ON DELETE CASCADE,
  
  -- Referencia al servicio
  servicio_id INTEGER REFERENCES servicios_custodia(id),
  id_servicio TEXT,          -- ID legible del servicio
  id_interno_cliente TEXT,   -- Folio del cliente
  
  -- Detalle
  descripcion TEXT NOT NULL,
  fecha_servicio DATE,
  ruta TEXT,
  
  -- Montos
  cantidad INTEGER DEFAULT 1,
  precio_unitario NUMERIC(12,2) NOT NULL,
  importe NUMERIC(12,2) NOT NULL,
  
  -- SAT (futuro)
  clave_prod_serv TEXT DEFAULT '78101800', -- Custodia de valores
  clave_unidad TEXT DEFAULT 'E48',         -- Servicio
  
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Tabla: `pagos`

Registro de pagos recibidos:

```sql
CREATE TABLE pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencia
  factura_id UUID REFERENCES facturas(id),
  cliente_id UUID REFERENCES pc_clientes(id),
  
  -- Monto
  monto NUMERIC(12,2) NOT NULL,
  moneda TEXT DEFAULT 'MXN',
  
  -- Forma de pago
  forma_pago TEXT NOT NULL, -- transferencia, cheque, efectivo, tarjeta
  referencia_bancaria TEXT,
  banco TEXT,
  
  -- Fechas
  fecha_pago DATE NOT NULL,
  fecha_deposito DATE,
  
  -- Estado
  estado TEXT DEFAULT 'aplicado', -- aplicado, devuelto, pendiente
  
  -- Metadata
  notas TEXT,
  comprobante_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

### Tabla: `cobranza_seguimiento`

Historial de gestiones de cobranza:

```sql
CREATE TABLE cobranza_seguimiento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Referencias
  factura_id UUID REFERENCES facturas(id),
  cliente_id UUID REFERENCES pc_clientes(id),
  
  -- Tipo de accion
  tipo_accion TEXT NOT NULL, -- llamada, email, visita, promesa_pago, escalamiento
  
  -- Detalle
  descripcion TEXT NOT NULL,
  contacto_nombre TEXT,
  contacto_telefono TEXT,
  
  -- Promesa de pago
  fecha_promesa_pago DATE,
  monto_prometido NUMERIC(12,2),
  promesa_cumplida BOOLEAN,
  
  -- Resultado
  resultado TEXT, -- exitoso, sin_respuesta, rechazado, reprogramar
  proxima_accion DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
```

### Modificar: `pc_clientes`

Agregar campos fiscales faltantes:

```sql
ALTER TABLE pc_clientes ADD COLUMN IF NOT EXISTS
  -- Datos fiscales
  razon_social TEXT,
  regimen_fiscal TEXT,
  codigo_postal_fiscal TEXT,
  direccion_fiscal TEXT,
  uso_cfdi_default TEXT DEFAULT 'G03',
  
  -- Condiciones comerciales
  dias_credito INTEGER DEFAULT 30,
  limite_credito NUMERIC(12,2),
  dia_corte INTEGER DEFAULT 15,
  dia_pago INTEGER DEFAULT 30,
  
  -- Contacto facturacion
  contacto_facturacion_nombre TEXT,
  contacto_facturacion_email TEXT,
  contacto_facturacion_tel TEXT,
  
  -- Cobranza
  prioridad_cobranza TEXT DEFAULT 'normal', -- alta, normal, baja
  notas_cobranza TEXT;
```

---

## 2. Vistas SQL para Reportes

### Vista: `vw_aging_cuentas_cobrar`

Reporte de antiguedad de saldos:

```sql
CREATE VIEW vw_aging_cuentas_cobrar AS
SELECT
  f.cliente_id,
  f.cliente_nombre,
  f.cliente_rfc,
  
  -- Totales
  SUM(f.total) as total_facturado,
  SUM(COALESCE(p.total_pagado, 0)) as total_pagado,
  SUM(f.total - COALESCE(p.total_pagado, 0)) as saldo_pendiente,
  
  -- Aging buckets
  SUM(CASE WHEN f.fecha_vencimiento >= CURRENT_DATE THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vigente,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento BETWEEN 1 AND 30 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_1_30,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento BETWEEN 31 AND 60 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_31_60,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento BETWEEN 61 AND 90 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_61_90,
  SUM(CASE WHEN CURRENT_DATE - f.fecha_vencimiento > 90 THEN f.total - COALESCE(p.total_pagado, 0) ELSE 0 END) as vencido_90_mas,
  
  -- Metricas
  COUNT(DISTINCT f.id) as num_facturas,
  MAX(f.fecha_vencimiento) as ultima_factura,
  MAX(p.ultima_fecha_pago) as ultimo_pago
  
FROM facturas f
LEFT JOIN (
  SELECT factura_id, SUM(monto) as total_pagado, MAX(fecha_pago) as ultima_fecha_pago
  FROM pagos WHERE estado = 'aplicado'
  GROUP BY factura_id
) p ON f.id = p.factura_id
WHERE f.estado NOT IN ('cancelada')
GROUP BY f.cliente_id, f.cliente_nombre, f.cliente_rfc;
```

---

## 3. Componentes de UI

### 3.1 Tab: Cuentas por Cobrar

**Archivo:** `components/CuentasPorCobrar.tsx`

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ RESUMEN CXC                                                                                  │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐                   │
│ │  $2.4M     │ │  $1.8M     │ │  $420K     │ │  $180K     │ │   42       │                   │
│ │  Total CxC │ │  Vigente   │ │  Vencido   │ │  >60 dias  │ │   DSO      │                   │
│ │  ▓▓▓▓▓▓▓▓▓ │ │  ▓▓▓▓▓▓▓   │ │  ▓▓▓       │ │  ▓▓ ⚠️    │ │            │                   │
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘ └────────────┘                   │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ AGING POR CLIENTE                                                                            │
│ ┌──────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Cliente        │ Total   │ Vigente │ 1-30d  │ 31-60d │ 61-90d │ >90d   │ Acciones         │ │
│ ├────────────────┼─────────┼─────────┼────────┼────────┼────────┼────────┼──────────────────┤ │
│ │ Bimbo          │ $850K   │ $650K   │ $150K  │ $50K   │ -      │ -      │ [Ver] [Cobrar]   │ │
│ │ Nestle         │ $420K   │ $300K   │ $80K   │ $40K   │ -      │ -      │ [Ver] [Cobrar]   │ │
│ │ Femsa ⚠️       │ $280K   │ $50K    │ $80K   │ $50K   │ $100K  │ -      │ [Ver] [Cobrar]   │ │
│ └──────────────────────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ PROXIMAS ACCIONES DE COBRANZA                                                                │
│ • Hoy: 3 llamadas programadas | 2 vencimientos | 1 promesa de pago                          │
│ • Esta semana: 12 facturas por vencer ($450K)                                               │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

Funcionalidades:
- Tabla de aging con codigo de colores (verde vigente, amarillo 1-30, naranja 31-60, rojo >60)
- Detalle por cliente con drill-down a facturas individuales
- Boton "Registrar seguimiento" para agregar notas de cobranza
- Estado de cuenta descargable en PDF
- KPIs: DSO (Days Sales Outstanding), % de cartera vencida, eficiencia de cobranza

### 3.2 Tab: Gestion de Clientes

**Archivo:** `components/GestionClientes.tsx`

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│ [Buscar cliente...] [+ Nuevo Cliente]                       [Solo activos] [Exportar]        │
├──────────────────────────────────────────────────────────────────────────────────────────────┤
│ │ Cliente       │ RFC           │ Dias Cred │ Limite    │ Saldo    │ Estado │ Acciones      │ │
│ ├───────────────┼───────────────┼───────────┼───────────┼──────────┼────────┼───────────────┤ │
│ │ Bimbo         │ BIM880630XX1  │ 30        │ $2M       │ $850K    │ ✅     │ [Editar] [Ver]│ │
│ │ Nestle        │ NES970501XX2  │ 45        │ $1.5M     │ $420K    │ ✅     │ [Editar] [Ver]│ │
│ │ Femsa         │ FEM920101XX3  │ 30        │ $500K     │ $280K ⚠️ │ ⚠️     │ [Editar] [Ver]│ │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

**Modal de Edicion de Cliente:**

```text
┌─────────────────────────────────────────────────────────────┐
│ Editar Cliente: Bimbo                              [X]      │
├─────────────────────────────────────────────────────────────┤
│ DATOS FISCALES                                              │
│ ┌─────────────────┐ ┌─────────────────┐                     │
│ │ Razon Social    │ │ RFC             │                     │
│ │ [Bimbo S.A...]  │ │ [BIM880630XX1]  │                     │
│ └─────────────────┘ └─────────────────┘                     │
│ ┌─────────────────┐ ┌─────────────────┐                     │
│ │ Regimen Fiscal  │ │ C.P. Fiscal     │                     │
│ │ [601 - General] │ │ [06600]         │                     │
│ └─────────────────┘ └─────────────────┘                     │
│ ┌───────────────────────────────────────┐                   │
│ │ Direccion Fiscal                      │                   │
│ │ [Av. Insurgentes Sur 1234...]         │                   │
│ └───────────────────────────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│ CONDICIONES COMERCIALES                                     │
│ ┌─────────────────┐ ┌─────────────────┐                     │
│ │ Dias Credito    │ │ Limite Credito  │                     │
│ │ [30]            │ │ [$2,000,000]    │                     │
│ └─────────────────┘ └─────────────────┘                     │
│ ┌─────────────────┐ ┌─────────────────┐                     │
│ │ Dia de Corte    │ │ Dia de Pago     │                     │
│ │ [15]            │ │ [30]            │                     │
│ └─────────────────┘ └─────────────────┘                     │
├─────────────────────────────────────────────────────────────┤
│ CONTACTO FACTURACION                                        │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ Nombre          │ │ Email           │ │ Telefono        │ │
│ │ [Ana Garcia]    │ │ [ana@bimbo.mx]  │ │ [55 1234 5678]  │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                                    [Cancelar] [💾 Guardar]  │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Tab: Facturas (con Badge "Proximo")

**Archivo:** `components/FacturasTab.tsx`

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                              │
│                        ┌─────────────────────────────────────┐                               │
│                        │        🧾 Facturacion CFDI          │                               │
│                        │                                     │                               │
│                        │  ┌─────────────────────────────┐    │                               │
│                        │  │  ✨ PROXIMAMENTE            │    │                               │
│                        │  │     Integracion SAT 4.0     │    │                               │
│                        │  └─────────────────────────────┘    │                               │
│                        │                                     │                               │
│                        │  Estamos trabajando en la           │                               │
│                        │  integracion con PAC autorizado     │                               │
│                        │  para generacion de CFDI 4.0.       │                               │
│                        │                                     │                               │
│                        │  Funcionalidades planeadas:         │                               │
│                        │  • Generacion de facturas           │                               │
│                        │  • Notas de credito                 │                               │
│                        │  • Complementos de pago             │                               │
│                        │  • Timbrado automatico              │                               │
│                        │                                     │                               │
│                        │  ─────────────────────────────────  │                               │
│                        │  Por ahora, use la seccion          │                               │
│                        │  "Servicios" para exportar datos    │                               │
│                        │  y generar facturas en su sistema   │                               │
│                        │  externo.                           │                               │
│                        └─────────────────────────────────────┘                               │
│                                                                                              │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Hooks y Servicios

### 4.1 Hook: `useCuentasPorCobrar.ts`

```typescript
interface AgingData {
  cliente_id: string;
  cliente_nombre: string;
  total_facturado: number;
  saldo_pendiente: number;
  vigente: number;
  vencido_1_30: number;
  vencido_31_60: number;
  vencido_61_90: number;
  vencido_90_mas: number;
  dso: number;
}

interface CxCMetrics {
  totalCxC: number;
  totalVigente: number;
  totalVencido: number;
  totalVencidoMas60: number;
  dsoPromedio: number;
  eficienciaCobranza: number;
}
```

### 4.2 Hook: `useClientesFiscales.ts`

```typescript
interface ClienteFiscal {
  id: string;
  nombre: string;
  razon_social: string;
  rfc: string;
  regimen_fiscal: string;
  codigo_postal_fiscal: string;
  dias_credito: number;
  limite_credito: number;
  saldo_actual: number;
  estado_credito: 'disponible' | 'limite' | 'bloqueado';
}
```

### 4.3 Hook: `useCobranzaSeguimiento.ts`

```typescript
interface SeguimientoCobranza {
  id: string;
  factura_id: string;
  cliente_nombre: string;
  tipo_accion: 'llamada' | 'email' | 'visita' | 'promesa_pago';
  descripcion: string;
  fecha_promesa_pago?: Date;
  monto_prometido?: number;
  resultado: string;
  created_at: Date;
  created_by_name: string;
}
```

---

## 5. Estructura de Archivos

```
src/pages/Facturacion/
├── FacturacionHub.tsx                    # Hub principal (modificar)
├── components/
│   ├── FacturacionDashboard.tsx          # Existente
│   ├── FacturacionHeroBar.tsx            # Existente
│   ├── ServiciosConsulta.tsx             # Existente
│   ├── CuentasPorCobrar/                 # NUEVO
│   │   ├── CuentasPorCobrarTab.tsx
│   │   ├── AgingTable.tsx
│   │   ├── AgingKPIBar.tsx
│   │   ├── SeguimientoCobranzaModal.tsx
│   │   └── EstadoCuentaPDF.tsx
│   ├── GestionClientes/                  # NUEVO
│   │   ├── GestionClientesTab.tsx
│   │   ├── ClientesTable.tsx
│   │   └── ClienteFormModal.tsx
│   └── Facturas/                         # NUEVO
│       └── FacturasComingSoon.tsx
└── hooks/
    ├── useServiciosFacturacion.ts        # Existente
    ├── useFacturacionMetrics.ts          # Existente
    ├── useCuentasPorCobrar.ts            # NUEVO
    ├── useClientesFiscales.ts            # NUEVO
    └── useCobranzaSeguimiento.ts         # NUEVO
```

---

## 6. Migraciones SQL

### Orden de Ejecucion

1. `001_alter_pc_clientes_fiscal.sql` - Agregar campos fiscales a clientes
2. `002_create_facturas.sql` - Tabla de facturas
3. `003_create_factura_partidas.sql` - Detalle de facturas
4. `004_create_pagos.sql` - Registro de pagos
5. `005_create_cobranza_seguimiento.sql` - Historial de cobranza
6. `006_create_vw_aging.sql` - Vista de aging report
7. `007_rls_policies.sql` - Politicas de seguridad

---

## 7. Resumen de Entregables

| Componente | Descripcion | Estado |
|------------|-------------|--------|
| **Dashboard** | KPIs y charts financieros | Existente |
| **Servicios** | Tabla BI con timeline | Existente |
| **Cuentas x Cobrar** | Aging, DSO, seguimiento | NUEVO |
| **Gestion Clientes** | Datos fiscales, condiciones | NUEVO |
| **Facturas CFDI** | Generacion SAT | Badge "Proximo" |

---

## Seccion Tecnica

### Calculo de DSO (Days Sales Outstanding)

```typescript
// DSO = (Cuentas por Cobrar / Ventas a Credito) * Dias del Periodo
const calcularDSO = (cxc: number, ventasPeriodo: number, diasPeriodo: number = 30) => {
  if (ventasPeriodo === 0) return 0;
  return Math.round((cxc / ventasPeriodo) * diasPeriodo);
};
```

### Eficiencia de Cobranza

```typescript
// Eficiencia = (Pagos Recibidos / Facturas Emitidas) * 100
const calcularEficiencia = (pagosRecibidos: number, facturasEmitidas: number) => {
  if (facturasEmitidas === 0) return 100;
  return Math.min(100, (pagosRecibidos / facturasEmitidas) * 100);
};
```

### Codigo de Colores Aging

```typescript
const getAgingColor = (dias: number) => {
  if (dias <= 0) return 'bg-emerald-500/10 text-emerald-700'; // Vigente
  if (dias <= 30) return 'bg-amber-500/10 text-amber-700';    // 1-30
  if (dias <= 60) return 'bg-orange-500/10 text-orange-700';  // 31-60
  if (dias <= 90) return 'bg-red-500/10 text-red-700';        // 61-90
  return 'bg-red-700/20 text-red-800 font-bold';               // >90
};
```

### Badge "Proximamente"

```tsx
<Badge className="bg-gradient-to-r from-violet-500 to-purple-500 text-white border-0">
  <Sparkles className="h-3 w-3 mr-1" />
  Proximo
</Badge>
```

