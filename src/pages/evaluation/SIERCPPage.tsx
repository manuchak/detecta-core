import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, FileText, Brain, Shield, Zap, Heart, Eye, MessageSquare } from "lucide-react";
import { useSIERCP } from "@/hooks/useSIERCP";

const moduleConfig = {
  integridad: { 
    title: 'Integridad Laboral', 
    icon: Shield, 
    description: 'Evaluación de honestidad y ética laboral',
    color: 'bg-blue-500'
  },
  psicopatia: { 
    title: 'Psicopatía y Antisocialidad', 
    icon: Brain, 
    description: 'Detección de rasgos antisociales',
    color: 'bg-red-500'
  },
  violencia: { 
    title: 'Riesgo de Violencia', 
    icon: AlertCircle, 
    description: 'Evaluación de tendencias violentas',
    color: 'bg-orange-500'
  },
  agresividad: { 
    title: 'Agresividad e Impulsividad', 
    icon: Zap, 
    description: 'Medición de control de impulsos',
    color: 'bg-yellow-500'
  },
  afrontamiento: { 
    title: 'Estilo de Afrontamiento', 
    icon: Heart, 
    description: 'Estrategias de manejo de estrés',
    color: 'bg-green-500'
  },
  veracidad: { 
    title: 'Veracidad de Respuesta', 
    icon: Eye, 
    description: 'Detección de deseabilidad social',
    color: 'bg-purple-500'
  },
  entrevista: { 
    title: 'Entrevista Estructurada', 
    icon: MessageSquare, 
    description: 'Evaluación cualitativa complementaria',
    color: 'bg-indigo-500'
  }
};

const SIERCPPage = () => {
  const {
    responses,
    currentModule,
    isCompleted,
    addResponse,
    setCurrentModule,
    setIsCompleted,
    getQuestionsForModule,
    calculateResults,
    resetTest
  } = useSIERCP();

  const [showResults, setShowResults] = useState(false);

  const modules = Object.keys(moduleConfig);
  const currentModuleIndex = modules.indexOf(currentModule);
  const progress = isCompleted ? 100 : ((currentModuleIndex + 1) / modules.length) * 100;

  const currentQuestions = getQuestionsForModule(currentModule);
  const currentResponses = responses.filter(r => 
    currentQuestions.some(q => q.id === r.questionId)
  );

  const handleResponse = (questionId: string, value: number | string) => {
    addResponse(questionId, value);
  };

  const handleNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModule(modules[currentModuleIndex + 1]);
    } else {
      setIsCompleted(true);
      setShowResults(true);
    }
  };

  const handlePreviousModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModule(modules[currentModuleIndex - 1]);
    }
  };

  const renderQuestion = (question: any) => {
    const response = responses.find(r => r.questionId === question.id);
    
    if (question.type === 'open') {
      return (
        <div key={question.id} className="space-y-3">
          <Label className="text-sm font-medium">{question.text}</Label>
          <Textarea
            value={response?.value as string || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder="Escriba su respuesta aquí..."
            className="min-h-[100px]"
          />
        </div>
      );
    }

    if (question.type === 'dicotomic') {
      return (
        <div key={question.id} className="space-y-3">
          <Label className="text-sm font-medium">{question.text}</Label>
          <RadioGroup
            value={response?.value?.toString() || ''}
            onValueChange={(value) => handleResponse(question.id, parseInt(value))}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="1" id={`${question.id}_si`} />
              <Label htmlFor={`${question.id}_si`}>Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="0" id={`${question.id}_no`} />
              <Label htmlFor={`${question.id}_no`}>No</Label>
            </div>
          </RadioGroup>
        </div>
      );
    }

    const scales = {
      likert: ['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'],
      frequency: ['Nunca', 'Casi nunca', 'A veces', 'Frecuentemente', 'Siempre']
    };

    const currentScale = scales[question.type as keyof typeof scales] || scales.likert;

    return (
      <div key={question.id} className="space-y-3">
        <Label className="text-sm font-medium">{question.text}</Label>
        <RadioGroup
          value={response?.value?.toString() || ''}
          onValueChange={(value) => handleResponse(question.id, parseInt(value))}
          className="grid grid-cols-5 gap-2"
        >
          {currentScale.map((label, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              <RadioGroupItem value={(index + 1).toString()} id={`${question.id}_${index}`} />
              <Label 
                htmlFor={`${question.id}_${index}`} 
                className="text-xs text-center leading-tight"
              >
                {label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    );
  };

  const results = showResults ? calculateResults() : null;

  if (showResults && results) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Resultados SIERCP
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <div className="text-3xl font-bold">{results.globalScore}</div>
                    <div className="text-sm text-muted-foreground">Puntuación Global</div>
                    <Badge 
                      variant={results.globalScore >= 70 ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {results.classification}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Recomendación</div>
                    <div className="text-sm">{results.recommendation}</div>
                    {results.globalScore >= 70 ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{results.integridad}</div>
                <div className="text-xs text-muted-foreground">Integridad</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.psicopatia}</div>
                <div className="text-xs text-muted-foreground">Psicopatía</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.violencia}</div>
                <div className="text-xs text-muted-foreground">Violencia</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{results.agresividad}</div>
                <div className="text-xs text-muted-foreground">Agresividad</div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={resetTest} variant="outline">
                Nueva Evaluación
              </Button>
              <Button onClick={() => window.print()}>
                Imprimir Resultados
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentModuleConfig = moduleConfig[currentModule as keyof typeof moduleConfig];
  const Icon = currentModuleConfig.icon;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Sistema Integrado de Evaluación de Riesgo y Confiabilidad Psico-Criminológica
          </CardTitle>
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <div className="text-sm text-muted-foreground">
              Módulo {currentModuleIndex + 1} de {modules.length}: {currentModuleConfig.title}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {currentModuleConfig.title}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {currentModuleConfig.description}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestions.map(renderQuestion)}
          
          <div className="flex justify-between pt-6">
            <Button 
              onClick={handlePreviousModule}
              disabled={currentModuleIndex === 0}
              variant="outline"
            >
              Anterior
            </Button>
            
            <div className="flex gap-2">
              <span className="text-sm text-muted-foreground">
                {currentResponses.length} de {currentQuestions.length} completadas
              </span>
            </div>

            <Button 
              onClick={handleNextModule}
              disabled={currentResponses.length < currentQuestions.length}
            >
              {currentModuleIndex === modules.length - 1 ? 'Finalizar' : 'Siguiente'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SIERCPPage;