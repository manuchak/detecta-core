

# Fishbone Analysis: Fallas en Guardado de Evaluaciones Psicométricas

## Error Reportado

```
insert or update on table "evaluaciones_psicometricas" violates foreign key constraint
"evaluaciones_psicometricas_evaluador_id_fkey"
```

---

## Diagrama Fishbone

```text
                                    ┌─────────────────────────────────┐
                                    │  FK VIOLATION al guardar eval   │
                                    └────────────────┬────────────────┘
                                                     │
         ┌───────────────────┬───────────────────┬───┴───┬───────────────────┬──────────────────┐
         │                   │                   │       │                   │                  │
    ┌────┴────┐       ┌──────┴──────┐     ┌──────┴─────┐ │            ┌──────┴──────┐    ┌──────┴──────┐
    │  RPC    │       │  Schema /   │     │  Datos     │ │            │  Frontend   │    │  RLS /      │
    │  Logic  │       │  FK Design  │     │  Integridad│ │            │  Hook       │    │  Permisos   │
    └────┬────┘       └──────┬──────┘     └──────┬─────┘ │            └──────┬──────┘    └──────┬──────┘
         │                   │                   │       │                   │                  │
    ▼ evaluador_id     ▼ evaluador_id      ▼ 13 invit.  │            ▼ user.id como   ▼ anon puede
      se setea como      → profiles(id)     activas sin  │              evaluador_id     insertar pero
      candidato_           FK rígido        profile       │              (correcto solo   no tiene profile
      custodio_id                           asociado     │              para internos)
                     ▼ candidato_id                      │
                       → candidatos_                     │
                       custodios(id)              ┌──────┴──────┐
                       (OK)                       │  Trigger    │
                                                  │  Semáforo   │
                                                  └──────┬──────┘
                                                         │
                                                  ▼ Sin problemas
                                                    (70/50 thresholds)
```

---

## Rama 1: RPC `complete_siercp_assessment` — CAUSA RAÍZ PRINCIPAL

El RPC inserta:
```sql
evaluador_id = v_invitation.candidato_custodio_id
```

El `candidato_custodio_id` es un UUID de la tabla `candidatos_custodios`, **NO** de `profiles`. Pero la FK exige:
```sql
FOREIGN KEY (evaluador_id) REFERENCES profiles(id)
```

Los candidatos externos **no tienen registro en `profiles`** (solo los usuarios internos con cuenta auth lo tienen). De las 13 invitaciones activas, **ninguna tiene un profile asociado**.

Resultado: cada vez que un candidato externo completa la prueba SIERCP, el INSERT falla con el error de FK.

## Rama 2: Schema / FK Design

- `candidato_id → candidatos_custodios(id)` — correcto, los candidatos existen en esa tabla
- `evaluador_id → profiles(id)` — incorrecto para el flujo externo. Un candidato externo no es un "evaluador" con perfil de usuario
- `aval_coordinacion_id → profiles(id)` — correcto, siempre es un usuario interno

## Rama 3: Datos / Integridad

- 13 invitaciones activas (started/pending) donde `candidato_custodio_id` NO existe en `profiles`
- Las evaluaciones que SÍ se guardaron exitosamente corresponden a candidatos que coincidentemente tenían un registro en profiles (ej: admins haciendo pruebas)

## Rama 4: Frontend Hook (`useCreateEvaluacionPsicometrica`)

- Usa `evaluador_id: user.id` — correcto para creación manual por usuario interno
- No afecta el flujo externo (que usa el RPC)

## Rama 5: RLS / Permisos

- Política `anon_insert_siercp_evaluation` permite INSERT anónimo si hay invitación válida — correcto
- El error NO es de RLS, es de FK constraint — la política pasa pero el constraint de la base falla

## Rama 6: Trigger Semáforo

- `calculate_semaforo_psicometrico` funciona correctamente con umbrales 70/50
- No contribuye al error

---

## Solución

### Cambio en DB: Hacer `evaluador_id` nullable y eliminar/relajar la FK

`evaluador_id` debe ser **nullable** para evaluaciones auto-completadas por candidatos externos (donde no hay "evaluador" humano interno).

**Migración SQL:**
```sql
-- Hacer evaluador_id nullable (ya lo es en el schema)
-- Eliminar FK rígida a profiles
ALTER TABLE evaluaciones_psicometricas 
  DROP CONSTRAINT evaluaciones_psicometricas_evaluador_id_fkey;

-- Re-crear con ON DELETE SET NULL para evaluadores internos
ALTER TABLE evaluaciones_psicometricas 
  ADD CONSTRAINT evaluaciones_psicometricas_evaluador_id_fkey 
  FOREIGN KEY (evaluador_id) REFERENCES profiles(id) ON DELETE SET NULL;
```

### Cambio en RPC: Setear `evaluador_id` como NULL para externos

```sql
-- En complete_siercp_assessment, cambiar:
evaluador_id = v_invitation.candidato_custodio_id
-- Por:
evaluador_id = NULL
```

Un candidato externo completando su propia prueba no es un "evaluador". El evaluador es NULL (auto-evaluación).

### Cambio en Frontend: Manejo de evaluador NULL en UI

En los componentes que muestran `evaluador.display_name`, agregar fallback para cuando `evaluador` es null:
- Mostrar "Auto-evaluación" o el nombre del candidato en su lugar

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| DB Migration | Drop + recrear FK con ON DELETE SET NULL; actualizar RPC |
| `src/hooks/useEvaluacionesPsicometricas.ts` | Sin cambios necesarios (ya maneja nullable) |
| Componentes de visualización | Fallback para evaluador null |

