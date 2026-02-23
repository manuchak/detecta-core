

# Evaluacion como Product Owner: Pipeline de Inteligencia para Head de Seguridad

## User Persona: Head de Seguridad / Director de Operaciones de Custodia

**Necesidad principal del dia:** "Hoy hay bloqueos en Jalisco y Michoacan. Necesito saber en 30 segundos si autorizo o no los movimientos programados en esos corredores."

---

## Evaluacion del Estado Actual: GAPS CRITICOS

### GAP 1: No se puede filtrar por entidad federativa (BLOQUEANTE)

El filtro "Estado" en la pagina NO filtra por estado geografico (Jalisco, Michoacan). Filtra por **estado del registro** (nuevo, validado, descartado). Un Head de Seguridad que quiere ver "todo lo de Jalisco hoy" no puede hacerlo.

- **Hook:** `useIncidentesRRSS` filtra `estado` contra el campo de estado del registro, no contra la columna `estado` geografico (que si existe en la BD)
- **Page:** `ESTADOS_INCIDENTE` lista "Nuevo", "Validado", "Descartado" -- no entidades federativas

### GAP 2: No hay filtro temporal adecuado para operacion del dia

El unico filtro temporal es "Dias hacia atras" con un input numerico (default 30 dias). Un Head de Seguridad necesita presets rapidos:
- "Ultimas 4 horas" (situacion activa)
- "Hoy" (briefing matutino)
- "Ultimas 24h" (turno)
- "Esta semana"

30 dias de datos es ruido para una decision operativa del dia.

### GAP 3: No hay banner de situacion activa

Cuando hay bloqueos AHORA MISMO, la pagina muestra una tabla plana sin urgencia visual. No hay:
- Alerta prominente tipo "3 BLOQUEOS ACTIVOS EN JALISCO - hace 23 min"
- Indicador de "situacion activa" vs "historico"
- Conteo de eventos criticos de las ultimas horas

### GAP 4: No hay conexion "incidente -> decision de ruta"

La pagina muestra incidentes como fichas informativas pero no responde la pregunta operativa: "Esto afecta mis rutas programadas?" No hay:
- Filtro por corredor/carretera especifica
- Indicador de "afecta X servicios programados"
- Boton de "No autorizar movimientos en este corredor"

### GAP 5: Queries de scraping no cubren el vocabulario real

Los bloqueos de Jalisco/Michoacan se reportan como "narcobloqueo", "quema de vehiculos", "jornada de violencia". Estos terminos no estan en los 12 queries actuales.

### GAP 6: El mapa sigue como placeholder "Fase 2"

Para un Head de Seguridad, un mapa con los incidentes de HOY geocodificados es la herramienta numero uno de decision. Sigue siendo un div gris.

### GAP 7: Filtro de "Estado" del registro esta mal nombrado

El label dice "Estado" pero filtra por estatus del registro. Esto confunde al usuario que piensa que filtrara por entidad federativa.

---

## Plan de Implementacion: Pagina de Decision Operativa

### Cambio 1: Panel de Situacion Activa (hero banner)

Agregar un componente `ActiveSituationBanner` al tope de la pagina que muestre:
- Conteo de incidentes criticos de las ultimas 4 horas
- Las entidades federativas mas afectadas
- Tipo de incidente predominante
- Timestamp de ultima actualizacion
- Color: rojo si hay criticos, ambar si solo media, verde si limpio

**Archivo nuevo:** `src/components/incidentes/ActiveSituationBanner.tsx`

### Cambio 2: Filtros rediseñados para operacion

Reemplazar la seccion de filtros con presets operativos:

- **Temporalidad:** Botones rapidos "4h", "Hoy", "24h", "7d", "30d" (en lugar de solo input numerico)
- **Entidad Federativa:** Dropdown con los 32 estados de Mexico (filtrando contra la columna `estado` geografico de la BD)
- **Carretera/Corredor:** Dropdown con las carreteras detectadas en la BD
- Renombrar el filtro actual de "Estado" a "Estatus del registro"

**Archivos:**
- `src/pages/Incidentes/IncidentesRRSSPage.tsx` - Rediseno de filtros
- `src/hooks/useIncidentesRRSS.ts` - Agregar filtros `estado_geografico` y `carretera`, y nuevo parametro `horas_atras` como alternativa a `dias_atras`

### Cambio 3: Mapa de incidentes activos

Reemplazar el placeholder "Fase 2" con un mapa Mapbox real que muestre los incidentes geocodificados del periodo filtrado, con:
- Marcadores coloreados por severidad
- Popup con resumen AI al hacer click
- Cluster para zonas con multiples incidentes

**Archivo nuevo:** `src/components/incidentes/IncidentesMap.tsx`
**Modificar:** `src/pages/Incidentes/IncidentesRRSSPage.tsx`

### Cambio 4: Queries de scraping ampliados

Agregar al array `SEARCH_QUERIES`:
```
"narcobloqueo" OR "narco bloqueo" Jalisco OR Michoacan OR Mexico
"quema vehiculos" OR "jornada violencia" carretera Mexico
"cierre autopista" OR "cierre carretera" OR "paro transportistas" Mexico
```

**Archivo:** `supabase/functions/firecrawl-incident-search/index.ts`

### Cambio 5: Indicador de corredores afectados

Agregar un componente compacto que cruce los incidentes activos con los corredores de `HIGHWAY_CORRIDORS` y muestre: "Corredores afectados ahora: Mexico-Guadalajara (2 bloqueos), Morelia-Lazaro Cardenas (1 asalto)"

**Archivo nuevo:** `src/components/incidentes/AffectedCorridors.tsx`

---

## Detalle tecnico

### Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/incidentes/ActiveSituationBanner.tsx` | Banner de situacion activa con conteos de ultimas 4h |
| `src/components/incidentes/IncidentesMap.tsx` | Mapa Mapbox con incidentes geocodificados |
| `src/components/incidentes/AffectedCorridors.tsx` | Panel de corredores con incidentes activos cruzado con highway segments |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/Incidentes/IncidentesRRSSPage.tsx` | Layout: banner arriba, filtros con presets temporales + estado geografico + carretera, mapa real, panel de corredores afectados |
| `src/hooks/useIncidentesRRSS.ts` | Agregar filtros `estado_geografico`, `carretera`, `horas_atras`; nuevo hook `useIncidentesActivos` para ultimas 4h |
| `supabase/functions/firecrawl-incident-search/index.ts` | 3 queries adicionales con vocabulario de narcobloqueos y cierres |

### Layout resultante de la pagina

```text
+-------------------------------------------------------+
| [!] SITUACION ACTIVA: 3 incidentes criticos (4h)      |
| Jalisco (2) · Michoacan (1) · Tipo: Bloqueo carretera |
+-------------------------------------------------------+
| Filtros: [4h] [Hoy] [24h] [7d] [30d]                 |
| Estado: [Jalisco v] Carretera: [Todas v] Tipo: [...v] |
+-------------------------------------------------------+
| Corredores Afectados                                   |
| Mexico-Guadalajara: 2 bloqueos | Morelia-LC: 1 asalto |
+---------------------------+---------------------------+
| Mapa de Incidentes        | Stats / Charts            |
| [Mapbox con marcadores]   | [Cards de stats]          |
+---------------------------+---------------------------+
| Tabla de Incidentes (ficha de inteligencia expandible) |
+-------------------------------------------------------+
```

