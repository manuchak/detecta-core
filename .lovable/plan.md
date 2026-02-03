
# Plan: Auditoría y Baja Masiva de Armados Internos (+90 días)

## Contexto

El sistema ya tiene implementada la lógica para calcular días de inactividad (`dias_sin_actividad`) y nivel de actividad para armados. También existe el hook `useBajaMasiva` que ya soporta el tipo `armado`. Solo falta replicar la UI de selección masiva del módulo de custodios.

## Datos Actuales
- **85 armados** listados en perfiles operativos
- Ya existe filtro "Sin actividad (+90d)" en la tabla
- Hook `useBajaMasiva` ya soporta `operativoTipo: 'armado'`

## Cambios a Implementar

### 1. Hacer el Modal Genérico

**Archivo:** `src/pages/PerfilesOperativos/components/BajaMasivaModal.tsx`

Modificar para aceptar un prop `operativoTipo` y ajustar los textos dinámicamente:
- Cambiar prop `custodios` → `operativos`
- Agregar prop `operativoTipo: 'custodio' | 'armado'`
- Textos dinámicos según el tipo

### 2. Agregar Selección Masiva a Armados

**Archivo:** `src/pages/PerfilesOperativos/components/ArmadosDataTable.tsx`

Replicar la funcionalidad del `CustodiosDataTable`:
- Estado para IDs seleccionados (`selectedIds`)
- Columna de checkbox con "Seleccionar todos"
- Barra de acciones flotante cuando hay selección
- Integración con modal de baja masiva

## Estructura de Cambios

```text
BajaMasivaModal.tsx          ArmadosDataTable.tsx
┌────────────────────┐       ┌────────────────────┐
│ + operativoTipo    │       │ + selectedIds      │
│ + textos dinámicos │       │ + columna checkbox │
│ - hardcode custodio│       │ + barra de acciones│
└────────────────────┘       │ + modal de baja    │
                             └────────────────────┘
```

## Flujo de Usuario

1. Ir a **Perfiles Operativos > Armados**
2. Filtrar por **"Sin actividad (+90d)"** para ver los inactivos
3. Seleccionar armados con checkbox (o "Seleccionar todos")
4. Clic en **"Dar de baja masiva"**
5. Confirmar en el modal
6. Sistema procesa y registra historial

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `BajaMasivaModal.tsx` | Hacerlo genérico para custodios y armados |
| `ArmadosDataTable.tsx` | Agregar checkboxes, estado de selección, barra de acciones y modal |

## Vista Previa UI

**Tabla con selección (misma que custodios):**
```
☑️ Seleccionar | Armado            | Tipo    | Zona  | Actividad     | Días
☐              | Juan García       | Interno | CDMX  | Sin actividad | 120
☑️             | Pedro Martínez    | Interno | Qro   | Sin actividad | 95
☑️             | Luis Sánchez      | Interno | NL    | Sin actividad | 180
```

**Barra flotante:**
```
┌──────────────────────────────────────────────────────┐
│ 2 armados seleccionados   [Limpiar] [Dar de baja]   │
└──────────────────────────────────────────────────────┘
```
