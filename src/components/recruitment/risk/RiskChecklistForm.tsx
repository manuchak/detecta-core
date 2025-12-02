import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useRiskChecklist, useUpsertRiskChecklist, RISK_FACTORS, RiskFactorKey } from '@/hooks/useRiskChecklist';
import { Shield, AlertTriangle, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
  onClose?: () => void;
  compact?: boolean;
}

export function RiskChecklistForm({ candidatoId, candidatoNombre, onClose, compact = false }: Props) {
  const { data: existingChecklist, isLoading } = useRiskChecklist(candidatoId);
  const upsertChecklist = useUpsertRiskChecklist();

  const [factors, setFactors] = useState<Record<RiskFactorKey, boolean>>({
    antecedentes_penales: false,
    antecedentes_laborales_negativos: false,
    inconsistencias_cv: false,
    actitud_defensiva: false,
    respuestas_evasivas: false,
    nerviosismo_excesivo: false,
    cambios_frecuentes_empleo: false,
    referencias_no_verificables: false,
    documentacion_incompleta: false,
    zona_alto_riesgo: false,
  });
  const [notas, setNotas] = useState('');

  useEffect(() => {
    if (existingChecklist) {
      setFactors({
        antecedentes_penales: existingChecklist.antecedentes_penales,
        antecedentes_laborales_negativos: existingChecklist.antecedentes_laborales_negativos,
        inconsistencias_cv: existingChecklist.inconsistencias_cv,
        actitud_defensiva: existingChecklist.actitud_defensiva,
        respuestas_evasivas: existingChecklist.respuestas_evasivas,
        nerviosismo_excesivo: existingChecklist.nerviosismo_excesivo,
        cambios_frecuentes_empleo: existingChecklist.cambios_frecuentes_empleo,
        referencias_no_verificables: existingChecklist.referencias_no_verificables,
        documentacion_incompleta: existingChecklist.documentacion_incompleta,
        zona_alto_riesgo: existingChecklist.zona_alto_riesgo,
      });
      setNotas(existingChecklist.notas || '');
    }
  }, [existingChecklist]);

  const calculatedScore = RISK_FACTORS.reduce((acc, factor) => {
    return acc + (factors[factor.key] ? factor.weight : 0);
  }, 0);

  const riskLevel = calculatedScore >= 50 ? 'alto' : calculatedScore >= 25 ? 'medio' : 'bajo';

  const getRiskBadge = () => {
    switch (riskLevel) {
      case 'alto':
        return <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> Riesgo Alto</Badge>;
      case 'medio':
        return <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800"><AlertTriangle className="h-3 w-3" /> Riesgo Medio</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800"><CheckCircle2 className="h-3 w-3" /> Riesgo Bajo</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-300 bg-red-50';
      case 'high': return 'border-orange-300 bg-orange-50';
      case 'medium': return 'border-amber-300 bg-amber-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleSave = async () => {
    await upsertChecklist.mutateAsync({
      candidato_id: candidatoId,
      ...factors,
      notas,
    });
    onClose?.();
  };

  if (isLoading) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={compact ? 'border-0 shadow-none' : 'w-full max-w-2xl mx-auto'}>
      {!compact && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Checklist de Riesgo
          </CardTitle>
          <CardDescription>
            Evaluación de: <span className="font-semibold">{candidatoNombre}</span>
          </CardDescription>
        </CardHeader>
      )}

      <CardContent className="space-y-6">
        {/* Risk Score Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score de Riesgo</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{calculatedScore}</span>
              <span className="text-muted-foreground">/ 130</span>
              {getRiskBadge()}
            </div>
          </div>
          <Progress 
            value={(calculatedScore / 130) * 100} 
            className={`h-3 ${riskLevel === 'alto' ? '[&>div]:bg-red-500' : riskLevel === 'medio' ? '[&>div]:bg-amber-500' : '[&>div]:bg-green-500'}`}
          />
        </div>

        {/* Warning for high risk */}
        {riskLevel === 'alto' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Candidato de Alto Riesgo</AlertTitle>
            <AlertDescription>
              Este candidato presenta múltiples factores de riesgo. Se recomienda revisión adicional antes de aprobar.
            </AlertDescription>
          </Alert>
        )}

        {/* Risk Factors */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Factores de Riesgo</h3>
          <div className="grid gap-2">
            {RISK_FACTORS.map((factor) => (
              <div 
                key={factor.key}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  factors[factor.key] ? getSeverityColor(factor.severity) : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={factor.key}
                    checked={factors[factor.key]}
                    onCheckedChange={(checked) => setFactors({ ...factors, [factor.key]: checked as boolean })}
                  />
                  <Label htmlFor={factor.key} className="cursor-pointer font-normal">
                    {factor.label}
                  </Label>
                </div>
                <Badge variant="outline" className="text-xs">
                  +{factor.weight} pts
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label>Notas Adicionales</Label>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Observaciones sobre los factores de riesgo identificados..."
            rows={3}
          />
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
        )}
        <Button onClick={handleSave} disabled={upsertChecklist.isPending} className={!onClose ? 'ml-auto' : ''}>
          {upsertChecklist.isPending ? 'Guardando...' : 'Guardar Evaluación'}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Compact badge version for showing in lists
export function RiskLevelBadge({ level, score }: { level: 'bajo' | 'medio' | 'alto'; score?: number }) {
  switch (level) {
    case 'alto':
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Alto {score !== undefined && `(${score})`}
        </Badge>
      );
    case 'medio':
      return (
        <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-800 hover:bg-amber-100">
          <AlertTriangle className="h-3 w-3" />
          Medio {score !== undefined && `(${score})`}
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3" />
          Bajo {score !== undefined && `(${score})`}
        </Badge>
      );
  }
}
