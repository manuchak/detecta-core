
# Plan: Ajustar Definición de Bajas vs Suspendidos

## Clarificación Conceptual

| Categoría | Estado DB | Significado | Dónde mostrar |
|-----------|-----------|-------------|---------------|
| **Operativos** | `activo` + `suspendido` | Trabajan o volverán a trabajar | Tab "Custodios" |
| **Bajas** | `inactivo` | Ya no trabajan definitivamente | Tab "Bajas" |

## Cambios Requeridos

### 1. Hook `useOperativeProfiles.ts`

**Query de Custodios** - Incluir suspendidos:
```typescript
// ANTES
.eq('estado', 'activo')

// DESPUÉS
.in('estado', ['activo', 'suspendido'])
```

**Query de Bajas** - Solo inactivos permanentes:
```typescript
// ANTES
.in('estado', ['inactivo', 'suspendido'])

// DESPUÉS
.eq('estado', 'inactivo')
```

### 2. Stats Actualizados

```typescript
totalCustodios: // activos + suspendidos (operativos reales)
totalBajas: // solo inactivos (bajas definitivas)
suspendidos: // nuevo stat para visibilidad
```

### 3. Tabla de Custodios

Agregar columna/badge para distinguir:
- `activo` = Badge verde "Activo"
- `suspendido` = Badge amarillo "Suspendido" con fecha de reactivación

### 4. Tabla de Bajas

Simplificar - solo mostrar bajas permanentes:
- Quitar filtro de tipo (temporal/permanente)
- Todos son bajas definitivas por inactividad

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Custodios (operativos) | 77 (solo activos) | ~113 (activos + suspendidos) |
| Bajas (definitivas) | 37 (mezclados) | ~1 (solo inactivos) |
| Suspendidos visibles | En "Bajas" | En "Custodios" con badge |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts` | Ajustar queries y stats |
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Agregar badge de estado |
| `src/pages/PerfilesOperativos/components/BajasDataTable.tsx` | Simplificar para solo inactivos |
| `src/pages/PerfilesOperativos/index.tsx` | Actualizar stat cards |
