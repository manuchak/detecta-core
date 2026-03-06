

# Fix: Claridad en requisitos de liberacion y desbloqueo GPS/Historial

## Diagnostico

Revisando el codigo de gates (lineas 419-483 de `LiberacionChecklistModal.tsx`):

- **GPS** ya es gate GREEN (linea 474) — NO bloquea liberacion
- **Historial** no tiene gate — NO bloquea liberacion
- Los unicos RED gates (que bloquean) son: INE faltante, Licencia/Portacion de arma, Toxico positivo, Estudio socioeconomico desfavorable

**El problema real es de UX**: el footer sticky muestra los bloqueos pero no es suficientemente claro. El equipo de supply no distingue que es RED (bloquea) vs GREEN (informativo). Ven las tabs GPS e Historial sin completar y asumen que eso es lo que bloquea, cuando en realidad puede ser un checkbox de documentacion desmarcado.

## Solucion

### 1. Mejorar footer sticky con detalle expandido

Cuando hay RED gates, mostrar cada bloqueo como item individual con indicacion de la seccion donde resolverlo:

```
🔴 INE faltante → Sección: Documentación
🔴 Licencia faltante → Sección: Documentación
```

### 2. Marcar claramente GPS e Historial como NO requeridos

En los accordion headers de GPS e Historial, agregar un badge `(Opcional)` para que supply sepa que no bloquean. Actualmente no hay indicacion visual de que son opcionales.

### 3. Agregar badges de estado a TODOS los accordion headers

Cada seccion del accordion muestra un badge inline:
- **Documentacion**: 🔴 "2 faltantes" o ✅ "Completo"
- **Psicometricos**: 🟡 "Pendiente" o ✅ "Aprobado"
- **Toxicologicos**: 🔴 "Positivo" / 🟡 "Pendiente" / ✅ "Negativo"  
- **Vehiculo**: ✅ o 🟡 segun estado
- **GPS**: badge gris "Opcional"
- **Contratos**: 🟡 "X/5 firmados" o ✅
- **Capacitacion**: 🟡 o ✅
- **Estudio Socioeconomico**: 🔴 "Desfavorable" / 🟡 "Pendiente" / ✅ "Favorable"

### 4. Expandir el banner de bloqueos para listar items individuales

En lugar de `gates.red.join(' · ')` en una sola linea, mostrar una lista con bullets para que cada bloqueo sea visible y accionable.

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `LiberacionChecklistModal.tsx` | Badges en accordion headers, footer expandido con items individuales, badge "Opcional" en GPS/Historial |

Un solo archivo, cambios localizados en la UI del modal.

