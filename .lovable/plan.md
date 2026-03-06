

# Plan de Corrección: 5 Bugs LMS (UAT Lupita Ruedas)

## Resumen de Bugs Interconectados

Los 5 bugs reportados afectan el flujo completo de capacitación: desde la creación de contenido (admin) hasta la experiencia del alumno y la emisión de certificados. No son problemas aislados — son fallas en diferentes puntos de un pipeline secuencial.

```text
FLUJO DEL ALUMNO:
  Contenido A (Mod 1) → Contenido B (Mod 1) → Contenido C (Mod 2) → Quiz → Certificado
       ↑ BUG 1              ↑ BUG 2                                  ↑ BUG 3    ↑ BUG 4
  (auto-complete)       (sin candado)                            (intentos ∞)  (título/fecha)

FLUJO DEL ADMIN:
  Crear Módulo → Agregar Contenido → Seleccionar Tipo
                      ↑ BUG 5
                 (dropdown descuadrado)
```

---

## Bug 1: Embed y Texto Enriquecido se auto-completan

**Causa raíz:** `EmbedRenderer.tsx` tiene un `setTimeout` de 5 segundos que llama `onComplete()` automáticamente. En `CursoViewer.tsx`, `onComplete` dispara `handleComplete` que a su vez invoca `marcarCompletado.mutate()`. El contenido se marca como completado sin que el usuario lo haya consumido.

Para `TextoEnriquecidoViewer.tsx`, el problema es diferente pero relacionado: tiene un botón "He terminado de leer" que sí es manual, pero TAMBIÉN `CursoViewer.tsx` muestra un segundo botón "Marcar como completado" (línea 295-304) para tipos `documento`, `embed`, `texto_enriquecido`. Hay duplicación de mecanismo de completado.

**Archivos a modificar:**
- `src/components/lms/EmbedRenderer.tsx`: Eliminar el `useEffect` con `setTimeout` de 5 segundos. Reemplazar con un botón manual "He terminado de ver" similar al de `TextoEnriquecidoViewer`.
- `src/pages/LMS/CursoViewer.tsx`: Ajustar la lógica en líneas 295-305 para no mostrar el botón duplicado cuando el componente hijo ya tiene su propio botón de completado (embed y texto_enriquecido). Mantenerlo solo para `documento`.

---

## Bug 2: Sin candado de avance secuencial

**Causa raíz:** `CursoViewer.tsx` permite navegar libremente entre contenidos. Los botones "Anterior"/"Siguiente" (líneas 308-329) no tienen restricciones. El sidebar (`ModuleSidebar.tsx`) permite clic en cualquier contenido sin verificar si el anterior está completado (línea 130-132, `onClick` sin condición).

**Archivos a modificar:**
- `src/pages/LMS/CursoViewer.tsx`:
  - Agregar función `isContenidoDesbloqueado(contenidoId)` que verifica si todos los contenidos obligatorios anteriores (en orden global) están completados.
  - Deshabilitar botón "Siguiente" si el contenido actual obligatorio no está completado.
  - Interceptar `setContenidoActualId` para validar que el contenido destino esté desbloqueado.
- `src/components/lms/ModuleSidebar.tsx`:
  - Recibir nueva prop `isDesbloqueado: (contenidoId: string) => boolean`.
  - Aplicar `disabled` visual (opacidad, cursor, candado icon) a contenidos bloqueados.
  - Prevenir `onClick` en contenidos no desbloqueados.

**Lógica de desbloqueo:**
```text
Para contenido en posición N:
  - Si N === 0 → siempre desbloqueado
  - Si contenido[N-1].es_obligatorio === false → mirar más atrás hasta encontrar uno obligatorio
  - Si contenido[N-1].es_obligatorio === true → debe estar completado en progresos[]
  - Contenidos opcionales siempre están desbloqueados si el anterior obligatorio está completado
```

---

## Bug 3: Intentos infinitos en quiz (ignora configuración)

**Causa raíz:** La función `puedeReintentar()` en `useLMSQuiz.ts` (línea 189-194) tiene la lógica correcta: `if (intentosPermitidos === 0) return true` — 0 significa ilimitados. PERO el problema está en cómo se lee `progresoActual` en `CursoViewer.tsx`.

En `CursoViewer.tsx` línea 209-213, se construye `progresoQuiz` desde `progresos[]`, pero el campo `quiz_intentos` se pasa como `progresoContenido.quiz_intentos ?? undefined`. Si el registro de progreso no existe aún, `progresoQuiz` es `undefined`, lo cual hace que `QuizComponent` use `intentosUsados = 0`.

**El bug real:** Cuando el quiz se guarda vía `useLMSGuardarQuiz` (línea 139), se hace `quiz_intentos: intentosActuales + 1`. Pero `lms_marcar_contenido_completado` (la función SQL, líneas 534-544 del migration) hace un `ON CONFLICT DO UPDATE SET ... quiz_intentos = COALESCE(EXCLUDED.quiz_intentos, lms_progreso.quiz_intentos)`. Si `handleComplete` se llama después de aprobar el quiz (línea 99 de QuizComponent), esto podría sobrescribir `quiz_intentos` con 0 (el default del EXCLUDED).

**Archivos a modificar:**
- `src/pages/LMS/CursoViewer.tsx`: En `handleComplete`, NO llamar `lms_marcar_contenido_completado` para quizzes. El quiz ya se marca como completado dentro de `useLMSGuardarQuiz`. Actualmente, cuando el quiz se aprueba, `onComplete()` se llama (línea 99 de QuizComponent), lo cual dispara `handleComplete` en CursoViewer, que llama `lms_marcar_contenido_completado` — esta segunda llamada sobrescribe `quiz_intentos` con 0.
- `src/components/lms/ContentRenderer.tsx`: Para tipo `quiz`, no pasar `onComplete` al QuizComponent directamente. En su lugar, usar un callback que solo avance al siguiente contenido sin re-llamar a marcar completado.

**Verificación adicional:** Confirmar que `quizData.intentos_permitidos` se está leyendo correctamente del campo `contenido.contenido.intentos_permitidos` (línea 43 de QuizComponent). Si el admin configuró 3 intentos, ese valor debe llegar intacto.

---

## Bug 4: Certificado muestra "Curso estándar" y fecha se resetea

**Causa raíz (título):** En `lms_generar_certificado` (migración línea 179), el título del curso se obtiene de `v_curso.titulo`:
```sql
SELECT * INTO v_curso FROM lms_cursos WHERE id = v_inscripcion.curso_id;
'titulo_curso', v_curso.titulo,
```
Si `v_curso.titulo` es NULL o el curso tiene un título genérico como "Curso estándar" (que es probablemente el valor por defecto o placeholder), eso se graba en `datos_certificado`. Esto es un problema de datos, no de código — verificar en la tabla `lms_cursos` que el curso real tenga el título correcto.

**Causa raíz (fecha se cambia):** En `lms_marcar_contenido_completado` (línea 536), cada vez que se llama:
```sql
ON CONFLICT DO UPDATE SET
  completado = true,
  fecha_completado = NOW(),  -- ← AQUÍ: se sobrescribe SIEMPRE
```
Y luego `lms_calcular_progreso` (línea 357-359):
```sql
fecha_completado = CASE 
  WHEN v_porcentaje >= 100 AND fecha_completado IS NULL THEN NOW()
  ELSE fecha_completado  -- ← Protegida, solo se pone una vez
END,
```
La fecha de la **inscripción** está protegida, pero la fecha del **progreso individual** se sobrescribe cada vez que el usuario re-visita un contenido completado y vuelve a hacer clic en "Marcar como completado". Y el certificado usa `v_inscripcion.fecha_completado` que está protegida... pero si se re-calcula progreso y el porcentaje baja temporalmente y vuelve a subir, la condición `fecha_completado IS NULL` ya no aplica porque ya fue seteada.

El bug más probable: si el usuario entra de nuevo a una actividad completada y el frontend vuelve a mostrar el botón "Marcar como completado" (porque `contenidoCompletado` no se verifica antes de renderizar el botón en algunos renderers), y hace clic, esto dispara `lms_marcar_contenido_completado` → `lms_calcular_progreso`. Si en algún momento intermedio el estado cambió, la fecha puede resetearse.

**Archivos a modificar:**
- **Migración SQL nueva:** Modificar `lms_marcar_contenido_completado` para proteger `fecha_completado` en el `ON CONFLICT`:
  ```sql
  fecha_completado = CASE 
    WHEN lms_progreso.fecha_completado IS NULL THEN NOW()
    ELSE lms_progreso.fecha_completado
  END,
  ```
- `src/pages/LMS/CursoViewer.tsx`: No mostrar botón "Marcar como completado" si `contenidoCompletado === true` (ya existe esta lógica en línea 295, pero verificar que aplique a TODOS los renderers).
- **Certificado título:** Agregar validación en `lms_generar_certificado` para que si `v_curso.titulo` está vacío use un fallback más inteligente. También agregar un query de diagnóstico para verificar los cursos actuales en producción.

---

## Bug 5: Dropdown de tipo de contenido aparece descuadrado (admin)

**Causa raíz:** En `ModuloInlineEditor.tsx` líneas 329-357, el formulario inline de "Agregar contenido" usa un `Select` de Radix dentro de un contenedor con `overflow: hidden` (heredado del `Collapsible`). El `SelectContent` (portal del dropdown) puede renderizarse fuera del viewport o en una posición incorrecta porque el contenedor padre tiene restricciones de layout.

La imagen de Lupita muestra que el dropdown aparece en la parte inferior de la pantalla, separado del trigger. Esto es un problema conocido de Radix Select dentro de contenedores con scroll o colapsables.

**Archivos a modificar:**
- `src/components/lms/admin/editor/ModuloInlineEditor.tsx`: Agregar `position="popper"` y `sideOffset` al `SelectContent` para forzar posicionamiento relativo al trigger:
  ```tsx
  <SelectContent position="popper" sideOffset={4} className="z-50">
  ```
- Si persiste, considerar usar `align="start"` y asegurar que el contenedor padre no tenga `overflow: hidden`.

---

## Resumen de Archivos a Modificar

| Archivo | Bugs |
|---------|------|
| `src/components/lms/EmbedRenderer.tsx` | #1 |
| `src/pages/LMS/CursoViewer.tsx` | #1, #2, #3, #4 |
| `src/components/lms/ModuleSidebar.tsx` | #2 |
| `src/components/lms/ContentRenderer.tsx` | #3 |
| `src/hooks/useLMSQuiz.ts` | #3 (verificar) |
| `supabase/migrations/nuevo.sql` | #3, #4 |
| `src/components/lms/admin/editor/ModuloInlineEditor.tsx` | #5 |

## Orden de Implementación Recomendado

1. **Bug 3** (quiz intentos) — impacto funcional más alto, afecta evaluaciones
2. **Bug 4** (certificado) — afecta entregable final del alumno
3. **Bug 1** (auto-complete) — afecta integridad del progreso
4. **Bug 2** (candado secuencial) — mejora UX de aprendizaje dirigido
5. **Bug 5** (dropdown admin) — cosmético pero afecta productividad del creador de contenido

