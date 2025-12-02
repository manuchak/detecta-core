import { useStateTransitions, CANDIDATE_STATES, CandidateState } from '@/hooks/useStateTransitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, GitBranch, ArrowRight, User, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  candidatoId: string;
  currentState?: string;
}

export function CandidateStateTimeline({ candidatoId, currentState }: Props) {
  const { data: transitions, isLoading } = useStateTransitions(candidatoId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const stateConfig = currentState && CANDIDATE_STATES[currentState as CandidateState];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Historial de Estados
          </span>
          {stateConfig && (
            <Badge className={stateConfig.color}>
              {stateConfig.label}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!transitions || transitions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay transiciones registradas
          </p>
        ) : (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
            
            <div className="space-y-4">
              {transitions.map((transition, index) => {
                const toStateConfig = CANDIDATE_STATES[transition.to_state as CandidateState];
                const fromStateConfig = transition.from_state 
                  ? CANDIDATE_STATES[transition.from_state as CandidateState]
                  : null;

                return (
                  <div key={transition.id} className="relative flex gap-4 pl-8">
                    {/* Dot */}
                    <div className={`absolute left-1.5 top-1.5 w-3 h-3 rounded-full border-2 border-background ${
                      index === 0 ? 'bg-primary' : 'bg-muted'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {fromStateConfig && (
                          <>
                            <Badge variant="outline" className="text-xs">
                              {fromStateConfig.label}
                            </Badge>
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          </>
                        )}
                        <Badge className={`text-xs ${toStateConfig?.color || 'bg-gray-500'}`}>
                          {toStateConfig?.label || transition.to_state}
                        </Badge>
                      </div>
                      
                      {transition.reason && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {transition.reason}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transition.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Progress bar showing position in workflow
export function CandidateStateProgress({ currentState }: { currentState: string }) {
  const stateConfig = CANDIDATE_STATES[currentState as CandidateState];
  if (!stateConfig || stateConfig.order === -1) return null;

  const totalStates = Object.values(CANDIDATE_STATES).filter(s => s.order > 0).length;
  const progress = (stateConfig.order / totalStates) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Progreso del candidato</span>
        <Badge className={stateConfig.color}>{stateConfig.label}</Badge>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all ${stateConfig.color}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Lead</span>
        <span>Activo</span>
      </div>
    </div>
  );
}
