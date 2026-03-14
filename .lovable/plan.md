

# Plan Maestro: Auditoría QA y Blindaje RLS — Todos los Módulos

## Diagnóstico General

Se identificaron **135+ hooks y componentes con mutaciones Supabase** distribuidos en 12 módulos funcionales. Solo 3 archivos (`useBitacoraBoard`, `useServiciosPlanificados`, `useMonitoristaAssignment`) y 8 archivos de Planeación upstream tienen el patrón `assertRowsAffected`. El resto (~120+ archivos) operan sin verificación de persistencia.

### Inventario de Mutaciones Desprotegidas por Módulo

```text
┌─────────────────────────┬────────┬──────────┬───────────┐
│ Módulo                  │ Hooks  │ Mutac.   │ Severidad │
├─────────────────────────┼────────┼──────────┼───────────┤
│ Supply (Reclutamiento)  │ 12     │ ~40      │ ALTA      │
│ Facturación / Finanzas  │ 7      │ ~35      │ ALTA      │
│ WMS (Inventario)        │ 6      │ ~30      │ ALTA      │
│ Tickets / Soporte       │ 3      │ ~12      │ MEDIA     │
│ Customer Success        │ 8      │ ~20      │ MEDIA     │
│ LMS (Capacitación)      │ 6      │ ~25      │ MEDIA     │
│ Leads / CRM             │ 5      │ ~18      │ MEDIA     │
│ Perfiles Operativos     │ 4      │ ~12      │ MEDIA     │
│ Instalaciones / GPS     │ 5      │ ~20      │ MEDIA     │
│ Incidentes              │ 1      │ ~5       │ MEDIA     │
│ Aprobaciones Workflow   │ 2      │ ~15      │ MEDIA     │
│ Portales Campo          │ 3      │ ~8       │ BAJA      │
│ Comunicaciones          │ 2      │ ~4       │ BAJA      │
└─────────────────────────┴────────┴──────────┴───────────┘
Total: ~65 hooks/componentes, ~244 mutaciones sin protección
```

## Estrategia: 7 Fases Secuenciales

Cada fase agrupa módulos por **dominio de negocio y riesgo**. Se aplica el patrón ya establecido:

```typescript
// Updates/Inserts individuales
const { data, error } = await supabase
  .from('tabla').update({...}).eq('id', id).select('id');
if (error) throw error;
if (!data || data.length === 0) throw new Error('Operación bloqueada');

// Bulk operations
const { data, error } = await supabase
  .from('tabla').update({...}).in('id', ids).select('id');
if (error) throw error;
if (data?.length !== ids.length) toast.warning(`Parcial: ${data?.length}/${ids.length}`);

// Fire-and-forget audit logs (non-blocking)
const { data, error } = await supabase
  .from('audit_table').insert({...}).select('id');
if (error || !data?.length) console.warn('[audit] Failed:', error);
```

---

### FASE 1: Supply (Reclutamiento y Liberación) — 12 hooks

**Riesgo**: Candidatos aprobados sin contrato persistido, liberaciones fantasma, evaluaciones perdidas.

Archivos:
1. `src/hooks/useCustodioLiberacion.ts` — 6 mutations (insert liberación + update candidato)
2. `src/hooks/useContratosCandidato.ts` — 4 mutations (insert/update contratos)
3. `src/hooks/useDocumentosCandidato.ts` — 3 mutations (insert/update documentos)
4. `src/hooks/useEvaluacionesPsicometricas.ts` — 3 mutations
5. `src/hooks/useEvaluacionesMidot.ts` — 3 mutations (insert/update/delete)
6. `src/hooks/useEvaluacionesToxicologicas.ts` — 1 mutation
7. `src/hooks/useEstudioSocioeconomico.ts` — 2 mutations
8. `src/hooks/useReferencias.ts` — 3 mutations
9. `src/hooks/useLeadApprovals.ts` — 7 mutations (approve/reject pipeline)
10. `src/hooks/useCustodioIndisponibilidades.ts` — 4 mutations
11. `src/hooks/useBajaMasiva.ts` — 3 mutations (bulk deactivation)
12. `src/hooks/useReactivacionMasiva.ts` — 3 mutations

### FASE 2: Facturación y Finanzas — 7 hooks

**Riesgo**: Facturas generadas sin partidas, CxP sin detalle, maestro de clientes corrupto.

Archivos:
1. `src/pages/Facturacion/hooks/useGenerarFactura.ts` — insert factura + partidas
2. `src/pages/Facturacion/hooks/useCxPProveedores.ts` — insert CxP + detalle
3. `src/pages/Facturacion/hooks/useCxPCortesSemanales.ts` — insert corte + detalle
4. `src/pages/Facturacion/hooks/useClientesContactos.ts` — CRUD contactos
5. `src/pages/Facturacion/hooks/useInventarioGadgets.ts` — CRUD gadgets + rentas
6. `src/pages/Facturacion/services/maestroImportService.ts` — batch upserts (~10 mutations)
7. `src/hooks/useProveedoresPagos.ts` — insert pagos + update estado_pago

### FASE 3: WMS (Inventario y Almacén) — 6 hooks

**Riesgo**: Movimientos de stock sin persistir, desechos no registrados, seriales fantasma.

Archivos:
1. `src/hooks/useStockProductos.ts` — 6 mutations (movimientos, ajustes, seriales)
2. `src/hooks/useOrdenesCompra.ts` — 3 mutations (insert/update/complete)
3. `src/hooks/useRecepciones.ts` — 4 mutations (insert/update/upsert detalles/complete)
4. `src/hooks/useDesechosInventario.ts` — 2 mutations (insert desecho + movimiento)
5. `src/hooks/useDevolucionesProveedor.ts` — 3 mutations (insert devolución + detalle + movimiento)
6. `src/hooks/useProductoActions.ts` — 3 mutations (delete stock + delete producto + audit)

### FASE 4: Customer Success + Tickets — 11 hooks

**Riesgo**: Quejas sin persistir, touchpoints perdidos, tickets con respuestas fantasma.

Archivos:
1. `src/hooks/useCSQuejas.ts` — 2 mutations
2. `src/hooks/useCSCapa.ts` — 2 mutations
3. `src/hooks/useCSTouchpoints.ts` — 3 mutations
4. `src/hooks/useCSNPS.ts` — 1 mutation
5. `src/hooks/useCSNPSCampaign.ts` — 2 mutations
6. `src/hooks/useCSCSAT.ts` — 1 mutation
7. `src/hooks/useCSCartera.ts` — 2 mutations (baja/reactivación cliente)
8. `src/hooks/useCSConfig.ts` — 1 mutation (upsert config)
9. `src/hooks/useTickets.ts` — 3 mutations
10. `src/hooks/useTicketsEnhanced.ts` — 3 mutations
11. `src/pages/Tickets/TicketDetailPage.tsx` — 1 mutation (insert respuesta)

### FASE 5: LMS + Leads/CRM — 10 hooks

**Riesgo**: Cursos duplicados, progreso perdido, leads sin sync.

Archivos:
1. `src/hooks/lms/useLMSAdminCursos.ts` — 8 mutations (CRUD cursos + duplicar + reordenar)
2. `src/hooks/lms/useLMSAdminModulos.ts` — 4 mutations
3. `src/hooks/lms/useLMSAdminContenidos.ts` — 5 mutations
4. `src/hooks/lms/useLMSAdminPreguntas.ts` — 2 mutations
5. `src/hooks/lms/useLMSAdminInscripciones.ts` — 2 mutations
6. `src/hooks/useLMSQuiz.ts` — 1 mutation (upsert progreso)
7. `src/hooks/useLeads.ts` — 3 mutations
8. `src/hooks/useLeadsUnified.ts` — 3 mutations
9. `src/hooks/useLeadsStable.ts` — 3 mutations
10. `src/hooks/useCrmDeals.ts` — 1 mutation

### FASE 6: Instalaciones, GPS y Aprobaciones — 8 hooks

**Riesgo**: Instalaciones programadas sin persistir, comodatos GPS sin movimiento registrado.

Archivos:
1. `src/hooks/useProgramacionInstalaciones.ts` — 7 mutations
2. `src/hooks/useProgramacionInstalacionesCandidato.ts` — 2 mutations
3. `src/hooks/useComodatosGPS.ts` — 6 mutations (insert comodato + stock + movimiento)
4. `src/hooks/useInstalacionDocumentacion.ts` — 3 mutations (upsert docs/validaciones/reporte)
5. `src/hooks/useKitsInstalacion.ts` — 1 mutation
6. `src/hooks/useAprobacionesWorkflow.ts` — 10 mutations (aprobaciones + seguimiento)
7. `src/hooks/useIncidentesOperativos.ts` — 3 mutations
8. `src/hooks/usePoolReserva.ts` — 1 mutation

### FASE 7: Perfiles Operativos, Sanciones y Portales — 8 hooks

**Riesgo**: Sanciones no aplicadas, cambios de estatus perdidos, onboarding incompleto.

Archivos:
1. `src/hooks/useSanciones.ts` — 3 mutations (insert sanción + suspend + review)
2. `src/hooks/useCambioEstatusOperativo.ts` — 2 mutations (update + history)
3. `src/hooks/useConfiguracionSanciones.ts` — 1 mutation
4. `src/pages/PerfilesOperativos/hooks/useNotasOperativo.ts` — 4 mutations (CRUD notas)
5. `src/pages/PerfilesOperativos/hooks/useVerifyDocument.ts` — 2 mutations
6. `src/pages/PerfilesOperativos/components/CustodiosDataTable.tsx` — 1 mutation
7. `src/pages/PerfilesOperativos/components/ArmadosDataTable.tsx` — 1 mutation
8. `src/pages/custodian/CustodianOnboarding.tsx` — 2 mutations
9. `src/hooks/useProveedores.ts` — 2 mutations
10. `src/hooks/useProveedoresArmados.ts` — 2 mutations
11. `src/hooks/useServicioComm.ts` — 2 mutations
12. `src/hooks/useServiceChecklist.ts` — 1 mutation (upsert)
13. `src/hooks/useOfflineSync.ts` — 2 mutations (upsert)

---

## Metodología Fishbone (por fase)

Si se detecta un error durante la implementación, se aplica el análisis causa-raíz:

```text
                        ┌─ RLS Policy: ¿Bloqueó silenciosamente?
                        ├─ Network: ¿Timeout sin retry?
  ERROR SILENCIOSO ─────├─ Code: ¿Missing .select('id')?
                        ├─ Logic: ¿catch {} swallowed error?
                        └─ Data: ¿Constraint violation no manejado?
```

## Ejecución

- Cada fase es un mensaje independiente para mantener contexto manejable
- Estimación total: ~65 archivos, ~244 mutaciones
- Patrón consistente: `assertRowsAffected` como utility reutilizable
- Excepciones documentadas: heartbeat pings, audit logs non-blocking, localStorage ops

## Resultado esperado

| Métrica | Antes | Después |
|---|---|---|
| Hooks con protección RLS | 11/65 (17%) | 65/65 (100%) |
| Mutaciones verificadas | ~50/244 (20%) | 244/244 (100%) |
| Score QA General | 7.5/10 | 9.5/10 |

Comenzamos con **Fase 1: Supply** al aprobar.

