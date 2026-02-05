
# Plan: Gestión de Nombres Comerciales de Clientes en Planeación + Arquitectura con Cliente ID

## Diagnóstico Detallado

### Estado Actual de Datos

| Métrica | Valor | Impacto |
|---------|-------|---------|
| Clientes en `pc_clientes` (tabla maestra) | 69 | Base de datos oficial |
| Clientes que SOLO existen en rutas (texto libre) | **386** | Sin registro formal |
| Rutas "huérfanas" (sin vínculo a tabla maestra) | **1,655** | Relaciones rotas |
| Clientes maestros CON rutas vinculadas | 67 | Solo 2.5% del total de rutas |

### Arquitectura Actual de Relaciones

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     TABLAS CON cliente_id (FK) ✓                        │
│  facturas, pagos, pc_servicios, pc_rutas_frecuentes, cobranza_seguimiento│
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          pc_clientes                                     │
│  id (PK) | nombre (comercial) | razon_social (fiscal) | rfc | ...       │
└─────────────────────────────────────────────────────────────────────────┘
                                    ▲
                                    │ NO HAY RELACIÓN
                                    │
┌─────────────────────────────────────────────────────────────────────────┐
│               TABLAS CON cliente_nombre (texto libre) ✗                  │
│  matriz_precios_rutas, servicios_custodia, servicios_planificados        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Interfaces de Edición Actuales

| Módulo | Componente | Campo `nombre` | Campo `razon_social` | cliente_id |
|--------|------------|----------------|----------------------|------------|
| Planeación | ClienteDialog.tsx | ✓ Editable | ✗ No existe | No aplica |
| Facturación | ClienteFormModal.tsx | ✓ Editable (recién agregado) | ✓ Editable | No aplica |
| Rutas | RouteManagementForm.tsx | ✓ Input libre | ✗ No existe | **✗ No existe** |

---

## Solución en 3 Fases

### Fase 1: Gestión de Clientes desde Rutas (Inmediato)

**Objetivo**: Permitir al equipo de Planeación crear/vincular clientes directamente desde Gestión de Rutas.

#### 1.1 Nuevo Componente: ClienteSelector para Rutas

Reemplazar el input de texto libre por un selector inteligente que:
- Busque en `pc_clientes` primero
- Busque en clientes "solo rutas" como fallback
- Permita crear cliente nuevo si no existe

**Archivos a modificar:**
- `src/pages/Planeacion/components/RouteManagementForm.tsx`
- Nuevo: `src/pages/Planeacion/components/routes/ClienteSelectorForRoutes.tsx`

#### 1.2 Gestión Rápida de Nombre Comercial desde Rutas

Agregar acción "Editar Cliente" en el menú de acciones de cada ruta que:
- Abra modal de edición de `pc_clientes`
- Solo permita editar `nombre` (comercial)
- Muestre warning de impacto en rutas existentes
- Requiera rol autorizado (`NOMBRE_COMERCIAL_EDIT_ROLES`)

**Archivos a crear:**
- `src/pages/Planeacion/components/routes/QuickClienteEditModal.tsx`

#### 1.3 Sub-tab "Clientes" en Gestión de Rutas

Agregar pestaña para ver/editar clientes con rutas:

**Modificar:**
- `src/pages/Planeacion/components/RoutesManagementTab.tsx` - Agregar tab "Clientes"
- Nuevo: `src/pages/Planeacion/components/routes/ClientesConRutasTable.tsx`

---

### Fase 2: Agregar cliente_id a matriz_precios_rutas (Riesgo Medio)

**Objetivo**: Normalizar relaciones con foreign keys para queries eficientes.

#### 2.1 Migración de Base de Datos

```sql
-- Paso 1: Agregar columna nullable
ALTER TABLE matriz_precios_rutas 
ADD COLUMN cliente_id uuid REFERENCES pc_clientes(id);

-- Paso 2: Crear índice para performance
CREATE INDEX idx_matriz_precios_cliente_id 
ON matriz_precios_rutas(cliente_id);

-- Paso 3: Script de vinculación automática
UPDATE matriz_precios_rutas mpr
SET cliente_id = pc.id
FROM pc_clientes pc
WHERE LOWER(mpr.cliente_nombre) = LOWER(pc.nombre)
AND mpr.cliente_id IS NULL;

-- Paso 4: Vista para identificar rutas sin vincular
CREATE VIEW vw_rutas_sin_cliente AS
SELECT DISTINCT cliente_nombre, COUNT(*) as rutas_count
FROM matriz_precios_rutas
WHERE cliente_id IS NULL AND activo = true
GROUP BY cliente_nombre
ORDER BY rutas_count DESC;
```

#### 2.2 Hook Actualizado para Rutas

**Modificar:**
- `src/hooks/useClientesFromPricing.ts` - Agregar lógica para usar cliente_id cuando exista

#### 2.3 UI de Reconciliación

Crear interfaz para que Planeación vincule manualmente las 386 entidades huérfanas:

**Nuevo:**
- `src/pages/Planeacion/components/routes/ClienteReconciliationTool.tsx`

---

### Fase 3: Sistema de Alias (Largo Plazo)

**Objetivo**: Permitir múltiples nombres para el mismo cliente sin perder historiales.

#### 3.1 Nueva Tabla de Alias

```sql
CREATE TABLE pc_clientes_alias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES pc_clientes(id) NOT NULL,
  alias text NOT NULL,
  tipo text DEFAULT 'comercial', -- 'comercial', 'fiscal', 'historico'
  es_principal boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  UNIQUE(alias)
);

-- Trigger para buscar en alias automáticamente
CREATE OR REPLACE FUNCTION buscar_cliente_por_nombre(nombre_buscar text)
RETURNS uuid AS $$
BEGIN
  -- Primero buscar en nombre principal
  RETURN (SELECT id FROM pc_clientes WHERE LOWER(nombre) = LOWER(nombre_buscar) LIMIT 1);
  
  -- Si no encuentra, buscar en alias
  IF NOT FOUND THEN
    RETURN (SELECT cliente_id FROM pc_clientes_alias WHERE LOWER(alias) = LOWER(nombre_buscar) LIMIT 1);
  END IF;
END;
$$ LANGUAGE plpgsql;
```

---

## Implementación Detallada - Fase 1

### Cambios en RouteManagementForm.tsx

El campo "Cliente" actual es un Input libre. Lo reemplazaremos por un componente de búsqueda/selección:

```text
[Input texto libre]  →  [ClienteSelector con autocomplete + crear nuevo]
```

**Comportamiento:**
1. El usuario escribe nombre
2. Se muestran sugerencias de `pc_clientes` (prioridad) + clientes solo en rutas
3. Si selecciona existente: se guarda el nombre normalizado
4. Si escribe nuevo: opción de crear en `pc_clientes` o usar texto libre

### Cambios en RoutesManagementTab.tsx

```text
Tabs actuales:
[Pendientes] [Todas las Rutas] [Historial]

Tabs propuestos:
[Pendientes] [Todas las Rutas] [Clientes] [Historial]
```

El tab "Clientes" mostrará:
- Clientes con rutas activas
- Botón "Editar nombre comercial" (con warning)
- Indicador de cuántas rutas tiene cada cliente

### Nuevo QuickClienteEditModal

Modal minimalista para editar solo el nombre comercial:
- Input para nuevo nombre
- Warning si el cliente tiene rutas/servicios
- Checkbox de confirmación obligatorio
- Registro en historial de cambios

---

## Control de Acceso

| Acción | Roles Autorizados |
|--------|-------------------|
| Ver clientes en rutas | Cualquier planificador |
| Crear cliente nuevo | admin, owner, coordinador_operaciones, planificador |
| Editar nombre comercial | admin, owner, coordinador_operaciones |
| Vincular ruta a cliente existente | Cualquier planificador |

---

## Archivos a Crear/Modificar

### Nuevos Archivos
1. `src/pages/Planeacion/components/routes/ClienteSelectorForRoutes.tsx`
2. `src/pages/Planeacion/components/routes/QuickClienteEditModal.tsx`
3. `src/pages/Planeacion/components/routes/ClientesConRutasTable.tsx`
4. `src/hooks/useClientesEnRutas.ts`

### Archivos a Modificar
1. `src/pages/Planeacion/components/RoutesManagementTab.tsx` - Agregar tab Clientes
2. `src/pages/Planeacion/components/RouteManagementForm.tsx` - Integrar ClienteSelector
3. `src/pages/Planeacion/components/MatrizPreciosTab.tsx` - Agregar acción "Editar Cliente"
4. `src/constants/accessControl.ts` - Ya tiene NOMBRE_COMERCIAL_EDIT_ROLES

---

## Riesgos y Mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Cambiar nombre rompe búsquedas de rutas | No propagar automáticamente; advertencia visual obligatoria |
| Duplicados al crear clientes | Validación de nombre existente antes de crear |
| Performance en autocomplete | Debounce + cache de 2 min en useAllClientes |
| Confusión nombre comercial vs fiscal | Labels claros: "Nombre Comercial (búsquedas)" vs "Razón Social (facturas)" |

---

## Orden de Implementación Sugerido

1. **ClienteSelectorForRoutes** - Selector inteligente con autocomplete
2. **QuickClienteEditModal** - Edición rápida de nombre comercial
3. **Tab Clientes en RoutesManagementTab** - Vista centralizada
4. **Integración en RouteManagementForm** - Reemplazar input libre
5. **Acciones en tabla de rutas** - Botón "Editar Cliente"

---

## Métricas de Éxito

- Reducción de clientes "solo rutas" de 386 a <50 en 30 días
- 100% de nuevas rutas vinculadas a `pc_clientes`
- Cero incidentes de búsquedas rotas por cambio de nombre
