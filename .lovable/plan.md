

# Plan: Billing Command Center — UX de Facturación Inteligente

## Problema actual

El usuario tiene que navegar entre múltiples pestañas para armar una factura:
- **Insights** → valor de ruta (`cobro_cliente`), casetas, costo custodio
- **Tiempos Ops** → deltas de origen/destino (base para calcular estadías)
- **Config/Reglas** → horas de cortesía, tarifas de excedente por cliente
- **Por Facturar** → lista plana de servicios sin contexto financiero enriquecido

No hay un lugar que **consolide automáticamente** todos los conceptos facturables por servicio.

## Solución: "Pre-Factura Inteligente" — Un solo click para ver todo lo que se debe cobrar

Rediseñar el flujo de `ServiciosPorFacturarTab` → `GenerarFacturaModal` para que el sistema **auto-calcule** cada línea de la factura con todos los conceptos, y el usuario solo valide/ajuste.

### Arquitectura de datos (lo que ya existe y cómo conectarlo)

```text
┌─────────────────────────────────────────────────────────────┐
│  SERVICIO (vw_servicios_facturacion)                        │
│  cobro_cliente, costo_custodio, casetas, ruta, folio        │
├─────────────────────────────────────────────────────────────┤
│  + TIEMPOS OPS (servicio_eventos_ruta via ServiceTimes)     │
│    deltaOrigen, deltaDestino → base para estadías           │
├─────────────────────────────────────────────────────────────┤
│  + REGLAS CLIENTE (reglas_estadias_cliente + pc_clientes)    │
│    horas_cortesia, tarifa_hora_excedente, cobra_pernocta    │
├─────────────────────────────────────────────────────────────┤
│  + DETENCIONES (detenciones_servicio)                       │
│    eventos cobrables: espera_cliente, carga, descarga...    │
├─────────────────────────────────────────────────────────────┤
│  + GASTOS EXTRA (gastos_extraordinarios_servicio)           │
│    hoteles, pernoctas reembolsables al cliente              │
└─────────────────────────────────────────────────────────────┘
         ↓ AUTO-CONSOLIDADO ↓
┌─────────────────────────────────────────────────────────────┐
│  LÍNEAS DE FACTURA (auto-generadas)                        │
│  1. Servicio de custodia (tarifa ruta)     $X,XXX          │
│  2. Casetas                                 $X,XXX          │
│  3. Estadía excedente (Xh × $tarifa)        $X,XXX          │
│  4. Pernocta                                $X,XXX          │
│  5. Gastos reembolsables                    $X,XXX          │
│                                    Subtotal  $XX,XXX        │
└─────────────────────────────────────────────────────────────┘
```

## Cambios concretos

### 1. Nuevo hook: `usePreFacturaInteligente.ts`

Hook que, dado un array de `ServicioFacturacion[]` y un `clienteId`, consolida automáticamente:

- **Por cada servicio**: cruza con `servicio_eventos_ruta` para obtener deltas (reutiliza lógica de `fetchServiceTimes`)
- **Aplica reglas de estadía**: usa `resolveReglaEstadia()` del cliente para calcular horas excedentes
- **Suma casetas**: del campo `casetas` de `vw_servicios_facturacion`
- **Detecta pernoctas**: desde `servicio_eventos_ruta` tipo `pernocta` o `detenciones_servicio`
- **Agrega gastos extra reembolsables**: desde `gastos_extraordinarios_servicio` con `cobrable_cliente = true`

Retorna un array de `LineaPreFactura[]`:
```typescript
interface LineaPreFactura {
  servicioId: number;
  folio: string;
  fecha: string;
  ruta: string;
  conceptos: ConceptoFacturable[];
  subtotalServicio: number;
}

interface ConceptoFacturable {
  tipo: 'custodia' | 'casetas' | 'estadia' | 'pernocta' | 'gasto_extra';
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  importe: number;
  editable: boolean; // usuario puede ajustar
  detalle?: string;  // para tooltip/drill-down
}
```

### 2. Rediseño de `ServiciosPorFacturarTab` → Vista de cliente expandible

Cuando el usuario hace click en "Facturar" un cliente, en lugar de ir directo al modal, se expande una fila (accordion/collapsible) que muestra:

- **Resumen rápido por cliente**: Total servicios, monto base, estadías detectadas, casetas, extras
- **Semáforo de readiness**: iconos que indican si el cliente tiene datos fiscales completos, reglas de estadía configuradas, etc.
- **Tabla compacta de servicios** con columnas enriquecidas:
  - Folio | Fecha | Ruta | Tarifa | Casetas | Δ Estadía | Extras | Total
  - Cada fila tiene un toggle de inclusión (checkbox) pre-seleccionado
- **Botón "Generar Pre-Factura"** que abre el modal ya con todas las líneas calculadas

### 3. Rediseño de `GenerarFacturaModal` → Multi-concepto

Actualizar el modal para mostrar las líneas agrupadas por concepto en lugar de solo listar servicios:

**Sección 1: Resumen visual (cards)**
- Servicios de custodia: $XXX (N servicios)
- Casetas: $XXX
- Estadías excedentes: $XXX (N servicios con excedente)
- Pernoctas: $XXX
- Otros: $XXX

**Sección 2: Tabla de partidas editables**
Cada fila es un concepto facturable. El usuario puede:
- Ajustar montos (campo editable inline)
- Excluir conceptos (toggle)
- Ver detalle (tooltip con cálculo de estadía, horas de cortesía, etc.)

**Sección 3: Totales** (ya existe, se mantiene)

### 4. Componente `ClienteBillingReadiness`

Badge/indicador compacto que muestra qué tan "listo para facturar" está un cliente:
- Datos fiscales completos (RFC, razón social)
- Reglas de estadía configuradas
- Portal configurado (si aplica)
- Contactos de facturación

Se muestra en la tabla de "Por Facturar" al lado del nombre del cliente.

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| **Nuevo**: `usePreFacturaInteligente.ts` | Hook que auto-calcula todas las líneas facturables |
| **Nuevo**: `ClienteBillingReadiness.tsx` | Indicador de readiness del cliente |
| **Modificar**: `ServiciosPorFacturarTab.tsx` | Expandir filas con resumen enriquecido, semáforo readiness |
| **Modificar**: `GenerarFacturaModal.tsx` | Multi-concepto con partidas editables por tipo |
| **Modificar**: `useGenerarFactura.ts` | Soportar múltiples tipos de partida (no solo custodia) |

## Flujo del usuario (3 clicks)

1. Ve lista de clientes con pendientes → semáforo verde/amarillo/rojo de readiness
2. Click "Facturar" → se expande resumen con todos los conceptos auto-calculados
3. Valida, ajusta si necesario → "Generar Pre-Factura" → modal con todo pre-llenado, confirma

