

# Rediseno del Dashboard de Inteligencia de Incidentes

## Diagnostico UX actual

Tras analizar los 8 componentes que conforman esta pagina, identifico estos problemas clave para los stakeholders (Head of Security, Directores de Operaciones):

### Problemas detectados

1. **Header debil**: El titulo con un icono generico de AlertTriangle no comunica urgencia ni autoridad. Los botones de accion (Actualizar desde X, TriggerApifyFetch) estan mezclados sin jerarquia visual.

2. **TriggerApifyFetch es un Card completo en el header**: Este componente renderiza un Card con CardHeader + 3 botones + panel de progreso directamente en la zona de acciones del header. Ocupa espacio excesivo y rompe la jerarquia visual.

3. **Filtros demasiado prominentes**: Los filtros ocupan una Card completa con titulo "Filtros Operativos" que compite visualmente con el contenido importante. Para un directivo, los filtros son herramientas secundarias, no contenido principal.

4. **Layout vertical sin priorizacion**: Todo esta apilado verticalmente sin distinguir que es critico vs. informativo. El mapa y las stats estan al mismo nivel que las recomendaciones.

5. **Tabla de incidentes en Card generica**: No tiene filtros inline, ni indicadores de estado rapido, ni acciones batch.

6. **Falta de "glanceability"**: Un stakeholder deberia entender la situacion en 5 segundos. Actualmente necesita hacer scroll para encontrar la informacion clave.

---

## Rediseno propuesto

### 1. Header ejecutivo con barra de estado

Reemplazar el header actual por un diseno tipo "command center":
- Titulo limpio sin icono de alerta generico
- Subtitulo con timestamp de ultima actualizacion (ya existe, pero darle mas prominencia)
- Botones de accion agrupados en un dropdown o toolbar compacta
- **Status pill** que muestre el estado general del sistema (ej: "3 alertas activas" o "Sin incidentes")

### 2. Barra de acciones colapsable

Mover TriggerApifyFetch y el boton de Twitter a una barra de herramientas colapsable:
- Un boton principal "Actualizar fuentes" que abre un popover/dropdown con las 3 opciones (Twitter, Apify dataset, Firecrawl web)
- El panel de progreso de Firecrawl se muestra como un banner temporal debajo del header cuando esta activo
- Reduce el ruido visual cuando no se esta actualizando

### 3. Filtros como toolbar inline

Reemplazar la Card de filtros por una toolbar horizontal compacta:
- Presets temporales como chips/toggle group (ya los tiene, pero sacarlos de la Card)
- Dropdowns en una sola linea horizontal
- Sin titulo ni Card wrapper
- Colapsable en mobile

### 4. Layout de "Situation Room" con 3 zonas

Reorganizar el contenido en 3 zonas claras:

```text
+--------------------------------------------------+
|  BANNER DE SITUACION ACTIVA (ya existe, mantener) |
+--------------------------------------------------+
|  [4h] [Hoy] [24h] [7d] [30d]  | Entidad | Tipo  |  <-- Filtros inline
+--------------------------------------------------+
|  MAPA (60%)          |  RECOMENDACIONES (40%)     |  <-- Zona 1: Vista rapida
|  Grande, prominente  |  Operativas + Corredores   |
+--------------------------------------------------+
|  SEMAFORO CORREDORES (full width)                 |  <-- Zona 2: Estado operativo
+--------------------------------------------------+
|  KPIs compactos (4 cards)                         |  <-- Zona 3: Metricas
+--------------------------------------------------+
|  TABLA DE INCIDENTES (full width)                 |  <-- Zona 4: Detalle
+--------------------------------------------------+
```

### 5. KPIs como metric cards compactas

Simplificar IncidentesStats: las 4 cards superiores (Total, Geocodificados, Severidad, Metodo) se mantienen pero con diseno mas limpio. Los graficos (pie chart, bar chart) se mueven a una seccion "Analisis" debajo de la tabla, accesible via tab o accordion.

### 6. Tabla mejorada

- Agregar conteo de resultados como badge en el header de la tabla
- Mejorar contraste de badges de severidad
- Row highlighting para incidentes criticos (fondo rojo tenue)

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/Incidentes/IncidentesRRSSPage.tsx` | Reestructurar layout completo: header, filtros inline, reordenar secciones, agregar seccion de analisis colapsable |
| `src/components/incidentes/TriggerApifyFetch.tsx` | Refactorizar a version compacta: eliminar Card wrapper, exponer solo botones + progreso inline |
| `src/components/incidentes/IncidentesStats.tsx` | Separar en 2 componentes: KPIs compactos (top) y AnalisisPanel (graficos, abajo) |
| `src/components/incidentes/IncidentesTable.tsx` | Agregar row highlighting para incidentes criticos |

## Nota sobre build errors

Los errores de `gl-matrix` en `node_modules` son de una dependencia transitiva de Mapbox GL y no afectan la ejecucion. Se resolvera agregando `skipLibCheck: true` en tsconfig si no esta ya presente.

