

# Bug: Touchpoint no se puede registrar — CHECK constraint mismatch

## Causa raíz

La tabla `cs_touchpoints` tiene un CHECK constraint en la columna `tipo`:

```text
tipo IN ('llamada_seguimiento', 'email', 'whatsapp', 'reunion', 'visita', 'nota_interna')
```

Pero el formulario en `CSCartera.tsx` envía `'llamada'` como valor:

```tsx
<SelectItem value="llamada">Llamada</SelectItem>  // ← NO coincide con 'llamada_seguimiento'
```

El INSERT falla con un constraint violation. El error se muestra como toast pero el formulario no se cierra (comportamiento correcto del `onError`).

## Solución

Corregir el valor del `SelectItem` en `CSCartera.tsx` línea 495 para que coincida con el constraint de la base de datos:

```
'llamada' → 'llamada_seguimiento'
```

Y agregar el valor faltante `'nota_interna'` como opción en el Select.

**También** actualizar el estado inicial `tpTipo` (actualmente `'llamada'`) a `'llamada_seguimiento'`.

### Archivo a modificar

`src/pages/CustomerSuccess/components/CSCartera.tsx`:
- Línea ~171: cambiar default `useState('llamada')` → `useState('llamada_seguimiento')`
- Línea ~495: cambiar `<SelectItem value="llamada">` → `<SelectItem value="llamada_seguimiento">`
- Agregar `<SelectItem value="nota_interna">Nota interna</SelectItem>`

**1 archivo, 3 líneas.**

