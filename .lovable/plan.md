

# Rediseño: Cambio de Turno Efectivo

## Diagnóstico del diseño actual

El cambio de turno actual tiene problemas fundamentales de modelo operativo:

| Problema | Detalle |
|----------|---------|
| **Ejecutor incorrecto** | Lo ejecuta el coordinador desde el Command Center. El monitorista saliente debería ser quien entrega su turno — él conoce el contexto de cada servicio |
| **Solo 1:1** | Un from → un to. No soporta el caso real: 2 monitoristas matutinos → 1 nocturno, o 1 nocturno → 3 matutinos |
| **Sin contexto por servicio** | Muestra UUIDs truncados. El entrante no sabe qué cliente es, en qué fase está, si hay incidencias |
| **Sin documento de entrega** | La nota es un texto libre global. No hay acta firmada que deslinde responsabilidades |
| **Ciego a incidentes** | No consulta `incidentes_operativos` abiertos. El entrante puede heredar una crisis sin saberlo |
| **Sin distribución inteligente** | Al ir de 1→N, no distribuye equitativamente; al ir de N→1, requiere N operaciones manuales |

## Modelo operativo propuesto

```text
CASO 1: Matutino → Nocturno (N:1)
┌──────────┐  ┌──────────┐
│ Jose (5)  │  │ Maria (3)│    ──→   Carlos (8 servicios)
│ entrega   │  │ entrega  │          recibe todo
└──────────┘  └──────────┘

CASO 2: Nocturno → Matutino (1:N)  
┌──────────┐
│ Carlos(8) │    ──→   Jose (3) + Maria (3) + Karla (2)
│ entrega   │          distribución equitativa
└──────────┘
```

## Flujo UX propuesto

### Paso 1: Contexto del turno saliente
- Auto-detectar monitoristas en turno activo (salientes)
- Mostrar resumen: X servicios activos, Y incidentes abiertos, Z eventos especiales en curso
- El saliente agrega **notas por servicio** (no solo una nota global)

### Paso 2: Selección de entrantes
- Multi-select de monitoristas entrantes (1 o más)
- Si hay más de 1 entrante → mostrar opción de distribución:
  - **Automática** (equitativa por carga)
  - **Manual** (drag o assign individual)

### Paso 3: Resumen con alertas
- Lista de cada servicio con: cliente, fase actual, último evento, tiempo sin actividad
- Bandera roja en servicios con incidentes abiertos
- Bandera ámbar en servicios con eventos especiales activos (pausa, desvío)
- Notas del saliente visibles por servicio

### Paso 4: Confirmación y Acta
- Generar un registro de entrega en una nueva tabla `bitacora_entregas_turno`
- Campos: timestamp, salientes[], entrantes[], servicios transferidos, servicios cerrados por inactividad, incidentes heredados, notas por servicio, firmado por (user que confirma)
- Toast de confirmación con resumen

## Cambios técnicos

### 1. Nueva tabla: `bitacora_entregas_turno`
```sql
CREATE TABLE bitacora_entregas_turno (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  turno_saliente text NOT NULL,
  turno_entrante text NOT NULL,
  ejecutado_por uuid REFERENCES auth.users(id),
  monitoristas_salientes jsonb NOT NULL, -- [{id, display_name}]
  monitoristas_entrantes jsonb NOT NULL,
  servicios_transferidos jsonb NOT NULL, -- [{servicio_id, cliente, fase, notas_servicio}]
  servicios_cerrados jsonb DEFAULT '[]',
  incidentes_abiertos jsonb DEFAULT '[]', -- [{incidente_id, tipo, severidad}]
  notas_generales text,
  created_at timestamptz DEFAULT now()
);
```
Con RLS para monitoring roles.

### 2. Hook `useShiftHandoff.ts` (nuevo)
- Reemplaza la lógica inline de `handoffTurno` en `useMonitoristaAssignment`
- Soporta N:1 y 1:N
- Consulta `incidentes_operativos` abiertos vinculados a servicios activos
- Genera registro en `bitacora_entregas_turno`
- Distribuye equitativamente cuando hay múltiples entrantes

### 3. `ShiftHandoffDialog.tsx` (rediseño completo)
- Wizard de 3 pasos en vez de formulario plano
- Paso 1: Auto-detecta salientes, muestra resumen
- Paso 2: Multi-select entrantes + modo distribución
- Paso 3: Resumen con alertas de incidentes + confirmación
- Notas por servicio (expandible) además de nota general

### 4. Acceso dual
- **Coordinador**: accede desde Command Center (como hoy) — puede ejecutar para cualquiera
- **Monitorista**: nuevo botón "Entregar mi turno" en la `MonitoristaAssignmentBar` — solo entrega sus propios servicios

| Archivo | Cambio |
|---------|--------|
| Migración SQL | Crear `bitacora_entregas_turno` + RLS |
| `src/hooks/useShiftHandoff.ts` | Nuevo hook con lógica N:M, incidentes, acta |
| `src/components/monitoring/bitacora/ShiftHandoffDialog.tsx` | Rediseño wizard 3 pasos |
| `src/hooks/useMonitoristaAssignment.ts` | Remover `handoffTurno` inline (mover a nuevo hook) |
| `src/components/monitoring/bitacora/MonitoristaAssignmentBar.tsx` | Agregar botón "Entregar mi turno" para monitoristas |

