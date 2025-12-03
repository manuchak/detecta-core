import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Brain, AlertCircle } from 'lucide-react';
import { useCreateEvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  candidatoId: string;
  candidatoNombre: string;
}

export function ApplySIERCPDialog({ isOpen, onClose, candidatoId, candidatoNombre }: Props) {
  const [scores, setScores] = useState({
    score_integridad: '',
    score_psicopatia: '',
    score_violencia: '',
    score_agresividad: '',
    score_afrontamiento: '',
    score_veracidad: '',
    score_entrevista: '',
  });
  const [interpretacion, setInterpretacion] = useState('');
  const [riskFlags, setRiskFlags] = useState('');

  const createMutation = useCreateEvaluacionPsicometrica();

  const scoreLabels = [
    { key: 'score_integridad', label: 'Integridad', description: 'Honestidad y valores éticos' },
    { key: 'score_psicopatia', label: 'Psicopatía', description: 'Rasgos antisociales (invertido)' },
    { key: 'score_violencia', label: 'Violencia', description: 'Tendencia a conductas violentas (invertido)' },
    { key: 'score_agresividad', label: 'Agresividad', description: 'Nivel de agresividad (invertido)' },
    { key: 'score_afrontamiento', label: 'Afrontamiento', description: 'Manejo de estrés y presión' },
    { key: 'score_veracidad', label: 'Veracidad', description: 'Consistencia en respuestas' },
    { key: 'score_entrevista', label: 'Entrevista', description: 'Evaluación de entrevista' },
  ];

  const calculateGlobalScore = () => {
    const values = Object.values(scores).filter(v => v !== '').map(Number);
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  };

  const globalScore = calculateGlobalScore();
  const semaforo = globalScore >= 70 ? 'verde' : globalScore >= 50 ? 'ambar' : 'rojo';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const scoreData: Record<string, number | undefined> = {};
    Object.entries(scores).forEach(([key, value]) => {
      if (value !== '') {
        scoreData[key] = Number(value);
      }
    });

    await createMutation.mutateAsync({
      candidato_id: candidatoId,
      score_global: globalScore,
      ...scoreData,
      interpretacion_clinica: interpretacion || undefined,
      risk_flags: riskFlags ? riskFlags.split(',').map(s => s.trim()) : undefined,
    });

    onClose();
    // Reset form
    setScores({
      score_integridad: '',
      score_psicopatia: '',
      score_violencia: '',
      score_agresividad: '',
      score_afrontamiento: '',
      score_veracidad: '',
      score_entrevista: '',
    });
    setInterpretacion('');
    setRiskFlags('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Registrar Evaluación SIERCP
          </DialogTitle>
          <DialogDescription>
            Ingrese los resultados del test SIERCP para {candidatoNombre}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Scores por módulo */}
          <div className="space-y-4">
            <h4 className="font-medium">Scores por Módulo (0-100)</h4>
            <div className="grid grid-cols-2 gap-4">
              {scoreLabels.map(({ key, label, description }) => (
                <div key={key} className="space-y-1">
                  <Label htmlFor={key} className="text-sm">
                    {label}
                    <span className="text-xs text-muted-foreground ml-1">({description})</span>
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="0-100"
                    value={scores[key as keyof typeof scores]}
                    onChange={(e) => setScores(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Score global calculado */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Score Global Calculado:</span>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold">{globalScore.toFixed(1)}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  semaforo === 'verde' ? 'bg-green-500/20 text-green-700' :
                  semaforo === 'ambar' ? 'bg-amber-500/20 text-amber-700' :
                  'bg-red-500/20 text-red-700'
                }`}>
                  {semaforo === 'verde' ? '🟢 Verde' : semaforo === 'ambar' ? '🟡 Ámbar' : '🔴 Rojo'}
                </span>
              </div>
            </div>
            {semaforo === 'ambar' && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este resultado requerirá aval de Coordinación Operativa para que el candidato continúe.
                </AlertDescription>
              </Alert>
            )}
            {semaforo === 'rojo' && (
              <Alert variant="destructive" className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Este resultado indica que el candidato no es apto para el puesto.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Interpretación clínica */}
          <div className="space-y-2">
            <Label htmlFor="interpretacion">Interpretación Clínica (opcional)</Label>
            <Textarea
              id="interpretacion"
              placeholder="Observaciones clínicas sobre los resultados..."
              value={interpretacion}
              onChange={(e) => setInterpretacion(e.target.value)}
              rows={3}
            />
          </div>

          {/* Banderas de riesgo */}
          <div className="space-y-2">
            <Label htmlFor="riskFlags">Banderas de Riesgo (opcional, separadas por coma)</Label>
            <Input
              id="riskFlags"
              placeholder="Ej: Inconsistencia en respuestas, Tendencia manipuladora..."
              value={riskFlags}
              onChange={(e) => setRiskFlags(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || globalScore === 0}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Registrar Evaluación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
