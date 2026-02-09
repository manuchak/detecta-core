

# Plan: Configuracion de Pago SEICSA + Tarifas por KM Editables

## Problema Actual

Las tarifas escalonadas de pago a armados internos (SEICSA) estan **hardcodeadas** en 3 archivos distintos:

- `src/hooks/useFinancialMetrics.ts` - RANGOS_KM
- `src/pages/Reportes/hooks/useArmadosInternosMetrics.ts` - TARIFAS_KM  
- `src/pages/PerfilesOperativos/hooks/useArmadoEconomics.ts`

Las tarifas actuales son:
- 0-100 km: $6.0/km
- 101-250 km: $5.5/km
- 251-400 km: $5.0/km
- 400+ km: $4.6/km

No hay forma de editarlas desde la UI, y no estan en base de datos.

## Solucion

### 1. Tabla en base de datos: `tarifas_km_armados_internos`

Almacenara los rangos de tarifas por km para que sean editables:

| Columna | Tipo | Descripcion |
|---------|------|-------------|
| id | uuid | PK |
| km_min | integer | Inicio del rango |
| km_max | integer | Fin del rango (NULL = sin limite) |
| tarifa_por_km | numeric | Precio por km |
| descripcion | text | Ej: "0-100 km" |
| activo | boolean | Default true |
| orden | integer | Para ordenar los rangos |
| created_at / updated_at | timestamp | Audit |

Se insertaran los 4 rangos actuales como datos iniciales (seed).

### 2. Hook: `useTarifasKmArmados`

- CRUD para la tabla `tarifas_km_armados_internos`
- Funcion `calcularCostoPorKm(km)` que lee de la tabla en vez de constantes
- Cache con React Query (stale 5 min)

### 3. Nuevo componente: `TarifasKmInternosCard`

Una card dentro del tab "Esquemas" de la configuracion de Planeacion que muestre:
- Titulo "Tarifas SEICSA - Armados Internos (por KM)"
- Tabla editable con los 4 rangos: km_min, km_max, tarifa
- Botones para editar cada rango inline
- Boton para agregar rango adicional
- Vista previa: simulador que muestra "Para X km, el costo seria $Y"

### 4. Integracion en EsquemasArmadosTab

Agregar el `TarifasKmInternosCard` arriba o abajo de los esquemas de proveedores externos existentes, separado con un encabezado claro:
- Seccion 1: "Tarifas Armados Internos (SEICSA) - Por KM"
- Seccion 2: "Esquemas Proveedores Externos" (lo que ya existe)

### 5. Refactorizar consumidores

Actualizar los 3 archivos que tienen las tarifas hardcodeadas para que lean de la tabla via el hook, con fallback a los valores actuales si la tabla esta vacia.

## Archivos a Crear

| Archivo | Descripcion |
|---------|-------------|
| `supabase/migrations/..._tarifas_km_armados.sql` | Tabla + seed data + RLS |
| `src/hooks/useTarifasKmArmados.ts` | Hook CRUD + calculo |
| `src/pages/Planeacion/components/configuration/TarifasKmInternosCard.tsx` | UI editable |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Planeacion/components/configuration/EsquemasArmadosTab.tsx` | Agregar TarifasKmInternosCard |
| `src/hooks/useFinancialMetrics.ts` | Usar hook en vez de constantes |
| `src/pages/Reportes/hooks/useArmadosInternosMetrics.ts` | Usar hook en vez de constantes |
| `src/integrations/supabase/types.ts` | Tipos de la nueva tabla |
