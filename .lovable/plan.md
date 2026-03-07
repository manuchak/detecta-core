
Objetivo
- Corregir el bug de “scroll pegado” en `/dashboard/operativo` cuando se llega al fondo y luego se intenta subir.

Hallazgos (código actual)
- Hay scroll anidado:
  - `UnifiedLayout.tsx`: `main` usa `overflow-auto` (scroll principal).
  - `MobileOperationalDashboard.tsx`: además aplica `overscrollBehaviorY: 'contain'` en su contenedor interno.
- En móvil, esa combinación puede volver “duro” el gesto de retorno al invertir dirección en el límite inferior.
- `ExecutiveDashboard.tsx` usa `min-h-screen` dentro de un layout con altura controlada (`h-viewport-full`), lo que puede amplificar el efecto de rebote/cadena de scroll en iOS/Android.

Plan de implementación
1) Dejar un solo responsable de física de scroll (contenedor principal)
- Archivo: `src/layouts/UnifiedLayout.tsx`
- Ajustar `main` para comportamiento móvil estable:
  - `overflow-y-auto overflow-x-hidden`
  - `overscroll-y-contain`
  - `[-webkit-overflow-scrolling:touch]`
- Mantener `min-h-0` en el contenedor flex padre para evitar desbordes ocultos.

2) Quitar contención de overscroll en el hijo operativo
- Archivo: `src/components/executive/MobileOperationalDashboard.tsx`
- Eliminar `style={{ overscrollBehaviorY: 'contain' }}` del wrapper principal.
- Conservar padding inferior, pero con safe-area para móviles:
  - `pb-[calc(env(safe-area-inset-bottom)+6rem)]`

3) Evitar altura “extra” interna en el tab operativo
- Archivo: `src/pages/Dashboard/ExecutiveDashboard.tsx`
- Para el modo operativo, cambiar wrapper de `min-h-screen` a `min-h-full` (o condicionar clase por tab) para no crear una segunda referencia de viewport dentro del scroller del layout.

4) Ajuste fino opcional anti-stick (si persiste en iOS)
- Añadir `touch-pan-y` al contenedor de contenido operativo para priorizar scroll vertical.
- Revisar si algún drawer abierto/cerrado deja bloqueo residual de scroll (vaul), y forzar limpieza de estilo de `body` al cerrar si se detecta.

Validación end-to-end (obligatoria)
- En móvil real o emulación:
  1. Ir a `/dashboard/operativo`.
  2. Hacer scroll hasta el fondo 3 veces seguidas.
  3. Invertir gesto y subir inmediatamente: debe responder fluido, sin “atorarse”.
  4. Repetir después de abrir/cerrar un drawer de alerta para confirmar que no reaparece.
  5. Validar en iOS Safari y Chrome Android (si disponible).

Resultado esperado
- Scroll continuo y reversible en toda la pantalla operativa, sin fricción al regresar desde el fondo.
