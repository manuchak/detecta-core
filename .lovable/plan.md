
# Analisis Completo: Bug de Custodios Liberados No Visibles en Planeacion

## Diagnostico del Problema

### Evidencia en Base de Datos (Datos Reales de Hoy)

| Custodio | Estado en custodios_operativos | Estado en pc_custodios | Resultado |
|----------|-------------------------------|----------------------|-----------|
| FABIAN ROLDAN FABIAN | **inactivo** | activo | **NO VISIBLE** en Planeacion |
| MARCOS ANTONIO CARDENAS | **inactivo** | activo | **NO VISIBLE** en Planeacion |
| JAIRO JESUS MACIAS | **inactivo** | activo | **NO VISIBLE** en Planeacion |
| JUAN MANCIALLA ROSAS | **inactivo** | activo | **NO VISIBLE** en Planeacion |

**Todos los custodios liberados hoy tienen estado='inactivo' en custodios_operativos** a pesar de haber sido liberados exitosamente.

---

## Causa Raiz: RPC No Reactiva Custodios Existentes

### Flujo Actual del RPC `liberar_custodio_a_planeacion_v2`

```text
PASO 3: Buscar o crear custodios_operativos
              │
              ▼
   ┌──────────────────────────┐
   │ SELECT id FROM           │
   │ custodios_operativos     │
   │ WHERE nombre = X         │
   └──────────┬───────────────┘
              │
        ┌─────┴─────┐
        │           │
    NO EXISTE    YA EXISTE
        │           │
        ▼           ▼
   ┌─────────┐  ┌─────────────────────────┐
   │ INSERT  │  │ UPDATE solo             │
   │ estado= │  │ pc_custodio_id          │
   │ 'activo'│  │ (NO TOCA estado!)       │  ← BUG AQUI
   └─────────┘  └─────────────────────────┘
```

### Codigo Problematico (lineas 67-87 del RPC)

```sql
-- 3. Buscar o crear custodios_operativos
SELECT id INTO v_custodio_operativo_id
FROM custodios_operativos
WHERE LOWER(TRIM(nombre)) = LOWER(TRIM(v_candidato_nombre))
LIMIT 1;

IF v_custodio_operativo_id IS NULL THEN
  -- ✅ Crea nuevo con estado='activo'
  INSERT INTO custodios_operativos (
    estado, disponibilidad, ...
  ) VALUES (
    'activo', 'disponible', ...
  );
ELSE
  -- ❌ BUG: Solo actualiza pc_custodio_id, NO el estado
  UPDATE custodios_operativos
  SET pc_custodio_id = v_pc_custodio_id, updated_at = NOW()
  WHERE id = v_custodio_operativo_id AND pc_custodio_id IS NULL;
END IF;
```

---

## Impacto del Bug

### Modulos Afectados

| Modulo | Query/Filtro | Resultado |
|--------|-------------|-----------|
| **Planeacion - Asignacion** | `estado = 'activo' AND disponibilidad IN ('disponible', 'parcial')` | 0 custodios liberados visibles |
| **Perfiles Operativos** | `.in('estado', ['activo', 'suspendido'])` | Custodios aparecen en "Bajas" |
| **Monitoreo** | `estado = 'activo'` | No aparecen en dashboards |

### Escenario Tipico

1. Custodio trabajaba hace 6 meses
2. Se dio de baja (estado → 'inactivo')
3. Supply lo re-libera (pasa por todo el proceso de documentacion)
4. RPC encuentra registro existente con estado='inactivo'
5. RPC solo actualiza pc_custodio_id
6. Custodio sigue invisible para Planeacion

---

## Solucion Propuesta

### Fix en RPC: Reactivar Custodios Existentes

Modificar la rama ELSE del RPC para tambien actualizar estado y disponibilidad:

```sql
-- ACTUAL (BUGGY)
ELSE
  UPDATE custodios_operativos
  SET pc_custodio_id = v_pc_custodio_id, updated_at = NOW()
  WHERE id = v_custodio_operativo_id AND pc_custodio_id IS NULL;
END IF;

-- CORREGIDO
ELSE
  UPDATE custodios_operativos
  SET 
    pc_custodio_id = v_pc_custodio_id,
    estado = 'activo',                    -- REACTIVAR
    disponibilidad = 'disponible',        -- DISPONIBILIZAR
    fecha_inactivacion = NULL,            -- LIMPIAR HISTORIAL DE BAJA
    motivo_inactivacion = NULL,
    tipo_inactivacion = NULL,
    fecha_reactivacion_programada = NULL,
    updated_at = NOW()
  WHERE id = v_custodio_operativo_id;
END IF;
```

### Migracion SQL Correctiva

```sql
-- Corregir custodios liberados hoy que quedaron inactivos
UPDATE custodios_operativos co
SET 
  estado = 'activo',
  disponibilidad = 'disponible',
  fecha_inactivacion = NULL,
  motivo_inactivacion = NULL,
  tipo_inactivacion = NULL,
  fecha_reactivacion_programada = NULL,
  updated_at = NOW()
FROM custodio_liberacion cl
WHERE cl.pc_custodio_id = co.pc_custodio_id
  AND cl.estado_liberacion = 'liberado'
  AND cl.fecha_liberacion >= '2026-02-03'
  AND co.estado = 'inactivo';
```

---

## Diagrama de Flujo Corregido

```text
Supply libera custodio
         │
         ▼
┌─────────────────────────────┐
│ RPC liberar_custodio_v2     │
└──────────┬──────────────────┘
           │
           ▼
    ¿Existe en custodios_operativos?
           │
     ┌─────┴─────┐
     │           │
    NO         SI
     │           │
     ▼           ▼
 ┌───────────┐  ┌───────────────────────┐
 │ INSERT    │  │ UPDATE                │
 │ estado=   │  │ estado = 'activo'     │  ← FIX
 │ 'activo'  │  │ disponibilidad =      │
 │           │  │   'disponible'        │
 └───────────┘  │ Limpiar campos baja   │
                └───────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ Custodio VISIBLE en:                 │
│ ✅ Planeacion (asignacion)           │
│ ✅ Perfiles Operativos (Custodios)   │
│ ✅ Monitoreo                         │
└──────────────────────────────────────┘
```

---

## Acciones de Implementacion

### 1. Migracion SQL (Prioridad Alta)

Crear nueva funcion RPC que:
- Actualice estado='activo' cuando el custodio ya existe
- Limpie campos de baja (fecha_inactivacion, motivo, etc.)
- Corrija los 4 custodios liberados hoy que quedaron inactivos

### 2. Validacion Post-Fix

Agregar verificacion en `useCustodioLiberacion.ts`:

```typescript
// Despues de llamar al RPC, verificar estado
const { data: verification } = await supabase
  .from('custodios_operativos')
  .select('estado, disponibilidad')
  .eq('id', result.custodio_operativo_id)
  .single();

if (verification?.estado !== 'activo') {
  console.error('⚠️ Custodio liberado pero estado no es activo');
  result.warnings.push('Estado no actualizado correctamente');
}
```

### 3. Notificacion Realtime (Ya Implementada)

El sistema de alertas_sistema_nacional ya envia notificaciones, pero como el custodio queda inactivo, Planeacion no lo ve aunque reciba la alerta.

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| Nueva migracion SQL | Corregir RPC + data fix para custodios de hoy |
| `useCustodioLiberacion.ts` | Agregar verificacion post-liberacion |

## Beneficios

1. Custodios re-liberados seran visibles inmediatamente
2. Historial de baja se limpia automaticamente
3. Consistencia entre pc_custodios y custodios_operativos
4. Sin cambios en queries de Planeacion (ya funcionan correctamente)
