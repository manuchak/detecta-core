

# Bug: "Arribado" desaparece en Planeación cuando Monitoreo inicia el servicio

## Causa Raíz

Dos archivos con la misma falla lógica — el check de `hora_inicio_real` tiene mayor prioridad que `hora_llegada_custodio`:

**CompactServiceCard.tsx** (tarjeta de Planning):
```
Línea 61: if (hora_inicio_real) → 'en_curso'    ← GANA
Línea 74: if (hora_llegada_custodio) → 'en_sitio' ← nunca se alcanza
```
El badge "Arribado HH:mm" solo se muestra cuando `status === 'en_sitio'` (línea 256), así que desaparece.

**ScheduledServicesTabSimple.tsx** (tabla de Planning):
```
Línea 241: if (hora_llegada_custodio && !hora_inicio_real) → 'en_sitio'
```
Explícitamente requiere que NO exista `hora_inicio_real`.

## Perspectiva de negocio

Para Planeación, "Arribado" es un hecho inmutable — el custodio llegó a las HH:mm. Que Monitoreo inicie el servicio no cambia ese hecho. Planeación necesita:
- Ver "Arribado HH:mm" siempre que `hora_llegada_custodio` esté seteado
- Opcionalmente ver "En curso" como información secundaria, pero sin perder el badge de arribo

## Solución

### CompactServiceCard.tsx
Reordenar la prioridad en `getOperationalStatus`: poner `hora_llegada_custodio` **antes** de `hora_inicio_real`. Si el custodio ya llegó, el estatus para Planning es "en_sitio" siempre (excepto completado/cancelado).

```
1. Cancelado → cancelado
2. Completado (hora_fin_real) → completado  
3. hora_llegada_custodio → en_sitio (SIEMPRE, aunque hora_inicio_real exista)
4. hora_inicio_real → en_curso (solo si no tiene hora_llegada, caso edge)
5. Sin asignar, armado pendiente, programado...
```

Adicionalmente, enriquecer el badge para mostrar "En monitoreo" como indicador secundario cuando `hora_inicio_real` existe junto con `hora_llegada_custodio`.

### ScheduledServicesTabSimple.tsx
Mismo cambio: quitar la condición `&& !service.hora_inicio_real` de la línea 241, para que `hora_llegada_custodio` sea suficiente. Agregar un badge secundario "En monitoreo" si `hora_inicio_real` existe.

### Monitoreo (sin cambios)
`iniciarServicio` en `useBitacoraBoard.ts` solo escribe `hora_inicio_real` — no toca `hora_llegada_custodio` ni `estado_planeacion`. No requiere cambios.

**Impacto**: 2 archivos, reordenamiento de condiciones + badge secundario opcional. Cero cambios en Monitoreo o base de datos.

