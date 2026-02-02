
# Plan de Mejoras UX - Dashboard de Planeación
## Análisis de User Persona: Planificador/Coordinador

### Resumen de Hallazgos del Feedback

| Problema Reportado | Causa Raíz Identificada | Impacto |
|---|---|---|
| "Me tardé bastante en asignar" | Flujo de asignación con muchos pasos, sin atajos | 🔴 Alto |
| "No hay control por fechas/servicios por mes" | CustodianCard no muestra historial | 🔴 Alto |
| "No hay control local vs foráneo" | Sin campo/rotación de tipo de servicio | 🟡 Medio |
| "Rechazos siguen apareciendo" | Estado de rechazo solo en sesión, no persiste | 🔴 Alto |
| "Listado aparece los mismos" | Factor Gini existe pero no es visible | 🟡 Medio |
| "Indicador Gini no claro" | Sin badges de sub/sobre-favorecido | 🟡 Medio |
| "Armados no se visualizan" | Bug: filtro 90 días no actualiza lista | 🔴 Alto |
| "Zonas base incorrectas (GDL→CDMX)" | Problema de calidad de datos | 🟡 Medio |

---

## Epic 1: Visibilidad del Historial de Servicios
**User Story**: Como planificador, quiero ver cuántos servicios ha hecho un custodio recientemente para tomar decisiones informadas.

### Tareas Técnicas

#### 1.1 Agregar métricas a CustodianCard
**Archivo**: `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx`

Agregar sección de métricas visibles:
```text
┌─────────────────────────────────────────────┐
│  Juan Pérez                    🟢 85% comp. │
│  📞 55-1234-5678              🚗 Sedán      │
├─────────────────────────────────────────────┤
│  📊 Últimos 30d:  12 servicios             │
│  📅 Último: 28 Ene   🏷️ Sub-favorecido    │
└─────────────────────────────────────────────┘
```

#### 1.2 Modificar RPC `get_custodios_activos_disponibles`
Agregar campos:
- `servicios_30d` (COUNT de últimos 30 días)
- `servicios_mes_actual` (COUNT mes en curso)
- `fecha_ultimo_servicio` (ya existe en tabla)
- `categoria_workload` ('sub_favorecido' | 'normal' | 'sobre_favorecido')

---

## Epic 2: Persistencia de Rechazos
**User Story**: Como planificador, cuando un custodio rechaza un servicio, no quiero verlo en la lista por un período configurable.

### Tareas Técnicas

#### 2.1 Crear tabla `custodio_rechazos`
```sql
CREATE TABLE custodio_rechazos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custodio_id UUID REFERENCES custodios_operativos(id),
  servicio_id UUID REFERENCES servicios_planificados(id),
  fecha_rechazo TIMESTAMPTZ DEFAULT NOW(),
  motivo TEXT,
  reportado_por UUID REFERENCES auth.users(id),
  vigencia_hasta TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);
```

#### 2.2 Modificar lógica de filtrado
**Archivo**: `src/hooks/useProximidadOperacional.ts`

En el RPC o query, excluir custodios con rechazos vigentes:
```sql
WHERE c.id NOT IN (
  SELECT custodio_id FROM custodio_rechazos 
  WHERE vigencia_hasta > NOW()
)
```

#### 2.3 UI: Botón "Reportar Rechazo"
En `CustodianCard.tsx`, cuando el estado es `rechaza`, guardar en BD:
```typescript
const handleRejection = async () => {
  await supabase.from('custodio_rechazos').insert({
    custodio_id: custodio.id,
    servicio_id: servicioActual?.id,
    motivo: 'Rechazó durante asignación'
  });
  // Refetch para remover de lista
};
```

---

## Epic 3: Visualización del Factor Gini
**User Story**: Como planificador, quiero ver claramente quién está sub-favorecido para equilibrar las asignaciones.

### Tareas Técnicas

#### 3.1 Badge de Equidad en CustodianCard
**Archivo**: `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx`

```typescript
// Usar datos_equidad del custodio
const getEquidadBadge = () => {
  if (custodio.datos_equidad?.workload_index < 0.7) {
    return <Badge variant="success">🎯 Priorizar</Badge>;
  }
  if (custodio.datos_equidad?.workload_index > 1.3) {
    return <Badge variant="warning">⚠️ Alta carga</Badge>;
  }
  return null;
};
```

#### 3.2 Filtro rápido "Ver Sub-favorecidos"
**Archivo**: `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/index.tsx`

Agregar toggle:
```typescript
<Button 
  variant={showSubFavorecidos ? 'default' : 'outline'}
  onClick={() => setShowSubFavorecidos(!showSubFavorecidos)}
>
  🎯 Mostrar sub-favorecidos primero
</Button>
```

---

## Epic 4: Fix Bug de Armados
**User Story**: Como planificador, quiero ver todos los armados disponibles sin importar el filtro de 90 días.

### Tareas Técnicas

#### 4.1 Corregir desconexión de filtros
**Archivo**: `src/components/planeacion/SimplifiedArmedAssignment.tsx`

Problema: `soloConActividad90Dias` en `serviceContext` (línea 86) es estático y no responde al toggle de UI.

Solución:
```typescript
// Conectar el estado del filtro con el fetch
const { filterConfig, updateFilter } = useArmedGuardFilters();

const serviceContext = useMemo(() => ({
  ...contextBase,
  soloConActividad90Dias: filterConfig.soloConActividad90Dias
}), [contextBase, filterConfig.soloConActividad90Dias]);
```

#### 4.2 Agregar botón "Mostrar Todos"
```typescript
<Button 
  variant="ghost" 
  onClick={() => updateFilter({ soloConActividad90Dias: false })}
>
  👁️ Mostrar todos los armados
</Button>
```

---

## Epic 5: Corrección de Zonas Base
**User Story**: Como admin, quiero poder corregir zonas base incorrectas de forma masiva o individual.

### Tareas Técnicas

#### 5.1 Agregar columna editable en CustodiosTab
**Archivo**: `src/pages/Planeacion/components/CustodiosTab.tsx`

Agregar selector inline de zona_base:
```typescript
<Select 
  value={custodio.zona_base}
  onValueChange={(zona) => handleZonaChange(custodio.id, zona)}
>
  <SelectItem value="Ciudad de México">CDMX</SelectItem>
  <SelectItem value="Jalisco">Guadalajara</SelectItem>
  <SelectItem value="Nuevo León">Monterrey</SelectItem>
  ...
</Select>
```

#### 5.2 Alerta de calidad de datos
Mostrar banner cuando hay custodios sin zona o con "Por asignar":
```typescript
{custodiosSinZona.length > 0 && (
  <Alert variant="warning">
    ⚠️ {custodiosSinZona.length} custodios sin zona base definida.
    <Button onClick={openBulkEditor}>Corregir ahora</Button>
  </Alert>
)}
```

---

## Epic 6: Control Local vs Foráneo (Fase 2)
**User Story**: Como planificador, quiero rotar custodios entre servicios locales y foráneos para balance.

### Tareas Técnicas

#### 6.1 Agregar campo `tipo_ultimo_servicio`
En `custodios_operativos`:
- `tipo_ultimo_servicio`: 'local' | 'foraneo' | null
- `contador_locales_consecutivos`: INTEGER
- `contador_foraneos_consecutivos`: INTEGER

#### 6.2 Lógica de rotación en scoring
```typescript
// En calcularProximidadOperacional
if (custodio.tipo_ultimo_servicio === 'local' && servicioNuevo.es_foraneo) {
  score += 10; // Bonus por rotación
}
```

---

## Priorización Sugerida

| Epic | Esfuerzo | Impacto | Prioridad | Estado |
|------|----------|---------|-----------|--------|
| Epic 4: Fix Bug Armados | Bajo | Alto | 🔴 P0 - Inmediato | ✅ Completado |
| Epic 2: Persistencia Rechazos | Medio | Alto | 🔴 P1 - Esta semana | ✅ Completado |
| Epic 1: Historial en Card | Medio | Alto | 🟡 P2 - Próxima semana | ✅ Completado |
| Epic 3: Badges Gini | Bajo | Medio | 🟡 P2 - Próxima semana | ✅ Completado |
| Epic 5: Corrección Zonas | Bajo | Medio | 🟢 P3 - Siguiente sprint | ✅ Completado |
| Epic 6: Local/Foráneo | Alto | Medio | 🟢 P4 - Backlog | ✅ Completado |

---

## Métricas de Éxito

1. **Tiempo de asignación**: Reducir de ~5 min a ~2 min por servicio
2. **Rechazos duplicados**: Eliminar aparición de custodios que rechazaron en últimos 7 días
3. **Visibilidad de armados**: 100% de armados activos visibles sin bugs de filtro
4. **Índice Gini**: Mejorar distribución de servicios (target: Gini < 0.3)

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianCard.tsx` | Agregar métricas, badges de equidad |
| `src/hooks/useProximidadOperacional.ts` | Filtrar rechazos, agregar datos de historial |
| `src/components/planeacion/SimplifiedArmedAssignment.tsx` | Fix conexión de filtros |
| `src/components/planeacion/ArmedGuardFilters.tsx` | Agregar "Mostrar todos" |
| `src/pages/Planeacion/components/CustodiosTab.tsx` | Editor de zonas inline |
| **Nueva migración SQL** | Tabla `custodio_rechazos` |
| **Modificar RPC** | `get_custodios_activos_disponibles` con métricas |
