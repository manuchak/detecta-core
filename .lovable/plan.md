

# Analisis Fishbone: Evaluacion genera resultado A, luego muestra resultado B

## Diagrama Ishikawa (Causa-Efecto)

```text
                                    EFECTO
                                    ======
                    Evaluacion muestra resultado A al completar,
                     pero resultado B al revisarlo despues
                                      |
   ================================== | ==================================
   |                |                 |              |                   |
   |                |                 |              |                   |
 LOGICA           DATOS            TRIGGER         UI/DISPLAY        CACHE
 DUPLICADA        INCONSIST.       SOBREESCRIBE   DESINCRONIZADO    STALE
   |                |                 |              |                   |
   |                |                 |              |                   |
 3 funciones      "amarillo"       DB trigger      SemaforoBadge     React Query
 con umbrales     vs "ambar"       usa 70/50       solo acepta       staleTime
 distintos        (enum diff)      y SIEMPRE       verde/ambar/rojo  puede servir
                                   gana                              datos viejos
```

## CAUSA RAIZ #1 (CRITICA): Tres sistemas de semaforo con umbrales DIFERENTES

Existen **3 funciones independientes** que calculan el semaforo, cada una con umbrales distintos:

| Ubicacion | Umbrales | Valores posibles |
|---|---|---|
| **DB Trigger** `calculate_semaforo_psicometrico()` | >=70 verde, >=50 ambar, <50 rojo | verde, ambar, rojo |
| **Frontend Assessment** `getResultadoSemaforo()` en SIERCPAssessmentPage.tsx:149 | >=88 verde, >=75 amarillo, >=60 naranja, <60 rojo | verde, **amarillo**, **naranja**, rojo |
| **Frontend Manual** `ApplySIERCPDialog.tsx:50` | >=70 verde, >=50 ambar, <50 rojo | verde, ambar, rojo |

### Escenario de fallo concreto:

1. Candidato completa SIERCP con score 72
2. `SIERCPAssessmentPage` calcula `getResultadoSemaforo(72)` = **"amarillo"**
3. RPC `complete_siercp_assessment` envia `p_resultado_semaforo = 'amarillo'` a la DB
4. **Pero** el trigger `trg_calculate_semaforo` es `BEFORE INSERT` y **sobreescribe** con su logica: score 72 >= 70 = **"verde"**
5. DB almacena `resultado_semaforo = 'verde'`
6. Cuando el reclutador revisa, ve **verde** (no "amarillo" como vio el candidato)

El trigger siempre gana, asi que los datos en DB son consistentes con la escala 70/50. **Pero** si por algun motivo el trigger se desactivo o fallo, la DB guardaria "amarillo" -- un valor que `SemaforoBadge` NO reconoce (solo acepta 'verde'|'ambar'|'rojo'), y mostraria `null` (nada).

## CAUSA RAIZ #2 (ALTA): Valores de enum incompatibles

El frontend del assessment usa **"amarillo"** y **"naranja"**, pero:
- El trigger DB solo genera: `verde`, `ambar`, `rojo`
- `SemaforoBadge` solo acepta: `verde`, `ambar`, `rojo`
- El tipo TypeScript `EvaluacionPsicometrica.resultado_semaforo` es: `'verde' | 'ambar' | 'rojo'`

Si el trigger alguna vez NO se ejecuta (por ejemplo en un `UPDATE` que no toque `score_global`), el valor "amarillo" o "naranja" del RPC quedaria persistido y seria **invisible** en la UI de revision.

## CAUSA RAIZ #3 (MEDIA): La RPC pasa un semaforo que sera ignorado

El RPC `complete_siercp_assessment` acepta `p_resultado_semaforo` como parametro y lo inserta en la tabla. Pero el trigger `BEFORE INSERT` lo sobreescribe **siempre**. Esto significa:
- El parametro `p_resultado_semaforo` es codigo muerto / engano
- Da falsa confianza de que el frontend controla el resultado

## CAUSA RAIZ #4 (MEDIA): useSIERCP.ts usa escala clinica diferente para clasificacion

En `useSIERCP.ts:386-398`, `getClassification()` y `getRecommendation()` usan la escala 88/75/60 (clinica/ROC). Esto alimenta el reporte AI. Si un candidato tiene score 72:
- Clasificacion clinica: "Riesgo bajo" (75 > 72 >= 60 = "Riesgo moderado" en realidad)
- Semaforo operativo DB: "verde" (72 >= 70)
- El reporte AI dice "Riesgo moderado" pero el badge dice "Verde/Aprobado"

---

## Plan de Correccion

### Fix 1: Eliminar calculo de semaforo del frontend de Assessment

**Archivo**: `src/pages/assessment/SIERCPAssessmentPage.tsx`

- Eliminar la funcion `getResultadoSemaforo()` (lineas 149-154)
- Pasar un valor placeholder al RPC (ej: `'pendiente'`) ya que el trigger lo sobreescribira de todos modos
- Esto elimina la fuente de inconsistencia

### Fix 2: Hacer que la RPC NO acepte resultado_semaforo

**Migracion SQL**: Modificar la funcion `complete_siercp_assessment` para que **no reciba** `p_resultado_semaforo` y en su lugar pase un valor dummy que el trigger sobreescribira. Alternativa: simplemente remover el parametro y que el INSERT ponga 'verde' como placeholder (el trigger siempre corrige).

### Fix 3: Unificar la escala de clasificacion clinica

**Archivo**: `src/hooks/useSIERCP.ts`

- Alinear `getClassification()` y `getRecommendation()` con los umbrales operativos: 70/50
- O documentar explicitamente que la escala clinica (88/75/60) es diferente del semaforo operativo (70/50) y mostrar ambas

### Fix 4: Agregar validacion de enum en SemaforoBadge

**Archivo**: `src/components/recruitment/psychometrics/SemaforoBadge.tsx`

- Si `resultado` no es 'verde'|'ambar'|'rojo', mostrar un badge de warning con el valor raw para que el bug sea visible en lugar de silencioso

### Fix 5: Limpiar datos historicos inconsistentes (si existen)

**Migracion SQL**: Query de auditoria para encontrar registros con `resultado_semaforo` fuera del enum esperado y corregirlos.

---

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/pages/assessment/SIERCPAssessmentPage.tsx` | Eliminar `getResultadoSemaforo()`, pasar placeholder al RPC |
| Migracion SQL | Actualizar RPC para no depender de parametro semaforo del frontend |
| `src/hooks/useSIERCP.ts` | Alinear clasificaciones con umbrales operativos 70/50 |
| `src/components/recruitment/psychometrics/SemaforoBadge.tsx` | Fallback visual para valores inesperados |

## Resultado esperado

- **Una sola fuente de verdad** para el semaforo: el trigger de DB con umbrales 70/50
- El frontend NUNCA calcula el semaforo para persistirlo -- solo lo lee de la DB
- Valores incompatibles ("amarillo", "naranja") eliminados del flujo
- Clasificacion clinica alineada o explicitamente separada del semaforo operativo

