

## Fix: Alinear todas las stats del custodio al mes actual

### Problema

Las 3 tarjetas de stats muestran rangos de tiempo inconsistentes:

| Metrica | Rango actual | Rango correcto |
|---|---|---|
| Servicios | Mes actual | Mes actual |
| Km | ALL TIME (historico) | Mes actual |
| Ingresos | ALL TIME (historico) | Mes actual |

Resultado: Un custodio con 3 servicios en febrero ve "$1.4M" de ingresos (acumulado historico), lo cual es confuso y genera desconfianza.

### Mejores practicas (Uber, DoorDash, Rappi)

- **Uber**: Semana actual (lun-dom) como periodo principal, con opcion de ver dia/mes
- **DoorDash**: Resumen del dash actual + semana
- **Rappi**: Semana actual

Para custodios de seguridad privada, cuya frecuencia de servicio es menor que rideshare, el **mes actual** es el periodo optimo (ya se usa para servicios).

### Solucion

Calcular `kmEsteMes` e `ingresosEsteMes` con el mismo filtro de fecha que ya se usa para `serviciosEsteMes`.

### Cambios

**Archivo: `src/components/custodian/MobileDashboardLayout.tsx`**

Agregar dos `useMemo` adicionales que filtren servicios del mes actual para KM e ingresos:

```typescript
const kmEsteMes = useMemo(() => {
  if (!services || services.length === 0) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return services
    .filter(s => new Date(s.fecha_hora_cita) >= startOfMonth)
    .reduce((sum, s) => sum + (s.km_recorridos || 0), 0);
}, [services]);

const ingresosEsteMes = useMemo(() => {
  if (!services || services.length === 0) return 0;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return services
    .filter(s => new Date(s.fecha_hora_cita) >= startOfMonth)
    .reduce((sum, s) => sum + (s.cobro_cliente || 0), 0);
}, [services]);
```

Actualizar el CompactStatsBar:

```tsx
<CompactStatsBar
  serviciosEsteMes={serviciosEsteMes}
  kmRecorridos={kmEsteMes}          // era stats.km_totales
  ingresosTotales={ingresosEsteMes}  // era stats.ingresos_totales
/>
```

**Archivo: `src/components/custodian/CompactStatsBar.tsx`**

Actualizar el label de "Km" a "Km mes" y "Ingresos" a "Ingresos mes" (o alternativamente, agregar el nombre del mes como subtitulo en las 3 tarjetas).

### Lo que NO cambia

- `useCustodianServices` sigue calculando stats historicos (se usan en la pagina de Vehiculo para kilometraje total de mantenimiento)
- La UI y el componente CompactStatsBar mantienen su estructura
- El calculo de `serviciosEsteMes` que ya existia no se toca

### Resultado

Las 3 tarjetas mostraran datos coherentes del mes actual: "3 servicios, X km, $Y ingresos" — todo del mismo periodo, sin ruido.
