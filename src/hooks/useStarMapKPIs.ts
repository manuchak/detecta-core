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
}

export interface StarMapPillar {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  kpis: StarMapKPI[];
  score: number; // 0-100
  coverage: number; // % of KPIs measurable
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
    // Lower is better (e.g., time to assign)
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
      // Execute all queries in parallel
      const [
        dealsRes,
        planificadosRes,
        checklistRes,
        custodiosRes,
        documentosRes,
        facturasRes,
        healthScoresRes,
      ] = await Promise.all([
        // CRM deals for Win Rate
        supabase.from('crm_deals').select('id, status, value').eq('is_deleted', false),
        // Servicios planificados for Ops KPIs
        supabase.from('servicios_planificados')
          .select('id, custodio_asignado, armado_asignado, requiere_armado, estado_confirmacion_custodio, estado_planeacion, fecha_asignacion, created_at, hora_inicio_real, hora_fin_real')
          .gte('fecha_hora_cita', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
        // Checklists for evidence
        supabase.from('checklist_servicio')
          .select('id, servicio_id, firma_base64, items_inspeccion, estado')
          .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
        // Custodios for activation rate
        supabase.from('custodios_operativos')
          .select('id, estado, created_at')
          .eq('estado', 'activo'),
        // Documents compliance
        supabase.from('documentos_custodio')
          .select('id, custodio_id, estado_validacion, fecha_vencimiento')
          .eq('estado_validacion', 'aprobado'),
        // Facturas for DSO
        supabase.from('facturas')
          .select('id, fecha_emision, fecha_pago, monto_total, estado')
          .gte('fecha_emision', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()),
        // CS Health scores
        supabase.from('cs_health_scores')
          .select('id, cliente, health_score, churn_risk')
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      const deals = dealsRes.data || [];
      const planificados = planificadosRes.data || [];
      const checklists = checklistRes.data || [];
      const custodios = custodiosRes.data || [];
      const documentos = documentosRes.data || [];
      const facturas = facturasRes.data || [];
      const healthScores = healthScoresRes.data || [];

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

      // === PILAR 2: Tech ===
      // TP7: Evidence Capture Pass Rate
      const completedChecklists = checklists.filter(c => c.firma_base64 && c.items_inspeccion);
      const evidenceRate = serviciosFinalizados.length > 0
        ? (completedChecklists.length / serviciosFinalizados.length) * 100
        : null;

      // === PILAR 3: Ops/Supply ===
      // O1: Fill Rate E2E
      const totalPlanificados = planificados.filter(s => s.estado_planeacion !== 'cancelado');
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

      // O4: Time to Assign (minutes)
      const assignTimes = totalPlanificados
        .filter(s => s.fecha_asignacion && s.created_at)
        .map(s => {
          const diff = new Date(s.fecha_asignacion).getTime() - new Date(s.created_at).getTime();
          return diff / (1000 * 60); // minutes
        })
        .filter(t => t > 0 && t < 10080); // filter outliers (>1 week)
      const avgTimeToAssign = assignTimes.length > 0
        ? assignTimes.reduce((a, b) => a + b, 0) / assignTimes.length
        : null;

      // O6: Activation (new custodians this month)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newCustodians = custodios.filter(c => 
        new Date(c.created_at) >= thisMonth
      ).length;

      // O7: Document Compliance
      const now = new Date();
      const validDocs = documentos.filter(d => 
        !d.fecha_vencimiento || new Date(d.fecha_vencimiento) > now
      ).length;
      const docCompliance = documentos.length > 0
        ? (validDocs / documentos.length) * 100
        : null;

      // === PILAR 4: C4 ===
      // C1: Check-in Compliance
      const checkinCompliance = serviciosFinalizados.length > 0
        ? (checklists.length / serviciosFinalizados.length) * 100
        : null;

      // === PILAR 6: Finanzas ===
      // F4: Retention (from CS health scores)
      const avgHealthScore = healthScores.length > 0
        ? healthScores.reduce((sum, h) => sum + (h.health_score || 0), 0) / healthScores.length
        : null;

      // F5: DSO
      const paidFacturas = facturas.filter(f => f.fecha_pago && f.fecha_emision);
      const dsoValues = paidFacturas.map(f => {
        const diff = new Date(f.fecha_pago).getTime() - new Date(f.fecha_emision).getTime();
        return diff / (1000 * 60 * 60 * 24); // days
      }).filter(d => d > 0 && d < 365);
      const avgDSO = dsoValues.length > 0
        ? dsoValues.reduce((a, b) => a + b, 0) / dsoValues.length
        : null;

      return {
        scnvProxy,
        winRate,
        evidenceRate,
        fillRate,
        confirmRate,
        avgTimeToAssign,
        newCustodians,
        docCompliance,
        checkinCompliance,
        avgHealthScore,
        avgDSO,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const d = data || {};

  // Build pillars
  const pillars: StarMapPillar[] = [
    {
      id: 'gtm',
      name: 'GTM / Growth',
      shortName: 'GTM',
      icon: '🎯',
      color: 'hsl(210, 70%, 50%)',
      kpis: [
        { id: 'S3', name: 'Win Rate', value: d.winRate ?? null, target: 35, unit: '%', status: getStatus(d.winRate ?? null, 35, 20), isProxy: false, dataSource: 'crm_deals' },
        { id: 'M1', name: 'Solicitudes Operables', value: null, target: 0, unit: '#', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['status OPERABLE', 'checklist campos mínimos'] },
        { id: 'M2', name: 'SQL → Operable Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['etapa SQL', 'etapa OPERABLE'] },
        { id: 'M3', name: 'Fit Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['cobertura zona', 'capacidad servicio'] },
        { id: 'M5', name: 'Lead Response Time', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['lead_created_ts', 'first_contact_ts'] },
        { id: 'S2', name: 'Quote Turnaround Time', value: null, target: 0, unit: 'h', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['quote_sent_ts', 'operable_ts'] },
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
        { id: 'TP1', name: 'E2E Traceability Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['join key CRM→servicio', 'flag trazabilidad'] },
        { id: 'TP2', name: 'Timestamp Completeness', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['operable_ts', 'quote_sent_ts', 'closed_ok_ts'] },
        { id: 'TP9', name: 'Integration Reliability', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['logs integración', 'reconciliación'] },
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
        { id: 'O4', name: 'Time to Assign', value: d.avgTimeToAssign ? Math.round(d.avgTimeToAssign) : null, target: 30, unit: 'min', status: getStatus(d.avgTimeToAssign ?? null, 30, 60, true), isProxy: false, dataSource: 'servicios_planificados' },
        { id: 'O6', name: 'Activación Base', value: d.newCustodians ?? null, target: 5, unit: '#/mes', status: getStatus(d.newCustodians ?? null, 5, 2), isProxy: false, dataSource: 'custodios_operativos' },
        { id: 'O7', name: 'Document Compliance', value: d.docCompliance ?? null, target: 95, unit: '%', status: getStatus(d.docCompliance ?? null, 95, 80), isProxy: false, dataSource: 'documentos_custodio' },
        { id: 'O3', name: 'No-Show Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['flag no_show explícito'] },
        { id: 'O5', name: 'Coverage Index', value: null, target: 0, unit: 'ratio', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['capacidad neta por zona'] },
        { id: 'O8', name: 'Rechazos Capacidad', value: null, target: 0, unit: '#', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['razón rechazo tipificada'] },
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
        { id: 'C2', name: 'Time to Acknowledge', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['alertas C4', 'ack_ts'] },
        { id: 'C3', name: 'Time to Validate', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['validate_ts'] },
        { id: 'C4', name: 'Time to Escalate', value: null, target: 0, unit: 'min', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['escalate_ts'] },
        { id: 'C5', name: 'Close Quality Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['campo cierre_ok'] },
        { id: 'C6', name: 'Rework Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['concepto retrabajo'] },
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
        { id: 'R1', name: 'Incident Rate ×1,000', value: null, target: 0, unit: 'rate', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['tabla incidentes operativos'] },
        { id: 'R2', name: 'Critical Attributable Rate', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['taxonomía incidentes'] },
        { id: 'R3', name: 'Exposure Score', value: null, target: 0, unit: 'pts', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['modelo exposición'] },
        { id: 'R4', name: 'Control Effectiveness', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['datos mitigantes'] },
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
        { id: 'F1', name: 'GM por servicio', value: null, target: 0, unit: '%', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['costo armado', 'casetas reales', 'overhead'] },
        { id: 'F2', name: 'CPS', value: null, target: 0, unit: '$', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['overhead', 'armado externo'] },
        { id: 'F3', name: 'Leakage', value: null, target: 0, unit: '$', status: 'no-data', isProxy: false, dataSource: '', missingFields: ['descuentos', 'ajustes', 'no facturados'] },
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
