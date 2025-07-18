import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, FileText, Brain, Shield, Zap, Heart, Eye, MessageSquare, ArrowRight, ArrowLeft, UserCheck, History } from "lucide-react";
import { useSIERCP, SIERCPQuestion } from "@/hooks/useSIERCP";
import { useSIERCPResults } from "@/hooks/useSIERCPResults";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

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
  const { userRole } = useAuth();
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

  const {
    existingResult,
    loading,
    isAdmin,
    canTakeEvaluation,
    saveResult
  } = useSIERCPResults();

  const [showResults, setShowResults] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [animation, setAnimation] = useState('');
  const [saving, setSaving] = useState(false);

  const modules = Object.keys(moduleConfig);
  const currentModuleIndex = modules.indexOf(currentModule);
  const currentQuestions = getQuestionsForModule(currentModule);
  
  // Calculate overall progress: completed modules + current question progress
  const totalQuestions = modules.reduce((total, mod) => total + getQuestionsForModule(mod).length, 0);
  const completedQuestions = modules.slice(0, currentModuleIndex).reduce(
    (total, mod) => total + getQuestionsForModule(mod).length, 0
  ) + currentQuestionIndex;
  
  const progress = isCompleted ? 100 : Math.round((completedQuestions / totalQuestions) * 100);
  
  // Get current question
  const currentQuestion = currentQuestions[currentQuestionIndex];
  const response = responses.find(r => r.questionId === currentQuestion?.id);
  
  // Automatically move to next question when an answer is selected
  useEffect(() => {
    if (answered) {
      const timer = setTimeout(() => {
        handleNextQuestion();
        setAnswered(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [answered]);

  const handleResponse = (questionId: string, value: number | string) => {
    addResponse(questionId, value);
    
    // Only trigger auto-advance for likert and dicotomic questions, not for open questions
    if (currentQuestion?.type !== 'open') {
      setAnswered(true);
      setAnimation('animate-pulse');
    }
  };

  const handleNextQuestion = () => {
    setAnimation('');
    
    if (currentQuestionIndex < currentQuestions.length - 1) {
      // Move to next question in same module
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentModuleIndex < modules.length - 1) {
      // Move to next module
      setCurrentModule(modules[currentModuleIndex + 1]);
      setCurrentQuestionIndex(0);
    } else {
      // Complete test
      setIsCompleted(true);
      setShowResults(true);
    }
  };
  
  // This is now only used for the "Skip" button
  const handleNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModule(modules[currentModuleIndex + 1]);
      setCurrentQuestionIndex(0);
    } else {
      setIsCompleted(true);
      setShowResults(true);
    }
  };

  const renderQuestion = (question: any) => {
    const response = responses.find(r => r.questionId === question.id);
    
    if (question.type === 'open') {
      return (
        <div key={question.id} className="space-y-6">
          <div className="text-xl font-medium text-center">{question.text}</div>
          <Textarea
            value={response?.value as string || ''}
            onChange={(e) => handleResponse(question.id, e.target.value)}
            placeholder="Escriba su respuesta detallada aquí..."
            className="min-h-[150px] p-4 text-base border-2 border-gray-200 focus:border-primary"
          />
          <div className="flex justify-center mt-8">
            <Button 
              onClick={() => {
                if ((response?.value as string)?.trim().length >= 1) {
                  handleNextQuestion();
                }
              }}
              disabled={!response?.value || (response?.value as string)?.trim().length < 1}
              size="lg"
              className={`px-10 py-4 text-lg font-semibold transition-all duration-200 shadow-lg rounded-full ${
                (response?.value as string)?.trim().length >= 1 
                  ? `bg-gradient-to-r from-${currentModule}-500 to-${currentModule}-600 hover:from-${currentModule}-600 hover:to-${currentModule}-700 text-white border-none hover:shadow-xl hover:scale-105` 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
              }`}
            >
              {(response?.value as string)?.trim().length >= 1 
                ? '✓ Siguiente Pregunta' 
                : 'Escriba su respuesta para continuar'
              }
            </Button>
          </div>
        </div>
      );
    }

    if (question.type === 'dicotomic') {
      return (
        <div key={question.id} className="space-y-6">
          <div className="text-xl font-medium text-center">{question.text}</div>
          <RadioGroup
            value={response?.value?.toString() || ''}
            onValueChange={(value) => handleResponse(question.id, parseInt(value))}
            className="grid grid-cols-2 gap-4 pt-4"
          >
            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleResponse(question.id, 1)}
            >
              <div className={`w-full h-16 flex items-center justify-center rounded-md border-2 transition-all
                ${response?.value === 1 
                  ? `${moduleConfig[currentModule as keyof typeof moduleConfig].color} text-white border-transparent` 
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`
              }>
                <RadioGroupItem value="1" id={`${question.id}_si`} className="sr-only" />
                <Label 
                  htmlFor={`${question.id}_si`} 
                  className={`text-lg font-medium cursor-pointer ${response?.value === 1 ? 'text-white' : ''}`}
                >
                  Sí
                </Label>
              </div>
            </div>
            <div 
              className="flex flex-col items-center cursor-pointer"
              onClick={() => handleResponse(question.id, 0)}
            >
              <div className={`w-full h-16 flex items-center justify-center rounded-md border-2 transition-all
                ${response?.value === 0 
                  ? `${moduleConfig[currentModule as keyof typeof moduleConfig].color} text-white border-transparent` 
                  : 'border-gray-200 hover:border-gray-300 bg-gray-50'}`
              }>
                <RadioGroupItem value="0" id={`${question.id}_no`} className="sr-only" />
                <Label 
                  htmlFor={`${question.id}_no`} 
                  className={`text-lg font-medium cursor-pointer ${response?.value === 0 ? 'text-white' : ''}`}
                >
                  No
                </Label>
              </div>
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
      <div key={question.id} className="space-y-8">
        <div className="text-xl font-medium text-center">{question.text}</div>
        <div className="flex justify-center px-8">
          <RadioGroup
            value={response?.value?.toString() || ''}
            onValueChange={(value) => handleResponse(question.id, parseInt(value))}
            className="flex items-start justify-between gap-6 w-full max-w-3xl"
          >
            {currentScale.map((label, index) => (
              <div 
                key={index} 
                className="flex flex-col items-center cursor-pointer group flex-1 max-w-24"
                onClick={() => handleResponse(question.id, index + 1)}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border transition-all duration-200 hover:scale-105 mb-4 backdrop-blur-sm
                  ${response?.value === index + 1 
                    ? `${moduleConfig[currentModule as keyof typeof moduleConfig].color} text-white border-white/30 shadow-lg shadow-primary/25` 
                    : 'border-white/20 bg-white/10 hover:bg-white/20 hover:border-white/30 shadow-md'}`
                }>
                  <RadioGroupItem 
                    value={(index + 1).toString()} 
                    id={`${question.id}_${index}`} 
                    className="sr-only"
                  />
                  <Label 
                    htmlFor={`${question.id}_${index}`} 
                    className={`text-lg font-semibold cursor-pointer ${response?.value === index + 1 ? 'text-white' : 'text-gray-700'}`}
                  >
                    {index + 1}
                  </Label>
                </div>
                <Label 
                  htmlFor={`${question.id}_${index}`} 
                  className="text-sm text-center leading-tight font-medium text-gray-600 px-2 h-12 flex items-center justify-center"
                >
                  {label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      </div>
    );
  };

  const results = showResults ? calculateResults() : null;

  // Manejar guardado de resultados
  const handleSaveResults = async (results: any) => {
    if (!isAdmin && existingResult) {
      toast({
        title: "Evaluación ya completada",
        description: "Ya has completado esta evaluación anteriormente.",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      await saveResult({
        scores: {
          integridad: results.integridad,
          psicopatia: results.psicopatia,
          violencia: results.violencia,
          agresividad: results.agresividad,
          afrontamiento: results.afrontamiento,
          veracidad: results.veracidad,
          entrevista: results.entrevista
        },
        percentiles: results.percentiles || {},
        clinical_interpretation: results.clinicalInterpretation?.interpretation || results.classification,
        risk_flags: results.clinicalInterpretation?.validityFlags || [],
        global_score: results.globalScore
      });

      toast({
        title: "Resultados guardados",
        description: "Los resultados de tu evaluación han sido guardados exitosamente.",
      });
    } catch (error) {
      console.error('Error saving results:', error);
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al guardar los resultados. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (showResults && results && !isAdmin && !existingResult) {
      handleSaveResults(results);
    }
  }, [showResults, results]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Cargando evaluación...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar mensaje si ya completó la evaluación
  if (!canTakeEvaluation && existingResult) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-green-600" />
              <div>
                <CardTitle>Evaluación ya completada</CardTitle>
                <CardDescription>
                  Ya has completado la evaluación SIERCP anteriormente
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    Evaluación completada el {new Date(existingResult.completed_at).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-green-600">
                    Puntuación global: {existingResult.global_score}/100
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Los resultados de tu evaluación están registrados en el sistema. 
              Si necesitas realizar una nueva evaluación, contacta al administrador.
            </div>

            {isAdmin && (
              <div className="pt-4 border-t">
                <Button
                  onClick={() => {
                    resetTest();
                    setShowResults(false);
                  }}
                  className="w-full"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Realizar nueva evaluación (Modo Admin)
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && results) {
    const getScoreColor = (score: number) => {
      if (score >= 85) return 'text-green-600';
      if (score >= 70) return 'text-blue-600';
      if (score >= 55) return 'text-yellow-600';
      return 'text-red-600';
    };
    
    const getBgColor = (score: number) => {
      if (score >= 85) return 'bg-green-100';
      if (score >= 70) return 'bg-blue-100';
      if (score >= 55) return 'bg-yellow-100';
      return 'bg-red-100';
    };
    
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle>Resultados SIERCP</CardTitle>
                <CardDescription className="text-white/80">
                  Sistema Integrado de Evaluación de Riesgo y Confiabilidad Psico-Criminológica
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6 space-y-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`w-32 h-32 rounded-full ${getBgColor(results.globalScore)} flex items-center justify-center`}>
                  <div className={`text-4xl font-bold ${getScoreColor(results.globalScore)}`}>
                    {results.globalScore}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-40">
                <Card className="overflow-hidden shadow-md">
                  <CardHeader className={`${getBgColor(results.globalScore)} py-3`}>
                    <CardTitle className="text-lg">Clasificación</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getBgColor(results.globalScore)}`}>
                      {results.globalScore >= 70 ? (
                        <CheckCircle className={`h-4 w-4 ${getScoreColor(results.globalScore)}`} />
                      ) : (
                        <AlertCircle className={`h-4 w-4 ${getScoreColor(results.globalScore)}`} />
                      )}
                    </div>
                    <div className={`font-medium ${getScoreColor(results.globalScore)}`}>
                      {results.classification}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden shadow-md">
                  <CardHeader className={`${getBgColor(results.globalScore)} py-3`}>
                    <CardTitle className="text-lg">Recomendación</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="font-medium">{results.recommendation}</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Detalle por Módulos</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { name: 'Integridad', score: results.integridad, icon: Shield },
                  { name: 'Psicopatía', score: results.psicopatia, icon: Brain },
                  { name: 'Violencia', score: results.violencia, icon: AlertCircle },
                  { name: 'Agresividad', score: results.agresividad, icon: Zap },
                  { name: 'Afrontamiento', score: results.afrontamiento, icon: Heart },
                  { name: 'Veracidad', score: results.veracidad, icon: Eye }
                ].map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <Card key={index} className="overflow-hidden shadow-sm">
                      <div className="p-4 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getBgColor(module.score)}`}>
                          <Icon className={`h-5 w-5 ${getScoreColor(module.score)}`} />
                        </div>
                        <div>
                          <div className="text-sm font-medium">{module.name}</div>
                          <div className={`text-2xl font-bold ${getScoreColor(module.score)}`}>{module.score}</div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              {isAdmin && (
                <Button 
                  onClick={resetTest} 
                  variant="outline" 
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Nueva Evaluación
                </Button>
              )}
              <Button 
                onClick={() => window.print()} 
                className={`${isAdmin ? 'flex-1' : 'w-full'} bg-blue-600 hover:bg-blue-700`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Imprimir Resultados
              </Button>
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                Guardando resultados...
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentModuleConfig = moduleConfig[currentModule as keyof typeof moduleConfig];
  const Icon = currentModuleConfig.icon;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Sistema Integrado de Evaluación de Riesgo y Confiabilidad Psico-Criminológica
          </CardTitle>
          <div className="space-y-2">
            <Progress value={progress} className="w-full h-2" />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Pregunta {currentQuestionIndex + 1} de {currentQuestions.length}</span>
              <span>Módulo {currentModuleIndex + 1} de {modules.length}: {currentModuleConfig.title}</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className={`overflow-hidden transition-all duration-300 ${animation}`}>
        <CardHeader className={`${moduleConfig[currentModule as keyof typeof moduleConfig].color} bg-opacity-10`}>
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${moduleConfig[currentModule as keyof typeof moduleConfig].color}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle>{currentModuleConfig.title}</CardTitle>
              <CardDescription>{currentModuleConfig.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 pt-8">
          {currentQuestion && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
              {renderQuestion(currentQuestion)}
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between p-6 border-t">
          <div className="text-sm text-muted-foreground">
            Seleccione su respuesta para continuar
          </div>
          
          <Button 
            onClick={handleNextQuestion}
            disabled={!response}
            size="sm"
          >
            {currentQuestionIndex === currentQuestions.length - 1 && currentModuleIndex === modules.length - 1 
              ? 'Finalizar' 
              : 'Omitir'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SIERCPPage;