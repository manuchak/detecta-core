import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Target } from 'lucide-react';
import type { AlgorithmExample as ExampleType, AlgorithmComponent } from './AlgorithmVisualization';

interface AlgorithmExampleProps {
  example: ExampleType;
  components: AlgorithmComponent[];
}

export const AlgorithmExample: React.FC<AlgorithmExampleProps> = ({ example, components }) => {
  const getComponentColor = (componentId: string) => {
    const comp = components.find(c => 
      c.name.toLowerCase().includes(componentId.toLowerCase()) ||
      c.id.toLowerCase().includes(componentId.toLowerCase())
    );
    return comp?.color || '#6B7280';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 85) return { label: 'Excelente', color: 'text-emerald-500' };
    if (score >= 70) return { label: 'Bueno', color: 'text-blue-500' };
    if (score >= 55) return { label: 'Aceptable', color: 'text-amber-500' };
    return { label: 'Bajo', color: 'text-red-500' };
  };

  const grade = getScoreGrade(example.totalScore);

  return (
    <div className="mt-3 space-y-4">
      {/* Scenario Description */}
      <Card className="p-3 bg-muted/30">
        <div className="flex items-start gap-2">
          <Target className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div>
            <h5 className="font-medium text-sm">{example.title}</h5>
            <p className="text-xs text-muted-foreground mt-1">{example.scenario}</p>
          </div>
        </div>
      </Card>

      {/* Input Values */}
      <div>
        <h5 className="text-xs font-medium text-muted-foreground mb-2">Valores de Entrada:</h5>
        <div className="flex flex-wrap gap-2">
          {Object.entries(example.inputs).map(([key, value]) => (
            <Badge key={key} variant="outline" className="text-xs font-mono">
              {key}: <span className="font-semibold ml-1">{value}</span>
            </Badge>
          ))}
        </div>
      </div>

      {/* Step by Step Calculation */}
      <div>
        <h5 className="text-xs font-medium text-muted-foreground mb-2">Cálculo Paso a Paso:</h5>
        <div className="space-y-2">
          {example.steps.map((step, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 text-sm"
              style={{ borderLeft: `3px solid ${getComponentColor(step.component)}` }}
            >
              <div className="flex-1">
                <span className="font-medium">{step.component}</span>
                <span className="text-muted-foreground mx-2">→</span>
                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {step.calculation}
                </code>
              </div>
              <Badge
                variant="secondary"
                className="font-mono"
                style={{
                  backgroundColor: `${getComponentColor(step.component)}20`,
                  color: getComponentColor(step.component)
                }}
              >
                {step.result}
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Total Result */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="font-medium">Score Total</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-bold ${grade.color}`}>
            {example.totalScore}
          </span>
          <Badge variant="outline" className={grade.color}>
            {grade.label}
          </Badge>
        </div>
      </div>

      {/* Recommendation */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <ArrowRight className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
        <div>
          <span className="text-xs font-medium text-emerald-600">Recomendación:</span>
          <p className="text-sm mt-0.5">{example.recommendation}</p>
        </div>
      </div>
    </div>
  );
};
