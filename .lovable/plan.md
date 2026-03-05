

# Fix: Ventana de servicios activos — 7 días en vez de 72h

## Análisis

- Oaxaca → Tijuana: ~3,500 km, **5 días** máximo en carga pesada
- 72h cortaría esa ruta al día 3 → **incorrecto**
- 7 días (168h) cubre cualquier ruta nacional con margen
- Reduce de 1,638 → 286 servicios (aún muchos, pero operativamente correcto)

## Problema de fondo

~40-50 servicios/día se inician y nunca se cierran. Eso requiere una tarea de higiene de datos separada (auto-cerrar servicios sin actividad en X días). Pero eso es un proyecto aparte.

## Cambio

### `src/hooks/useBitacoraBoard.ts`

En la query Q2 de servicios activos, agregar:

```ts
.gte('hora_inicio_real', new Date(Date.now() - 7 * 24 * 3600_000).toISOString())
```

Esto usa **7 días** en lugar de 72h, cubriendo incluso las rutas más largas de México sin perder servicios legítimos.

| Archivo | Cambio |
|---|---|
| `src/hooks/useBitacoraBoard.ts` | Filtro de 7 días en query de servicios activos |

