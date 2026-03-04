

# Deep Research: Bitácora en Ruta vs. Soluciones del Mercado

## Benchmark de competidores analizados

| Solución | Segmento | Modelo de registro | Fortalezas clave |
|---|---|---|---|
| **TrackVigilante** (MX) | Guardias / Custodias | App móvil del guardia: checkpoints NFC/QR, fotos, notas de voz | Registro desde campo, evidencia multimedia, reportes automáticos al cliente |
| **Logytek** (MX) | Custodias de mercancía en tránsito | App del custodio + panel web del cliente | Trazabilidad fotográfica, cotización/contratación digital, visibilidad pre-servicio |
| **CityTroops** (LATAM) | Field service / Seguridad | App de agente + dashboard supervisor | Formularios dinámicos, offline-first, reportes automáticos |
| **Safetrac / GuardTrac** (US) | Security guard management | App del guardia: patrol tours, incident reports | Activity feed en tiempo real, incident logging con fotos, scheduling integrado |
| **TrackTik** (US/Global) | Enterprise security | Guard tour + dispatch console | Checkpoints verificados, exception-based workflows, post orders |
| **Dispatch Ops Platform** (case study Lindi Wheaton) | Fleet/freight dispatch | Console del dispatcher | Queue-based workflow, exception banners, role-based density, "leading identifiers" search |

## Hallazgos clave y gaps en nuestro plan actual

### 1. Nuestro plan ya es correcto en el concepto central
El flujo "carrusel de servicios + registro rápido + timeline compacta" es sólido y alineado con lo que hace la industria. El monitorista es un **operador de consola**, no un agente de campo.

### 2. Gaps identificados vs. mercado

| Gap | Qué hacen los competidores | Qué nos falta |
|---|---|---|
| **Keyboard shortcuts** | Dispatch consoles usan atajos (1-9 para tipo, Enter para confirmar, flechas para navegar servicios) | Nuestro plan solo contempla clicks. Un monitorista con 30 servicios necesita atajos de teclado |
| **Pegar coordenadas de Google Maps** | Logytek y CityTroops aceptan un solo campo "19.4326, -99.1332" | Tenemos 2 campos separados lat/lng. Debemos aceptar ambos formatos (pegar Google Maps link o coords) |
| **Notas de voz → texto** | TrackVigilante y CityTroops permiten notas de voz | No aplica directo (el monitorista está en escritorio), pero sí deberíamos soportar **pegar texto largo de WhatsApp** con un botón de "pegar mensaje completo" |
| **Fotos como thumbnails inline** | Todos los competidores muestran thumbnails de evidencia fotográfica inline, no solo URLs | Nuestro EventTimeline muestra URLs. Debemos renderizar thumbnails clickeables |
| **Contadores de alerta por servicio** | GuardTrac/Safetrac muestran badges de "incidencias pendientes" en el feed | Nuestro carrusel ya tiene badge de conteo, pero debería diferenciar **incidencias** (rojo) de eventos normales |
| **Quick-duplicate** | Dispatch consoles permiten "repetir último evento" con un click para checkpoints repetitivos | No lo tenemos. Un botón "Repetir último" ahorraría clicks en checkpoints secuenciales |
| **Modo offline / draft** | CityTroops y TrackVigilante guardan borradores offline | No crítico para monitorista en escritorio, pero sí útil tener **auto-save draft** en localStorage por si se refresca |
| **Timestamp override** | Operadores de consola frecuentemente registran eventos que pasaron hace 5-10 minutos (el custodio reportó tarde) | Nuestro plan siempre usa `now()`. Necesitamos un campo opcional "hora real del evento" |

### 3. Mejoras recomendadas al plan

**Incorporar al rediseño:**

1. **Campo unificado de coordenadas**: Un solo input que acepte `19.4326, -99.1332` o un link de Google Maps y parsee automáticamente lat/lng
2. **Keyboard shortcuts**: `1-9` para seleccionar tipo, `Enter` para iniciar, `Esc` para cancelar, `←/→` para navegar servicios en carrusel
3. **Botón "Repetir último"**: Cuando hay eventos previos, mostrar un botón que pre-llena tipo + ubicación del último evento registrado (ideal para checkpoints secuenciales)
4. **Timestamp override opcional**: Un toggle "Hora real" que permite al monitorista poner la hora exacta que reportó el custodio (default: ahora)
5. **Thumbnails de fotos**: En el mini-timeline, renderizar las fotos como thumbnails clickeables, no como texto de URL
6. **Badge diferenciado en carrusel**: Incidencias en rojo, eventos normales en gris/azul
7. **Auto-save draft en localStorage**: Si el monitorista estaba llenando datos y refresca, no pierde el borrador

**No incorporar (no aplica a nuestro caso):**
- NFC/QR checkpoints (es para agentes de campo, no monitoristas de escritorio)
- Notas de voz (el monitorista está en PC)
- Offline-first (el monitorista siempre tiene conexión)
- Scheduling/billing integrado (ya existe en otro módulo)

## Plan actualizado

El plan original del carrusel + tracker compacto se mantiene como base. Se agregan las 7 mejoras identificadas arriba como parte de la misma implementación. Los archivos a modificar son los mismos:

| Archivo | Cambio adicional |
|---|---|
| `EventTracker.tsx` | Campo unificado de coords, timestamp override, botón "Repetir último", keyboard shortcuts, auto-save draft |
| `BitacoraServiceSelector.tsx` | Badge diferenciado incidencias vs normales, keyboard nav ←/→ |
| `EventTimeline.tsx` | Thumbnails de fotos, timestamp real vs registrado |
| `BitacoraPanel.tsx` | Keyboard event listener global para shortcuts |

