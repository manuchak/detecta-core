

## Fix: Timezone bug en useServiciosAyer y useServiciosHoy

### Problema detectado

Ambos hooks (`useServiciosAyer.ts` y `useServiciosHoy.ts`) filtran `fecha_hora_cita` usando rangos UTC sin considerar la zona horaria CDMX (-06:00). Esto causa:

- **Servicios incluidos incorrectamente**: Registros de la noche anterior en CDMX (18:00-23:59) que en UTC ya caen en el dia siguiente
- **Servicios excluidos incorrectamente**: Registros del dia despues de las 18:00 CDMX que en UTC ya son del dia siguiente

Ejemplo concreto para "ayer" (Feb 9 CDMX):
- El query actual busca UTC `2026-02-09T00:00:00` a `2026-02-09T23:59:59`
- Incluye 5 servicios que son realmente Feb 8 noche CDMX
- Excluye 3+ servicios de Feb 9 despues de las 18:00 CDMX
- Resultado: muestra ~15 incorrectos en vez de los 29-32 reales

### Solucion

Usar `buildCDMXTimestamp` (ya existente en `cdmxTimezone.ts`) para construir los rangos con offset `-06:00`, de modo que PostgreSQL compare correctamente en zona CDMX.

### Cambios

**1. `src/hooks/useServiciosAyer.ts`**

Reemplazar:
```typescript
const ayer = format(subDays(new Date(), 1), 'yyyy-MM-dd');
// query con ${ayer}T00:00:00 y ${ayer}T23:59:59
```

Por:
```typescript
import { buildCDMXTimestamp } from '@/utils/cdmxTimezone';

const ayer = format(subDays(new Date(), 1), 'yyyy-MM-dd');
const inicio = buildCDMXTimestamp(ayer, '00:00');
const fin = buildCDMXTimestamp(ayer, '23:59');
// query con .gte('fecha_hora_cita', inicio).lt('fecha_hora_cita', fin)
```

Esto genera `2026-02-09T00:00:00-06:00` y `2026-02-09T23:59:00-06:00`, que PostgreSQL convierte internamente a UTC para comparar correctamente.

**2. `src/hooks/useServiciosHoy.ts`**

Mismo patron: reemplazar las comparaciones naive por `buildCDMXTimestamp` para el dia actual.

### Detalle tecnico

`buildCDMXTimestamp('2026-02-09', '00:00')` produce `2026-02-09T00:00:00-06:00`, que PostgreSQL interpreta como `2026-02-09T06:00:00Z`. Esto alinea correctamente el rango del "dia CDMX" con los timestamps UTC almacenados en la base de datos.

No se requieren cambios en la base de datos ni migraciones.
