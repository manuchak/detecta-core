

## Fix: Calcular Versatilidad en tiempo real desde servicios_custodia

### Problema detectado

Los campos denormalizados `servicios_locales_15d` y `servicios_foraneos_15d` en `custodios_operativos` estan en **0** para este custodio, pero en realidad tiene **4 servicios en los ultimos 15 dias**:

| Fecha | km_recorridos | Clasificacion |
|---|---|---|
| 2026-02-10 | 71 km | Local (<100km) |
| 2026-02-03 | 8 km | Local |
| 2026-02-02 | 103 km | Foraneo (>=100km) |
| 2026-01-30 | 69 km | Local |

La funcion batch `actualizar_todas_metricas_15d` no ha corrido o no actualizo este registro. El hook `useOperativeRating` depende de estos campos denormalizados, lo cual produce datos incorrectos en Versatilidad (score 50, "Sin servicios") y afecta el rating general.

### Solucion

Modificar `useOperativeRating.ts` para calcular los servicios locales/foraneos de 15 dias en **tiempo real** desde `servicios_custodia`, en vez de leer los campos denormalizados.

### Cambio tecnico

**Archivo: `src/pages/PerfilesOperativos/hooks/useOperativeRating.ts`**

1. Agregar una nueva query que consulte `servicios_custodia` de los ultimos 15 dias filtrada por `nombre_custodio`, clasificando cada servicio como local (<100km) o foraneo (>=100km) usando `km_recorridos`
2. Reemplazar las referencias a `profileData.servicios_locales_15d` y `profileData.servicios_foraneos_15d` con los valores calculados en tiempo real
3. Actualizar la variable `serviciosLocales` y `serviciosForaneos` en el return del rating para reflejar los datos reales
4. Agregar esta query al array de `isLoading`

La query seria:

```sql
SELECT km_recorridos 
FROM servicios_custodia 
WHERE nombre_custodio ILIKE '%NOMBRE%' 
  AND fecha_hora_cita >= (now - 15 days)
  AND estado IN ('Finalizado', 'completado', 'Completado', 'finalizado')
```

Y la clasificacion en JS:
- `km_recorridos < 100` o NULL = local
- `km_recorridos >= 100` = foraneo

### Resultado esperado

Para este custodio, la seccion Versatilidad mostraria:
- Locales: 3
- Foraneos: 1
- Score de versatilidad calculado correctamente (~67 en vez de 50)
- Rating general ajustado con el nuevo score

### Archivo afectado

Solo `src/pages/PerfilesOperativos/hooks/useOperativeRating.ts` - una query nueva y reemplazo de 2 variables.
