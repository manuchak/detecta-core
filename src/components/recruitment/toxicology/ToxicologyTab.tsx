import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TestTube, Plus, Clock, User, AlertTriangle, CheckCircle } from 'lucide-react';
import { useEvaluacionesToxicologicas } from '@/hooks/useEvaluacionesToxicologicas';
import { ToxicologyResultForm } from './ToxicologyResultForm';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
}

export function ToxicologyTab({ candidatoId, candidatoNombre }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { data: evaluaciones, isLoading } = useEvaluacionesToxicologicas(candidatoId);

  const latestEval = evaluaciones?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Evaluación Toxicológica
        </h3>
        <Button onClick={() => setShowForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Registrar Resultado
        </Button>
      </div>

      {!evaluaciones || evaluaciones.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay pruebas toxicológicas registradas</p>
            <p className="text-sm mt-2">
              Registre el resultado de la prueba de antidoping
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setShowForm(true)}
            >
              Registrar Primer Resultado
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {evaluaciones.map((eval_, index) => (
            <Card key={eval_.id} className={index === 0 ? 'border-primary/50' : 'opacity-75'}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    {index === 0 && <Badge variant="secondary">Última</Badge>}
                    <Clock className="h-4 w-4" />
                    {format(new Date(eval_.created_at), "d MMM yyyy HH:mm", { locale: es })}
                  </span>
                  <Badge 
                    variant={eval_.resultado === 'negativo' ? 'default' : 'destructive'}
                    className={eval_.resultado === 'negativo' 
                      ? 'bg-green-500/20 text-green-700 border-green-500/30' 
                      : ''
                    }
                  >
                    {eval_.resultado === 'negativo' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Negativo
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Positivo
                      </>
                    )}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {eval_.laboratorio && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Laboratorio:</span> {eval_.laboratorio}
                  </p>
                )}
                {eval_.fecha_muestra && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Fecha de muestra:</span>{' '}
                    {format(new Date(eval_.fecha_muestra), "d MMM yyyy", { locale: es })}
                  </p>
                )}
                {eval_.resultado === 'positivo' && eval_.sustancias_detectadas && eval_.sustancias_detectadas.length > 0 && (
                  <div className="p-2 bg-destructive/10 rounded-lg">
                    <p className="text-sm font-medium text-destructive mb-1">Sustancias detectadas:</p>
                    <div className="flex flex-wrap gap-1">
                      {eval_.sustancias_detectadas.map((s, i) => (
                        <Badge key={i} variant="outline" className="text-destructive border-destructive/50">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {eval_.notas && (
                  <p className="text-sm text-muted-foreground border-t pt-2">
                    {eval_.notas}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                  <User className="h-3 w-3" />
                  Registrado por: {eval_.registrador?.display_name || 'Usuario'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ToxicologyResultForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        candidatoId={candidatoId}
        candidatoNombre={candidatoNombre}
      />
    </div>
  );
}
