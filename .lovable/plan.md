

# Plan: Corregir Lógica de Proveedor en Vista de Facturación

## Problema Identificado

El campo "Proveedor" muestra valores incorrectos como "EX - MILITAR", "Seter", "Ex-Militar CDMX" que NO son proveedores externos del sistema.

### Diagnóstico

| Valor en Campo | Origen | Es Proveedor Real? |
|----------------|--------|-------------------|
| CUSAEM | proveedores_armados | Si |
| SEICSA | proveedores_armados | Si |
| EX - MILITAR | servicios_custodia (legacy) | No - Clasificación interna |
| Ex-Militar CDMX | servicios_custodia (legacy) | No - Clasificación interna |
| Seter | servicios_custodia (legacy) | No - Dato corrupto |

### Lógica Actual (Incorrecta)

```sql
COALESCE(
    CASE WHEN sp.tipo_asignacion_armado = 'proveedor' 
         AND sp.proveedor_armado_id IS NOT NULL 
         THEN pa.nombre_empresa
         ELSE NULL
    END,
    sc.proveedor  -- Este fallback trae datos incorrectos
) AS proveedor
```

## Solución Propuesta

### Opción A: Vista Estricta (Recomendada)

Solo mostrar proveedor cuando existe una asignación formal a proveedor externo:

```sql
CASE 
    WHEN sp.tipo_asignacion_armado = 'proveedor' 
         AND sp.proveedor_armado_id IS NOT NULL 
    THEN pa.nombre_empresa
    ELSE NULL
END AS proveedor
```

Esto elimina el fallback a datos legacy incorrectos.

### Opción B: Vista con Filtro de Proveedores Válidos

Solo usar fallback si el valor coincide con un proveedor real:

```sql
COALESCE(
    CASE WHEN sp.tipo_asignacion_armado = 'proveedor' 
         AND sp.proveedor_armado_id IS NOT NULL 
         THEN pa.nombre_empresa
         ELSE NULL
    END,
    CASE WHEN sc.proveedor IN ('CUSAEM', 'SEICSA', 'Cusaem') 
         THEN sc.proveedor
         ELSE NULL
    END
) AS proveedor
```

## Cambios Requeridos

### 1. Actualizar Vista SQL (vw_servicios_facturacion)

Modificar la línea del proveedor para usar Opción A:

```sql
-- Reemplazar:
COALESCE(
    CASE WHEN sp.tipo_asignacion_armado = 'proveedor' AND sp.proveedor_armado_id IS NOT NULL 
         THEN pa.nombre_empresa
         ELSE NULL
    END, 
    sc.proveedor
) AS proveedor

-- Por:
CASE 
    WHEN sp.tipo_asignacion_armado = 'proveedor' 
         AND sp.proveedor_armado_id IS NOT NULL 
    THEN pa.nombre_empresa
    ELSE NULL
END AS proveedor
```

### 2. Actualizar Hook useProveedoresUnicos

Actualmente obtiene proveedores de servicios_custodia (datos incorrectos). Debe obtenerlos de proveedores_armados:

```typescript
// Antes (incorrecto):
const { data } = await supabase
  .from('servicios_custodia')
  .select('proveedor')

// Después (correcto):
const { data } = await supabase
  .from('proveedores_armados')
  .select('nombre_empresa')
  .eq('activo', true)
```

## Impacto

| Servicio | Antes | Después |
|----------|-------|---------|
| Con proveedor real asignado | CUSAEM | CUSAEM |
| Armado interno | EX - MILITAR | - (vacío) |
| Armado interno | Seter | - (vacío) |
| Sin armado | - | - |

## Sección Técnica

La corrección requiere:

1. **Migración SQL**: ALTER VIEW o DROP/CREATE para actualizar vw_servicios_facturacion
2. **Frontend**: Modificar useProveedoresUnicos para usar proveedores_armados
3. **No breaking changes**: Los servicios con proveedores reales (CUSAEM, SEICSA) seguirán mostrándose correctamente

Nota: Los 3,397 servicios con "Ex-Militar CDMX" y 181 con "EX - MILITAR" mostrarán proveedor vacío, lo cual es correcto porque son armados internos, no proveedores externos.

