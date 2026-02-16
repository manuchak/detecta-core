
# Hacer visible el panel de Incidentes Operativos

## Problema

El componente `IncidentPanel` existe y funciona correctamente (queries retornan 200 OK), pero esta ubicado al final de la pagina StarMap, debajo del Data Health Summary y el Instrumentation Roadmap. Cuando la tabla esta vacia, muestra un estado vacio discreto que es facil de pasar por alto.

## Solucion

Mover el `IncidentPanel` a una posicion mas prominente y mejorar su visibilidad:

### 1. Reposicionar en la pagina (`StarMapPage.tsx`)

Mover el `IncidentPanel` justo despues del grid de pilares (overview cards) y antes del Data Health Summary. Esto lo coloca en una posicion natural despues de ver que el pilar Riesgo tiene datos.

Orden final de secciones:
1. Header + North Star Banner
2. Star Visualization + Detail Panel
3. Pillar Overview Cards (6 cards)
4. **Incidentes Operativos** (movido aqui arriba)
5. Data Health Summary + Instrumentation Roadmap

### 2. Mejorar el empty state del `IncidentPanel`

Cuando no hay incidentes, hacer el boton "Reportar" mas prominente:
- Cambiar el boton de `variant="outline" size="sm"` a un boton mas visible con color primario
- Agregar un CTA mas claro en el empty state: "Registra el primer incidente para activar los KPIs R1-R4"
- Agregar un indicador visual que conecte con el pilar Riesgo (badge "Pilar Riesgo: 0% datos")

### 3. Sin cambios en BD ni logica

Todo funciona correctamente. Solo es un cambio de posicion en el layout y mejora visual del empty state.

## Archivos a modificar

- `src/pages/StarMap/StarMapPage.tsx` — mover IncidentPanel arriba del DataHealthSummary
- `src/components/starmap/IncidentPanel.tsx` — mejorar empty state con CTA mas prominente
