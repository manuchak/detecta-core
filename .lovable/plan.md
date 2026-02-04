
# Plan: Modulo de Facturacion y Finanzas con Vision BI

## Resumen Ejecutivo

Crear un nuevo modulo para el equipo de Facturacion y Finanzas con acceso de solo lectura a los servicios de custodia, diseñado con metricas estrategicas para un Head de BI.

---

## 1. Nuevos Roles a Crear

| Rol | Descripcion | Acceso |
|-----|-------------|--------|
| `facturacion_admin` | Jefe de Facturacion - acceso completo al modulo | Todas las vistas y exportaciones |
| `facturacion` | Analista de Facturacion | Consultas y reportes basicos |
| `finanzas_admin` | Director de Finanzas - vision ejecutiva | Dashboards estrategicos + exportacion |
| `finanzas` | Analista Financiero | Reportes y analisis |

---

## 2. Estructura del Modulo

```text
/facturacion
├── /dashboard          → KPIs ejecutivos
├── /servicios          → Consulta detallada de servicios
├── /clientes           → Analisis por cliente
├── /rentabilidad       → Margenes y costos
└── /exportacion        → Generacion de reportes
```

---

## 3. Vista Principal: Dashboard Ejecutivo BI

### KPIs Estrategicos (Head de BI)

| KPI | Descripcion | Fuente |
|-----|-------------|--------|
| **Ingresos Brutos** | SUM(cobro_cliente) | servicios_custodia |
| **Costos Operativos** | SUM(costo_custodio) | servicios_custodia |
| **Margen Bruto** | Ingresos - Costos | Calculado |
| **% Margen** | (Margen / Ingresos) * 100 | Calculado |
| **Ticket Promedio** | AVG(cobro_cliente) | servicios_custodia |
| **Servicios Completados** | COUNT WHERE estado = 'Finalizado' | servicios_custodia |
| **Km Facturables** | SUM(km_recorridos) | servicios_custodia |

### Dimensiones de Analisis

- **Temporal**: Diario, Semanal, Mensual, Trimestral, Anual
- **Cliente**: Top 10 clientes, concentracion de ingresos
- **Ruta**: Rutas mas rentables vs menos rentables
- **Tipo Servicio**: Punto A-B vs Repartos
- **Local/Foraneo**: Segmentacion geografica

---

## 4. Vista Espejo de Servicios (Solo Lectura)

### Datos Disponibles para Facturacion

| Campo | Tipo | Uso |
|-------|------|-----|
| id_servicio | text | Identificador unico para factura |
| fecha_hora_cita | timestamp | Fecha del servicio |
| nombre_cliente | text | Cliente a facturar |
| folio_cliente | text | Referencia del cliente |
| ruta | text | Descripcion de la ruta |
| origen / destino | text | Puntos de servicio |
| km_recorridos | numeric | Kilometros a facturar |
| cobro_cliente | numeric | Monto a facturar |
| costo_custodio | numeric | Costo operativo |
| nombre_custodio | text | Personal asignado |
| estado | text | Estado del servicio |
| tipo_servicio | text | Categoria |
| local_foraneo | text | Clasificacion geografica |
| casetas | text | Costos adicionales |
| gadget | text | Equipo utilizado |

### Filtros Disponibles

- Rango de fechas
- Cliente
- Estado (Finalizado, Cancelado, etc.)
- Tipo de servicio
- Local/Foraneo
- Rango de montos

---

## 5. Arquitectura de Base de Datos

### Vista SQL para Facturacion (Read-Only)

```sql
CREATE VIEW vw_servicios_facturacion AS
SELECT 
  sc.id,
  sc.id_servicio,
  sc.fecha_hora_cita,
  sc.nombre_cliente,
  sc.folio_cliente,
  sc.ruta,
  sc.origen,
  sc.destino,
  sc.tipo_servicio,
  sc.local_foraneo,
  sc.km_recorridos,
  sc.km_teorico,
  sc.cobro_cliente,
  sc.costo_custodio,
  (sc.cobro_cliente - sc.costo_custodio) as margen_bruto,
  CASE 
    WHEN sc.cobro_cliente > 0 
    THEN ((sc.cobro_cliente - sc.costo_custodio) / sc.cobro_cliente) * 100 
    ELSE 0 
  END as porcentaje_margen,
  sc.nombre_custodio,
  sc.nombre_armado,
  sc.proveedor,
  sc.estado,
  sc.casetas,
  sc.gadget,
  sc.duracion_servicio,
  sc.created_at,
  sc.creado_por,
  -- Campos adicionales de cliente
  pc.rfc as cliente_rfc,
  pc.contacto_email as cliente_email,
  pc.forma_pago_preferida,
  -- Precios de referencia
  mpr.valor_bruto as precio_lista,
  mpr.precio_custodio as costo_lista
FROM servicios_custodia sc
LEFT JOIN pc_clientes pc ON LOWER(TRIM(sc.nombre_cliente)) = LOWER(TRIM(pc.nombre))
LEFT JOIN matriz_precios_rutas mpr ON sc.ruta = mpr.clave
WHERE sc.estado IN ('Finalizado', 'En ruta', 'En Espera');
```

### Politicas RLS

```sql
-- Solo lectura para roles de facturacion/finanzas
CREATE POLICY "facturacion_read_servicios" ON servicios_custodia
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('facturacion_admin', 'facturacion', 'finanzas_admin', 'finanzas', 'admin', 'owner', 'bi')
  )
);
```

---

## 6. Componentes UI a Crear

### Archivos Nuevos

```text
src/pages/Facturacion/
├── FacturacionHub.tsx              → Hub principal con tabs
├── components/
│   ├── FacturacionDashboard.tsx    → KPIs y graficas ejecutivas
│   ├── ServiciosConsulta.tsx       → Tabla con filtros avanzados
│   ├── ClientesAnalisis.tsx        → Concentracion y rentabilidad
│   ├── RentabilidadView.tsx        → Margenes por ruta/cliente
│   ├── ExportacionPanel.tsx        → Generacion de reportes
│   └── charts/
│       ├── IngresosTrendChart.tsx  → Evolucion temporal
│       ├── MargenPieChart.tsx      → Distribucion de margenes
│       ├── ClienteConcentration.tsx→ Pareto de clientes
│       └── RutasRentabilidad.tsx   → Mapa de calor rutas
├── hooks/
│   ├── useFacturacionMetrics.ts    → Hook de KPIs
│   ├── useServiciosFacturacion.ts  → Hook de consulta
│   └── useExportFacturacion.ts     → Hook de exportacion
```

---

## 7. Integracion con App.tsx

```typescript
// Nueva ruta protegida
<Route
  path="/facturacion/*"
  element={
    <ProtectedRoute>
      <RoleProtectedRoute allowedRoles={[
        'admin', 
        'owner', 
        'bi',
        'facturacion_admin', 
        'facturacion',
        'finanzas_admin',
        'finanzas'
      ]}>
        <UnifiedLayout>
          <FacturacionHub />
        </UnifiedLayout>
      </RoleProtectedRoute>
    </ProtectedRoute>
  }
/>
```

---

## 8. Actualizacion de Access Control

```typescript
// src/constants/accessControl.ts

/**
 * Roles de Facturacion y Finanzas
 */
export const FACTURACION_ROLES = [
  'facturacion_admin',
  'facturacion',
  'finanzas_admin',
  'finanzas'
] as const;

/**
 * Roles con acceso completo a Facturacion
 */
export const FACTURACION_FULL_ACCESS_ROLES = [
  'admin',
  'owner',
  'bi',
  'facturacion_admin',
  'finanzas_admin'
] as const;

/**
 * Roles con acceso limitado (solo consulta)
 */
export const FACTURACION_LIMITED_ROLES = [
  'facturacion',
  'finanzas'
] as const;
```

---

## 9. Actualizacion de Role Types

```typescript
// src/types/roleTypes.ts
export type Role = 
  | 'owner'
  | 'admin'
  // ... roles existentes ...
  | 'facturacion_admin'  // NUEVO
  | 'facturacion'        // NUEVO
  | 'finanzas_admin'     // NUEVO
  | 'finanzas'           // NUEVO
  | 'pending'
  | 'unverified';
```

---

## 10. Tabs del Modulo

| Tab | Roles | Descripcion |
|-----|-------|-------------|
| **Dashboard** | Todos | KPIs ejecutivos, trends, insights |
| **Servicios** | Todos | Consulta detallada con filtros |
| **Clientes** | full_access | Analisis de concentracion y rentabilidad |
| **Rentabilidad** | full_access | Margenes por dimension |
| **Exportacion** | admin roles | Generacion de reportes Excel/PDF |

---

## 11. Funcionalidades Clave

### Para el Head de BI

1. **Insights Automaticos**: Alertas cuando margenes caen debajo de umbral
2. **Comparacion Temporal**: MoM, YoY, WoW
3. **Segmentacion Dinamica**: Drill-down por cliente/ruta/periodo
4. **Concentracion de Riesgo**: Pareto de clientes (80/20)
5. **Proyecciones**: Forecast basado en tendencias

### Para Facturacion

1. **Busqueda Rapida**: Por folio, cliente, fecha
2. **Exportacion a Excel**: Con todos los campos necesarios
3. **Filtros Predefinidos**: "Pendientes de facturar", "Este mes", etc.
4. **Validacion de Datos**: Alertas de servicios sin cobro asignado

---

## 12. Archivos a Crear/Modificar

| Archivo | Accion |
|---------|--------|
| `src/types/roleTypes.ts` | Agregar 4 nuevos roles |
| `src/constants/accessControl.ts` | Agregar constantes de facturacion |
| `src/pages/Facturacion/FacturacionHub.tsx` | CREAR - Hub principal |
| `src/pages/Facturacion/components/*.tsx` | CREAR - 5 componentes |
| `src/pages/Facturacion/hooks/*.ts` | CREAR - 3 hooks |
| `src/App.tsx` | Agregar rutas protegidas |
| `src/components/navigation/GlobalNav.tsx` | Agregar modulo Facturacion |
| Migracion SQL | CREAR vista + RLS policies |

---

## 13. Datos de Muestra (Enero-Febrero 2026)

| Metrica | Valor |
|---------|-------|
| Servicios Finalizados | 726 |
| Ingresos Totales | $6,294,356 MXN |
| Costos Operativos | $2,736,114 MXN |
| Margen Bruto | $3,558,242 MXN |
| % Margen Promedio | 56.5% |
| Servicios Cancelados | 33 (4.3%) |

---

## Entregables

1. 4 nuevos roles en el sistema
2. Modulo completo con 5 vistas
3. Dashboard BI con KPIs estrategicos
4. Vista espejo read-only de servicios
5. Exportacion a Excel
6. Auditoria de accesos (log de consultas)
