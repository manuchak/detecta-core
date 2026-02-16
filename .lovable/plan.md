

# Corregir descripciones cortadas en los selectores de Tipo y Severidad

## Problema

Las descripciones dentro de los dropdowns de "Tipo" y "Severidad" se cortan por dos razones:
1. El texto se trunca a 80 caracteres con `.slice(0, 80)`
2. El contenedor tiene `max-w-[340px]` que es muy estrecho para el texto completo

## Cambios

### Archivo: `src/components/monitoring/incidents/IncidentReportForm.tsx`

**Selector de Tipo (lineas 407-414)**:
- Cambiar `max-w-[340px]` a `w-[420px]` en SelectContent para dar mas espacio
- Eliminar `.slice(0, 80)` para mostrar el texto completo
- Agregar `whitespace-normal` al SelectItem para permitir salto de linea
- Cambiar `leading-tight` a `leading-snug` para mejor legibilidad

**Selector de Severidad (lineas 435-442)**:
- Aplicar los mismos cambios que en Tipo

En ambos casos el cambio es identico:
- `SelectContent className="max-w-[340px]"` se convierte en `SelectContent className="w-[420px]"`
- `{t.descripcion.slice(0, 80)}...` se convierte en `{t.descripcion}` (texto completo)
- Se agrega `whitespace-normal` en el SelectItem y `max-w-[370px]` en el div interno para que el texto fluya correctamente

