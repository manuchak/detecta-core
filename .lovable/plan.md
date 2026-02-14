

## Separar visualmente la alerta "En Riesgo" del Funnel

### Problema actual

El `mt-8` ya esta aplicado pero no es suficiente porque la alerta sigue dentro del mismo `CardContent`, asi que visualmente parece una extension del funnel (un "sexto nivel").

### Solucion

Mover la alerta de riesgo **fuera** del `Card` del funnel, convirtiendola en un elemento independiente debajo. Esto crea una ruptura visual clara:

**Cambios en `CSLoyaltyFunnel.tsx`:**

1. Cerrar el `</Card>` inmediatamente despues del funnel trapezoidal (despues del `</div>` del flex-col)
2. Renderizar el bloque "En Riesgo" como un elemento separado fuera del Card, sin estar envuelto en CardContent
3. Mantener el estilo actual del boton de riesgo (borde rojo, fondo rojo claro) que ya lo diferencia visualmente

Resultado: El funnel termina limpiamente dentro de su Card, y la alerta roja aparece como un componente completamente separado debajo, eliminando cualquier ambiguedad visual.

### Archivo

- `src/pages/CustomerSuccess/components/CSLoyaltyFunnel.tsx`

