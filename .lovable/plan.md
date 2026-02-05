
# Plan: Corregir Error al Eliminar Rutas

## Causa del Bug

El código en `DeleteRouteDialog.tsx` intenta actualizar una columna `notas` que **no existe** en la tabla `matriz_precios_rutas`:

```typescript
// Línea 59-64
const { error } = await supabase
  .from('matriz_precios_rutas')
  .update({ 
    activo: false,
    notas: `[ELIMINADA ${new Date().toLocaleDateString('es-MX')}] ${reason}`  // ❌ ERROR
  })
  .in('id', routes.map(r => r.id));
```

PostgreSQL rechaza el UPDATE porque la columna no existe.

---

## Solución Propuesta

Agregar la columna `notas` a la tabla `matriz_precios_rutas` para mantener la trazabilidad de eliminaciones.

### Opción A: Migración SQL (Recomendada)

Crear columna `notas` tipo `TEXT` nullable:

```sql
ALTER TABLE matriz_precios_rutas 
ADD COLUMN notas TEXT;

COMMENT ON COLUMN matriz_precios_rutas.notas IS 'Notas de auditoría (eliminaciones, observaciones)';
```

### Opción B: Remover campo del código

Si no se requiere guardar el motivo, simplemente remover `notas` del UPDATE:

```typescript
.update({ 
  activo: false,
  updated_at: new Date().toISOString()
})
```

**Sin embargo**, esta opción pierde la trazabilidad del motivo de eliminación.

---

## Implementación Recomendada

| Paso | Acción |
|------|--------|
| 1 | Crear migración SQL para agregar columna `notas` |
| 2 | El código existente funcionará sin cambios adicionales |

### Migración SQL

```sql
-- Agregar columna notas para trazabilidad de eliminaciones
ALTER TABLE public.matriz_precios_rutas 
ADD COLUMN IF NOT EXISTS notas TEXT;

-- Comentario descriptivo
COMMENT ON COLUMN public.matriz_precios_rutas.notas IS 
  'Notas de auditoría: motivos de eliminación, observaciones de precios';
```

---

## Archivo a Crear

| Archivo | Cambio |
|---------|--------|
| `supabase/migrations/xxx_add_notas_to_matriz_precios.sql` | Nueva migración |

---

## Beneficios

1. **Trazabilidad**: Se conserva el motivo de eliminación en la propia ruta
2. **Sin cambios de código**: El flujo actual funciona tal cual
3. **Mínimo impacto**: Solo agrega una columna nullable
4. **Auditoría**: Daniela puede ver por qué se eliminó cada ruta

---

## Testing

- [ ] Ejecutar migración SQL
- [ ] Probar eliminación de ruta individual
- [ ] Probar eliminación masiva de rutas
- [ ] Verificar que el motivo se guarda correctamente
- [ ] Confirmar que rutas eliminadas muestran `activo = false` y `notas` con el motivo
