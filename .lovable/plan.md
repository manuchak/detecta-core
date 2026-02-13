

## Fix: Validacion GPS de fotos siempre muestra "Pendiente"

### Problema

Hay dos fallas encadenadas que causan que todas las fotos muestren "Pendiente" en vez del estado real de GPS:

1. **No se pasan coordenadas de origen**: Cuando el custodio abre el checklist, la navegacion no incluye las coordenadas del punto de origen del servicio en la URL
2. **Laguna logica**: Cuando el telefono SI obtiene GPS pero no hay coordenadas de origen para comparar, el codigo no contempla ese caso y deja la validacion como "pendiente"

```text
Flujo actual:
  coords = GPS del telefono (SI existe)
  origenCoords = null (nunca se pasan)

  if (coords && origenCoords) → false (no entra)
  else if (!coords) → false (coords SI existen)
  → validacion = 'pendiente' (el default, nunca se actualiza)
```

### Solucion

Dos cambios:

**1. Pasar coordenadas de origen en la navegacion**

En `src/components/custodian/MobileDashboardLayout.tsx`, al navegar al checklist, incluir las coordenadas del origen del servicio (si existen) como query params.

**2. Manejar el caso sin coordenadas de origen**

En `src/hooks/useServiceChecklist.ts`, agregar un `else` para cuando el telefono SI tiene GPS pero no hay origen para comparar. En ese caso, registrar la ubicacion como 'ok' (capturada exitosamente, sin referencia de comparacion).

```text
Flujo corregido:
  coords = GPS del telefono (SI existe)
  origenCoords = coordenadas del origen del servicio

  if (coords && origenCoords) → compara distancia → 'ok' o 'fuera_rango'
  else if (!coords) → 'sin_gps'
  else → 'ok' (tiene GPS pero sin punto de referencia para comparar)
```

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useServiceChecklist.ts` | Agregar `else { validacion = 'ok' }` despues del `else if (!coords)` en la linea 194 |
| `src/components/custodian/MobileDashboardLayout.tsx` | Pasar coordenadas de origen del servicio como query params en la navegacion al checklist |

### Resultado esperado

- Las fotos que SI tienen GPS mostraran "ok" con las coordenadas capturadas
- Si ademas hay coordenadas de origen, se calculara la distancia y se validara el rango
- Solo las fotos genuinamente sin GPS mostraran "Sin GPS"
- "Pendiente" solo aparecera antes de capturar la foto

