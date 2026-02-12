

## Plan: Corregir inserciones de indisponibilidad en modales de planeacion

### Causa raiz

Los modales `PendingAssignmentModal` y `ReassignmentModal` usan nombres de columna incorrectos al insertar en la tabla `custodio_indisponibilidades`:

| Columna usada (incorrecta) | Columna real en la tabla |
|---|---|
| `tipo` | `tipo_indisponibilidad` |
| `fecha_fin` | `fecha_fin_estimada` |
| `activo` | `estado` (valor: `'activo'`) |
| _(faltante)_ | `severidad` (default requerido) |

El insert falla silenciosamente con un error de Supabase porque las columnas no existen, y el toast muestra "Error al registrar indisponibilidad".

### Solucion

Corregir los payloads de insert en ambos archivos para alinearlos con el esquema real de la tabla, siguiendo el patron ya correcto en `useCustodioIndisponibilidades.ts`.

### Cambios

| Archivo | Cambio |
|---|---|
| `src/components/planeacion/PendingAssignmentModal.tsx` (~linea 244-253) | Corregir nombres de columna en el insert |
| `src/components/planeacion/ReassignmentModal.tsx` (~linea 261-270) | Corregir nombres de columna en el insert |

### Detalle del cambio (identico en ambos archivos)

Antes:
```typescript
.insert({
  custodio_id: unavailabilityCustodian.id,
  tipo: data.tipo,
  motivo: data.motivo || null,
  fecha_inicio: new Date().toISOString().split('T')[0],
  fecha_fin: fechaFin,
  activo: true
})
```

Despues:
```typescript
.insert({
  custodio_id: unavailabilityCustodian.id,
  tipo_indisponibilidad: data.tipo,
  motivo: data.motivo || 'Sin especificar',
  fecha_inicio: new Date().toISOString(),
  fecha_fin_estimada: fechaFin ? new Date(fechaFin).toISOString() : null,
  estado: 'activo',
  severidad: 'media'
})
```

Notas:
- `motivo` es NOT NULL en la tabla, asi que se usa un fallback `'Sin especificar'` en vez de `null`
- `fecha_inicio` cambia a timestamp completo (la columna es `timestamp with time zone`, no `date`)
- `fecha_fin_estimada` tambien se convierte a ISO timestamp
- `severidad` se agrega con valor default `'media'`

