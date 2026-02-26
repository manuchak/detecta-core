

# Fix: Texto enriquecido se marca como completado automáticamente

## Problema
El componente `TextoEnriquecidoViewer` tiene un timer de 3 segundos que llama `onComplete()` automáticamente. El usuario reporta que no le da tiempo de leer el contenido antes de que avance a la siguiente actividad.

## Solución
Eliminar el timer automático y agregar un botón manual "Marcar como completado" al final del contenido. El usuario decidirá cuándo terminó de leer.

## Cambios

### TextoEnriquecidoViewer.tsx
- Eliminar el `useEffect` con `setTimeout` de 3 segundos
- Agregar un botón "Marcar como completado" al final del contenido HTML
- El botón llama `onComplete()` al hacer clic y se deshabilita después
- Incluir un ícono de check y feedback visual (cambia a "Completado" una vez presionado)

### Diseño del botón

```text
[Contenido HTML del texto...]

+-------------------------------------------+
|  [CheckCircle] He terminado de leer       |
+-------------------------------------------+
```

- Estilo: botón con variante `default`, tamaño normal, centrado
- Al presionar: se marca como completado, el botón cambia a estado "Completado" (verde, deshabilitado)
- No hay avance automático — el usuario controla el ritmo

## Archivos
- **1 archivo modificado**: `src/components/lms/TextoEnriquecidoViewer.tsx`

## Impacto
- Respeta el ritmo de lectura del usuario
- El progreso solo se registra cuando el usuario confirma que terminó
- No afecta otros tipos de contenido

