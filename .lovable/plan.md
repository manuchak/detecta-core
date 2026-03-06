

# Servicios Astra desaparecen del tablero de Bitácora

## Problema raíz

En `useBitacoraBoard.ts`, la query Q2 (servicios activos) tiene un filtro de ventana de **24 horas**:

```typescript
// Línea 95
.gte('hora_inicio_real', new Date(Date.now() - 24 * 3600_000).toISOString())
```

Los servicios de Astra estaban en **pernocta** (evento especial nocturno). Si un servicio inicio hace más de 24h y aún no ha sido liberado, esta condición lo excluye del query — el servicio desaparece del tablero aunque siga activo y sin `hora_fin_real`.

Al "finalizar la detención" (cerrar el evento pernocta), el servicio debería volver a la columna "En Curso", pero como ya pasaron las 24h desde `hora_inicio_real`, nunca vuelve a aparecer.

**Flujo que causó el bug:**
1. Servicio Astra inicia a las 08:00 del día anterior
2. A las 22:00 se registra pernocta (evento especial)
3. A las 07:14 del día siguiente (>23h después del inicio), David Corona cierra la pernocta
4. El servicio tiene `hora_inicio_real` de hace >23h → fuera de la ventana de 24h → desaparece
5. No se puede dar seguimiento ni liberar al custodio

## Solución

**Eliminar el filtro temporal de 24h** en la query de servicios activos. Un servicio activo se define por:
- `hora_inicio_real` no es null (ya inició)
- `hora_fin_real` es null (no ha terminado)
- `estado_planeacion` no es cancelado ni completado

Estos tres filtros **ya existen** en las líneas 94, 96-97. La línea 95 es redundante y peligrosa.

### Cambio en `useBitacoraBoard.ts`

Remover línea 95 (`.gte('hora_inicio_real', ...)`). La query queda:

```typescript
const { data, error } = await supabase
  .from('servicios_planificados')
  .select('...')
  .not('hora_inicio_real', 'is', null)    // Ya inició
  .is('hora_fin_real', null)               // No ha terminado
  .not('estado_planeacion', 'in', '(cancelado,completado)')
  .order('hora_inicio_real', { ascending: true });
```

### Mismo fix en `useServiciosTurnoLive.ts` (Radar)

Verificar si tiene el mismo filtro temporal y corregirlo también para mantener consistencia entre Bitácora y Radar.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useBitacoraBoard.ts` | Remover `.gte('hora_inicio_real', ...)` de Q2 (línea 95) |
| `src/hooks/useServiciosTurnoLive.ts` | Verificar y corregir filtro equivalente si existe |

Un cambio de una sola línea que resuelve la desaparición de servicios de larga duración.

