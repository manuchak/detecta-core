

# Distribución con afinidad por cliente

## Concepto

Agregar una segunda capa de optimización a `autoDistribute` y `resetAndRedistribute`: después de garantizar el balanceo equitativo (prioridad 1), agrupar servicios del mismo cliente en el mismo monitorista cuando sea posible (prioridad 2). Si un cliente tiene más servicios que el cupo promedio por agente, se reparte entre 2+ monitoristas.

## Algoritmo

```text
1. Fetch nombre_cliente para cada servicio desde servicios_planificados
2. Agrupar servicios por cliente: { "ClienteA": [s1, s2, s3], "ClienteB": [s4], ... }
3. Ordenar grupos de mayor a menor (los clientes con más servicios primero)
4. Para cada grupo:
   a. Si cabe completo en el monitorista con menor carga → asignar todo ahí
   b. Si no cabe (sobrepasa el promedio), partir: asignar hasta el cupo al de menor carga,
      el resto al siguiente con menor carga
5. Resultado: balanceo equitativo + máxima afinidad por cliente
```

## Cambios

**Archivo: `src/hooks/useMonitoristaAssignment.ts`**

Modificar las funciones `autoDistribute` y `resetAndRedistribute`:

1. Antes de distribuir, hacer un query a `servicios_planificados` para obtener `nombre_cliente` de cada `id_servicio`
2. Reemplazar el round-robin simple por el algoritmo de afinidad:
   - Agrupar servicios por `nombre_cliente`
   - Ordenar grupos de mayor a menor tamaño
   - Asignar cada grupo completo al monitorista con menor carga actual
   - Si el grupo excede el cupo máximo por agente (`ceil(totalServicios / totalMonitoristas)`), dividir el excedente al siguiente con menor carga
3. El toast de éxito se mantiene igual

No se crean archivos nuevos ni se modifican otros componentes. La lógica de afinidad es interna al hook.

