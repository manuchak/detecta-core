
Objetivo: ejecutar un análisis de debugging completo del flujo SIERCP, identificar causas raíz con Fishbone y definir un plan de corrección de bugs críticos de la prueba psicométrica.

Resumen ejecutivo del diagnóstico
- Hallazgo crítico confirmado: la evaluación externa falla al guardar por incompatibilidad entre frontend y RPC.
- Evidencia:
  - UI/capturas: error “Could not find function public.complete_siercp_assessment(..., p_resultado_semaforo, ..., p_token)”.
  - Código frontend (`src/pages/assessment/SIERCPAssessmentPage.tsx`): todavía envía `p_resultado_semaforo`.
  - DB actual: función `complete_siercp_assessment` existe con firma SIN `p_resultado_semaforo` (10 args).
  - Impacto real en datos:
    - `started_since_mar3 = 5`
    - `completed_since_mar3 = 0`
    - `evals_since_mar3 = 0`
- Conclusión: regresión de contrato API entre frontend y base de datos, bloqueando completitud de evaluaciones.

Workflow auditado (end-to-end)
1) Invitación SIERCP creada → token UUID en `siercp_invitations`.
2) Candidato entra a `/assessment/:token`.
3) Frontend valida token y cambia estado (`opened`/`started`).
4) Al finalizar, llama RPC `complete_siercp_assessment`.
5) RPC inserta en `evaluaciones_psicometricas` y marca invitación `completed`.
6) Trigger DB `trg_calculate_semaforo` calcula semáforo con regla 70/50.

Dónde rompe hoy:
- Paso 4: payload frontend incluye parámetro removido (`p_resultado_semaforo`), PostgREST no encuentra firma y retorna error.
- Efecto en UX: usuario “se queda en la misma pregunta” al final porque no se persiste la evaluación.

Fishbone (causa raíz)
```text
Problema: Evaluación SIERCP no se completa (error al guardar)

1) Método/Proceso
   - Cambio de firma RPC en migración sin sincronizar consumidor frontend.
   - No hubo checklist de compatibilidad backward/forward en despliegue DB+UI.

2) Código/Aplicación
   - Frontend aún manda p_resultado_semaforo.
   - Supabase client está tipado como any (createClient<any>), no detecta drift en compile-time.
   - Uso de @ts-nocheck en partes SIERCP legacy aumenta riesgo de regresión.

3) Datos/Modelo
   - Flujo depende de RPC atómico; al fallar, no hay inserción ni cierre de invitación.
   - Invitaciones quedan en started (atasco operativo).

4) Pruebas/Calidad
   - Falta test de contrato RPC (firma/args esperados).
   - Falta prueba e2e del flujo público completo (/assessment/:token → completado).

5) Operación/Monitoreo
   - No hay alerta automática por crecimiento de invitaciones en started sin conversión a completed.
   - Error visible al usuario, pero sin circuito de rollback funcional.

6) Personas/Gobernanza
   - Cambio de DB y cambio de frontend no versionados como unidad.
```

Errores detectados (priorizados)
- P0 (bloqueante): mismatch de argumentos RPC (`p_resultado_semaforo`).
- P1 (riesgo de reincidencia): cliente Supabase sin tipado fuerte (`any`) impide detectar roturas de firma.
- P1 (operativo): falta observabilidad para detectar “started estancados”.
- P2 (consistencia de evento): `opened` depende de condición `status === 'pending'`; invitaciones `sent` pueden saltarse ese hito de tracking.

Plan de solución propuesto (implementación)
Fase 1 — Hotfix inmediato (bloqueo)
- `src/pages/assessment/SIERCPAssessmentPage.tsx`
  - Quitar `p_resultado_semaforo` del `supabase.rpc('complete_siercp_assessment', ...)`.
  - Mantener `p_interpretacion`.
- Verificar que el guardado vuelve a crear registros en `evaluaciones_psicometricas` y cerrar invitación.

Fase 2 — Hardening de contrato
- Reforzar tipado de Supabase client para RPC (evitar `createClient<any>` en rutas críticas).
- Asegurar que llamadas RPC SIERCP usen tipos generados y fallen en build si cambia firma.

Fase 3 — Resiliencia y observabilidad
- Agregar métrica/consulta de salud:
  - invitaciones `started` > X horas sin `completed`.
- Agregar dashboard operativo o alerta periódica (query programada).

Fase 4 — Calidad (prevención de regresión)
- Test e2e del flujo público SIERCP:
  - token válido → contestar → guardar → pantalla éxito.
- Test de contrato RPC (firma esperada y respuesta no nula).
- Caso negativo controlado: token expirado/cancelado.

Fase 5 — Ajustes de workflow (no bloqueantes)
- Revisar transición `opened` para incluir invitaciones en `sent` y mejorar trazabilidad.
- Validar mensajes de error amigables y botón “Reintentar guardar” en cierre.

Criterios de aceptación
- Se elimina error “Could not find function complete_siercp_assessment...”.
- Nuevas invitaciones pasan de `started` a `completed` al finalizar.
- Se crean nuevas filas en `evaluaciones_psicometricas` (post-fix).
- Flujo end-to-end público pasa en test.
- Existe monitoreo de invitaciones estancadas.

Plan de validación post-fix (debug checklist)
1) Crear invitación nueva.
2) Abrir `/assessment/:token` y completar hasta última pregunta.
3) Confirmar toast/success screen.
4) DB:
   - `siercp_invitations.status = completed`
   - `evaluacion_id` presente
   - nueva fila en `evaluaciones_psicometricas`
5) Reintento con mismo token debe bloquear por “already_completed”.
6) Validar en móvil (caso reportado) y escritorio.

Riesgo residual y mitigación
- Riesgo: otro consumidor aún use firma antigua.
- Mitigación:
  - búsqueda global de `complete_siercp_assessment` y limpieza de payload legacy;
  - tipado estricto + test de contrato;
  - release checklist DB/UI en bloque.
