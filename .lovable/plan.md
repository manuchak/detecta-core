
## Fallback de Puntualidad: usar `hora_inicio_real` de Planeacion

### Contexto

Cuando los planificadores marcan "En sitio" en el modulo de planeacion, se guarda `hora_inicio_real` en `servicios_planificados`. Esta informacion existe para los servicios recientes (ene-feb 2026) donde `servicios_custodia.hora_presentacion` aun no ha sido capturada.

Datos confirmados de Alvaro Toriz:
- Ene 22-28 y Feb 2-10: tienen `hora_inicio_real` en planificados pero `hora_presentacion` null en custodia
- Esto da 8 servicios adicionales con datos de puntualidad que actualmente se pierden

### Cambio unico

**Archivo: `src/pages/PerfilesOperativos/hooks/useProfileTrends.ts`**

1. Despues de la query de `servicios_custodia` (seccion 2), agregar una query a `servicios_planificados` para traer `hora_inicio_real` y `fecha_hora_cita` del mismo rango
2. Construir un mapa de `id_servicio` a `hora_inicio_real` de planificados
3. En el loop de puntualidad, si `hora_presentacion` es null, buscar el fallback en el mapa usando el `id_servicio` (campo `id` en custodia que coincide con `id_servicio` en planificados como numero)

Logica de fallback:

```text
Para cada servicio de custodia:
  1. Si tiene hora_presentacion -> usar esa (fuente primaria)
  2. Si NO tiene hora_presentacion -> buscar hora_inicio_real en servicios_planificados
  3. Si ninguna existe -> no contar para puntualidad
```

La query adicional a `servicios_planificados` ya se hace en la seccion 1 para contar asignados/confirmados. Se puede reutilizar esa query simplemente agregando `hora_inicio_real` al select, sin necesidad de una query extra.

### Detalle tecnico

- Modificar la query existente de `servicios_planificados` (seccion 1, linea 86) para incluir `hora_inicio_real` y `id_servicio`
- Construir un `Map<string, string>` de `id_servicio` -> `hora_inicio_real`
- En la seccion 2, agregar `id_servicio` al select de `servicios_custodia` (campo `id` es numerico, `id_servicio` en planificados es texto tipo "MAATMAR-249")
- Buscar match por `id_servicio` de custodia (hay que verificar campo correcto)
- No se requieren nuevas queries, solo se expande la query ya existente

**Nota**: La columna que une ambas tablas es `servicios_custodia.id_servicio` (texto, ej: "MAATMAR-249") = `servicios_planificados.id_servicio`.

Se necesita agregar `id_servicio` al select de `servicios_custodia` para poder hacer el match.

### Resultado esperado

- Febrero pasara de 0 servicios con datos de puntualidad a 3
- Enero pasara de 9 a 14 (se recuperan 5 servicios sin hora_presentacion)
- La grafica mostrara una linea continua en vez de caer a 0%
