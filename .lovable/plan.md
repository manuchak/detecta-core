

# Causa Raíz: Evaluación SIERCP de Alfonso Avalos Barajas no visible en leads

## Diagnóstico

```text
┌─────────────────────────────────────────────────────────────┐
│  SIERCP completado pero no visible en el módulo de leads    │
└──────────────────────────┬──────────────────────────────────┘
                           │
     ┌─────────────────────┼─────────────────────────────┐
     │                     │                             │
┌────┴─────┐        ┌─────┴──────┐               ┌──────┴──────┐
│ INVITACIÓN│       │  RPC INSERT │              │  UI QUERY    │
│ CREADA SIN│       │ candidato_id│              │ .eq(candidato│
│ candidato_│       │ = NULL      │              │ _id, X)      │
│ custodio  │       │ (hereda NULL│              │ nunca matchea│
│ _id       │       │ de invitación)             │ NULL         │
└────┬──────┘       └─────┬──────┘               └──────┬──────┘
     │                    │                             │
  ★ CAUSA               EFECTO 1                    EFECTO 2
  RAÍZ                                           (invisible)
```

### Datos en BD

| Entidad | Valor |
|---|---|
| Lead | `848baf03...` — "ALFONSO AVALOS BARAJAS", estado `aprobado` |
| Invitación | `022fe5b4...` — `candidato_custodio_id = NULL`, status `completed` |
| Evaluación | `a20fb51e...` — score 72, semáforo verde, **`candidato_id = NULL`** |
| Candidato custodio | **No existe** registro en `candidatos_custodios` para este lead |

### Cadena causal

1. **La invitación SIERCP fue creada sin `candidato_custodio_id`** — el lead no tenía un registro vinculado en `candidatos_custodios` al momento de crear la invitación (el campo es opcional en `CreateInvitationData`).

2. **El RPC `complete_siercp_assessment`** inserta en `evaluaciones_psicometricas` usando `v_invitation.candidato_custodio_id` como `candidato_id`. Como era NULL, la evaluación se guardó con `candidato_id = NULL`.

3. **El hook `useEvaluacionesPsicometricas`** filtra por `.eq('candidato_id', candidatoId)`. Una evaluación con `candidato_id = NULL` nunca es retornada por ningún query, quedando huérfana e invisible.

## Corrección

### 1. Migración SQL — Vincular la evaluación huérfana (fix inmediato)

Actualizar el `candidato_id` de la evaluación existente. Como no hay registro en `candidatos_custodios`, hay dos opciones:
- **Opción A**: Crear el registro en `candidatos_custodios` y vincular.
- **Opción B**: Hacer que el RPC y la UI soporten buscar evaluaciones por `lead_id` además de `candidato_id`.

**Recomendación: Opción B** — es más resiliente porque no todos los leads tienen candidato_custodio al momento de la evaluación.

### 2. Modificar la tabla `evaluaciones_psicometricas` — Agregar columna `lead_id`

```sql
ALTER TABLE evaluaciones_psicometricas ADD COLUMN lead_id text;
```

### 3. Modificar RPC `complete_siercp_assessment`

Además de `candidato_id`, guardar `lead_id` desde la invitación:

```sql
INSERT INTO evaluaciones_psicometricas (
  candidato_id, lead_id, ...
) VALUES (
  v_invitation.candidato_custodio_id,
  v_invitation.lead_id,
  ...
);
```

### 4. Retroactive patch — Vincular evaluaciones huérfanas existentes

```sql
UPDATE evaluaciones_psicometricas ep
SET lead_id = si.lead_id
FROM siercp_invitations si
WHERE si.evaluacion_id = ep.id
  AND ep.lead_id IS NULL;
```

### 5. Modificar hook `useEvaluacionesPsicometricas`

Agregar fallback: si no se encuentra por `candidato_id`, buscar por `lead_id`:

```typescript
// En useEvaluacionesPsicometricas y useLatestEvaluacionPsicometrica
// Cambiar el query para usar OR logic via .or()
.or(`candidato_id.eq.${candidatoId},lead_id.eq.${leadId}`)
```

Alternativamente, crear un hook separado `useEvaluacionesByLeadId` que el componente de leads use cuando no hay `candidato_custodio_id`.

### Archivos impactados

| Archivo | Cambio |
|---|---|
| Nueva migración SQL | Agregar columna `lead_id`, patch retroactivo, actualizar RPC |
| `src/hooks/useEvaluacionesPsicometricas.ts` | Soporte para buscar por `lead_id` como fallback |
| `src/components/recruitment/psychometrics/PsychometricEvaluationTab.tsx` | Pasar `leadId` además de `candidatoId` |

