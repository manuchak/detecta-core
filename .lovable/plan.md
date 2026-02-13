

## Fix: Custodio no ve su servicio -- estado "planificado" excluido del filtro

### Causa raiz

El servicio `YOCOYTM-273` tiene:
- `custodio_telefono = '5516802984'` (correcto, coincide con el perfil de Jesus Molina)
- `estado_planeacion = 'planificado'` (problema)

El hook `useNextService.ts` (linea 50) filtra servicios con:
```
.in('estado_planeacion', ['asignado', 'confirmado', 'en_transito', 'Asignado', 'Confirmado', 'En Tránsito'])
```

El estado `'planificado'` no esta en la lista, por lo que el servicio se descarta. **21 servicios de hoy** tienen este mismo problema: custodio asignado pero estado "planificado", invisibles para los custodios.

### Impacto

Cualquier servicio que tenga custodio asignado pero cuyo estado no haya avanzado a "asignado" queda invisible en el portal del custodio. Esto afecta hoy a 21 servicios.

### Solucion

Agregar `'planificado'` y `'Planificado'` a la lista de estados permitidos en el filtro de `useNextService.ts`.

### Cambio

| Archivo | Cambio |
|---|---|
| `src/hooks/useNextService.ts` | Linea 50: agregar `'planificado'` y `'Planificado'` al array del filtro `.in()` |

Cambio de una sola linea:
```tsx
// ANTES
.in('estado_planeacion', ['asignado', 'confirmado', 'en_transito', 'Asignado', 'Confirmado', 'En Tránsito'])

// DESPUES
.in('estado_planeacion', ['planificado', 'asignado', 'confirmado', 'en_transito', 'Planificado', 'Asignado', 'Confirmado', 'En Tránsito'])
```

### Resultado

- Jesus Molina vera inmediatamente su servicio YOCOYTM-273
- Los otros 20 servicios en estado "planificado" con custodio asignado tambien seran visibles
- No hay riesgo de mostrar servicios sin custodio porque el filtro por `custodio_telefono` ya los excluye

