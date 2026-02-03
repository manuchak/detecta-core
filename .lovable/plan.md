
# Plan: Homologar Fuentes de Datos de Custodios

## Problema Identificado

El Dashboard Operacional muestra "128 Custodios Disponibles" pero:
- La base de datos tiene **124** custodios con `estado='activo' AND disponibilidad='disponible'`
- La base de datos tiene **126** custodios con `estado='activo'`
- Perfiles Operativos muestra **126** (estado in ['activo', 'suspendido'])

Hay confusión semántica entre:
- **"Activo"** = estado del empleado (puede trabajar)
- **"Disponible"** = no tiene indisponibilidad temporal
- **"Activo 30d"** = tuvo servicios en últimos 30 días

## Solución Propuesta

### 1. Crear un hook centralizado para métricas de personal

Crear `src/hooks/usePersonnelMetrics.ts` que exponga todas las métricas de forma consistente:

```typescript
// Métricas unificadas
{
  custodiosActivos: number;          // estado='activo' (126)
  custodiosDisponibles: number;      // activo + disponibilidad='disponible' (124)
  custodiosConActividad30d: number;  // con servicios en 30 días
  custodiosNoDisponibles: number;    // activo pero en indisponibilidad temporal (2)
  armadosInternos: number;
  armadosExternos: number;
}
```

### 2. Actualizar Dashboard Operacional

Modificar la tarjeta verde "Custodios Disponibles" para:
- Usar el hook centralizado
- Mostrar **"X Disponibles de Y Activos"** para claridad
- Agregar tooltip explicativo

**Archivo:** `src/pages/Planeacion/components/OperationalDashboard.tsx`

Cambio en la métrica (línea ~310-333):
```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <div className="apple-metric apple-metric-success cursor-help">
      <div className="apple-metric-icon">
        <Users className="h-6 w-6" />
      </div>
      <div className="apple-metric-content">
        <div className="apple-metric-value">
          {metrics.custodiosDisponibles}
        </div>
        <div className="apple-metric-label">Custodios Disponibles</div>
        <span className="text-xs text-muted-foreground">
          de {metrics.custodiosActivos} activos
        </span>
      </div>
    </div>
  </TooltipTrigger>
  <TooltipContent>
    <p>Custodios con estado activo y disponibilidad inmediata</p>
    <p className="text-xs text-muted-foreground">
      {metrics.custodiosNoDisponibles} con indisponibilidad temporal
    </p>
  </TooltipContent>
</Tooltip>
```

### 3. Actualizar Perfiles Operativos

Agregar métrica "Disponibles" a las stats cards para consistencia:

**Archivo:** `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts`

Agregar a ProfileStats:
```typescript
custodiosDisponibles: number; // activo + disponibilidad='disponible'
```

### 4. Actualizar Resumen por Zona en Dashboard

El "Resumen por Zona" ya usa `useZonasOperativas()` que filtra correctamente. Solo verificar consistencia.

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/usePersonnelMetrics.ts` | **NUEVO** - Hook centralizado |
| `src/pages/Planeacion/components/OperationalDashboard.tsx` | Usar hook centralizado + mejorar tooltip |
| `src/pages/PerfilesOperativos/hooks/useOperativeProfiles.ts` | Agregar métrica `custodiosDisponibles` |
| `src/pages/PerfilesOperativos/index.tsx` | Mostrar card "Disponibles" |

## Resultado Esperado

- Dashboard mostrará **124 Disponibles** (de 126 activos)
- Perfiles Operativos mostrará las mismas métricas
- Tooltips explicarán la diferencia entre "activo" y "disponible"
- Una sola fuente de verdad para ambos módulos

## Detalles Técnicos

El nuevo hook `usePersonnelMetrics` realizará las siguientes queries:

```sql
-- Custodios activos totales
SELECT COUNT(*) FROM custodios_operativos WHERE estado = 'activo';

-- Custodios disponibles
SELECT COUNT(*) FROM custodios_operativos 
WHERE estado = 'activo' AND disponibilidad = 'disponible';

-- Custodios con actividad 30d (ya existe en useCustodiosActivos30d)
SELECT COUNT(DISTINCT custodio_asignado) FROM servicios_planificados
WHERE fecha_hora_cita >= NOW() - INTERVAL '30 days';
```

Esto garantiza que ambos módulos muestren exactamente los mismos números.
