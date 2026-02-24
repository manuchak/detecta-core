

# Gestion de Cuentas Twitter/X y Monitoreo de Consumo API

## Resumen

Crear una tabla `twitter_monitored_accounts` para gestionar cuentas de X.com a monitorear, un panel UI en Settings para administrarlas, y un tracker de consumo de la API para controlar costos. La Edge Function `twitter-incident-search` leera las cuentas de la tabla en lugar de tenerlas hardcodeadas.

---

## Fase 1: Tabla de Cuentas Monitoreadas

**Nueva tabla: `twitter_monitored_accounts`**

```text
- id uuid PK DEFAULT gen_random_uuid()
- username text NOT NULL UNIQUE (sin @, ej: "GN_Carreteras")
- display_name text (nombre legible)
- categoria: 'gobierno' | 'periodismo' | 'monitoreo' | 'seguridad' | 'otro'
- activa boolean DEFAULT true
- notas text
- agregada_por uuid FK -> auth.users
- created_at timestamptz DEFAULT now()
```

**Nueva tabla: `twitter_api_usage`**

```text
- id uuid PK DEFAULT gen_random_uuid()
- fecha date NOT NULL
- tweets_leidos int DEFAULT 0
- queries_ejecutadas int DEFAULT 0
- tweets_insertados int DEFAULT 0
- tweets_duplicados int DEFAULT 0
- rate_limited boolean DEFAULT false
- created_at timestamptz DEFAULT now()
```

**Seed inicial** con las cuentas mencionadas previamente:
- GN_Carreteras (Guardia Nacional Carreteras) - gobierno
- monitorcarrete1 (Monitor de Carreteras) - monitoreo
- jaliscorojo (Jalisco Rojo) - periodismo
- mimorelia (Mi Morelia) - periodismo

---

## Fase 2: Panel de Gestion en Settings

**Nuevo componente: `src/components/settings/TwitterAccountsManager.tsx`**

Ubicado en la tab "Inteligencia Artificial" o como nueva tab "Twitter/X" en Settings.

Funcionalidad:
- Lista de cuentas monitoreadas con toggle activa/inactiva
- Formulario para agregar nuevas cuentas (username + categoria + notas)
- Boton eliminar cuenta
- Indicador de categoria con badge de color
- Boton "Ejecutar busqueda ahora" que invoca `twitter-incident-search`
- Panel de estadisticas de consumo mensual:
  - Tweets leidos este mes / limite (10,000 Basic)
  - Barra de progreso visual
  - Costo estimado proporcional
  - Historial diario de consumo en tabla

---

## Fase 3: Actualizar Edge Function

**Modificar `supabase/functions/twitter-incident-search/index.ts`:**

En lugar de los queries hardcodeados en `SEARCH_QUERIES`, la funcion:
1. Consulta `twitter_monitored_accounts` donde `activa = true`
2. Construye el query `from:` dinamicamente con las cuentas activas
3. Mantiene los queries de keywords (robo, bloqueo, asalto) como estan
4. Al finalizar, inserta un registro en `twitter_api_usage` con las estadisticas de la ejecucion

---

## Fase 4: Integracion en Settings

**Modificar `src/pages/Settings/Settings.tsx`:**
- Agregar nueva tab "Twitter/X" con icono de X
- Renderizar `TwitterAccountsManager`

---

## Archivos a crear/modificar

| Archivo | Accion |
|---|---|
| Migracion SQL | Tablas `twitter_monitored_accounts`, `twitter_api_usage`, seed de cuentas iniciales |
| `src/components/settings/TwitterAccountsManager.tsx` | NUEVO: UI completa de gestion |
| `src/hooks/useTwitterConfig.ts` | NUEVO: hooks para CRUD cuentas y lectura de usage |
| `supabase/functions/twitter-incident-search/index.ts` | Leer cuentas de BD + registrar usage |
| `src/pages/Settings/Settings.tsx` | Agregar tab Twitter/X |

## Detalle tecnico: Calculo de costos

- Basic tier: $200/mes por 10,000 tweets
- Costo por tweet: $0.02
- El panel mostrara: `tweets_leidos_mes * $0.02` como costo estimado
- Alerta visual cuando el consumo supere 80% del limite mensual

