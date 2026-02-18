
# Agregar "Reportado por" a la UX de exclusiones y rechazos

## Problema

Cuando un custodio aparece como excluido (por rechazo o indisponibilidad), el planificador no sabe **quien ejecuto esa accion**: si fue un usuario interno (coordinador, planificador) o si el mismo custodio se puso inactivo. Esto genera confusion operativa como la que reporta Daniela en el screenshot.

## Datos disponibles

Ambas tablas ya almacenan `reportado_por` (UUID del usuario):
- `custodio_rechazos.reportado_por` -- usuario que registro el rechazo
- `custodio_indisponibilidades.reportado_por` -- usuario que registro la indisponibilidad

Los nombres se resuelven contra la tabla `profiles` (campos `display_name`, `email`).

## Cambios propuestos

### 1. Hook `useCustodioRechazos.ts` -- Agregar `reportado_por_nombre` a `RechazadoDetalle`

- Extender la interface `RechazadoDetalle` con `reportado_por_nombre: string | null`
- En `useRechazosVigentesDetallados`, agregar `reportado_por` al select de `custodio_rechazos`
- Resolver los UUIDs de `reportado_por` contra `profiles` (display_name o email) en el mismo queryFn
- Si `reportado_por` es null, mostrar "Sistema" o "Desconocido"

### 2. Componente `ExcludedCustodiansAlert.tsx` -- Mostrar quien reporto

- Actualizar la interface `RechazadoDetail` para incluir `reportado_por_nombre: string | null`
- En el mensaje especifico (1 custodio coincide con busqueda), agregar una linea: "Reportado por: [nombre]"
- Formato: texto gris discreto debajo del motivo

### 3. Hook `useCustodioIndisponibilidades.ts` -- Resolver nombres en indisponibilidades activas

- Extender la query de `indisponibilidadesActivas` para incluir `reportado_por`
- Resolver el UUID contra `profiles` para mostrar el nombre en el banner de indisponibilidad

### 4. Componente `UnavailabilityStatusBanner.tsx` -- Mostrar quien registro la indisponibilidad

- Agregar prop opcional `reportadoPor: string | null`
- Mostrar "Reportado por: [nombre]" como texto discreto

## Detalle tecnico

| Archivo | Accion |
|---|---|
| `src/hooks/useCustodioRechazos.ts` | Modificar - Agregar `reportado_por` al select, resolver nombre contra `profiles`, extender `RechazadoDetalle` |
| `src/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ExcludedCustodiansAlert.tsx` | Modificar - Agregar campo `reportado_por_nombre` a interface y mostrarlo en el banner |
| `src/hooks/useCustodioIndisponibilidades.ts` | Modificar - Resolver `reportado_por` contra `profiles` en la query de activas |
| `src/components/custodian/UnavailabilityStatusBanner.tsx` | Modificar - Agregar prop `reportadoPor` y mostrarlo |

## Ejemplo visual del banner mejorado

```text
"David Diaz" coincide con un custodio excluido
David Diaz — Rechazo vigente hasta 24 de feb · No quiere servicio con armado
Reportado por: Daniela Castaneda
```

Para indisponibilidades:

```text
Estado: No disponible
Falla mecanica
Hasta: lunes, 24 de febrero
Reportado por: David Diaz (auto-reporte)
```

Si el `reportado_por` coincide con el custodio (self-service desde el portal), se agrega "(auto-reporte)".
