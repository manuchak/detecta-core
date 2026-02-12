import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { useStructuredInterviews } from '@/hooks/useStructuredInterview';
import { useRiskChecklist } from '@/hooks/useRiskChecklist';
import { useLatestEvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { useLatestMidot } from '@/hooks/useEvaluacionesMidot';
import { useLatestToxicologia } from '@/hooks/useEvaluacionesToxicologicas';
import { 
  MessageSquare, 
  Shield, 
  GitBranch, 
  Star, 
  Clock,
  Plus,
  User,
  Loader2,
  Brain,
  TestTube,
  Users,
  FileText,
  FileSignature,
  GraduationCap,
  Cpu,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
  currentState?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CandidateEvaluationPanel({ candidatoId, candidatoNombre, currentState, isOpen, onClose }: Props) {
  const [showInterviewForm, setShowInterviewForm] = useState(false);
  const { data: interviews, isLoading: loadingInterviews } = useStructuredInterviews(candidatoId);
  const { data: riskChecklist, isLoading: loadingRisk } = useRiskChecklist(candidatoId);
  const { data: latestPsicometrico } = useLatestEvaluacionPsicometrica(candidatoId);
  const { data: latestToxicologia } = useLatestToxicologia(candidatoId);
  const latestMidot = useLatestMidot(candidatoId);

  const latestInterview = interviews?.[0];

  // Calculate completion progress
  const completionInfo = useMemo(() => {
    const items = [
      { name: 'Entrevista', done: !!latestInterview },
      { name: 'Riesgo', done: !!riskChecklist },
      { name: 'Psicométricos', done: !!latestPsicometrico },
      { name: 'Midot', done: !!latestMidot },
      { name: 'Toxicológicos', done: !!latestToxicologia },
    ];
    const completed = items.filter(i => i.done).length;
    return { completed, total: items.length, percentage: Math.round((completed / items.length) * 100) };
  }, [latestInterview, riskChecklist, latestPsicometrico, latestMidot, latestToxicologia]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:max-w-6xl overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-base sm:text-lg">
            <User className="h-5 w-5" />
            <span className="truncate">Evaluación de {candidatoNombre}</span>
          </DialogTitle>
          {/* Progress bar */}
          <div className="flex items-center gap-3 mt-2">
            <Progress value={completionInfo.percentage} className="h-2 flex-1" />
            <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">
              {completionInfo.completed}/{completionInfo.total} evaluaciones
            </span>
          </div>
        </DialogHeader>

        {currentState && (
          <div className="mb-4">
            <CandidateStateProgress currentState={currentState} />
          </div>
        )}

        <Tabs defaultValue="interview" className="w-full">
          {/* Group labels visible on desktop */}
          <div className="hidden sm:flex gap-1 text-[10px] text-muted-foreground mb-1 px-1">
            <span className="w-[350px]">── Evaluación Core ──</span>
            <span className="w-[210px]">── Documentación ──</span>
            <span className="w-[140px]">── Preparación ──</span>
          </div>
          <TabsList className="flex w-full overflow-x-auto justify-start gap-0.5 h-auto p-1">
            {/* EVALUACIÓN CORE */}
            <TabsTrigger value="interview" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Entrevista</span>
              {latestInterview && (
                <Badge variant="secondary" className="ml-0.5 text-xs px-1">
                  <Star className="h-2 w-2 mr-0.5" />
                  {latestInterview.rating_promedio?.toFixed(1)}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <Shield className="h-3.5 w-3.5" />
              <span>Riesgo</span>
              {riskChecklist && <RiskLevelBadge level={riskChecklist.risk_level} />}
            </TabsTrigger>
            <TabsTrigger value="psychometric" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <Brain className="h-3.5 w-3.5" />
              <span>Psico</span>
              {latestPsicometrico && (
                <SemaforoBadge resultado={latestPsicometrico.resultado_semaforo} size="sm" avalDecision={latestPsicometrico.aval_decision} />
              )}
            </TabsTrigger>
            <TabsTrigger value="midot" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Midot</span>
              {latestMidot && <MidotBadge resultado={latestMidot.resultado_semaforo} size="sm" />}
            </TabsTrigger>
            <TabsTrigger value="toxicology" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <TestTube className="h-3.5 w-3.5" />
              <span>Tóxico</span>
              {latestToxicologia && <ToxicologyBadge resultado={latestToxicologia.resultado} size="sm" />}
            </TabsTrigger>

            {/* DOCUMENTACIÓN */}
            <TabsTrigger value="documents" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <FileText className="h-3.5 w-3.5" />
              <span>Docs</span>
              <DocumentsProgressBadge candidatoId={candidatoId} size="sm" />
            </TabsTrigger>
            <TabsTrigger value="contracts" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <FileSignature className="h-3.5 w-3.5" />
              <span>Contratos</span>
              <ContractsProgressBadge candidatoId={candidatoId} size="sm" />
            </TabsTrigger>
            <TabsTrigger value="references" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <Users className="h-3.5 w-3.5" />
              <span>Refs</span>
              <ReferencesProgressBadge candidatoId={candidatoId} size="sm" />
            </TabsTrigger>

            {/* PREPARACIÓN */}
            <TabsTrigger value="training" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Capacitación</span>
              <TrainingProgressBadge candidatoId={candidatoId} size="sm" />
            </TabsTrigger>
            <TabsTrigger value="installation" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <Cpu className="h-3.5 w-3.5" />
              <span>GPS</span>
              <InstallationProgressBadge candidatoId={candidatoId} size="sm" />
            </TabsTrigger>

            {/* INFO */}
            <TabsTrigger value="timeline" className="flex items-center gap-1 text-xs px-2 py-2 min-w-[70px] shrink-0">
              <GitBranch className="h-3.5 w-3.5" />
              <span>Historial</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="interview" className="mt-4">
            {showInterviewForm ? (
              <StructuredInterviewForm candidatoId={candidatoId} candidatoNombre={candidatoNombre} onClose={() => setShowInterviewForm(false)} onSuccess={() => setShowInterviewForm(false)} />
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold">Entrevistas Realizadas</h3>
                  <Button onClick={() => setShowInterviewForm(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />Nueva Entrevista
                  </Button>
                </div>
                {loadingInterviews ? (
                  <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : !interviews || interviews.length === 0 ? (
                  <Card><CardContent className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>No hay entrevistas registradas</p>
                    <Button variant="outline" className="mt-4" onClick={() => setShowInterviewForm(true)}>Registrar Primera Entrevista</Button>
                  </CardContent></Card>
                ) : (
                  <div className="space-y-3">
                    {interviews.map((interview) => (
                      <Card key={interview.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base flex items-center justify-between">
                            <span className="flex items-center gap-2">
                              <Badge variant="outline">{interview.tipo_entrevista}</Badge>
                              {format(new Date(interview.fecha_entrevista), "d MMM yyyy", { locale: es })}
                            </span>
                            <div className="flex items-center gap-2">
                              <Badge variant={interview.decision === 'aprobar' ? 'default' : interview.decision === 'rechazar' ? 'destructive' : 'secondary'}>
                                {interview.decision === 'aprobar' ? 'Aprobado' : interview.decision === 'rechazar' ? 'Rechazado' : interview.decision === 'segunda_entrevista' ? '2da Entrevista' : 'Pendiente'}
                              </Badge>
                              <Badge variant="outline" className="gap-1"><Star className="h-3 w-3" />{interview.rating_promedio?.toFixed(1)} / 5</Badge>
                            </div>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-6 gap-2 mb-3">
                            {[{ label: 'Comunicación', value: interview.rating_comunicacion },{ label: 'Actitud', value: interview.rating_actitud },{ label: 'Experiencia', value: interview.rating_experiencia },{ label: 'Disponibilidad', value: interview.rating_disponibilidad },{ label: 'Motivación', value: interview.rating_motivacion },{ label: 'Profesionalismo', value: interview.rating_profesionalismo }].map((item) => (
                              <div key={item.label} className="text-center"><div className="text-xs text-muted-foreground">{item.label}</div><div className="font-semibold">{item.value}/5</div></div>
                            ))}
                          </div>
                          {interview.notas_generales && <p className="text-sm text-muted-foreground border-t pt-2">{interview.notas_generales}</p>}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{interview.duracion_minutos} minutos</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="psychometric" className="mt-4">
            <PsychometricEvaluationTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />
          </TabsContent>

          <TabsContent value="toxicology" className="mt-4">
            <ToxicologyTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />
          </TabsContent>

          <TabsContent value="references" className="mt-4">
            <ReferencesTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />
          </TabsContent>

          <TabsContent value="midot" className="mt-4">
            <MidotEvaluationTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />
          </TabsContent>

          <TabsContent value="risk" className="mt-4">
            <RiskChecklistForm candidatoId={candidatoId} candidatoNombre={candidatoNombre} compact />
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <DocumentsTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />
          </TabsContent>

          <TabsContent value="contracts" className="mt-4">
            <ContractsTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />
          </TabsContent>

          <TabsContent value="training" className="mt-4">
            <TrainingTab candidatoId={candidatoId} />
          </TabsContent>

          <TabsContent value="installation" className="mt-4">
            <InstallationTab candidatoId={candidatoId} candidatoNombre={candidatoNombre} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <CandidateStateTimeline candidatoId={candidatoId} currentState={currentState} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}