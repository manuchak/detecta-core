

## Modulo de Configuracion CS - Health Score y Funnel de Fidelidad

### Enfoque: Tabla de configuracion con fallback a valores actuales

La estrategia clave para no romper nada es usar una tabla `cs_config` con pares clave-valor JSON. Los hooks y la edge function leeran la config al inicio; si no existe, usan los valores hardcoded actuales como fallback. Asi el sistema funciona identico hasta que el admin decida cambiar algo.

---

### 1. Tabla `cs_config`

Estructura simple y flexible:

```text
cs_config
---------
id          uuid PK
categoria   text  ('health_score' | 'loyalty_funnel' | 'sla' | ...)
config      jsonb (los parametros)
updated_at  timestamptz
updated_by  uuid FK profiles
```

Un solo registro por categoria. Ejemplo del JSON para `health_score`:

```text
{
  "penalizaciones": {
    "quejas_2_mas": 30,
    "quejas_1": 15,
    "sin_contacto_60d": 25,
    "sin_contacto_30d": 10,
    "sin_servicios_90d": 20,
    "csat_bajo_3": 15,
    "csat_bajo_4": 5
  },
  "umbrales_churn": {
    "alto": 40,
    "medio": 70
  }
}
```

Y para `loyalty_funnel`:

```text
{
  "en_riesgo": {
    "quejas_minimas": 2,
    "dias_inactividad": 60,
    "servicios_90d_minimo": 0
  },
  "embajador": {
    "meses_minimos": 6,
    "csat_minimo": 4.5,
    "dias_contacto_maximo": 30
  },
  "promotor": {
    "meses_minimos": 6,
    "csat_minimo": 4.5,
    "dias_contacto_maximo": 30
  },
  "leal": {
    "meses_minimos": 6,
    "dias_contacto_maximo": 30
  },
  "nuevo": {
    "meses_maximo": 2
  }
}
```

---

### 2. Hook `useCSConfig.ts`

- Lee la config de `cs_config` por categoria
- Exporta funciones `getHealthConfig()` y `getLoyaltyConfig()` con fallback a los valores hardcoded actuales
- Mutation para guardar cambios (upsert por categoria)
- Cache con React Query (`staleTime: 5min`)

---

### 3. Integracion sin romper nada

**En `useCSLoyaltyFunnel.ts`:**
- Llamar `useCSConfig('loyalty_funnel')` al inicio
- La funcion `calculateStage()` recibe la config como parametro en vez de usar constantes
- Si la config es `null` (no existe en BD), usa los mismos valores hardcoded actuales

**En `cs-health-snapshot/index.ts` (Edge Function):**
- Al inicio, leer `cs_config` donde `categoria = 'health_score'`
- Si no hay registro, usar los valores actuales
- Pasar la config al calculo del score

**En `useCSCartera.ts` y `useCSAlerts.ts`:**
- Los que usan umbrales de riesgo o dias, tambien pueden leer la config, pero con fallback

---

### 4. UI de Configuracion

Nuevo componente `CSConfigPanel.tsx` accesible desde un boton de engranaje en la pagina principal de CS (solo visible para admins).

La interfaz tendra dos secciones con formularios:

**Seccion Health Score:**
- Inputs numericos para cada penalizacion (ej: "Quejas >= 2: -30 pts")
- Inputs para umbrales de churn (alto/medio)
- Preview en tiempo real del impacto: "Con esta config, X clientes serian riesgo alto"

**Seccion Funnel de Fidelidad:**
- Por cada etapa, inputs para sus criterios (meses, CSAT minimo, dias contacto)
- Preview: "Con esta config, la distribucion seria: 5 nuevos, 40 activos, ..."

**Boton Guardar** con confirmacion y toast de exito.

---

### 5. Archivos a crear/modificar

| Archivo | Accion |
|---------|--------|
| Migracion SQL | Crear tabla `cs_config` con RLS |
| `src/hooks/useCSConfig.ts` | Nuevo hook de lectura/escritura |
| `src/pages/CustomerSuccess/components/CSConfigPanel.tsx` | Nueva UI de configuracion |
| `src/pages/CustomerSuccess/CustomerSuccessPage.tsx` | Boton engranaje para abrir config |
| `src/hooks/useCSLoyaltyFunnel.ts` | Leer config con fallback |
| `supabase/functions/cs-health-snapshot/index.ts` | Leer config con fallback |
| `src/hooks/useCSAlerts.ts` | Leer config de umbrales con fallback |

### 6. Seguridad

- RLS: solo usuarios autenticados pueden leer; solo roles admin pueden escribir (o se valida en el frontend con el perfil del usuario)
- La edge function usa service role key, asi que lee sin restriccion

