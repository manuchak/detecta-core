

# Plan: Módulo de Gestión de Rutas para Planeación

## Resumen Ejecutivo

Crear un módulo dedicado en Planeación para gestionar rutas y precios, enfocado en que el equipo de Planeación pueda:
1. Identificar y corregir rutas con precios pendientes ($1)
2. Actualizar precios de forma masiva (inflación, ajustes)
3. Mantener historial de cambios para auditoría

---

## Diagnóstico Actual

| Métrica | Valor |
|---------|-------|
| **Rutas con precio placeholder** | 127 de 2,324 (5.5%) |
| **Días promedio sin actualizar** | 47 días |
| **Rutas con margen negativo** | 2 rutas |
| **Historial de cambios** | No existe |

---

## Arquitectura Propuesta

### Fase 1: Tab "Rutas" en PlanningHub (Acceso Directo)

Mover la gestión de rutas desde Configuración a un tab principal en PlanningHub para mayor visibilidad.

**Archivo**: `src/pages/Planeacion/PlanningHub.tsx`

**Cambio**: Agregar nuevo tab "Rutas" entre "Consultas" y "GPS"

```
Tabs actuales:  Dashboard | Servicios | Consultas | GPS | Configuración
Tabs nuevos:    Dashboard | Servicios | Consultas | Rutas | GPS | Configuración
```

---

### Fase 2: Nuevo Componente RoutesManagementTab

**Archivo nuevo**: `src/pages/Planeacion/components/RoutesManagementTab.tsx`

**Estructura con 3 sub-tabs**:

```
┌─────────────────────────────────────────────────────────────┐
│  Gestión de Rutas                                           │
├─────────────────────────────────────────────────────────────┤
│  [Pendientes]  [Todas las Rutas]  [Historial]              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─ KPI Cards ─────────────────────────────────────────┐   │
│  │ Pendientes: 127 │ Total: 2,324 │ Margen Neg: 2      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─ Alert Banner (cuando hay pendientes) ───────────────┐  │
│  │ 127 rutas requieren actualización de precios          │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─ Tabla de Rutas Pendientes ──────────────────────────┐  │
│  │ Cliente | Ruta | Precio | Custodio | Días | Acciones │  │
│  │ ASTRA ZENECA | CIUDAD OBREGON → CUAUTITLAN | $1 | $1 │  │
│  │              [Editar Precio] [Ver Detalles]           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Sub-tab "Pendientes"**:
- Filtro automático: `valor_bruto <= 10 OR valor_bruto < precio_custodio`
- Badge con contador de pendientes
- Acción rápida "Editar Precio" inline
- Indicador visual de días sin actualizar

**Sub-tab "Todas las Rutas"**:
- Reutiliza componentes de `MatrizPreciosTab.tsx`
- Agregar filtro "Estado Precio" (Pendiente/Válido/Margen Negativo)
- Acción masiva: "Ajuste por Inflación %" (selección múltiple)

**Sub-tab "Historial"**:
- Tabla de cambios (requiere nueva tabla en DB - Fase 3)
- Filtros por cliente, fecha, usuario

---

### Fase 3: Tabla de Historial de Cambios de Precios

**Nueva migración SQL**: Crear tabla para auditoría de cambios

```sql
CREATE TABLE matriz_precios_historial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ruta_id UUID REFERENCES matriz_precios_rutas(id),
  campo_modificado TEXT NOT NULL,
  valor_anterior NUMERIC,
  valor_nuevo NUMERIC,
  motivo TEXT,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para capturar cambios automáticamente
CREATE OR REPLACE FUNCTION log_precio_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.valor_bruto IS DISTINCT FROM NEW.valor_bruto THEN
    INSERT INTO matriz_precios_historial (ruta_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (NEW.id, 'valor_bruto', OLD.valor_bruto, NEW.valor_bruto, auth.uid());
  END IF;
  IF OLD.precio_custodio IS DISTINCT FROM NEW.precio_custodio THEN
    INSERT INTO matriz_precios_historial (ruta_id, campo_modificado, valor_anterior, valor_nuevo, usuario_id)
    VALUES (NEW.id, 'precio_custodio', OLD.precio_custodio, NEW.precio_custodio, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_precio_change
  AFTER UPDATE ON matriz_precios_rutas
  FOR EACH ROW EXECUTE FUNCTION log_precio_change();
```

---

### Fase 4: Componente de Edición Rápida de Precio

**Archivo nuevo**: `src/pages/Planeacion/components/QuickPriceEditModal.tsx`

Modal simplificado para actualizar precios rápidamente sin abrir el formulario completo:

```
┌─────────────────────────────────────────────────┐
│  Actualizar Precio                              │
│  ASTRA ZENECA: CIUDAD OBREGON → CUAUTITLAN     │
├─────────────────────────────────────────────────┤
│  Precio Cliente (Valor Bruto)                   │
│  [$___________] ← Actual: $1.00                │
│                                                 │
│  Pago Custodio                                  │
│  [$___________] ← Actual: $1.00                │
│                                                 │
│  Margen Estimado: $_____ (___%)                │
│                                                 │
│  Motivo del Cambio (opcional)                   │
│  [________________________]                     │
│                                                 │
│  [Cancelar]            [Guardar Cambios]       │
└─────────────────────────────────────────────────┘
```

**Características**:
- Cálculo de margen en tiempo real
- Validación: precio cliente > pago custodio
- Guarda motivo en `matriz_precios_historial`
- Toast de confirmación

---

### Fase 5: Acción Masiva - Ajuste por Inflación

**Archivo**: `src/pages/Planeacion/components/BulkPriceAdjustModal.tsx`

Modal para aplicar ajuste porcentual a múltiples rutas:

```
┌─────────────────────────────────────────────────┐
│  Ajuste Masivo de Precios                       │
├─────────────────────────────────────────────────┤
│  Rutas seleccionadas: 45                        │
│                                                 │
│  Porcentaje de Ajuste                           │
│  [___5___] %  ○ Incremento  ○ Reducción        │
│                                                 │
│  Aplicar a:                                     │
│  ☑ Valor Bruto (Precio Cliente)                │
│  ☑ Pago Custodio                               │
│  ☐ Costo Operativo                             │
│                                                 │
│  Vista previa:                                  │
│  ┌───────────────────────────────────────────┐ │
│  │ Cliente | Ruta | Actual | Nuevo | Cambio  │ │
│  │ OXXO   | A→B  | $500   | $525  | +$25    │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Motivo: Ajuste inflación Q1 2026              │
│                                                 │
│  [Cancelar]        [Aplicar a 45 rutas]        │
└─────────────────────────────────────────────────┘
```

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `supabase/migrations/xxx_create_precio_historial.sql` | Crear | Tabla de historial + trigger |
| `src/pages/Planeacion/components/RoutesManagementTab.tsx` | Crear | Componente principal del tab |
| `src/pages/Planeacion/components/QuickPriceEditModal.tsx` | Crear | Modal de edición rápida |
| `src/pages/Planeacion/components/BulkPriceAdjustModal.tsx` | Crear | Modal de ajuste masivo |
| `src/pages/Planeacion/components/PriceHistoryTable.tsx` | Crear | Tabla de historial |
| `src/pages/Planeacion/PlanningHub.tsx` | Modificar | Agregar tab "Rutas" |
| `src/hooks/useRoutesWithPendingPrices.ts` | Crear | Hook para rutas pendientes |
| `src/hooks/usePriceHistory.ts` | Crear | Hook para historial |
| `src/integrations/supabase/types.ts` | Actualizar | Tipos de nueva tabla |

---

## Flujo de Usuario

```text
1. Planificador abre Planeación
2. Ve tab "Rutas" con badge [127] indicando pendientes
3. Entra al sub-tab "Pendientes"
4. Ve lista de rutas con precios $1
5. Hace clic en "Editar Precio" en una ruta
6. Ingresa nuevo precio, opcionalmente motivo
7. Guarda → Se registra en historial
8. Badge se actualiza a [126]
```

---

## Beneficios Esperados

| Beneficio | Impacto |
|-----------|---------|
| Visibilidad de pendientes | 127 rutas visibles vs 0 antes |
| Tiempo de actualización | Reducción de 5+ clics a 2 clics |
| Auditoría | Historial completo de cambios |
| Ajustes por inflación | Proceso que antes era manual ruta por ruta |

---

## Detalles Técnicos

### Hook useRoutesWithPendingPrices

```typescript
export function useRoutesWithPendingPrices() {
  return useAuthenticatedQuery(
    ['routes-pending-prices'],
    async () => {
      const { data, error } = await supabase
        .from('matriz_precios_rutas')
        .select('*')
        .eq('activo', true)
        .or('valor_bruto.lte.10,valor_bruto.lt.precio_custodio')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  );
}
```

### RLS para tabla de historial

```sql
-- Lectura: roles de planeación
CREATE POLICY "read_price_history" ON matriz_precios_historial
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() 
            AND role IN ('admin', 'owner', 'coordinador_operaciones', 'planificador'))
  );

-- Inserción: automática via trigger (SECURITY DEFINER)
```

---

## Cronograma Sugerido

| Fase | Descripción | Estimación |
|------|-------------|------------|
| 1 | Tab en PlanningHub | 15 min |
| 2 | RoutesManagementTab básico | 45 min |
| 3 | Tabla historial + trigger | 20 min |
| 4 | QuickPriceEditModal | 30 min |
| 5 | BulkPriceAdjustModal | 45 min |
| **Total** | | **~2.5 horas** |

