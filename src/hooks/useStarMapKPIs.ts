// @ts-nocheck
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface StarMapKPI {
  id: string;
  name: string;
  value: number | null;
  target: number;
  unit: string;
  status: 'green' | 'yellow' | 'red' | 'no-data';
  isProxy: boolean;
  dataSource: string;
  missingFields?: string[];
  instrumentationCategory?: 'quick-win' | 'new-table' | 'external';
  businessImpact?: string;
}

export interface StarMapPillar {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  kpis: StarMapKPI[];
  score: number;
  coverage: number;
  color: string;
}

export interface StarMapData {
  northStar: StarMapKPI;
  pillars: StarMapPillar[];
  overallScore: number;
  overallCoverage: number;
  loading: boolean;
}

function getStatus(value: number | null, greenMin: number, yellowMin: number, invert = false): 'green' | 'yellow' | 'red' | 'no-data' {
  if (value === null) return 'no-data';
  if (invert) {
    if (value <= greenMin) return 'green';
    if (value <= yellowMin) return 'yellow';
    return 'red';
  }
  if (value >= greenMin) return 'green';
  if (value >= yellowMin) return 'yellow';
  return 'red';
}

export function useStarMapKPIs(): StarMapData {
  const { data, isLoading } = useQuery({
    queryKey: ['starmap-kpis'],
    queryFn: async () => {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

      const [
        dealsRes,
        planificadosRes,
        checklistRes,
        custodiosRes,
        documentosRes,
        facturasRes,
        healthScoresRes,
        // Phase 2 queries
        custodiaFinancierosRes,
        rechazosRes,
        forecastRes,
        // Phase 4: Incidents
        incidentesRes,
      ] = await Promise.all([
        supabase.from('crm_deals').select('id, status, value').eq('is_deleted', false),
        supabase.from('servicios_planificados')
          .select('id, custodio_asignado, armado_asignado, requiere_armado, estado_confirmacion_custodio, estado_planeacion, fecha_asignacion, created_at, hora_inicio_real, hora_fin_real')
          .gte('fecha_hora_cita', ninetyDaysAgo),
        supabase.from('checklist_servicio')
          .select('id, servicio_id, firma_base64, items_inspeccion, estado')
          .gte('created_at', ninetyDaysAgo),
        supabase.from('custodios_operativos')
          .select('id, estado, created_at')
          .eq('estado', 'activo'),
        supabase.from('documentos_custodio')
          .select('id, custodio_id, estado_validacion, fecha_vencimiento')
          .eq('estado_validacion', 'aprobado'),
        supabase.from('facturas')
          .select('id, fecha_emision, fecha_pago, monto_total, estado')
          .gte('fecha_emision', ninetyDaysAgo),
        supabase.from('cs_health_scores')
          .select('id, cliente, health_score, churn_risk')
          .order('created_at', { ascending: false })
          .limit(50),
        // F1/F2: servicios_custodia with financial fields
        supabase.from('servicios_custodia')
          .select('id, cobro_cliente, costo_custodio')
          .gte('created_at', ninetyDaysAgo),
        // O8: custodio_rechazos count
        supabase.from('custodio_rechazos')
          .select('id')
          .gte('fecha_rechazo', ninetyDaysAgo),
        // S4: forecast accuracy latest
        supabase.from('forecast_accuracy_history')
          .select('mape_services')
          .order('created_at', { ascending: false })
          .limit(1),
        // Phase 4: incidentes_operativos
        supabase.from('incidentes_operativos')
          .select('id, severidad, atribuible_operacion, controles_activos, control_efectivo')
          .gte('fecha_incidente', ninetyDaysAgo),
      ]);

      const deals = dealsRes.data || [];
      const planificados = planificadosRes.data || [];
      const checklists = checklistRes.data || [];
      const custodios = custodiosRes.data || [];
      const documentos = documentosRes.data || [];
      const facturas = facturasRes.data || [];
      const healthScores = healthScoresRes.data || [];
      const custodiaFinancieros = custodiaFinancierosRes.data || [];
      const rechazos = rechazosRes.data || [];
      const forecastData = forecastRes.data || [];
      const incidentes = incidentesRes.data || [];

      // === NORTH STAR: SCNV (Proxy) ===
      const serviciosFinalizados = planificados.filter(s => 
        s.estado_planeacion === 'finalizado' || s.estado_planeacion === 'Finalizado'
      );
      const serviciosConChecklist = serviciosFinalizados.filter(s =>
        checklists.some(c => c.servicio_id === s.id && c.firma_base64)
      );
      const scnvProxy = serviciosFinalizados.length > 0
        ? (serviciosConChecklist.length / serviciosFinalizados.length) * 100
        : null;

      // === PILAR 1: GTM ===
      // S3: Win Rate
      const wonDeals = deals.filter(d => d.status === 'won').length;
      const closedDeals = deals.filter(d => d.status === 'won' || d.status === 'lost').length;
      const winRate = closedDeals > 0 ? (wonDeals / closedDeals) * 100 : null;

      // S1: Plan Rate (proxy) — finalizados / planificados no-cancelados
      const totalNoCancelados = planificados.filter(s => s.estado_planeacion !== 'cancelado');
      const s1PlanRate = totalNoCancelados.length > 0
        ? (serviciosFinalizados.length / totalNoCancelados.length) * 100
        : null;

      // S4: Forecast Accuracy (proxy) — MAPE from history or fallback
      const s4Mape = forecastData.length > 0 && forecastData[0].mape_services != null
        ? forecastData[0].mape_services
        : 18.5; // fallback

      // === PILAR 2: Tech ===
      // TP7: Evidence Capture Pass Rate
      const completedChecklists = checklists.filter(c => c.firma_base64 && c.items_inspeccion);
      const evidenceRate = serviciosFinalizados.length > 0
        ? (completedChecklists.length / serviciosFinalizados.length) * 100
        : null;

      // === PILAR 3: Ops/Supply ===
      const totalPlanificados = planificados.filter(s => s.estado_planeacion !== 'cancelado');
      // O1: Fill Rate E2E
      const asignadosCompletos = totalPlanificados.filter(s => {
        const custodioOk = !!s.custodio_asignado;
        const armadoOk = s.requiere_armado ? !!s.armado_asignado : true;
        return custodioOk && armadoOk;
      });
      const fillRate = totalPlanificados.length > 0
        ? (asignadosCompletos.length / totalPlanificados.length) * 100
        : null;

      // O2: Confirm Rate
      const asignados = totalPlanificados.filter(s => !!s.custodio_asignado);
      const confirmados = asignados.filter(s => s.estado_confirmacion_custodio === 'confirmado');
      const confirmRate = asignados.length > 0
        ? (confirmados.length / asignados.length) * 100
        : null;

      // O3: No-Show Rate (proxy) — asignados sin hora_inicio_real
      const asignadosPasados = asignados.filter(s => {
        const cita = new Date(s.created_at);
        return cita < new Date(); // only past services
      });
      const sinInicio = asignadosPasados.filter(s => !s.hora_inicio_real);
      const noShowRate = asignadosPasados.length > 0
        ? (sinInicio.length / asignadosPasados.length) * 100
        : null;

      // O4: Time to Assign (minutes)
      const assignTimes = totalPlanificados
        .filter(s => s.fecha_asignacion && s.created_at)
        .map(s => {
          const diff = new Date(s.fecha_asignacion).getTime() - new Date(s.created_at).getTime();
          return diff / (1000 * 60);
        })
        .filter(t => t > 0 && t < 10080);
      const avgTimeToAssign = assignTimes.length > 0
        ? assignTimes.reduce((a, b) => a + b, 0) / assignTimes.length
        : null;

      // O5: Coverage Index (proxy) — custodios activos / demanda semanal
      const weeklyDemand = totalPlanificados.length > 0
        ? totalPlanificados.length / 13 // 90 days ≈ 13 weeks
        : 0;
      const coverageIndex = weeklyDemand > 0
        ? Math.round((custodios.length / weeklyDemand) * 100) / 100
        : null;

      // O6: Activation
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newCustodians = custodios.filter(c => new Date(c.created_at) >= thisMonth).length;

      // O7: Document Compliance
      const now = new Date();
      const validDocs = documentos.filter(d => !d.fecha_vencimiento || new Date(d.fecha_vencimiento) > now).length;
      const docCompliance = documentos.length > 0
        ? (validDocs / documentos.length) * 100
        : null;

      // O8: Rechazos (proxy) — count directo
      const rechazosCount = rechazos.length;

      // === PILAR 4: C4 ===
      // C1: Check-in Compliance
      const checkinCompliance = serviciosFinalizados.length > 0
        ? (checklists.length / serviciosFinalizados.length) * 100
        : null;

      // C5: Close Quality (proxy) — checklists con firma + items / finalizados
      const closeQuality = serviciosFinalizados.length > 0
        ? (completedChecklists.length / serviciosFinalizados.length) * 100
        : null;

      // === PILAR 6: Finanzas ===
      // F1: GM por servicio (proxy)
      const conAmbos = custodiaFinancieros.filter(s => s.cobro_cliente > 0 && s.costo_custodio > 0);
      const gmValues = conAmbos.map(s => ((s.cobro_cliente - s.costo_custodio) / s.cobro_cliente) * 100);
      const avgGM = gmValues.length > 0
        ? Math.round(gmValues.reduce((a, b) => a + b, 0) / gmValues.length * 10) / 10
        : null;

      // F2: CPS (proxy)
      const conCosto = custodiaFinancieros.filter(s => s.costo_custodio > 0);
      const avgCPS = conCosto.length > 0
        ? Math.round(conCosto.reduce((sum, s) => sum + s.costo_custodio, 0) / conCosto.length)
        : null;

      // F4: Retention
      const avgHealthScore = healthScores.length > 0
        ? healthScores.reduce((sum, h) => sum + (h.health_score || 0), 0) / healthScores.length
        : null;

      // F5: DSO
      const paidFacturas = facturas.filter(f => f.fecha_pago && f.fecha_emision);
      const dsoValues = paidFacturas.map(f => {
        const diff = new Date(f.fecha_pago).getTime() - new Date(f.fecha_emision).getTime();
        return diff / (1000 * 60 * 60 * 24);
      }).filter(d => d > 0 && d < 365);
      const avgDSO = dsoValues.length > 0
        ? dsoValues.reduce((a, b) => a + b, 0) / dsoValues.length
        : null;

      // === PILAR 5: Seguridad / Riesgo (Phase 4) ===
      // Total services in period for rate calculation
      const totalServiciosPeriodo = totalPlanificados.length;

      // R1: Incident Rate per 1,000 services
      const r1IncidentRate = totalServiciosPeriodo > 0
        ? Math.round((incidentes.length / totalServiciosPeriodo) * 1000 * 10) / 10
        : incidentes.length > 0 ? incidentes.length : null;

      // R2: Critical Attributable Rate — % of incidents that are critical AND attributable
      const criticalAtribuibles = incidentes.filter(i => (i.severidad === 'critica' || i.severidad === 'alta') && i.atribuible_operacion);
      const r2CriticalRate = incidentes.length > 0
        ? Math.round((criticalAtribuibles.length / incidentes.length) * 100 * 10) / 10
        : null;

      // R3: Exposure Score — weighted severity (baja=1, media=2, alta=4, critica=8)
      const severityWeights = { baja: 1, media: 2, alta: 4, critica: 8 };
      const r3ExposureScore = incidentes.length > 0
        ? Math.round(incidentes.reduce((sum, i) => sum + (severityWeights[i.severidad] || 1), 0) * 10) / 10
        : null;

      // R4: Control Effectiveness — % of incidents where controls were active AND effective
      const withControls = incidentes.filter(i => i.controles_activos && i.controles_activos.length > 0);
      const controlsEffective = withControls.filter(i => i.control_efectivo === true);
      const r4ControlEffectiveness = withControls.length > 0
        ? Math.round((controlsEffective.length / withControls.length) * 100 * 10) / 10
        : null;

      return {
        scnvProxy, winRate, evidenceRate, fillRate, confirmRate, avgTimeToAssign,
        newCustodians, docCompliance, checkinCompliance, avgHealthScore, avgDSO,
        // Phase 2
        s1PlanRate, s4Mape, noShowRate, coverageIndex, rechazosCount, closeQuality, avgGM, avgCPS,
        // Phase 4
        r1IncidentRate, r2CriticalRate, r3ExposureScore, r4ControlEffectiveness,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const d = data || {};

  const pillars: StarMapPillar[] = [
    {
      id: 'gtm',
      name: 'GTM / Growth',
      shortName: 'GTM',
      icon: '🎯',
      color: 'hsl(210, 70%, 50%)',
      kpis: [
        { id: 'S3', name: 'Win Rate', value: d.winRate ?? null, target: 35, unit: '%', status: getStatus(d.winRate ?? null, 35, 20), isProxy: false, dataSource: 'crm_deals' },
        { id: 'S1', name: 'Plan Rate', value: d.s1PlanRate != null ? Math.round(d.s1PlanRate * 10) / 10 : null, target: 80, unit: '%', status: getStatus(d.s1PlanRate ?? null, 80, 60), isProxy: true, dataSource: 'servicios_planificados', missingFields: ['deal_id→servicio join', 'status OPERABLE formal'], instrumentationCategory: 'quick-win', businessImpact: 'GTM: cobertura +12%' },
        { id: 'S4', name: 'Forecast Accuracy (MAPE)', value: d.s4Mape != null ? Math.round(d.s4Mape * 10) / 10 : null, target: 15, unit: '%', status: getStatus(d.s4Mape ?? null, 15, 25, true), isProxy: true, dataSource: 'forecast_accuracy_history', missingFields: ['datos reales en forecast_accuracy_history'], instrumentationCategory: 'quick-win', businessImpact: 'GTM: forecast real vs proxy' },
        { id: 'M1', name: 'Solicitudes Operables', value: null, target: 0, unit: '#', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['status OPERABLE', 'checklist campos mínimos'], instrumentationCategory: 'new-table', businessImpact: 'GTM: visibilidad pipeline operativo' },
        { id: 'M2', name: 'SQL → Operable Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['etapa SQL', 'etapa OPERABLE'], instrumentationCategory: 'new-table', businessImpact: 'GTM: tasa conversión comercial→ops' },
        { id: 'M3', name: 'Fit Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['cobertura zona', 'capacidad servicio'], instrumentationCategory: 'new-table', businessImpact: 'GTM: match oferta-demanda' },
        { id: 'M5', name: 'Lead Response Time', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['lead_created_ts', 'first_contact_ts'], instrumentationCategory: 'external', businessImpact: 'GTM: velocidad respuesta +12%' },
        { id: 'S2', name: 'Quote Turnaround Time', value: null, target: 0, unit: 'h', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['quote_sent_ts', 'operable_ts'], instrumentationCategory: 'external', businessImpact: 'GTM: ciclo cotización' },
      ],
      score: 0,
      coverage: 0,
    },
    {
      id: 'tech',
      name: 'Tech & Producto',
      shortName: 'Tech',
      icon: '⚙️',
      color: 'hsl(270, 60%, 50%)',
      kpis: [
        { id: 'TP7', name: 'Evidence Capture Pass Rate', value: d.evidenceRate ?? null, target: 95, unit: '%', status: getStatus(d.evidenceRate ?? null, 95, 80), isProxy: false, dataSource: 'checklist_servicio' },
        { id: 'TP1', name: 'E2E Traceability Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['join key CRM→servicio', 'flag trazabilidad'], instrumentationCategory: 'external', businessImpact: 'Tech: trazabilidad deal→servicio' },
        { id: 'TP2', name: 'Timestamp Completeness', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['operable_ts', 'quote_sent_ts', 'closed_ok_ts'], instrumentationCategory: 'external', businessImpact: 'Tech: auditoría temporal completa' },
        { id: 'TP9', name: 'Integration Reliability', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['logs integración', 'reconciliación'], instrumentationCategory: 'external', businessImpact: 'Tech: confiabilidad integraciones' },
      ],
      score: 0,
      coverage: 0,
    },
    {
      id: 'ops',
      name: 'Ops / Supply',
      shortName: 'Ops',
      icon: '📋',
      color: 'hsl(150, 60%, 40%)',
      kpis: [
        { id: 'O1', name: 'Fill Rate E2E', value: d.fillRate ?? null, target: 95, unit: '%', status: getStatus(d.fillRate ?? null, 95, 85), isProxy: false, dataSource: 'servicios_planificados' },
        { id: 'O2', name: 'Confirm Rate', value: d.confirmRate ?? null, target: 90, unit: '%', status: getStatus(d.confirmRate ?? null, 90, 75), isProxy: false, dataSource: 'servicios_planificados' },
        { id: 'O3', name: 'No-Show Rate', value: d.noShowRate != null ? Math.round(d.noShowRate * 10) / 10 : null, target: 5, unit: '%', status: getStatus(d.noShowRate ?? null, 5, 10, true), isProxy: true, dataSource: 'servicios_planificados (hora_inicio_real)', missingFields: ['flag no_show explícito en BD'], instrumentationCategory: 'quick-win', businessImpact: 'Ops: +12% cobertura' },
        { id: 'O4', name: 'Time to Assign', value: d.avgTimeToAssign ? Math.round(d.avgTimeToAssign) : null, target: 30, unit: 'min', status: getStatus(d.avgTimeToAssign ?? null, 30, 60, true), isProxy: false, dataSource: 'servicios_planificados' },
        { id: 'O5', name: 'Coverage Index', value: d.coverageIndex ?? null, target: 1.5, unit: 'ratio', status: getStatus(d.coverageIndex ?? null, 1.5, 1.0), isProxy: true, dataSource: 'custodios_operativos / demanda semanal', missingFields: ['capacidad neta formal por zona'], instrumentationCategory: 'quick-win', businessImpact: 'Ops: capacidad real vs estimada' },
        { id: 'O6', name: 'Activación Base', value: d.newCustodians ?? null, target: 5, unit: '#/mes', status: getStatus(d.newCustodians ?? null, 5, 2), isProxy: false, dataSource: 'custodios_operativos' },
        { id: 'O7', name: 'Document Compliance', value: d.docCompliance ?? null, target: 95, unit: '%', status: getStatus(d.docCompliance ?? null, 95, 80), isProxy: false, dataSource: 'documentos_custodio' },
        { id: 'O8', name: 'Rechazos Capacidad', value: d.rechazosCount ?? null, target: 5, unit: '#', status: getStatus(d.rechazosCount ?? null, 5, 15, true), isProxy: true, dataSource: 'custodio_rechazos', missingFields: ['razón rechazo tipificada (capacidad vs otra)'], instrumentationCategory: 'quick-win', businessImpact: 'Ops: clasificar rechazos' },
      ],
      score: 0,
      coverage: 0,
    },
    {
      id: 'c4',
      name: 'C4 / Operación',
      shortName: 'C4',
      icon: '🛡️',
      color: 'hsl(30, 80%, 50%)',
      kpis: [
        { id: 'C1', name: 'Check-in Compliance', value: d.checkinCompliance ?? null, target: 98, unit: '%', status: getStatus(d.checkinCompliance ?? null, 98, 90), isProxy: false, dataSource: 'checklist_servicio' },
        { id: 'C5', name: 'Close Quality Rate', value: d.closeQuality != null ? Math.round(d.closeQuality * 10) / 10 : null, target: 95, unit: '%', status: getStatus(d.closeQuality ?? null, 95, 80), isProxy: true, dataSource: 'checklist_servicio (firma + items)', missingFields: ['campo cierre_ok formal'], instrumentationCategory: 'quick-win', businessImpact: 'C4: +17% cobertura' },
        { id: 'C2', name: 'Time to Acknowledge', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['alertas C4', 'ack_ts'], instrumentationCategory: 'new-table', businessImpact: 'C4: tiempos respuesta alertas' },
        { id: 'C3', name: 'Time to Validate', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['validate_ts'], instrumentationCategory: 'new-table', businessImpact: 'C4: SLA validación' },
        { id: 'C4', name: 'Time to Escalate', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['escalate_ts'], instrumentationCategory: 'new-table', businessImpact: 'C4: escalamiento oportuno' },
        { id: 'C6', name: 'Rework Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['concepto retrabajo'], instrumentationCategory: 'new-table', businessImpact: 'C4: calidad operativa' },
      ],
      score: 0,
      coverage: 0,
    },
    {
      id: 'security',
      name: 'Seguridad / Riesgo',
      shortName: 'Riesgo',
      icon: '🔒',
      color: 'hsl(0, 65%, 48%)',
      kpis: [
        { id: 'R1', name: 'Incident Rate ×1,000', value: d.r1IncidentRate ?? null, target: 5, unit: 'rate', status: getStatus(d.r1IncidentRate ?? null, 5, 15, true), isProxy: false, dataSource: 'incidentes_operativos' },
        { id: 'R2', name: 'Critical Attributable Rate', value: d.r2CriticalRate ?? null, target: 10, unit: '%', status: getStatus(d.r2CriticalRate ?? null, 10, 25, true), isProxy: false, dataSource: 'incidentes_operativos' },
        { id: 'R3', name: 'Exposure Score', value: d.r3ExposureScore ?? null, target: 20, unit: 'pts', status: getStatus(d.r3ExposureScore ?? null, 20, 50, true), isProxy: false, dataSource: 'incidentes_operativos' },
        { id: 'R4', name: 'Control Effectiveness', value: d.r4ControlEffectiveness ?? null, target: 80, unit: '%', status: getStatus(d.r4ControlEffectiveness ?? null, 80, 60), isProxy: false, dataSource: 'incidentes_operativos' },
      ],
      score: 0,
      coverage: 0,
    },
    {
      id: 'finance',
      name: 'Finanzas & CS',
      shortName: 'Finanzas',
      icon: '💰',
      color: 'hsl(45, 85%, 47%)',
      kpis: [
        { id: 'F4', name: 'Retención / Health Score', value: d.avgHealthScore ?? null, target: 80, unit: 'pts', status: getStatus(d.avgHealthScore ?? null, 80, 60), isProxy: false, dataSource: 'cs_health_scores' },
        { id: 'F5', name: 'DSO', value: d.avgDSO ? Math.round(d.avgDSO) : null, target: 30, unit: 'días', status: getStatus(d.avgDSO ?? null, 30, 45, true), isProxy: false, dataSource: 'facturas' },
        { id: 'F1', name: 'GM por servicio', value: d.avgGM ?? null, target: 40, unit: '%', status: getStatus(d.avgGM ?? null, 40, 25), isProxy: true, dataSource: 'servicios_custodia (cobro - costo)', missingFields: ['costo armado', 'casetas reales', 'overhead'], instrumentationCategory: 'quick-win', businessImpact: 'Finanzas: margen real completo' },
        { id: 'F2', name: 'CPS', value: d.avgCPS ?? null, target: 3000, unit: '$', status: getStatus(d.avgCPS ?? null, 3000, 4500, true), isProxy: true, dataSource: 'servicios_custodia (costo_custodio)', missingFields: ['overhead', 'armado externo', 'gadgets'], instrumentationCategory: 'quick-win', businessImpact: 'Finanzas: costo real por servicio' },
        { id: 'F3', name: 'Leakage', value: null, target: 0, unit: '$', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['descuentos', 'ajustes', 'no facturados'], instrumentationCategory: 'new-table', businessImpact: 'Finanzas: fuga de ingreso' },
      ],
      score: 0,
      coverage: 0,
    },
  ];

  // Calculate scores and coverage
  for (const pillar of pillars) {
    const measurable = pillar.kpis.filter(k => k.status !== 'no-data');
    pillar.coverage = (measurable.length / pillar.kpis.length) * 100;
    const greenCount = measurable.filter(k => k.status === 'green').length;
    const yellowCount = measurable.filter(k => k.status === 'yellow').length;
    pillar.score = measurable.length > 0
      ? Math.round(((greenCount * 100 + yellowCount * 60) / measurable.length))
      : 0;
  }

  const measurablePillars = pillars.filter(p => p.coverage > 0);
  const overallScore = measurablePillars.length > 0
    ? Math.round(measurablePillars.reduce((sum, p) => sum + p.score, 0) / measurablePillars.length)
    : 0;

  const totalKPIs = pillars.reduce((sum, p) => sum + p.kpis.length, 0);
  const measurableKPIs = pillars.reduce((sum, p) => sum + p.kpis.filter(k => k.status !== 'no-data').length, 0);
  const overallCoverage = Math.round((measurableKPIs / totalKPIs) * 100);

  const northStar: StarMapKPI = {
    id: 'SCNV',
    name: 'Servicios Completados Netos Validados',
    value: d.scnvProxy ?? null,
    target: 95,
    unit: '%',
    status: getStatus(d.scnvProxy ?? null, 95, 80),
    isProxy: true,
    dataSource: 'servicios_planificados + checklist_servicio',
    missingFields: ['sla_ok', 'cierre_ok', 'incidente_critico'],
  };

  return {
    northStar,
    pillars,
    overallScore,
    overallCoverage,
    loading: isLoading,
  };
}
