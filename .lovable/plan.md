

## Fix: Alinear botones en CourseCard

### Problema

Los botones "Continuar" no se alinean al fondo de la tarjeta cuando las descripciones tienen diferente largo. La causa es que `space-y-3` en el `CardContent` aplica `margin-top` via CSS selector `> * + *`, lo cual sobreescribe el `mt-auto` del contenedor del boton.

### Solucion

En `src/components/lms/CourseCard.tsx`, linea 86:

- Cambiar `space-y-3` por `gap-3` en el `CardContent`
- `gap-3` funciona con flexbox sin usar margin, permitiendo que `mt-auto` empuje el boton al fondo correctamente

### Cambio exacto

Linea 86, cambiar:
```
className="p-4 flex flex-col flex-1 space-y-3"
```
por:
```
className="p-4 flex flex-col flex-1 gap-3"
```

### Archivo a modificar
- `src/components/lms/CourseCard.tsx` (1 linea)
