import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { InterviewMetricsDashboard } from '@/components/recruitment/metrics/InterviewMetricsDashboard';
import { CandidateEvaluationPanel } from '@/components/recruitment/CandidateEvaluationPanel';
import { SIERCPResultsPanel } from '@/components/recruitment/siercp/SIERCPResultsPanel';
import { RiskLevelBadge } from '@/components/recruitment/risk/RiskChecklistForm';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  Search, 
  Star,
  Users,
  Loader2,
  FileText,
  ChevronRight,
  Brain
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-mobile';
import { SupplyPipelineBreadcrumb } from '@/components/leads/supply/SupplyPipelineBreadcrumb';

interface CandidatoWithEvaluation {
  id: string;
  nombre: string;
  email: string | null;
  telefono: string | null;
  estado_proceso: string | null;
  estado_detallado: string | null;
  created_at: string;
  // From joins
  latest_interview_rating?: number;
  risk_level?: 'bajo' | 'medio' | 'alto';
  risk_score?: number;
}

export default function EvaluacionesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidato, setSelectedCandidato] = useState<CandidatoWithEvaluation | null>(null);
  const [tipoOperativo, setTipoOperativo] = useState<'custodios' | 'armados'>('custodios');
  const isMobile = useIsMobile();

  const handleTabChange = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', value);
    // Clean sub-tab params when switching main tab
    params.delete('siercpTab');
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch candidates with their evaluation data
  const { data: candidatos, isLoading } = useQuery({
    queryKey: ['candidatos-with-evaluations', searchTerm, tipoOperativo],
    queryFn: async () => {
      const tableName = tipoOperativo === 'custodios' ? 'candidatos_custodios' : 'candidatos_armados';
      let query = supabase
        .from(tableName)
        .select(`
          id,
          nombre,
          email,
          telefono,
          estado_proceso,
          estado_detallado,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (searchTerm) {
        query = query.or(`nombre.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch risk checklists for these candidates
      const candidatoIds = data?.map(c => c.id) || [];
      const { data: riskData } = await supabase
        .from('candidato_risk_checklist')
        .select('candidato_id, risk_level, risk_score')
        .in('candidato_id', candidatoIds);

      // Fetch latest interviews
      const { data: interviewData } = await supabase
        .from('entrevistas_estructuradas')
        .select('candidato_id, rating_promedio')
        .in('candidato_id', candidatoIds)
        .order('fecha_entrevista', { ascending: false });

      // Merge data
      const riskMap = new Map(riskData?.map(r => [r.candidato_id, r]) || []);
      const interviewMap = new Map<string, number>();
      interviewData?.forEach(i => {
        if (!interviewMap.has(i.candidato_id)) {
          interviewMap.set(i.candidato_id, i.rating_promedio || 0);
        }
      });

      return data?.map(c => ({
        ...c,
        risk_level: riskMap.get(c.id)?.risk_level as 'bajo' | 'medio' | 'alto' | undefined,
        risk_score: riskMap.get(c.id)?.risk_score,
        latest_interview_rating: interviewMap.get(c.id),
      })) as CandidatoWithEvaluation[];
    },
  });

  return (
    <div className="container mx-auto py-4 sm:py-6 px-3 sm:px-6 space-y-4 sm:space-y-6">
      <SupplyPipelineBreadcrumb />
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2 sm:gap-3">
          <FileText className="h-6 w-6 sm:h-8 sm:w-8" />
          Evaluaciones
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Gestión de entrevistas y evaluación de riesgo
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <TabsList>
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="candidates" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Candidatos
            </TabsTrigger>
            <TabsTrigger value="siercp" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              SIERCP
            </TabsTrigger>
          </TabsList>

          {activeTab === 'candidates' && (
            <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 border border-border/50">
              <button
                type="button"
                onClick={() => setTipoOperativo('custodios')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tipoOperativo === 'custodios'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Custodios
              </button>
              <button
                type="button"
                onClick={() => setTipoOperativo('armados')}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  tipoOperativo === 'armados'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Armados
              </button>
            </div>
          )}
        </div>

        <TabsContent value="dashboard">
          <InterviewMetricsDashboard />
        </TabsContent>

        <TabsContent value="candidates">
          <Card>
            <CardHeader className="pb-3 sm:pb-6">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-base sm:text-lg">Lista de Candidatos</span>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar candidato..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-12 sm:h-9"
                  />
                </div>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Selecciona un candidato para ver o realizar evaluaciones
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : !candidatos || candidatos.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">
                  No se encontraron candidatos
                </p>
              ) : isMobile ? (
                /* Mobile: Card-based layout */
                <div className="space-y-2">
                  {candidatos.map((candidato) => (
                    <div
                      key={candidato.id}
                      className="p-3 border rounded-lg active:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedCandidato(candidato)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {candidato.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{candidato.nombre}</p>
                          <p className="text-xs text-muted-foreground truncate">{candidato.email || candidato.telefono || 'Sin contacto'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {candidato.latest_interview_rating !== undefined && (
                          <Badge variant="outline" className="gap-1 text-xs">
                            <Star className="h-2.5 w-2.5" />
                            {candidato.latest_interview_rating.toFixed(1)}
                          </Badge>
                        )}
                        {candidato.risk_level && (
                          <RiskLevelBadge level={candidato.risk_level} score={candidato.risk_score} />
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {candidato.estado_detallado || candidato.estado_proceso || 'lead'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop: Row-based layout */
                <div className="divide-y">
                  {candidatos.map((candidato) => (
                    <div
                      key={candidato.id}
                      className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-lg cursor-pointer transition-colors"
                      onClick={() => setSelectedCandidato(candidato)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {candidato.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{candidato.nombre}</p>
                          <p className="text-sm text-muted-foreground">{candidato.email || 'Sin email'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {candidato.latest_interview_rating !== undefined && (
                          <Badge variant="outline" className="gap-1">
                            <Star className="h-3 w-3" />
                            {candidato.latest_interview_rating.toFixed(1)}
                          </Badge>
                        )}
                        {candidato.risk_level && (
                          <RiskLevelBadge level={candidato.risk_level} score={candidato.risk_score} />
                        )}
                        <Badge variant="secondary">
                          {candidato.estado_detallado || candidato.estado_proceso || 'lead'}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="siercp">
          <SIERCPResultsPanel />
        </TabsContent>
      </Tabs>

      {/* Evaluation Panel Modal */}
      {selectedCandidato && (
        <CandidateEvaluationPanel
          candidatoId={selectedCandidato.id}
          candidatoNombre={selectedCandidato.nombre}
          currentState={selectedCandidato.estado_detallado || selectedCandidato.estado_proceso || 'lead'}
          isOpen={!!selectedCandidato}
          onClose={() => setSelectedCandidato(null)}
        />
      )}
    </div>
  );
}
