

# Plan: Configuración de Cobros por Cliente + Visibilidad de Gastos para Finanzas

## Diagnóstico

| Concepto | En DB | En UI del Cliente | Estado |
|---|---|---|---|
| `tarifa_sin_arma` | ✅ `pc_clientes` | ❌ Solo en EstadiasPanel (reglas globales) | Falta en form cliente |
| `tarifa_con_arma` | ✅ `pc_clientes` | ❌ Solo en EstadiasPanel | Falta en form cliente |
| `cobra_gadgets` (flag) | ❌ No existe | ❌ | Falta DB + UI |
| Gadgets con precios | ✅ `pc_clientes_gadgets` | ✅ Tab "Gadgets" en form | OK |
| Gastos custodios | ✅ `solicitudes_apoyo_extraordinario` | ✅ Dentro de Operaciones > Gastos Extra | No tiene tab propio en Finanzas |

## Cambios

### 1. Migración: `cobra_gadgets` en `pc_clientes`
```sql
ALTER TABLE pc_clientes ADD COLUMN cobra_gadgets boolean DEFAULT true;
```

### 2. Hook `useClientesFiscales.ts`
- Agregar `tarifa_sin_arma`, `tarifa_con_arma`, `cobra_gadgets` al tipo `ClienteFiscal`, a `ClienteFiscalUpdate`, y al SELECT.

### 3. `ClienteFormModal.tsx` — Tab "Facturación"
Después de la sección de pernocta, agregar:

**Bloque "Tarifas Servicio Armado"**:
- Input `Tarifa Estadía Sin Arma` → `tarifa_sin_arma`
- Input `Tarifa Estadía Con Arma` → `tarifa_con_arma`

**Bloque "Gadgets"**:
- Checkbox "Cobra gadgets a este cliente" → `cobra_gadgets`
- Nota informativa: "Configura precios por gadget en la pestaña Gadgets"

### 4. `ConfigTab.tsx` — Nueva sub-tab "Gadgets"
Agregar una sub-tab en Configuración del módulo de Finanzas para ver/editar los precios globales de gadgets. Esto reutiliza la tabla `pc_clientes_gadgets` pero ofrece una vista consolidada de todos los clientes y sus gadgets configurados, para que Finanzas tenga visibilidad rápida sin abrir cliente por cliente.

### 5. Gastos Extraordinarios visibles para Finanzas
Actualmente los gastos de custodios (`solicitudes_apoyo_extraordinario`) están enterrados en Operaciones > Gastos Extra > scroll al panel de aprobación. Para darle a Finanzas acceso directo:
- Agregar una sub-tab "Gastos Custodios" en **Egresos** (junto a OCA e Internos/PE), reutilizando el componente `AprobacionGastosPanel` existente.

### Archivos a modificar
1. **Migración SQL** — agregar `cobra_gadgets`
2. **`useClientesFiscales.ts`** — 3 campos al tipo + query
3. **`ClienteFormModal.tsx`** — inputs tarifa armado + checkbox cobra_gadgets en tab Facturación
4. **`EgresosTab.tsx`** — nuevo segmento "Gastos Custodios" con `AprobacionGastosPanel`
5. **`ConfigTab.tsx`** — nueva sub-tab "Gadgets" con vista consolidada

