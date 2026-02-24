

# Mejorar TVAlertTicker con noticias destacadas de X.com relevantes a carreteras

## Situacion actual

El `TVAlertTicker` ya consume datos de `incidentes_rrss` (alimentados por el pipeline de Twitter/X), pero tiene dos limitaciones:

1. **Sin filtro de relevancia**: Muestra todos los incidentes de las ultimas 24 horas sin priorizar los que afectan tramos carreteros
2. **Sin contexto visual**: No distingue entre un bloqueo critico en la Mexico-Queretaro y un incidente menor sin ubicacion

## Cambios propuestos

### 1. Filtrar y priorizar incidentes carreteros

Modificar `TVAlertTicker.tsx` para:
- Filtrar primero incidentes que tengan `carretera` poblada (son los que afectan tramos)
- Ordenar por severidad (critica > alta > media > baja)
- Si hay menos de 5 incidentes con carretera, complementar con los demas para que el ticker no quede vacio
- Agregar etiqueta "X" o icono de fuente para indicar que viene de redes sociales

### 2. Mejorar la presentacion visual para TV

- Hacer el ticker mas alto (de h-9 a h-10) para mejor legibilidad a distancia
- Agregar un label fijo "ALERTAS CARRETERAS" a la izquierda del marquee como ancla visual
- Mostrar la severidad como texto (CRITICA, ALTA) junto al dot de color
- Incluir el estado geografico cuando este disponible (ej: "Jalisco - Mex-Guadalajara")
- Tipografia ligeramente mas grande (de text-sm a text-base) para legibilidad en videowall

### 3. Indicador de fuente y frescura

- Mostrar un icono de X/Twitter sutil para indicar la fuente
- Agregar hace cuanto se publico (ej: "hace 2h")

## Archivo a modificar

| Archivo | Cambio |
|---|---|
| `src/components/monitoring/tv/TVAlertTicker.tsx` | Filtrar por carretera, priorizar por severidad, mejorar tipografia y layout para TV |

## Resultado esperado

El ticker inferior del videowall mostrara exclusivamente (o prioritariamente) las noticias de X.com que mencionan tramos carreteros, con severidad visible y contexto geografico, permitiendo al equipo de monitoreo identificar amenazas operativas de un vistazo.

