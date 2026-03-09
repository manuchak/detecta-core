

# Evaluación de Producto: Gastos Extraordinarios de Custodios

## Estado Actual

Ya tienes **3 tablas** construidas pero **vacías y desconectadas**:

| Tabla | Registros | Propósito | ¿Conectada al portal custodio? |
|-------|-----------|-----------|-------------------------------|
| `solicitudes_apoyo_extraordinario` | 0 | Apoyos (regreso base, hospedaje) | No |
| `gastos_extraordinarios_servicio` | 0 | Gastos (casetas, hotel, combustible) | No |
| `evidencias_gastos_servicio` | 0 | Evidencias/comprobantes | No |

**El backend ya integra estos datos al corte semanal** (líneas 259-307 de `useCxPCortesSemanales.ts`): apoyos aprobados y hoteles con `pagable_custodio=true` ya se suman al total. **Lo que falta es el flujo de entrada** desde el custodio y la **aprobación del coordinador**.

## Análisis RACI

```text
                          Custodio   Coord.Ops   Facturación   Admin
Solicitar gasto             R          I            -            -
Subir evidencia (foto)      R          -            -            -
Aprobar / Rechazar          -          R/A          I            A
Integrar al corte           -          -            R            A
Auditar / Disputar          -          C            R            A

R=Responsable  A=Aprobador  C=Consultado  I=Informado
```

## Gaps Identificados

1. **No hay UI en el portal custodio** para solicitar gastos ni subir evidencia
2. **No hay panel de aprobación** para coordinadores de operaciones
3. **Las 3 tablas están redundantes**: `gastos_extraordinarios_servicio` y `solicitudes_apoyo_extraordinario` cubren casos similares con esquemas diferentes — hay que unificar el flujo
4. **No hay bucket de storage** `evidencias-gastos` creado (el hook lo referencia pero puede no existir)
5. **RLS**: No hay políticas que permitan al custodio insertar/ver solo sus propios gastos

## Diseño Propuesto

### Decisión arquitectónica: Una sola tabla unificada

Usar `solicitudes_apoyo_extraordinario` como tabla principal (tiene mejor esquema: estado workflow, urgencia, aprobación, pago). Los gastos de hotel/caseta/combustible se registran aquí con `tipo_apoyo` expandido. Esto simplifica:
- Un solo formulario en el portal custodio
- Un solo panel de aprobación
- Una sola query en el corte semanal

### Flujo end-to-end

```text
CUSTODIO                    COORDINADOR                CORTE SEMANAL
   │                            │                          │
   ├─ Abre "Solicitar Apoyo"    │                          │
   ├─ Selecciona tipo           │                          │
   ├─ Monto + descripción       │                          │
   ├─ Sube foto comprobante     │                          │
   ├─ [Submit] ─────────────────┤                          │
   │                            ├─ Ve solicitud pendiente  │
   │                            ├─ Revisa evidencia        │
   │                            ├─ Aprueba / Rechaza       │
   │                            │  (monto_aprobado)        │
   │  ← Notificación estado     │                          │
   │                            │                          │
   │                            │     Al generar corte ────┤
   │                            │     query apoyos         │
   │                            │     estado='aprobado'    │
   │                            │     en rango de semana   │
   │                            │     → detalle corte      │
```

### Componentes a crear

**Portal Custodio (3 archivos nuevos):**

1. **`CustodianExpensesPage.tsx`** — Nueva página `/custodian/expenses`
   - Lista de solicitudes del custodio (mis gastos)
   - Estado visual: pendiente (amarillo), aprobado (verde), rechazado (rojo), pagado (azul)
   - Botón "Nueva Solicitud"

2. **`CreateExpenseForm.tsx`** — Modal/wizard mobile-first
   - Tipo de gasto (hotel, caseta riesgo, combustible, alimentación, transporte, otro)
   - Servicio asociado (selector de servicios recientes)
   - Monto + descripción + urgencia
   - Upload de foto con compresión (reusar `CameraUploader`)
   - Submit → insert en `solicitudes_apoyo_extraordinario`

3. **`MobileBottomNavNew.tsx`** — Agregar 5to tab "Gastos" con ícono `Receipt`

**Panel Coordinador (2 archivos nuevos):**

4. **`AprobacionGastosPanel.tsx`** — Tab o vista en módulo de Facturación o Monitoreo
   - Lista de solicitudes pendientes con filtros
   - Ver evidencia (foto), datos del servicio
   - Botones: Aprobar (con monto), Rechazar (con motivo)
   - Badge con count de pendientes

5. **Ruta en router** — Agregar `/facturacion` sub-tab o `/monitoring/gastos-pendientes`

**Cambios en existentes:**

6. **`useCxPCortesSemanales.ts`** — Ya integra apoyos aprobados; solo verificar que el campo `comprobante_url` se use para evidencia
7. **Storage bucket** — Crear `comprobantes-gastos` si no existe
8. **RLS policies** — Custodio: INSERT + SELECT propios; Coordinador: SELECT all + UPDATE estado

### Integridad de datos

- `custodio_id` = `auth.uid()` del custodio (identity link directo)
- `servicio_custodia_id` opcional para vincular al servicio
- `comprobante_url` almacena la foto en storage
- `estado` workflow: `pendiente` → `aprobado`/`rechazado` → `pagado` (al incluirse en corte)
- Trigger `updated_at` automático
- El corte semanal ya filtra por `estado = 'aprobado'` y rango de fechas

### Tipos de apoyo expandidos

Agregar al catálogo existente:
- `caseta_riesgo` — Caseta en zona de riesgo
- `hotel` — Hospedaje/pernocta
- `combustible` — Combustible adicional
- `alimentacion` — Alimentos
- `reparacion_vehicular` — Reparación vehículo
- `peaje_adicional` — Peaje no contemplado

## Archivos

| Archivo | Acción |
|---------|--------|
| `src/pages/custodian/CustodianExpensesPage.tsx` | Crear — lista de gastos del custodio |
| `src/components/custodian/CreateExpenseForm.tsx` | Crear — formulario mobile-first |
| `src/components/custodian/ExpenseCard.tsx` | Crear — tarjeta de gasto con estado |
| `src/hooks/useCustodianExpenses.ts` | Crear — hook CRUD para custodio |
| `src/components/custodian/MobileBottomNavNew.tsx` | Modificar — agregar tab "Gastos" |
| `src/pages/Facturacion/components/AprobacionGastosPanel.tsx` | Crear — panel de aprobación coordinador |
| `src/App.tsx` | Modificar — agregar ruta `/custodian/expenses` |
| Storage bucket + RLS | Migration SQL |

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Custodio sube gastos falsos | Evidencia fotográfica obligatoria + aprobación coordinador |
| Doble conteo en corte | Query filtra `estado = 'aprobado'` (no `pagado`), y al generar corte marca como `pagado` |
| Coordinador no revisa a tiempo | Badge de pendientes + filtro por urgencia |
| Fotos pesadas desde móvil | Compresión Canvas API (estándar existente ~400KB) |

