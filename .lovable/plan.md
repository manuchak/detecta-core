

# Integración de Fuentes Twitter + Panel de Inteligencia Carretero

## Estrategia de Fuentes

### Por qué Apify para Twitter (y no Firecrawl)

Firecrawl busca en Google, y Twitter/X bloquea la indexación de sus contenidos. Un tweet de @monitorcarrete1 publicado hace 20 minutos NUNCA aparecerá en una búsqueda de Firecrawl. Apify tiene scrapers dedicados que acceden directamente a Twitter.

**Estrategia dual:**
- **Apify** (fuente primaria): Scraping directo de cuentas Twitter especializadas
- **Firecrawl** (complemento): Buscar noticias web que citen estas cuentas

---

## Cambios

### 1. Apify: Queries para cuentas específicas

**Archivo:** `supabase/functions/apify-data-fetcher/index.ts`

Modificar el bloque `search` (linea 51-61) para incluir las cuentas especializadas como terminos de busqueda separados por cuenta:

```
// Grupo 1: Fuentes carreteras especializadas
'from:monitorcarrete1 bloqueo OR cierre OR accidente OR asalto'

// Grupo 2: Fuentes regionales Jalisco + Michoacan
'from:jaliscorojo OR from:mimorelia bloqueo OR narcobloqueo OR cierre'

// Grupo 3: Fuentes oficiales/complementarias
'from:GN_Carreteras OR from:ABORDOMX alerta OR cierre OR bloqueo'
```

Esto se complementa con el query generico que ya existe (robo trailer, bloqueo, etc.)

### 2. Firecrawl: Queries complementarios de menciones web

**Archivo:** `supabase/functions/firecrawl-incident-search/index.ts`

Agregar 2 queries al array `SEARCH_QUERIES`:

```
'"@monitorcarrete1" OR "Monitor Carretero" bloqueo OR cierre carretera Mexico'
'"@jaliscorojo" OR "@mimorelia" bloqueo OR narcobloqueo carretera'
```

Estos buscan noticias y sitios web que citen o embeben tweets de estas cuentas.

### 3. Panel de Estatus de Corredores (inspirado en reporte de inteligencia)

**Archivo nuevo:** `src/components/incidentes/CorridorStatusPanel.tsx`

Componente tipo tabla-semaforo que muestre el estatus operativo de cada corredor principal:

- Columnas: Corredor | Estatus | Incidentes Activos | Tipo | Ultima Actualizacion
- Semaforo por fila:
  - Rojo: Incidentes criticos en ultimas 4h (EVITAR)
  - Amarillo: Incidentes media/alta en ultimas 24h (PRECAUCION)
  - Verde: Sin incidentes recientes (OPERAR NORMAL)
- Cruza incidentes activos con los corredores definidos en `HIGHWAY_CORRIDORS`
- Formato compacto, escaneable en 10 segundos

### 4. Recomendaciones Operativas Automaticas

**Archivo nuevo:** `src/components/incidentes/OperationalRecommendations.tsx`

Panel que genera recomendaciones automaticas basadas en los datos:

- "EVITAR: Corredor Mexico-Guadalajara — 2 bloqueos activos (hace 45 min)"
- "PRECAUCION: Morelia-Lazaro Cardenas — incidente de asalto reportado (3h)"
- "OPERACION NORMAL: Mexico-Queretaro — sin reportes"
- Telefonos de emergencia: 088 (GN), 074 (CAPUFE)
- Fuentes recomendadas: @GN_Carreteras, @monitorcarrete1

La logica construye recomendaciones automaticamente:
- Corredores con incidentes criticos en 4h: genera "EVITAR"
- Corredores con incidentes media en 24h: genera "PRECAUCION"
- Corredores sin incidentes: genera "OPERAR NORMAL"

### 5. Integración en la página

**Archivo:** `src/pages/Incidentes/IncidentesRRSSPage.tsx`

Reorganizar layout para priorizar la informacion de decision:

```text
+-------------------------------------------------------+
| ALERTA ACTIVA (existente)                              |
+-------------------------------------------------------+
| Filtros Operativos (existente)                         |
+-------------------------------------------------------+
| ESTATUS DE CORREDORES (nuevo - tabla semaforo)         |
+---------------------------+---------------------------+
| RECOMENDACIONES CLAVE     | CORREDORES AFECTADOS      |
| (nuevo)                   | (existente)               |
+---------------------------+---------------------------+
| MAPA + STATS (existente)                               |
+-------------------------------------------------------+
| TABLA INCIDENTES (existente)                           |
+-------------------------------------------------------+
```

---

## Detalle tecnico

### Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `src/components/incidentes/CorridorStatusPanel.tsx` | Tabla semaforo con estatus por corredor, cruza incidentes con HIGHWAY_CORRIDORS |
| `src/components/incidentes/OperationalRecommendations.tsx` | Recomendaciones automaticas tipo briefing de inteligencia |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `supabase/functions/apify-data-fetcher/index.ts` | Agregar queries especificos para @monitorcarrete1, @jaliscorojo, @mimorelia, @GN_Carreteras |
| `supabase/functions/firecrawl-incident-search/index.ts` | 2 queries complementarios para menciones web de cuentas Twitter |
| `src/pages/Incidentes/IncidentesRRSSPage.tsx` | Integrar CorridorStatusPanel y OperationalRecommendations en layout |

