
## Fix: Evaluaciones SIERCP externas no se guardan en la base de datos

### Problema raiz

Cuando un candidato externo (LUIS ANDRES FLORES CANO) completa la evaluacion SIERCP via link de invitacion, la pagina muestra "Evaluacion Completada" pero **los datos nunca se guardan**. La tabla `evaluaciones_psicometricas` esta completamente vacia.

### Causa tecnica

El candidato accede sin autenticacion (rol `anon` de Supabase). El flujo actual hace:

```text
INSERT INTO evaluaciones_psicometricas ... 
  -> .select().single()  // Requiere SELECT policy
  -> FALLA: no hay SELECT policy para anon
  -> PostgREST hace ROLLBACK del INSERT completo
  -> evaluacion = null, insertError = error
  -> linkEvaluation() nunca se ejecuta
  -> setIsCompleted(true) muestra pantalla de exito FALSA
```

Las politicas RLS actuales de `evaluaciones_psicometricas`:
- **INSERT (anon)**: Existe y permite insertar cuando `candidato_id IS NULL`
- **SELECT**: Solo para roles admin/supply/coordinador - **NO existe para anon**
- Resultado: el `INSERT ... RETURNING *` se revierte porque anon no puede leer el registro insertado

### Solucion propuesta: RPC SECURITY DEFINER

Crear una funcion RPC `complete_siercp_assessment` que ejecute todo el flujo en una sola transaccion con privilegios elevados, eliminando los problemas de RLS para el usuario anonimo.

**Paso 1: Nueva migracion SQL** - Crear RPC `complete_siercp_assessment`

La funcion recibe el token y los scores, y ejecuta:
1. Valida que el token sea valido (no expirado, no completado, no cancelado)
2. Inserta el registro en `evaluaciones_psicometricas`
3. Actualiza `siercp_invitations` con `status = 'completed'`, `completed_at`, y `evaluacion_id`
4. Retorna el ID de la evaluacion creada

Atributos clave:
- `SECURITY DEFINER` para ejecutar con privilegios del owner
- Validacion interna del token para seguridad
- Transaccional: si algo falla, todo se revierte

```sql
CREATE OR REPLACE FUNCTION complete_siercp_assessment(
  p_token UUID,
  p_score_integridad NUMERIC,
  p_score_psicopatia NUMERIC,
  p_score_violencia NUMERIC,
  p_score_agresividad NUMERIC,
  p_score_afrontamiento NUMERIC,
  p_score_veracidad NUMERIC,
  p_score_entrevista NUMERIC,
  p_score_global NUMERIC,
  p_resultado_semaforo TEXT,
  p_interpretacion TEXT
) RETURNS UUID ...
```

**Paso 2: Modificar `SIERCPAssessmentPage.tsx`** - Usar la RPC

Reemplazar el flujo actual de insert + linkEvaluation + updateStatus por una sola llamada RPC:

```typescript
// ANTES (3 operaciones separadas que fallan):
const { data: evaluacion, error } = await supabase
  .from('evaluaciones_psicometricas')
  .insert(evaluacionData)
  .select().single();
await linkEvaluation(evaluacion.id);
await updateStatus('completed');

// DESPUES (1 llamada RPC atomica):
const { data: evaluacionId, error } = await supabase
  .rpc('complete_siercp_assessment', {
    p_token: token,
    p_score_integridad: results.integridad,
    // ... demas scores
  });
```

**Paso 3: Manejo de errores mejorado**

- Solo mostrar "Evaluacion Completada" si la RPC fue exitosa
- Si hay error, mostrar mensaje claro y NO marcar como completada
- Evitar el escenario actual donde el candidato ve exito pero nada se guardo

### Archivos a crear/modificar

1. **Nueva migracion SQL** - RPC `complete_siercp_assessment` con SECURITY DEFINER
2. **`src/pages/assessment/SIERCPAssessmentPage.tsx`** - Reemplazar handleComplete para usar la RPC
3. **`src/integrations/supabase/types.ts`** - Actualizar tipos (automatico con la migracion)

### Impacto

- La evaluacion de FLORES CANO (y futuros candidatos) se guardara correctamente
- La invitacion se marcara como "completed" con su `evaluacion_id` vinculado
- Los resultados apareceran en el dashboard de SIERCPResultsPanel bajo la tab "Invitaciones Candidatos"
- FLORES CANO necesitara retomar la evaluacion una vez aplicado el fix (ya que sus respuestas no se guardaron)

### Sobre FLORES CANO

Despues de aplicar el fix, sera necesario:
- Resetear su invitacion a estado `sent` para que pueda retomar el examen
- O crear una nueva invitacion desde su perfil de candidato
