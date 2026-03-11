import { useState, useMemo, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EvaluationHeroStatus } from './EvaluationHeroStatus';
import { StructuredInterviewForm } from './interviews/StructuredInterviewForm';
import { RiskChecklistForm, RiskLevelBadge } from './risk/RiskChecklistForm';
import { CandidateStateTimeline, CandidateStateProgress } from './state/CandidateStateTimeline';
import { PsychometricEvaluationTab } from './psychometrics/PsychometricEvaluationTab';
import { SemaforoBadge } from './psychometrics/SemaforoBadge';
import { MidotEvaluationTab } from './midot/MidotEvaluationTab';
import { MidotBadge } from './midot/MidotBadge';
import { ToxicologyTab } from './toxicology/ToxicologyTab';
import { ToxicologyBadge } from './toxicology/ToxicologyBadge';
import { ReferencesTab } from './references/ReferencesTab';
import { ReferencesProgressBadge } from './references/ReferencesProgressBadge';
import { DocumentsTab } from './documents/DocumentsTab';
import { DocumentsProgressBadge } from './documents/DocumentsProgressBadge';
import { ContractsTab } from './contracts/ContractsTab';
import { ContractsProgressBadge } from './contracts/ContractsProgressBadge';
import { TrainingTab } from '@/components/leads/evaluaciones/TrainingTab';
import { TrainingProgressBadge } from '@/components/leads/evaluaciones/TrainingProgressBadge';
import { InstallationTab } from '@/components/leads/evaluaciones/InstallationTab';
import { InstallationProgressBadge } from '@/components/leads/evaluaciones/InstallationProgressBadge';
import { SocioeconomicoTab } from './socioeconomico/SocioeconomicoTab';
import { SocioeconomicoBadge } from './socioeconomico/SocioeconomicoBadge';
import { PersonalDataTab, computePersonalDataCompletion } from './personal/PersonalDataTab';
import { PersonalDataBadge } from './personal/PersonalDataBadge';
import { LiberacionSuccessModal } from '@/components/liberacion/LiberacionSuccessModal';
import { useStructuredInterviews } from '@/hooks/useStructuredInterview';
import { useRiskChecklist } from '@/hooks/useRiskChecklist';
import { useLatestEvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { useLatestMidot } from '@/hooks/useEvaluacionesMidot';
import { useLatestToxicologia } from '@/hooks/useEvaluacionesToxicologicas';
import { useLatestEstudioSocioeconomico } from '@/hooks/useEstudioSocioeconomico';
import { useDocumentosProgress } from '@/hooks/useDocumentosCandidato';
import { useContratosProgress } from '@/hooks/useContratosCandidato';
import { useReferenciasProgress } from '@/hooks/useReferencias';
import { useProgramacionInstalacionesCandidato } from '@/hooks/useProgramacionInstalacionesCandidato';
import { useCapacitacion } from '@/hooks/useCapacitacion';
import { useCustodioLiberacion } from '@/hooks/useCustodioLiberacion';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { 
  User, Loader2, Plus, Star, Clock,
  MessageSquare, Shield, Brain, ShieldCheck, TestTube,
  FileText, FileSignature, Users, GraduationCap, Cpu, Home,
  GitBranch, ChevronDown, CheckCircle2, XCircle, AlertTriangle, Info,
  UserCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
  currentState?: string;
  tipoOperativo?: 'custodio' | 'armado';
  isOpen: boolean;
  onClose: () => void;
}

type GateLevel = 'blocker' | 'warning' | 'info';

interface Gate {
  id: string;
  label: string;
  level: GateLevel;
  passed: boolean;
  detail: string;
  tabTarget?: string;
}

// Section item config
interface SectionItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  content: React.ReactNode;
  gate?: Gate;
}

export function CandidateEvaluationPanel({ candidatoId, candidatoNombre, currentState, tipoOperativo = 'custodio', isOpen, onClose }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const [isLiberating, setIsLiberating] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const blockersRef = useRef<HTMLDivElement>(null);

  // Data hooks
  const { data: interviews, isLoading: loadingInterviews } = useStructuredInterviews(candidatoId);
  const { data: riskChecklist } = useRiskChecklist(candidatoId);
  const { data: latestPsicometrico } = useLatestEvaluacionPsicometrica(candidatoId);
  const { data: latestToxicologia } = useLatestToxicologia(candidatoId);
  const latestMidot = useLatestMidot(candidatoId);
  const latestSocioeconomico = useLatestEstudioSocioeconomico(candidatoId);
  const docsProgress = useDocumentosProgress(candidatoId, tipoOperativo);
  const contractsProgress = useContratosProgress(candidatoId);
  const { data: refsProgress } = useReferenciasProgress(candidatoId);
  const { instalacionCompletada, ultimaInstalacion } = useProgramacionInstalacionesCandidato(candidatoId);
  const { modulos, progreso, calcularProgresoGeneral } = useCapacitacion(candidatoId);
  const { liberarCustodio } = useCustodioLiberacion();

  const { data: candidatoData } = useQuery({
    queryKey: ['candidato-vehiculo', candidatoId],
    queryFn: async () => {
      const { data } = await supabase.from('candidatos_custodios').select('vehiculo_propio, nombre, telefono, email, curp, direccion, marca_vehiculo, modelo_vehiculo, placas_vehiculo, color_vehiculo, numero_serie, numero_motor, numero_licencia').eq('id', candidatoId).single();
      return data;
    },
    enabled: !!candidatoId,
  });

  const { data: liberacionRecord, isLoading: loadingLib } = useQuery({
    queryKey: ['custodio-liberacion-by-candidato', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase.from('custodio_liberacion').select('*').eq('candidato_id', candidatoId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!candidatoId,
  });

  const { data: invitationToken } = useQuery({
    queryKey: ['custodian-invitation-token', candidatoId],
    queryFn: async () => {
      const { data } = await supabase
        .from('custodian_invitations')
        .select('token')
        .eq('candidato_id', candidatoId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data?.token ?? null;
    },
    enabled: !!candidatoId,
  });

  const vehiculoPropio = candidatoData?.vehiculo_propio ?? false;
  const latestInterview = interviews?.[0];

  // Training
  const trainingComplete = useMemo(() => {
    const stats = calcularProgresoGeneral();
    return stats?.capacitacion_completa ?? false;
  }, [calcularProgresoGeneral]);

  // Compute gates
  const gates: Gate[] = useMemo(() => {
    const g: Gate[] = [];

    // BLOCKERS
    g.push({
      id: 'docs', label: 'Documentación completa', level: 'blocker',
      passed: docsProgress.isComplete,
      detail: docsProgress.isComplete ? `${docsProgress.completados}/${docsProgress.totalRequeridos} validados` : `Faltan ${docsProgress.totalRequeridos - docsProgress.completados} documentos`,
      tabTarget: 'documents',
    });

    const toxicoOk = latestToxicologia?.resultado === 'negativo';
    g.push({
      id: 'toxico', label: 'Toxicológico negativo', level: 'blocker',
      passed: toxicoOk,
      detail: !latestToxicologia ? 'Sin resultado registrado' : latestToxicologia.resultado === 'positivo' ? 'Resultado POSITIVO' : 'Negativo verificado',
      tabTarget: 'toxicology',
    });

    g.push({
      id: 'socio', label: 'Socioeconómico no desfavorable', level: 'blocker',
      passed: !latestSocioeconomico || latestSocioeconomico.resultado_general !== 'desfavorable',
      detail: !latestSocioeconomico ? 'Sin estudio — se puede proceder' : latestSocioeconomico.resultado_general === 'desfavorable' ? 'DESFAVORABLE' : `${latestSocioeconomico.resultado_general}`,
      tabTarget: 'socioeconomico',
    });

    // WARNINGS
    g.push({
      id: 'interview', label: 'Entrevista estructurada', level: 'warning',
      passed: !!latestInterview,
      detail: latestInterview ? `Rating: ${latestInterview.rating_promedio?.toFixed(1)}/5` : 'Sin entrevista registrada',
      tabTarget: 'interview',
    });

    g.push({
      id: 'risk', label: 'Checklist de riesgo', level: 'warning',
      passed: !!riskChecklist,
      detail: riskChecklist ? `Nivel: ${riskChecklist.risk_level}` : 'Sin evaluación de riesgo',
      tabTarget: 'risk',
    });

    g.push({
      id: 'psico', label: 'Evaluación psicométrica', level: 'warning',
      passed: !!latestPsicometrico,
      detail: latestPsicometrico ? `Score: ${latestPsicometrico.score_global}` : 'Sin evaluación',
      tabTarget: 'psychometric',
    });

    g.push({
      id: 'midot', label: 'Evaluación Midot', level: 'warning',
      passed: !!latestMidot,
      detail: latestMidot ? `${latestMidot.resultado_semaforo}` : 'Sin evaluación',
      tabTarget: 'midot',
    });

    g.push({
      id: 'contracts', label: 'Contratos firmados', level: 'warning',
      passed: contractsProgress.isComplete,
      detail: `${contractsProgress.firmados}/${contractsProgress.totalRequeridos} contratos`,
      tabTarget: 'contracts',
    });

    g.push({
      id: 'training', label: 'Capacitación completa', level: 'warning',
      passed: trainingComplete,
      detail: trainingComplete ? 'Módulos completados' : 'Pendiente',
      tabTarget: 'training',
    });

    const refsOk = (refsProgress?.totalOk ?? 0) >= 4;
    g.push({
      id: 'refs', label: 'Referencias verificadas (4/4)', level: 'warning',
      passed: refsOk,
      detail: `${refsProgress?.totalOk ?? 0}/${refsProgress?.totalRefs ?? 0} verificadas`,
      tabTarget: 'references',
    });

    // INFO
    g.push({
      id: 'gps', label: 'GPS instalado', level: 'info',
      passed: instalacionCompletada,
      detail: !ultimaInstalacion ? 'Opcional — sin instalación' : `Estado: ${ultimaInstalacion.estado}`,
      tabTarget: 'installation',
    });

    const personalCompletion = computePersonalDataCompletion(candidatoData);
    const personalHasBasics = !!(candidatoData?.nombre && candidatoData?.telefono && candidatoData?.email);
    g.push({
      id: 'personal_data', label: 'Datos personales verificados', level: 'info',
      passed: personalHasBasics,
      detail: `${personalCompletion.completed}/${personalCompletion.total} campos completados`,
      tabTarget: 'personal_data',
    });

    return g;
  }, [docsProgress, latestToxicologia, latestSocioeconomico, latestInterview, riskChecklist, latestPsicometrico, latestMidot, contractsProgress, trainingComplete, refsProgress, instalacionCompletada, ultimaInstalacion]);

  const blockers = gates.filter(g => g.level === 'blocker' && !g.passed);
  const warnings = gates.filter(g => g.level === 'warning' && !g.passed);
  const passed = gates.filter(g => g.passed);
  const canRelease = blockers.length === 0;
  const isAlreadyReleased = liberacionRecord?.estado_liberacion === 'liberado';

  const toggleSection = useCallback((id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const queryClient = useQueryClient();

  const handleRelease = async () => {
    setIsLiberating(true);
    let autoCreatedId: string | null = null;
    try {
      let libId = liberacionRecord?.id;
      // Auto-create liberación record if it doesn't exist
      if (!libId) {
        const { data: newRec, error } = await supabase
          .from('custodio_liberacion')
          .insert({ candidato_id: candidatoId, estado_liberacion: 'aprobado_final' })
          .select('id')
          .single();
        if (error || !newRec) throw error || new Error('No se pudo crear el registro de liberación');
        libId = newRec.id;
        autoCreatedId = libId;
      }
      const result = await liberarCustodio.mutateAsync({ liberacion_id: libId, forzar: true });
      setSuccessData(result);
      // Invalidate to reflect released state immediately
      queryClient.invalidateQueries({ queryKey: ['custodio-liberacion-by-candidato', candidatoId] });
      queryClient.invalidateQueries({ queryKey: ['custodian-invitation-token', candidatoId] });
    } catch (err) {
      // Cleanup ghost record if we auto-created it and the RPC failed
      if (autoCreatedId) {
        await supabase.from('custodio_liberacion').delete().eq('id', autoCreatedId);
      }
      throw err;
    } finally {
      setIsLiberating(false);
    }
  };

  // Build section items with content
  const sectionItems: SectionItem[] = useMemo(() => [
    {
      id: 'personal_data', label: 'Datos Personales', icon: <UserCircle className="h-4 w-4" />,
      badge: <PersonalDataBadge candidatoId={candidatoId} size="sm" />,
      gate: gates.find(g => g.id === 'personal_data'),
      content: <PersonalDataTab candidatoId={candidatoId} />,
    },
    {
      id: 'interview', label: 'Entrevista', icon: <MessageSquare className="h-4 w-4" />,
      badge: latestInterview ? <Badge variant="outline" className="text-xs gap-1"><Star className="h-2.5 w-2.5" />{latestInterview.rating_promedio?.toFixed(1)}</Badge> : null,
      gate: gates.find(g => g.id === 'interview'),
      content: showInterviewForm ? (
        <StructuredInterviewForm candidatoId={candidatoId} candidatoNombre={candidatoNombre} onClose={() => setShowInterviewForm(false)} onSuccess={() => setShowInterviewForm(false)} />
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-sm">Entrevistas</h3>
            <Button onClick={() => setShowInterviewForm(true)} size="sm" variant="outline"><Plus className="h-3.5 w-3.5 mr-1" />Nueva</Button>
          </div>
          {loadingInterviews ? (
            <div className="flex items-center justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : !interviews?.length ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin entrevistas registradas</p>
          ) : (
            <div className="space-y-2">
              {interviews.map((iv) => (
                <Card key={iv.id} className="bg-muted/30 border-border/50">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{iv.tipo_entrevista}</Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(iv.fecha_entrevista), "d MMM yyyy", { locale: es })}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge variant={iv.decision === 'aprobar' ? 'default' : iv.decision === 'rechazar' ? 'destructive' : 'secondary'} className="text-xs">
                          {iv.decision === 'aprobar' ? 'Aprobado' : iv.decision === 'rechazar' ? 'Rechazado' : 'Pendiente'}
                        </Badge>
                        <Badge variant="outline" className="text-xs gap-0.5"><Star className="h-2.5 w-2.5" />{iv.rating_promedio?.toFixed(1)}</Badge>
                      </div>
                    </div>
                    {iv.notas_generales && <p className="text-xs text-muted-foreground line-clamp-2">{iv.notas_generales}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'risk', label: 'Riesgo', icon: <Shield className="h-4 w-4" />,
      badge: riskChecklist ? <RiskLevelBadge level={riskChecklist.risk_level} /> : null,
      gate: gates.find(g => g.id === 'risk'),
      content: <RiskChecklistForm candidatoId={candidatoId} candidatoNombre={candidatoNombre} compact />,
    },
    {
      id: 'psychometric', label: 'Psicométricos', icon: <Brain className="h-4 w-4" />,
      badge: latestPsicometrico ? <SemaforoBadge resultado={latestPsicometrico.resultado_semaforo} size="sm" avalDecision={latestPsicometrico.aval_decision} /> : null,
      gate: gates.find(g => g.id === 'psico'),
      content: <PsychometricEvaluationTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />,
    },
    {
      id: 'midot', label: 'Midot', icon: <ShieldCheck className="h-4 w-4" />,
      badge: latestMidot ? <MidotBadge resultado={latestMidot.resultado_semaforo} size="sm" /> : null,
      gate: gates.find(g => g.id === 'midot'),
      content: <MidotEvaluationTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />,
    },
    {
      id: 'toxicology', label: 'Toxicológicos', icon: <TestTube className="h-4 w-4" />,
      badge: latestToxicologia ? <ToxicologyBadge resultado={latestToxicologia.resultado} size="sm" /> : null,
      gate: gates.find(g => g.id === 'toxico'),
      content: <ToxicologyTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />,
    },
    {
      id: 'documents', label: 'Documentación', icon: <FileText className="h-4 w-4" />,
      badge: <DocumentsProgressBadge candidatoId={candidatoId} size="sm" />,
      gate: gates.find(g => g.id === 'docs'),
      content: <DocumentsTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} tipoOperativo={tipoOperativo} />,
    },
    {
      id: 'contracts', label: 'Contratos', icon: <FileSignature className="h-4 w-4" />,
      badge: <ContractsProgressBadge candidatoId={candidatoId} size="sm" />,
      gate: gates.find(g => g.id === 'contracts'),
      content: <ContractsTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} vehiculoPropio={vehiculoPropio} />,
    },
    {
      id: 'references', label: 'Referencias', icon: <Users className="h-4 w-4" />,
      badge: <ReferencesProgressBadge candidatoId={candidatoId} size="sm" />,
      gate: gates.find(g => g.id === 'refs'),
      content: <ReferencesTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />,
    },
    {
      id: 'training', label: 'Capacitación', icon: <GraduationCap className="h-4 w-4" />,
      badge: <TrainingProgressBadge candidatoId={candidatoId} size="sm" />,
      gate: gates.find(g => g.id === 'training'),
      content: <TrainingTab candidatoId={candidatoId} />,
    },
    {
      id: 'installation', label: 'GPS', icon: <Cpu className="h-4 w-4" />,
      badge: <InstallationProgressBadge candidatoId={candidatoId} size="sm" />,
      gate: gates.find(g => g.id === 'gps'),
      content: <InstallationTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />,
    },
    {
      id: 'socioeconomico', label: 'Socioeconómico', icon: <Home className="h-4 w-4" />,
      badge: latestSocioeconomico ? <SocioeconomicoBadge estudio={latestSocioeconomico} size="sm" /> : null,
      gate: gates.find(g => g.id === 'socio'),
      content: <SocioeconomicoTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />,
    },
  ], [candidatoId, candidatoNombre, tipoOperativo, vehiculoPropio, gates, interviews, loadingInterviews, latestInterview, riskChecklist, latestPsicometrico, latestMidot, latestToxicologia, latestSocioeconomico, showInterviewForm]);

  // Group sections by gate status
  const blockerItems = sectionItems.filter(s => s.gate && s.gate.level === 'blocker' && !s.gate.passed);
  const warningItems = sectionItems.filter(s => s.gate && s.gate.level === 'warning' && !s.gate.passed);
  const passedItems = sectionItems.filter(s => s.gate?.passed);
  const infoItems = sectionItems.filter(s => s.gate && s.gate.level === 'info' && !s.gate.passed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-4xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
            <User className="h-5 w-5" />
            <span className="truncate">Evaluación de {candidatoNombre}</span>
          </DialogTitle>
        </DialogHeader>

        {/* Hero Status */}
        <EvaluationHeroStatus
          candidatoNombre={candidatoNombre}
          gates={gates}
          canRelease={canRelease}
          isLiberating={isLiberating}
          isAlreadyReleased={isAlreadyReleased}
          invitationToken={invitationToken ?? undefined}
          onRelease={handleRelease}
          onScrollToBlockers={() => blockersRef.current?.scrollIntoView({ behavior: 'smooth' })}
        />


        {/* Sections */}
        <div className="space-y-4 mt-4">
          {/* BLOCKERS */}
          {blockerItems.length > 0 && (
            <SectionGroup
              ref={blockersRef}
              title={`Bloqueos — ${blockerItems.length}`}
              variant="destructive"
              icon={<XCircle className="h-4 w-4" />}
              defaultOpen
            >
              {blockerItems.map(item => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isExpanded={expandedSections.has(item.id)}
                  onToggle={() => toggleSection(item.id)}
                  statusIcon={<XCircle className="h-3.5 w-3.5 text-destructive" />}
                />
              ))}
            </SectionGroup>
          )}

          {/* WARNINGS */}
          {warningItems.length > 0 && (
            <SectionGroup
              title={`Advertencias — ${warningItems.length}`}
              variant="warning"
              icon={<AlertTriangle className="h-4 w-4" />}
              defaultOpen={blockerItems.length === 0}
            >
              {warningItems.map(item => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isExpanded={expandedSections.has(item.id)}
                  onToggle={() => toggleSection(item.id)}
                  statusIcon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--warning))]" />}
                />
              ))}
            </SectionGroup>
          )}

          {/* INFO */}
          {infoItems.length > 0 && (
            <SectionGroup
              title="Informativos"
              variant="info"
              icon={<Info className="h-4 w-4" />}
            >
              {infoItems.map(item => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isExpanded={expandedSections.has(item.id)}
                  onToggle={() => toggleSection(item.id)}
                  statusIcon={<Info className="h-3.5 w-3.5 text-muted-foreground" />}
                />
              ))}
            </SectionGroup>
          )}

          {/* COMPLETED */}
          {passedItems.length > 0 && (
            <SectionGroup
              title={`Completado — ${passedItems.length}`}
              variant="success"
              icon={<CheckCircle2 className="h-4 w-4" />}
            >
              {passedItems.map(item => (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isExpanded={expandedSections.has(item.id)}
                  onToggle={() => toggleSection(item.id)}
                  statusIcon={<CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--success))]" />}
                />
              ))}
            </SectionGroup>
          )}

          {/* Timeline — always available */}
          <SectionGroup title="Historial" variant="info" icon={<GitBranch className="h-4 w-4" />}>
            <div className="px-1">
              <button
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-muted/70 transition-colors"
                onClick={() => toggleSection('timeline')}
              >
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium flex-1">Timeline de estados</span>
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedSections.has('timeline') && "rotate-180")} />
              </button>
              {expandedSections.has('timeline') && (
                <div className="px-3 pb-3">
                  <CandidateStateTimeline candidatoId={candidatoId} currentState={currentState} />
                </div>
              )}
            </div>
          </SectionGroup>
        </div>

        {successData && (
          <LiberacionSuccessModal isOpen={!!successData} onClose={() => setSuccessData(null)} data={successData} />
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components ---

import { forwardRef } from 'react';

const SectionGroup = forwardRef<HTMLDivElement, {
  title: string;
  variant: 'destructive' | 'warning' | 'success' | 'info';
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}>(({ title, variant, icon, defaultOpen = false, children }, ref) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const styles = {
    destructive: { border: 'border-destructive/20', text: 'text-destructive', bg: 'bg-destructive/5' },
    warning: { border: 'border-[hsl(var(--warning))]/20', text: 'text-[hsl(var(--warning))]', bg: 'bg-[hsl(var(--warning))]/5' },
    success: { border: 'border-[hsl(var(--success))]/20', text: 'text-[hsl(var(--success))]', bg: 'bg-[hsl(var(--success))]/5' },
    info: { border: 'border-border', text: 'text-muted-foreground', bg: 'bg-muted/30' },
  }[variant];

  return (
    <div ref={ref} className={cn('rounded-xl border overflow-hidden', styles.border)}>
      <button
        className={cn('w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/30', isOpen && styles.bg)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={styles.text}>{icon}</span>
        <span className="text-sm font-semibold flex-1">{title}</span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", isOpen && "rotate-180")} />
      </button>
      {isOpen && <div className="px-2 pb-2 space-y-0.5">{children}</div>}
    </div>
  );
});
SectionGroup.displayName = 'SectionGroup';

function AccordionItem({ item, isExpanded, onToggle, statusIcon }: {
  item: SectionItem;
  isExpanded: boolean;
  onToggle: () => void;
  statusIcon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg overflow-hidden">
      <button
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors rounded-lg",
          isExpanded ? "bg-muted/50" : "hover:bg-muted/30"
        )}
        onClick={onToggle}
      >
        {statusIcon}
        <span className="text-muted-foreground">{item.icon}</span>
        <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
        {!isExpanded && item.badge && <span className="shrink-0">{item.badge}</span>}
        {item.gate && !item.gate.passed && (
          <span className="text-xs text-muted-foreground truncate max-w-[140px]">{item.gate.detail}</span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200 shrink-0", isExpanded && "rotate-180")} />
      </button>
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border/50 mt-0.5">
          {item.content}
        </div>
      )}
    </div>
  );
}
