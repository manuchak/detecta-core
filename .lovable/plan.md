
# Plan de Integración: Direcciones de Casa Supply → Perfiles de Custodios

## Resumen Ejecutivo

Este plan integra la información de residencia capturada por Supply (durante el proceso de entrevista) al flujo de liberación y perfiles de custodios, asegurando que la **zona base** se determine correctamente por su **ubicación real de residencia** en lugar de asignar "Ciudad de México" por defecto.

---

## Diagnóstico del Estado Actual

### Datos Disponibles
| Fuente | Campo | Datos Disponibles |
|--------|-------|-------------------|
| `leads.last_interview_data` | `ubicacion.direccion` | 73 leads con dirección capturada |
| `leads.last_interview_data` | `ubicacion.estado_id` | 79 leads con estado capturado |
| `leads.last_interview_data` | `ubicacion.ciudad_id` | UUIDs de ciudades |
| `estados` | Catálogo | 32 estados mexicanos con UUIDs |

### Problema Actual
- **85% de custodios operativos** tienen `zona_base = "Ciudad de México"` por defecto
- **21 custodios** tienen zona incorrecta (residen en Querétaro, Estado de México, Colima, etc. pero figuran como CDMX)
- La información de ubicación **existe en leads** pero **no se propaga** a:
  - `custodio_liberacion` (registro de liberación)
  - `candidatos_custodios` (candidato)
  - `custodios_operativos` (perfil operativo final)

### Ejemplo de Datos Existentes
```
Candidato: OSCAR LEONARDO PATIÑO TERRAZAS
→ Dirección en leads: "ARQUITECTOS 710 EL MARQUÉS 76047 QUERÉTARO, QRO."
→ Estado real: Querétaro
→ Zona operativa asignada: "Ciudad de México" ❌
```

---

## Arquitectura de la Solución

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE DATOS DE UBICACIÓN                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. CAPTURA (Supply - Entrevista)                                       │
│     └── leads.last_interview_data.ubicacion                            │
│           ├── direccion: "Calle X #123, Col. Y, CP 12345"              │
│           ├── estado_id: UUID → estados.nombre                          │
│           └── ciudad_id: UUID → ciudades.nombre                         │
│                                                                         │
│  2. PREFILL (Liberación)                   ← NUEVO                      │
│     └── Hook: useCandidatoUbicacion                                    │
│           │                                                             │
│           ├── Consulta leads por candidato_custodio_id                 │
│           ├── JOIN con estados para obtener nombre                      │
│           └── Retorna: { direccion, estado, ciudad, estadoId }         │
│                                                                         │
│  3. FORMULARIO (Modal Liberación)          ← NUEVO                      │
│     └── Sección "Ubicación de Residencia"                              │
│           ├── Dirección (texto, prellenado)                            │
│           ├── Estado (select, prellenado)                              │
│           ├── Ciudad (texto)                                           │
│           └── Zona Base (calculada automáticamente)                    │
│                                                                         │
│  4. PERSISTENCIA (DB)                      ← MODIFICAR                  │
│     ├── custodio_liberacion:                                           │
│     │     ├── direccion_residencia: TEXT      ← NUEVO CAMPO            │
│     │     └── estado_residencia_id: UUID      ← NUEVO CAMPO            │
│     │                                                                   │
│     └── RPC liberar_custodio_a_planeacion_v2:                          │
│           ├── Leer estado_residencia_id de liberación                  │
│           ├── Resolver nombre del estado                                │
│           └── Escribir a custodios_operativos.zona_base                │
│                                                                         │
│  5. PERFIL FORENSE                         ← NUEVO                      │
│     └── InformacionPersonalTab:                                        │
│           ├── Mostrar dirección de residencia                          │
│           ├── Mostrar estado/ciudad                                    │
│           └── Badge visual de zona base                                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Plan de Implementación Detallado

### Fase 1: Esquema de Base de Datos

**Nuevos campos en `custodio_liberacion`:**

```sql
-- Migración SQL (ejecutar en Supabase SQL Editor)
ALTER TABLE custodio_liberacion
ADD COLUMN IF NOT EXISTS direccion_residencia TEXT,
ADD COLUMN IF NOT EXISTS estado_residencia_id UUID REFERENCES estados(id),
ADD COLUMN IF NOT EXISTS ciudad_residencia TEXT;

COMMENT ON COLUMN custodio_liberacion.direccion_residencia IS 'Dirección completa de residencia del custodio';
COMMENT ON COLUMN custodio_liberacion.estado_residencia_id IS 'FK al catálogo de estados';
COMMENT ON COLUMN custodio_liberacion.ciudad_residencia IS 'Nombre de la ciudad de residencia';
```

**Impacto:** Solo agrega columnas opcionales, no rompe flujos existentes.

---

### Fase 2: Hook de Datos de Ubicación

**Nuevo archivo:** `src/hooks/useCandidatoUbicacion.ts`

Este hook:
1. Recibe `candidatoId` del candidato en liberación
2. Busca el lead vinculado vía `candidato_custodio_id`
3. Extrae datos de `last_interview_data.ubicacion`
4. JOIN con tabla `estados` para resolver nombre
5. Retorna datos estructurados para prefill

```typescript
interface UbicacionCandidato {
  direccion: string | null;
  estadoId: string | null;
  estadoNombre: string | null;
  ciudadId: string | null;
  ciudadNombre: string | null;
  zonaBaseCalculada: string; // "Ciudad de México" | "Querétaro" | etc.
}
```

---

### Fase 3: Sección de Ubicación en Modal de Liberación

**Archivo:** `src/components/liberacion/LiberacionChecklistModal.tsx`

**Cambios:**

1. **Agregar sección de ubicación** en el Accordion (después de Información de Contacto):

```text
┌─────────────────────────────────────────────────────┐
│ 📍 Ubicación de Residencia                          │
├─────────────────────────────────────────────────────┤
│ ℹ️ Esta información determina la zona base del     │
│    custodio en Planeación.                          │
│                                                     │
│ Dirección: [Campo prellenado desde entrevista]     │
│ Estado:    [Select con estados mexicanos]          │
│ Ciudad:    [Campo de texto]                        │
│                                                     │
│ Zona Base Calculada: [Badge: "Querétaro"]          │
└─────────────────────────────────────────────────────┘
```

2. **Prellenar automáticamente** con datos del hook `useCandidatoUbicacion`
3. **Permitir edición** si Supply necesita corregir
4. **Calcular zona base** automáticamente basado en estado seleccionado

---

### Fase 4: Actualizar Tipos TypeScript

**Archivo:** `src/types/liberacion.ts`

```typescript
export interface CustodioLiberacion {
  // ... campos existentes
  
  // Ubicación - NUEVOS
  direccion_residencia?: string;
  estado_residencia_id?: string;
  ciudad_residencia?: string;
  
  // Relación expandida
  estado_residencia?: {
    id: string;
    nombre: string;
  };
}
```

---

### Fase 5: Propagar Ubicación en Liberación

**Archivo:** `src/hooks/useCustodioLiberacion.ts`

Modificar `updateChecklist` para incluir campos de ubicación:

```typescript
candidatoUpdates: {
  nombre: updates.nombre,
  telefono: updates.telefono,
  // NUEVO: Propagar ubicación
  direccion_residencia: updates.direccion_residencia,
  estado_residencia_id: updates.estado_residencia_id,
}
```

---

### Fase 6: Actualizar RPC de Liberación

**Función:** `liberar_custodio_a_planeacion_v2`

Modificar para:
1. Leer `estado_residencia_id` del registro de liberación
2. Si existe, resolver el nombre del estado
3. Escribir a `custodios_operativos.zona_base` con el nombre real

```sql
-- Pseudocódigo de la modificación
v_zona_base := COALESCE(
  (SELECT nombre FROM estados WHERE id = v_estado_residencia_id),
  'Por asignar'
);

UPDATE custodios_operativos
SET zona_base = v_zona_base
WHERE id = v_custodio_operativo_id;
```

---

### Fase 7: Mostrar Ubicación en Perfil Forense

**Archivo:** `src/pages/PerfilesOperativos/components/tabs/InformacionPersonalTab.tsx`

Agregar card de ubicación:

```text
┌─────────────────────────────────────────┐
│ 📍 Ubicación de Residencia              │
├─────────────────────────────────────────┤
│ 🏠 Dirección                            │
│    Arquitectos 710, El Marqués, CP76047 │
│                                         │
│ 📍 Ciudad                               │
│    Querétaro                            │
│                                         │
│ 🗺️ Estado                               │
│    Querétaro                            │
│                                         │
│ 🎯 Zona Base Operativa                  │
│    [Badge] Querétaro                    │
└─────────────────────────────────────────┘
```

---

### Fase 8: Migración de Datos Existentes (Opcional)

Script para actualizar custodios ya liberados con datos de ubicación disponibles:

```sql
-- Script de migración (ejecutar manualmente)
UPDATE custodios_operativos co
SET zona_base = e.nombre
FROM custodio_liberacion cl
JOIN candidatos_custodios cc ON cl.candidato_id = cc.id
JOIN leads l ON l.candidato_custodio_id = cc.id
JOIN estados e ON e.id::text = l.last_interview_data->'ubicacion'->>'estado_id'
WHERE co.pc_custodio_id = cl.pc_custodio_id
  AND l.last_interview_data->'ubicacion'->>'estado_id' IS NOT NULL
  AND l.last_interview_data->'ubicacion'->>'estado_id' != '';
```

**Impacto estimado:** Corrige ~21 custodios con zona incorrecta.

---

## Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `src/hooks/useCandidatoUbicacion.ts` | CREAR | Hook para obtener ubicación desde leads |
| `src/types/liberacion.ts` | MODIFICAR | Agregar campos de ubicación |
| `src/components/liberacion/LiberacionChecklistModal.tsx` | MODIFICAR | Agregar sección de ubicación con prefill |
| `src/hooks/useCustodioLiberacion.ts` | MODIFICAR | Incluir ubicación en updateChecklist |
| `src/pages/PerfilesOperativos/components/tabs/InformacionPersonalTab.tsx` | MODIFICAR | Mostrar ubicación en perfil |
| `src/pages/PerfilesOperativos/hooks/useProfileUbicacion.ts` | CREAR | Hook para obtener ubicación del perfil |

---

## Dependencias de Base de Datos

Antes de implementar el código, ejecutar en **Supabase SQL Editor**:

```sql
-- 1. Agregar columnas a custodio_liberacion
ALTER TABLE custodio_liberacion
ADD COLUMN IF NOT EXISTS direccion_residencia TEXT,
ADD COLUMN IF NOT EXISTS estado_residencia_id UUID REFERENCES estados(id),
ADD COLUMN IF NOT EXISTS ciudad_residencia TEXT;

-- 2. Actualizar RPC (requiere acceso a funciones SQL)
-- Se proporcionará script separado para el RPC
```

---

## Validaciones de No Regresión

| Flujo | Validación |
|-------|------------|
| Crear liberación | ✅ Sin cambios - campos nuevos son opcionales |
| Actualizar checklist | ✅ Retrocompatible - campos nuevos son opcionales |
| Liberar custodio | ✅ Si no hay ubicación, usa valor por defecto |
| Perfil forense | ✅ Muestra "No especificado" si no hay datos |
| Filtro por zona | ✅ Sin cambios - usa `zona_base` existente |

---

## Flujo de Usuario Final

```text
1. Supply completa entrevista → Captura dirección y estado
2. Candidato aprobado → Inicia proceso de liberación
3. Supply abre modal de liberación
   └── Sección "Ubicación" prellenada con datos de entrevista
   └── Supply verifica/corrige si es necesario
4. Supply hace clic en "Liberar"
   └── RPC propaga estado_residencia → zona_base
5. Planeación ve custodio con zona_base correcta
6. Perfil Forense muestra ubicación completa
```

---

## Tests de Verificación

1. **Nuevo custodio con ubicación:** Liberarlo → zona_base = estado de residencia ✅
2. **Nuevo custodio sin ubicación:** Liberarlo → zona_base = "Por asignar" ✅
3. **Editar ubicación en liberación:** Cambiar estado → zona_base actualizada ✅
4. **Perfil forense:** Mostrar dirección y estado correctamente ✅
5. **Filtro por zona:** Incluye custodios de estados correctos ✅
