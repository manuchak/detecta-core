

# Plan: Agregar Fallback a servicios_custodia en Vista de Facturacion

## Objetivo

Modificar la vista `vw_servicios_facturacion` para usar datos de `servicios_planificados` como fuente primaria, pero caer a `servicios_custodia` cuando los datos de planeacion no existan. Esto asegura continuidad durante la transicion de datos.

## Cambios en la Vista SQL

### Campos con Fallback

| Campo | Logica Actual | Nueva Logica con Fallback |
|-------|---------------|---------------------------|
| hora_presentacion | Solo de sp | `COALESCE(sp.hora_llegada_custodio combinado, sc.hora_presentacion)` |
| hora_inicio_custodia | Solo `sp.hora_inicio_real` | `COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia)` |
| hora_finalizacion | Solo `sp.hora_fin_real` | `COALESCE(sp.hora_fin_real, sc.hora_finalizacion)` |
| nombre_armado | Solo `sp.armado_asignado` | `COALESCE(sp.armado_asignado, sc.nombre_armado)` |
| proveedor | Solo JOIN a proveedores_armados | `COALESCE(pa.nombre_empresa, sc.proveedor)` |
| duracion_calculada | Solo si sp tiene inicio Y fin | Calcular con campos ya con fallback |
| tiempo_retraso | Solo si sp tiene inicio | Calcular con campos ya con fallback, fallback a `sc.tiempo_retraso` |

## SQL Actualizado

```sql
-- PRESENTACION: Planeacion primero, fallback a custodia
CASE 
  WHEN sp.hora_llegada_custodio IS NOT NULL 
  THEN (sp.fecha_hora_cita::date + sp.hora_llegada_custodio)::timestamptz
  ELSE sc.hora_presentacion
END AS hora_presentacion,

-- INICIO: Planeacion primero, fallback a custodia
COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) AS hora_inicio_custodia,

-- FIN: Planeacion primero, fallback a custodia
COALESCE(sp.hora_fin_real, sc.hora_finalizacion) AS hora_finalizacion,

-- DURACION: Usar campos ya con fallback
CASE 
  WHEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) IS NOT NULL 
   AND COALESCE(sp.hora_fin_real, sc.hora_finalizacion) IS NOT NULL
  THEN COALESCE(sp.hora_fin_real, sc.hora_finalizacion) 
     - COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia)
  ELSE NULL
END AS duracion_calculada,

-- RETRASO: Calcular con fallback, o usar existente
CASE 
  WHEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) IS NOT NULL 
   AND COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita) IS NOT NULL
  THEN COALESCE(sp.hora_inicio_real, sc.hora_inicio_custodia) 
     - COALESCE(sp.fecha_hora_cita, sc.fecha_hora_cita)
  ELSE sc.tiempo_retraso
END AS tiempo_retraso,

-- ARMADO: Planeacion primero, fallback a custodia
COALESCE(sp.armado_asignado, sc.nombre_armado) AS nombre_armado,

-- PROVEEDOR: JOIN primero, fallback a campo manual en custodia
COALESCE(
  CASE 
    WHEN sp.tipo_asignacion_armado = 'proveedor' AND sp.proveedor_armado_id IS NOT NULL
    THEN pa.nombre_empresa
    ELSE NULL
  END,
  sc.proveedor
) AS proveedor,
```

## Resultado

| Escenario | Antes | Despues |
|-----------|-------|---------|
| Servicio con datos en sp | Usa sp | Usa sp (sin cambio) |
| Servicio sin datos en sp | NULL/vacio | Usa sc como fallback |
| Servicio con datos parciales | Solo muestra lo de sp | Combina: sp para lo que existe, sc para lo demas |

## Archivo a Modificar

```
supabase/migrations/
└── YYYYMMDD_add_fallback_servicios_custodia.sql
```

## Seccion Tecnica

La migracion ejecutara:
1. `DROP VIEW IF EXISTS vw_servicios_facturacion`
2. `CREATE VIEW` con logica COALESCE para todos los campos de timeline y armado

No requiere cambios en frontend - los tipos en TypeScript ya soportan estos campos.

