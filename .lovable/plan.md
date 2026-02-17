

## Soporte para Multiples Armados por Servicio

### Contexto del Problema

Actualmente el sistema esta disenado para **exactamente 0 o 1 armado por servicio**. El modelo de datos en `servicios_planificados` usa campos escalares:

```
armado_asignado   TEXT        -- nombre del armado (singular)
armado_id         UUID        -- ID del armado (singular)
tipo_asignacion_armado TEXT   -- interno/proveedor
proveedor_armado_id    UUID   -- proveedor (singular)
```

Un cliente requiere **1 custodio + 2 armados**, lo cual rompe este modelo en toda la cadena: creacion, edicion, monitoreo, facturacion, reportes y PDFs.

### Hallazgo Clave: Ya existe una tabla relacional

La tabla `asignacion_armados` ya funciona como **tabla de relacion N:1** (multiples armados por servicio). Tiene campos para `armado_id`, `proveedor_armado_id`, `tarifa_acordada`, `estado_pago`, etc. Actualmente se usa solo para proveedores externos y como registro de auditoria, pero su estructura ya soporta multiples registros por servicio.

### Estrategia: Migracion Progresiva en 3 Fases

La estrategia es evolucionar `asignacion_armados` como **fuente de verdad** para armados, manteniendo retrocompatibilidad con los campos escalares existentes.

```text
FASE 1: Modelo de Datos + Service Creation
FASE 2: Lectura Unificada (Dashboards, Monitoring, Reports)
FASE 3: Deprecacion de campos escalares
```

---

### FASE 1 -- Modelo de Datos y Flujo de Creacion

**1.1 Esquema de Base de Datos**

Agregar campo `cantidad_armados_requeridos` a `servicios_planificados`:

```sql
ALTER TABLE servicios_planificados
  ADD COLUMN cantidad_armados_requeridos INTEGER NOT NULL DEFAULT 1;
```

Esto permite:
- `requiere_armado = true, cantidad_armados_requeridos = 1` (caso actual)
- `requiere_armado = true, cantidad_armados_requeridos = 2` (caso nuevo)
- `requiere_armado = false` (sin armado, ignorar cantidad)

**1.2 Normalizar `asignacion_armados` como fuente de verdad**

- Ya existe la tabla con `servicio_custodia_id` (TEXT que referencia `id_servicio`)
- Asegurar que **toda** asignacion de armado (interno o proveedor) cree un registro aqui
- Actualmente solo proveedores crean registro; los internos solo escriben en campos escalares

Agregar indice para consultas eficientes:
```sql
CREATE INDEX IF NOT EXISTS idx_asignacion_armados_servicio
  ON asignacion_armados(servicio_custodia_id, estado_asignacion);
```

**1.3 Logica de Estado de Planeacion**

Actualmente en `useServiciosPlanificados.ts` linea ~331:
```typescript
const shouldBeConfirmed = !currentService.requiere_armado || currentService.armado_asignado;
```

Debe cambiar a:
```typescript
const armadosAsignados = await countArmadosAsignados(serviceId);
const armadosRequeridos = currentService.cantidad_armados_requeridos || 1;
const shouldBeConfirmed = !currentService.requiere_armado || armadosAsignados >= armadosRequeridos;
```

**1.4 ServiceFormData -- Soporte multi-armado**

En `useServiceCreation.tsx`, cambiar los campos escalares:

```typescript
// Antes (singular)
armado: string;
armadoId: string;
tipoAsignacionArmado: 'interno' | 'proveedor' | null;

// Despues (array)
armados: Array<{
  nombre: string;
  id: string;
  tipo: 'interno' | 'proveedor';
  proveedorId?: string;
  puntoEncuentro?: string;
  horaEncuentro?: string;
}>;
cantidadArmadosRequeridos: number;
```

Mantener los campos escalares como aliases de `armados[0]` para retrocompatibilidad del draft system.

**1.5 ArmedStep -- UI Multi-seleccion**

Modificar `ArmedStep/index.tsx` para:
- Mostrar contador: "Armados asignados: 1/2"
- Permitir seleccionar multiples guardias (lista con checkboxes en lugar de radio)
- Cada armado seleccionado tiene su propio punto de encuentro y hora
- Boton "Continuar" solo se habilita cuando `seleccionados.length >= cantidadRequeridos`

**1.6 ConfirmationStep -- Mostrar lista de armados**

Cambiar la seccion de "Elemento Armado" de un solo registro a una lista iterada:
```
Armado 1: JOSE PEREZ (Interno) - Encuentro: Gasolinera Norte, 06:30
Armado 2: CUSAEM - LUIS GARCIA (Proveedor) - Encuentro: Base Sur, 06:15
```

**1.7 Insercion en DB**

Al crear servicio en `ConfirmationStep`:
1. Insertar en `servicios_planificados` con `cantidad_armados_requeridos = N`
2. Los campos escalares (`armado_asignado`, `armado_id`) se llenan con el primer armado (retrocompatibilidad)
3. Insertar N registros en `asignacion_armados` (uno por cada armado)

---

### FASE 2 -- Lectura Unificada

**2.1 Hook centralizado `useArmadosDelServicio`**

Crear hook que consulte `asignacion_armados` por `servicio_custodia_id`:

```typescript
function useArmadosDelServicio(servicioId: string) {
  // Retorna array de armados asignados con estado, tarifa, etc.
}
```

**2.2 Archivos a migrar (51+ archivos afectados)**

Los archivos con mayor impacto organizados por modulo:

| Modulo | Archivos clave | Cambio |
|--------|---------------|--------|
| Planeacion Dashboard | `OperationalDashboard.tsx`, `ScheduledServicesTab.tsx`, `ServiceQueryCard.tsx` | Mostrar badge "2 armados" en vez de nombre singular |
| Edicion | `EditServiceForm.tsx`, `SmartEditModal.tsx`, `ContextualEditModal.tsx`, `PendingAssignmentModal.tsx` | Soportar agregar/remover armados individuales |
| Monitoreo | `CompactServiceCard.tsx`, `AdditionalArmedGuard.tsx`, `ServiceDetailsModal.tsx` | Iterar lista de armados |
| Facturacion | `useProveedoresPagos.ts` | Ya usa `asignacion_armados` -- sin cambio |
| Reportes | `usePlanningResourcesMetrics.ts`, PDFs | Contar armados por servicio correctamente |
| KPIs | `useStarMapKPIs.ts`, `usePendingArmadoServices.ts` | Validar contra `cantidad_armados_requeridos` |
| Conflictos | `armadosConflictDetection.ts` | Verificar todos los armados del servicio |

**2.3 Logica "Armado Pendiente"**

`usePendingArmadoServices.ts` actualmente filtra:
```sql
WHERE requiere_armado = true AND armado_asignado IS NULL
```

Debe cambiar a contar armados asignados vs requeridos:
```sql
WHERE requiere_armado = true
  AND (SELECT count(*) FROM asignacion_armados WHERE servicio_custodia_id = id_servicio) 
      < cantidad_armados_requeridos
```

**2.4 Componente `AdditionalArmedGuard`**

Actualmente muestra 1 armado adicional. Debe convertirse en `ArmedGuardsList` que itere N armados.

---

### FASE 3 -- Deprecacion (Futura)

Una vez que todos los lectores usen `asignacion_armados`:
- Marcar `armado_asignado`, `armado_id`, `tipo_asignacion_armado`, `proveedor_armado_id` como deprecated
- Crear trigger que sincronice `armados[0]` a los campos escalares para queries legadas
- Eventualmente eliminar los campos escalares

---

### Riesgos y Mitigaciones

| Riesgo | Mitigacion |
|--------|-----------|
| Datos historicos solo en campos escalares | Fase 1 mantiene escritura dual (escalares + tabla relacional) |
| 51+ archivos a modificar | Fases progresivas; Fase 1 solo toca creacion, Fase 2 lectura |
| Performance de queries N+1 | Indice en `asignacion_armados(servicio_custodia_id)` + batch queries |
| Draft system (localStorage) | Mantener aliases escalares para retrocompatibilidad |
| Legacy `servicios_custodia` | Solo tiene campos de texto; no impacta modelo relacional |

### Secuencia de Implementacion Recomendada

1. Migracion SQL (campo `cantidad_armados_requeridos` + indice)
2. Actualizar `ServiceFormData` y `useServiceCreation` con soporte array
3. Refactorizar `ArmedStep` para multi-seleccion
4. Actualizar `ConfirmationStep` para mostrar e insertar multiples armados
5. Actualizar logica de estado en `useServiciosPlanificados`
6. Crear `useArmadosDelServicio` hook centralizado
7. Migrar lectores principales (Dashboard, Monitoring, Edit)
8. Migrar lectores secundarios (Reports, PDFs, KPIs)

### Estimacion

- **Fase 1** (Creacion): ~3-4 sesiones de trabajo
- **Fase 2** (Lectura): ~4-5 sesiones de trabajo  
- **Fase 3** (Deprecacion): futura, no urgente

