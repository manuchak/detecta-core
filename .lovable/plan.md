
# Plan: Corrección de Políticas RLS para Creación de Clientes

## Diagnóstico

### Causa Raíz Identificada
La función `es_planificador()` tiene una lista de roles **inconsistente** con el resto del sistema:

| Tabla | Política INSERT | Roles Permitidos |
|-------|-----------------|------------------|
| `pc_clientes` | `es_planificador()` | admin, owner, **planificador** |
| `matriz_precios_rutas` | Inline check | admin, owner, supply_admin, **coordinador_operaciones**, **planificador** |

**Resultado**: Coordinadores operativos pueden crear rutas pero NO clientes.

### Error en Logs de Postgres
```
"new row violates row-level security policy for table 'pc_clientes'"
```

---

## Solución

### Opción A: Actualizar la función `es_planificador()` (Recomendada)

Agregar `coordinador_operaciones` y `supply_admin` a la función para mantener consistencia:

```sql
CREATE OR REPLACE FUNCTION es_planificador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN (
      'admin', 
      'owner', 
      'planificador',
      'coordinador_operaciones',  -- NUEVO
      'supply_admin'              -- NUEVO
    )
    AND (is_active IS NULL OR is_active = true)  -- Agregar check de activo
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Opción B: Actualizar la política RLS directamente

Reemplazar la política de INSERT de `pc_clientes` con una inline check consistente:

```sql
DROP POLICY IF EXISTS pc_clientes_insert ON pc_clientes;

CREATE POLICY pc_clientes_insert ON pc_clientes
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'planificador')
    AND (user_roles.is_active IS NULL OR user_roles.is_active = true)
  )
);
```

---

## Implementación

Se creará una migración SQL que:

1. **Actualiza la función `es_planificador()`** para incluir los roles faltantes
2. **Agrega validación de `is_active`** para mayor seguridad
3. Las políticas que usan esta función (`pc_clientes_insert`, `pc_clientes_update`) heredarán automáticamente los nuevos permisos

### Archivo a Crear

`supabase/migrations/add_coordinador_to_es_planificador.sql`

```sql
-- Actualizar función es_planificador para incluir coordinador_operaciones
CREATE OR REPLACE FUNCTION public.es_planificador()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'owner', 'planificador', 'coordinador_operaciones', 'supply_admin')
    AND (is_active IS NULL OR is_active = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## Impacto

| Aspecto | Evaluación |
|---------|------------|
| **Riesgo** | Bajo - Solo expande permisos a roles que ya tienen acceso a rutas |
| **Rollback** | Fácil - Revertir la función a su estado anterior |
| **Dependencias** | La función es usada por 2 políticas de `pc_clientes` (INSERT y UPDATE) |

---

## Resultado Esperado

Después de la migración:
- ✅ Coordinadores operativos podrán crear clientes nuevos
- ✅ Planificadores mantendrán sus permisos actuales
- ✅ El flujo de creación de servicio con cliente nuevo funcionará correctamente
