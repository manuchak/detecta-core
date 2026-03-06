import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Rocket, CheckCircle2, AlertTriangle, XCircle, ChevronRight, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLatestEvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { useLatestToxicologia } from '@/hooks/useEvaluacionesToxicologicas';
import { useLatestEstudioSocioeconomico } from '@/hooks/useEstudioSocioeconomico';
import { useDocumentosProgress } from '@/hooks/useDocumentosCandidato';
import { useContratosProgress } from '@/hooks/useContratosCandidato';
import { useReferenciasProgress } from '@/hooks/useReferencias';
import { useProgramacionInstalacionesCandidato } from '@/hooks/useProgramacionInstalacionesCandidato';
import { useLatestMidot } from '@/hooks/useEvaluacionesMidot';
import { useCustodioLiberacion } from '@/hooks/useCustodioLiberacion';
import { useCapacitacion } from '@/hooks/useCapacitacion';
import { LiberacionSuccessModal } from '@/components/liberacion/LiberacionSuccessModal';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type GateLevel = 'blocker' | 'warning' | 'info';

interface Gate {
  id: string;
  label: string;
  level: GateLevel;
  passed: boolean;
  detail: string;
  tabTarget?: string;
}

interface Props {
  candidatoId: string;
  candidatoNombre: string;
  tipoOperativo?: 'custodio' | 'armado';
  onSwitchTab?: (tab: string) => void;
}

export function LiberacionWizardTab({ candidatoId, candidatoNombre, tipoOperativo = 'custodio', onSwitchTab }: Props) {
  const [isLiberating, setIsLiberating] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);

  // Fetch existing liberacion record
  const { data: liberacionRecord, isLoading: loadingLib } = useQuery({
    queryKey: ['custodio-liberacion-by-candidato', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('custodio_liberacion')
        .select('*')
        .eq('candidato_id', candidatoId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!candidatoId,
  });

  // All live data hooks
  const docsProgress = useDocumentosProgress(candidatoId, tipoOperativo);
  const { data: latestPsico } = useLatestEvaluacionPsicometrica(candidatoId);
  const { data: latestToxico } = useLatestToxicologia(candidatoId);
  const latestSocio = useLatestEstudioSocioeconomico(candidatoId);
  const latestMidot = useLatestMidot(candidatoId);
  const contractsProgress = useContratosProgress(candidatoId);
  const { data: refsProgress } = useReferenciasProgress(candidatoId);
  const { instalacionCompletada, ultimaInstalacion } = useProgramacionInstalacionesCandidato(candidatoId);
  const { modulos, progreso } = useCapacitacion(candidatoId);
  const { liberarCustodio } = useCustodioLiberacion();

  // Training progress
  const trainingComplete = useMemo(() => {
    if (!modulos || !progreso) return false;
    const completedModules = progreso.filter((p: any) => p.estado === 'completado').length;
    return modulos.length > 0 && completedModules >= modulos.length;
  }, [modulos, progreso]);

  // Compute gates from LIVE data
  const gates: Gate[] = useMemo(() => {
    const g: Gate[] = [];

    // === BLOCKERS (RED) ===
    const docsComplete = docsProgress.isComplete;
    g.push({
      id: 'docs',
      label: 'Documentación completa',
      level: 'blocker',
      passed: docsComplete,
      detail: docsComplete
        ? `${docsProgress.completados}/${docsProgress.totalRequeridos} documentos validados`
        : `Faltan ${docsProgress.totalRequeridos - docsProgress.completados} documentos`,
      tabTarget: 'documents',
    });

    const toxicoOk = latestToxico?.resultado === 'negativo';
    g.push({
      id: 'toxico',
      label: 'Toxicológico negativo',
      level: 'blocker',
      passed: toxicoOk,
      detail: !latestToxico
        ? 'Sin resultado toxicológico registrado'
        : latestToxico.resultado === 'positivo'
          ? '⚠ Resultado POSITIVO — no puede liberarse'
          : 'Resultado negativo verificado',
      tabTarget: 'toxicology',
    });

    const socioOk = !latestSocio || latestSocio.resultado_general !== 'desfavorable';
    g.push({
      id: 'socio',
      label: 'Socioeconómico no desfavorable',
      level: 'blocker',
      passed: socioOk,
      detail: !latestSocio
        ? 'Sin estudio socioeconómico — se puede proceder'
        : latestSocio.resultado_general === 'desfavorable'
          ? 'Resultado DESFAVORABLE — no puede liberarse'
          : `Resultado: ${latestSocio.resultado_general}`,
      tabTarget: 'socioeconomico',
    });

    // === WARNINGS (YELLOW) ===
    g.push({
      id: 'psico',
      label: 'Evaluación psicométrica',
      level: 'warning',
      passed: !!latestPsico,
      detail: latestPsico
        ? `Score: ${latestPsico.score_global} — ${latestPsico.resultado_semaforo}`
        : 'Sin evaluación psicométrica',
      tabTarget: 'psychometric',
    });

    g.push({
      id: 'midot',
      label: 'Evaluación Midot',
      level: 'warning',
      passed: !!latestMidot,
      detail: latestMidot
        ? `Resultado: ${latestMidot.resultado_semaforo}`
        : 'Sin evaluación Midot',
      tabTarget: 'midot',
    });

    g.push({
      id: 'contracts',
      label: 'Contratos firmados',
      level: 'warning',
      passed: contractsProgress.isComplete,
      detail: `${contractsProgress.firmados}/${contractsProgress.totalRequeridos} contratos`,
      tabTarget: 'contracts',
    });

    g.push({
      id: 'training',
      label: 'Capacitación completa',
      level: 'warning',
      passed: trainingComplete,
      detail: trainingComplete
        ? 'Todos los módulos completados'
        : 'Módulos de capacitación pendientes',
      tabTarget: 'training',
    });

    const refsOk = (refsProgress?.totalOk ?? 0) >= 4;
    g.push({
      id: 'refs',
      label: 'Referencias verificadas (4/4)',
      level: 'warning',
      passed: refsOk,
      detail: `${refsProgress?.totalOk ?? 0}/${refsProgress?.totalRefs ?? 0} referencias verificadas`,
      tabTarget: 'references',
    });

    // === INFO (GREEN) ===
    g.push({
      id: 'gps',
      label: 'GPS instalado',
      level: 'info',
      passed: instalacionCompletada,
      detail: !ultimaInstalacion
        ? 'Sin instalación programada — opcional'
        : `Estado: ${ultimaInstalacion.estado}`,
      tabTarget: 'installation',
    });

    return g;
  }, [docsProgress, latestToxico, latestSocio, latestPsico, latestMidot, contractsProgress, trainingComplete, refsProgress, instalacionCompletada, ultimaInstalacion]);

  const blockers = gates.filter(g => g.level === 'blocker' && !g.passed);
  const warnings = gates.filter(g => g.level === 'warning' && !g.passed);
  const passed = gates.filter(g => g.passed);
  const canRelease = blockers.length === 0;

  const handleRelease = async () => {
    if (!liberacionRecord) return;
    setIsLiberating(true);
    try {
      const result = await liberarCustodio.mutateAsync({
        liberacion_id: liberacionRecord.id,
        forzar: true,
      });
      setSuccessData(result);
    } finally {
      setIsLiberating(false);
    }
  };

  if (loadingLib) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!liberacionRecord) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Info className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="text-muted-foreground text-center max-w-sm">
          Este candidato aún no tiene un proceso de liberación iniciado. 
          Inicia el proceso desde el módulo de <strong>Liberación</strong>.
        </p>
      </div>
    );
  }

  if (liberacionRecord.estado_liberacion === 'liberado') {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-success" />
        </div>
        <p className="text-lg font-medium">Custodio ya liberado</p>
        <p className="text-sm text-muted-foreground">{candidatoNombre} fue liberado exitosamente a Planificación.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Wizard de Liberación</h3>
          <p className="text-sm text-muted-foreground">
            {canRelease
              ? 'Todo listo — puedes liberar a este candidato'
              : `${blockers.length} bloqueo${blockers.length !== 1 ? 's' : ''} que resolver`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3 text-[hsl(var(--success))]" />
            {passed.length}/{gates.length}
          </Badge>
        </div>
      </div>

      {/* BLOCKERS */}
      {blockers.length > 0 && (
        <Section title="Bloqueos — Debe resolver" icon={<XCircle className="h-4 w-4" />} variant="destructive">
          {blockers.map(g => (
            <GateRow key={g.id} gate={g} onClick={() => g.tabTarget && onSwitchTab?.(g.tabTarget)} />
          ))}
        </Section>
      )}

      {/* WARNINGS */}
      {warnings.length > 0 && (
        <Section title="Advertencias — Puede proceder" icon={<AlertTriangle className="h-4 w-4" />} variant="warning">
          {warnings.map(g => (
            <GateRow key={g.id} gate={g} onClick={() => g.tabTarget && onSwitchTab?.(g.tabTarget)} />
          ))}
        </Section>
      )}

      {/* PASSED */}
      {passed.length > 0 && (
        <Section title="Completado" icon={<CheckCircle2 className="h-4 w-4" />} variant="success" defaultCollapsed>
          {passed.map(g => (
            <GateRow key={g.id} gate={g} onClick={() => g.tabTarget && onSwitchTab?.(g.tabTarget)} />
          ))}
        </Section>
      )}

      {/* CTA */}
      <div className="pt-4 border-t border-border">
        <Button
          size="lg"
          className={cn(
            "w-full gap-2 text-base font-semibold h-14 rounded-xl transition-all",
            canRelease
              ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))]"
              : "opacity-50 cursor-not-allowed"
          )}
          disabled={!canRelease || isLiberating}
          onClick={handleRelease}
        >
          {isLiberating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Rocket className="h-5 w-5" />
          )}
          {isLiberating ? 'Liberando...' : 'Liberar a Planificación'}
        </Button>
        {!canRelease && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Resuelve los bloqueos marcados en rojo para habilitar la liberación
          </p>
        )}
      </div>

      {successData && (
        <LiberacionSuccessModal
          isOpen={!!successData}
          onClose={() => setSuccessData(null)}
          data={successData}
        />
      )}
    </div>
  );
}

// --- Sub-components ---

function Section({ title, icon, variant, defaultCollapsed = false, children }: {
  title: string;
  icon: React.ReactNode;
  variant: 'destructive' | 'warning' | 'success';
  defaultCollapsed?: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  const borderColor = {
    destructive: 'border-destructive/30',
    warning: 'border-[hsl(var(--warning))]/30',
    success: 'border-[hsl(var(--success))]/30',
  }[variant];

  const textColor = {
    destructive: 'text-destructive',
    warning: 'text-[hsl(var(--warning))]',
    success: 'text-[hsl(var(--success))]',
  }[variant];

  return (
    <Card className={cn('overflow-hidden', borderColor)}>
      <button
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className={textColor}>{icon}</span>
        <span className="text-sm font-medium flex-1">{title}</span>
        <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", !collapsed && "rotate-90")} />
      </button>
      {!collapsed && (
        <CardContent className="px-4 pb-3 pt-0 space-y-1">
          {children}
        </CardContent>
      )}
    </Card>
  );
}

function GateRow({ gate, onClick }: { gate: Gate; onClick?: () => void }) {
  const iconMap = {
    blocker: gate.passed ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" /> : <XCircle className="h-4 w-4 text-destructive" />,
    warning: gate.passed ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" /> : <AlertTriangle className="h-4 w-4 text-[hsl(var(--warning))]" />,
    info: gate.passed ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" /> : <Info className="h-4 w-4 text-muted-foreground" />,
  };

  return (
    <button
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
        onClick ? "hover:bg-muted/70 cursor-pointer" : "cursor-default"
      )}
      onClick={onClick}
    >
      {iconMap[gate.level]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{gate.label}</p>
        <p className="text-xs text-muted-foreground truncate">{gate.detail}</p>
      </div>
      {onClick && gate.tabTarget && (
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
    </button>
  );
}
