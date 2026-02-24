

# Enriquecer palabras clave de busqueda en Twitter y agregar UI de gestion

## Situacion actual

La Edge Function `twitter-incident-search` tiene solo **3 queries hardcodeadas**:
- `robo trailer OR robo carga`
- `bloqueo carretera OR narcobloqueo`
- `asalto transportista OR secuestro operador`

Esto es insuficiente para el modelo de negocio de seguridad en corredores carreteros. Ademas, no existe forma de agregar o modificar palabras clave desde la interfaz.

---

## Cambios propuestos

### 1. Nueva tabla `twitter_search_keywords`

Crear una tabla en Supabase para almacenar palabras clave configurables:

| Columna | Tipo | Descripcion |
|---|---|---|
| id | uuid PK | Identificador |
| query_text | text NOT NULL | Frase de busqueda (ej: "robo trailer OR robo carga") |
| categoria | text | Categoria tematica (robo_carga, bloqueos, violencia_vial, etc.) |
| activa | boolean DEFAULT true | Si se incluye en las busquedas |
| es_predeterminada | boolean DEFAULT false | Si es una keyword del sistema (no eliminable) |
| notas | text | Descripcion de que busca esta keyword |
| created_at | timestamptz | Fecha de creacion |

### 2. Semillas: Keywords enriquecidas para el modelo de negocio

Insertar las siguientes frases de busqueda predeterminadas organizadas por categoria:

**Robo de carga y vehiculos**
- `robo trailer OR robo carga -is:retweet lang:es`
- `robo tractocamion OR robo contenedor -is:retweet lang:es`
- `pirataje carretero OR robo autopista carga -is:retweet lang:es`

**Bloqueos y narcobloqueos**
- `bloqueo carretera OR narcobloqueo -is:retweet lang:es`
- `bloqueo autopista OR cierre carretero -is:retweet lang:es`
- `quema vehiculos carretera OR ponchallanta -is:retweet lang:es`

**Violencia contra operadores**
- `asalto transportista OR secuestro operador -is:retweet lang:es`
- `balacera carretera OR emboscada autopista -is:retweet lang:es`
- `extorsion transportista OR cobro piso carretera -is:retweet lang:es`

**Accidentes e infraestructura**
- `volcadura trailer OR accidente carretera -is:retweet lang:es`
- `derrumbe carretera OR puente colapsado -is:retweet lang:es`
- `derrame toxico carretera OR incendio autopista -is:retweet lang:es`

**Inhibidores y tecnologia criminal**
- `inhibidor senal GPS OR jammer camion -is:retweet lang:es`

### 3. UI de gestion de palabras clave

Agregar una nueva seccion en `TwitterAccountsManager.tsx` (debajo de Cuentas Monitoreadas) con:

- Card "Palabras Clave de Busqueda" con tabla que muestra las keywords activas
- Cada fila muestra: query, categoria (badge de color), switch activa/inactiva, boton eliminar
- Las keywords predeterminadas (`es_predeterminada = true`) no se pueden eliminar, solo desactivar
- Formulario para agregar nuevas keywords con campos: query_text, categoria (select), notas
- Indicador del total de queries activas (importante para el consumo de API)

### 4. Actualizar Edge Function

Modificar `twitter-incident-search/index.ts` para:
- Leer keywords activas de la tabla `twitter_search_keywords` en lugar del array hardcodeado `KEYWORD_QUERIES`
- Mantener un fallback minimo si la tabla esta vacia (las 3 queries originales)

### 5. Hook de datos

Crear funciones en `useTwitterConfig.ts`:
- `useTwitterKeywords()` - leer keywords
- `useAddTwitterKeyword()` - agregar
- `useToggleTwitterKeyword()` - activar/desactivar
- `useDeleteTwitterKeyword()` - eliminar (solo no predeterminadas)

---

## Archivos a crear/modificar

| Archivo | Cambio |
|---|---|
| **Migration SQL** | Crear tabla `twitter_search_keywords` con RLS + insertar semillas |
| `src/hooks/useTwitterConfig.ts` | Agregar hooks para CRUD de keywords |
| `src/components/settings/TwitterAccountsManager.tsx` | Agregar seccion de gestion de keywords |
| `supabase/functions/twitter-incident-search/index.ts` | Leer keywords de DB en vez de array hardcodeado |

---

## Nota sobre consumo de API

Cada keyword genera una query a la API de Twitter. Con 13 keywords predeterminadas + cuentas monitoreadas, se ejecutaran ~15-18 queries por ciclo. A 25 tweets/query, esto consume ~375-450 tweets del limite mensual de 10,000 por ejecucion. Con el cron cada 3 horas (8 ejecuciones/dia), el consumo estimado seria ~3,000-3,600 tweets/dia. Se agregara una nota de advertencia en la UI cuando haya muchas keywords activas.

