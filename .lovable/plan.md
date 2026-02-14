

## Fix: Modal de perfil de cliente muestra pantalla en blanco

### Causa raiz

El hook `useCSClienteProfile.ts` (linea 36) consulta la columna `fecha_servicio` en la tabla `servicios_custodia`, pero esa columna **no existe**. La columna correcta es `fecha_hora_cita`.

Esto causa un error 400 de Supabase que React Query captura internamente, dejando el componente atrapado en estado de "loading" mostrando solo los Skeletons blancos.

### Cambios

**1. `src/hooks/useCSClienteProfile.ts`**
- Cambiar `fecha_servicio` por `fecha_hora_cita` en el `.select()` de la query a `servicios_custodia`
- Actualizar todas las referencias internas que usen `fecha_servicio` para usar `fecha_hora_cita` (sorting de fechas, calculo de primer servicio, tendencia GMV por mes)

**2. `src/pages/CustomerSuccess/components/CSClienteProfileModal.tsx`**
- Agregar manejo del estado `isError` para mostrar un mensaje claro al usuario en lugar de skeletons infinitos
- Agregar `DialogDescription` para resolver el warning de accesibilidad en consola

### Impacto
- Corrige el modal de perfil de cliente para que cargue correctamente con datos de servicios, GMV y tendencias
- Elimina el warning de accesibilidad `DialogContent requires DialogTitle/Description`
