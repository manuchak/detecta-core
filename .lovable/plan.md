
# Plan: Baja Masiva por Inactividad (+90 días)

## Contexto

El sistema ya calcula automáticamente `dias_sin_actividad` y clasifica custodios en niveles de actividad. Los que tienen +90 días sin servicio aparecen como `nivel_actividad: 'sin_actividad'`.

**Datos actuales** (según el filtro existente):
- Ya existe el filtro "Sin actividad (+90d)" en la tabla de Custodios
- Cada custodio tiene `dias_sin_actividad` calculado

## Implementación

### 1. Agregar Sistema de Selección con Checkboxes

**Archivo:** `CustodiosDataTable.tsx`

- Agregar columna de checkbox al inicio de la tabla
- Estado local para IDs seleccionados
- Checkbox en header para seleccionar/deseleccionar todos los visibles
- Badge mostrando cantidad seleccionada

### 2. Barra de Acciones en Lote

Cuando hay elementos seleccionados, mostrar barra flotante con:
- Contador: "X custodios seleccionados"
- Botón "Dar de baja masiva" (rojo/destructivo)
- Botón "Limpiar selección"

### 3. Modal de Confirmación de Baja Masiva

**Nuevo componente:** `BajaMasivaModal.tsx`

Contenido del modal:
- Lista de custodios a dar de baja (nombre, días sin actividad)
- Selector de motivo (predeterminado: "Dado de baja por inactividad")
- Campo de notas opcional
- Resumen: "Se darán de baja X custodios"
- Botones: Cancelar / Confirmar

### 4. Hook para Baja Masiva

**Nuevo hook:** `useBajaMasiva.ts`

```typescript
// Procesa la baja en lote usando transacciones
async function darDeBajaMasiva(
  custodioIds: string[],
  motivo: string,
  notas?: string
)
```

Funcionalidad:
- Actualiza todos los custodios a `estado: 'inactivo'`
- Registra historial en `operativo_estatus_historial`
- Invalida queries relevantes
- Muestra toast con resultado

## Flujo de Usuario

```text
1. Ir a Perfiles Operativos > Custodios
2. Filtrar por "Sin actividad (+90d)"
3. Seleccionar custodios con checkbox (o "Seleccionar todos")
4. Clic en "Dar de baja masiva"
5. Confirmar motivo en modal
6. Sistema procesa y mueve custodios a tab "Bajas"
```

## Archivos a Crear/Modificar

| Archivo | Acción |
|---------|--------|
| `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` | Agregar checkboxes y barra de acciones |
| `src/pages/PerfilesOperativos/components/BajaMasivaModal.tsx` | **Nuevo** - Modal de confirmación |
| `src/hooks/useBajaMasiva.ts` | **Nuevo** - Hook para procesar baja en lote |

## Vista Previa UI

**Tabla con selección:**
```
☑️ Seleccionar | Custodio          | Zona  | Actividad    | Días
☐              | Juan Pérez        | CDMX  | Sin actividad| 120
☑️             | María López       | Qro   | Sin actividad| 95
☑️             | Carlos Hernández  | NL    | Sin actividad| 180
```

**Barra de acciones:**
```
┌─────────────────────────────────────────────────────┐
│ 2 custodios seleccionados   [Limpiar] [Dar de baja]│
└─────────────────────────────────────────────────────┘
```
