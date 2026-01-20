import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Heart, 
  Briefcase, 
  Clock, 
  Zap, 
  UserCheck,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Timer
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface StructuredInterview {
  id: string;
  rating_comunicacion: number | null;
  rating_actitud: number | null;
  rating_experiencia: number | null;
  rating_disponibilidad: number | null;
  rating_motivacion: number | null;
  rating_profesionalismo: number | null;
  rating_promedio: number | null;
  notas_generales: string | null;
  fortalezas: string[] | null;
  areas_mejora: string[] | null;
  decision: string | null;
  motivo_decision: string | null;
  tipo_entrevista: string | null;
  duracion_minutos: number | null;
  fecha_entrevista: string;
}

interface StructuredInterviewSectionProps {
  resultId?: string | null;
  candidatoEmail?: string | null;
  candidatoNombre?: string | null;
}

const ratingDimensions = [
  { key: 'rating_comunicacion', label: 'Comunicación', icon: MessageSquare, color: 'text-blue-600' },
  { key: 'rating_actitud', label: 'Actitud', icon: Heart, color: 'text-pink-600' },
  { key: 'rating_experiencia', label: 'Experiencia', icon: Briefcase, color: 'text-amber-600' },
  { key: 'rating_disponibilidad', label: 'Disponibilidad', icon: Clock, color: 'text-green-600' },
  { key: 'rating_motivacion', label: 'Motivación', icon: Zap, color: 'text-orange-600' },
  { key: 'rating_profesionalismo', label: 'Profesionalismo', icon: UserCheck, color: 'text-indigo-600' },
];

const getDecisionBadge = (decision: string | null) => {
  switch (decision) {
    case 'aprobar':
      return { 
        label: 'Aprobado', 
        icon: CheckCircle, 
        className: 'bg-green-100 text-green-800 border-green-300' 
      };
    case 'rechazar':
      return { 
        label: 'Rechazado', 
        icon: XCircle, 
        className: 'bg-red-100 text-red-800 border-red-300' 
      };
    case 'segunda_entrevista':
      return { 
        label: 'Segunda Entrevista', 
        icon: RefreshCw, 
        className: 'bg-amber-100 text-amber-800 border-amber-300' 
      };
    default:
      return { 
        label: 'Pendiente', 
        icon: Timer, 
        className: 'bg-slate-100 text-slate-700 border-slate-300' 
      };
  }
};

const getRatingColor = (rating: number | null) => {
  if (rating === null) return 'text-muted-foreground';
  if (rating >= 4) return 'text-green-600';
  if (rating >= 3) return 'text-amber-600';
  return 'text-red-600';
};

export function StructuredInterviewSection({ 
  resultId, 
  candidatoEmail, 
  candidatoNombre 
}: StructuredInterviewSectionProps) {
  const [interview, setInterview] = useState<StructuredInterview | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchInterview = async () => {
      setLoading(true);
      setNotFound(false);

      try {
        // Strategy 1: If we have resultId, find candidato via siercp_invitations
        if (resultId) {
          const { data: invitation } = await supabase
            .from('siercp_invitations')
            .select('candidato_custodio_id')
            .eq('evaluacion_id', resultId)
            .maybeSingle();

          if (invitation?.candidato_custodio_id) {
            const { data: interviewData } = await supabase
              .from('entrevistas_estructuradas')
              .select('*')
              .eq('candidato_id', invitation.candidato_custodio_id)
              .order('fecha_entrevista', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (interviewData) {
              setInterview(interviewData);
              setLoading(false);
              return;
            }
          }
        }

        // Strategy 2: Search by email in candidatos_custodios
        if (candidatoEmail) {
          const { data: candidato } = await supabase
            .from('candidatos_custodios')
            .select('id')
            .eq('email', candidatoEmail)
            .maybeSingle();

          if (candidato) {
            const { data: interviewData } = await supabase
              .from('entrevistas_estructuradas')
              .select('*')
              .eq('candidato_id', candidato.id)
              .order('fecha_entrevista', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (interviewData) {
              setInterview(interviewData);
              setLoading(false);
              return;
            }
          }
        }

        // Strategy 3: Search by name (partial match)
        if (candidatoNombre) {
          const { data: candidatos } = await supabase
            .from('candidatos_custodios')
            .select('id')
            .ilike('nombre', `%${candidatoNombre}%`)
            .limit(1);

          if (candidatos && candidatos.length > 0) {
            const { data: interviewData } = await supabase
              .from('entrevistas_estructuradas')
              .select('*')
              .eq('candidato_id', candidatos[0].id)
              .order('fecha_entrevista', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (interviewData) {
              setInterview(interviewData);
              setLoading(false);
              return;
            }
          }
        }

        // No interview found
        setNotFound(true);
      } catch (error) {
        console.error('Error fetching structured interview:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    if (resultId || candidatoEmail || candidatoNombre) {
      fetchInterview();
    } else {
      setLoading(false);
      setNotFound(true);
    }
  }, [resultId, candidatoEmail, candidatoNombre]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (notFound || !interview) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No hay entrevista estructurada registrada para este candidato</p>
          <p className="text-xs mt-1">La entrevista se realiza como parte del proceso de reclutamiento</p>
        </CardContent>
      </Card>
    );
  }

  const decisionBadge = getDecisionBadge(interview.decision);
  const DecisionIcon = decisionBadge.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          Entrevista Estructurada
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          Evaluación cualitativa por entrevistador
          {interview.fecha_entrevista && (
            <>
              <span>•</span>
              <span>
                {format(new Date(interview.fecha_entrevista), "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rating Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ratingDimensions.map(({ key, label, icon: Icon, color }) => {
            const rating = interview[key as keyof StructuredInterview] as number | null;
            const percentage = rating ? (rating / 5) * 100 : 0;
            
            return (
              <div 
                key={key} 
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className={`h-4 w-4 ${color}`} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold ${getRatingColor(rating)}`}>
                    {rating !== null ? `${rating}/5` : 'N/A'}
                  </span>
                </div>
                <Progress 
                  value={percentage} 
                  className="h-1.5 mt-2"
                />
              </div>
            );
          })}
        </div>

        {/* Average and Decision */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
          <div>
            <span className="text-sm text-muted-foreground">Rating Promedio</span>
            <p className={`text-2xl font-bold ${getRatingColor(interview.rating_promedio)}`}>
              {interview.rating_promedio?.toFixed(1) || 'N/A'}/5
            </p>
          </div>
          
          <Badge 
            variant="outline" 
            className={`px-3 py-1 flex items-center gap-1.5 ${decisionBadge.className}`}
          >
            <DecisionIcon className="h-4 w-4" />
            {decisionBadge.label}
          </Badge>
          
          {interview.duracion_minutos && (
            <div className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {interview.duracion_minutos} minutos
            </div>
          )}
        </div>

        {/* Fortalezas y Áreas de Mejora */}
        {((interview.fortalezas && interview.fortalezas.length > 0) || 
          (interview.areas_mejora && interview.areas_mejora.length > 0)) && (
          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            {interview.fortalezas && interview.fortalezas.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm font-medium text-green-800 mb-2 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Fortalezas
                </p>
                <ul className="text-sm text-green-700 space-y-1">
                  {interview.fortalezas.map((f, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-green-500">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {interview.areas_mejora && interview.areas_mejora.length > 0 && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <p className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Áreas de Mejora
                </p>
                <ul className="text-sm text-amber-700 space-y-1">
                  {interview.areas_mejora.map((a, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span className="text-amber-500">•</span>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Notas del entrevistador */}
        {interview.notas_generales && (
          <div className="p-3 bg-slate-50 rounded-lg border">
            <p className="text-sm font-medium mb-1">Notas del Entrevistador</p>
            <p className="text-sm text-muted-foreground">
              {interview.notas_generales}
            </p>
          </div>
        )}

        {/* Motivo de decisión */}
        {interview.motivo_decision && (
          <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <p className="text-sm font-medium text-indigo-800 mb-1">Motivo de la Decisión</p>
            <p className="text-sm text-indigo-700">
              {interview.motivo_decision}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
