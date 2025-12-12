import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Calculator, Scale, AlertTriangle, Lightbulb } from 'lucide-react';
import { AlgorithmFormula } from './AlgorithmFormula';
import { AlgorithmVariables } from './AlgorithmVariables';
import { AlgorithmExample } from './AlgorithmExample';

export interface AlgorithmVariable {
  name: string;
  source: string;
  range: string;
  description: string;
  calculation?: string;
}

export interface AlgorithmComponent {
  id: string;
  name: string;
  weight: number;
  color: string;
  description: string;
  variables: AlgorithmVariable[];
}

export interface BusinessRule {
  rule: string;
  type: 'limit' | 'penalty' | 'threshold' | 'bonus';
  description: string;
  value?: string;
}

export interface AlgorithmExample {
  title: string;
  scenario: string;
  inputs: Record<string, string | number>;
  steps: Array<{
    component: string;
    calculation: string;
    result: number;
  }>;
  totalScore: number;
  recommendation: string;
}

export interface AlgorithmDetails {
  id: string;
  name: string;
  version: string;
  description: string;
  components: AlgorithmComponent[];
  businessRules: BusinessRule[];
  example?: AlgorithmExample;
}

interface AlgorithmVisualizationProps {
  algorithm: AlgorithmDetails;
}

export const AlgorithmVisualization: React.FC<AlgorithmVisualizationProps> = ({ algorithm }) => {
  const [showVariables, setShowVariables] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const getRuleIcon = (type: BusinessRule['type']) => {
    switch (type) {
      case 'limit': return <AlertTriangle className="h-3.5 w-3.5 text-red-500" />;
      case 'penalty': return <Scale className="h-3.5 w-3.5 text-amber-500" />;
      case 'threshold': return <Calculator className="h-3.5 w-3.5 text-blue-500" />;
      case 'bonus': return <Lightbulb className="h-3.5 w-3.5 text-emerald-500" />;
    }
  };

  const getRuleBadgeVariant = (type: BusinessRule['type']) => {
    switch (type) {
      case 'limit': return 'destructive';
      case 'penalty': return 'secondary';
      case 'threshold': return 'outline';
      case 'bonus': return 'default';
    }
  };

  return (
    <Card className="mt-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Calculator className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {algorithm.name}
                <Badge variant="outline" className="text-xs font-mono">
                  v{algorithm.version}
                </Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                {algorithm.description}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formula Visual */}
        <AlgorithmFormula components={algorithm.components} />

        {/* Variables Expandibles */}
        <Collapsible open={showVariables} onOpenChange={setShowVariables}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium flex items-center gap-2">
              📋 Variables por Componente
            </span>
            {showVariables ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <AlgorithmVariables components={algorithm.components} />
          </CollapsibleContent>
        </Collapsible>

        {/* Reglas de Negocio */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium flex items-center gap-2">
            ⚠️ Reglas de Negocio
          </h4>
          <div className="grid gap-2">
            {algorithm.businessRules.map((rule, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 text-sm"
              >
                {getRuleIcon(rule.type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{rule.rule}</span>
                    <Badge variant={getRuleBadgeVariant(rule.type) as any} className="text-xs">
                      {rule.type}
                    </Badge>
                    {rule.value && (
                      <code className="text-xs bg-background px-1.5 py-0.5 rounded">
                        {rule.value}
                      </code>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ejemplo de Cálculo */}
        {algorithm.example && (
          <Collapsible open={showExample} onOpenChange={setShowExample}>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 rounded-lg hover:bg-muted/50 transition-colors">
              <span className="text-sm font-medium flex items-center gap-2">
                📝 Ejemplo de Cálculo
              </span>
              {showExample ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <AlgorithmExample example={algorithm.example} components={algorithm.components} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
};
