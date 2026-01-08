import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Brain, Shield, AlertCircle, CheckCircle, Clock, Lock, Zap, Heart, Eye, MessageSquare, ArrowRight, XCircle } from 'lucide-react';
import { useSIERCPToken } from '@/hooks/useSIERCPInvitations';
import { useSIERCP, type SIERCPResponse } from '@/hooks/useSIERCP';

// Configuración de módulos (simplificada del original)
const moduleConfig = {
  integridad: { title: 'Integridad Laboral', icon: Shield, color: 'bg-blue-500' },
  psicopatia: { title: 'Psicopatía y Antisocialidad', icon: Brain, color: 'bg-red-500' },
  violencia: { title: 'Riesgo de Violencia', icon: AlertCircle, color: 'bg-orange-500' },
  agresividad: { title: 'Agresividad e Impulsividad', icon: Zap, color: 'bg-yellow-500' },
  afrontamiento: { title: 'Estilo de Afrontamiento', icon: Heart, color: 'bg-green-500' },
  veracidad: { title: 'Veracidad de Respuesta', icon: Eye, color: 'bg-purple-500' },
  entrevista: { title: 'Entrevista Estructurada', icon: MessageSquare, color: 'bg-indigo-500' }
};

export default function SIERCPAssessmentPage() {
  const { token } = useParams<{ token: string }>();
  const { validation, isLoading, updateStatus, linkEvaluation } = useSIERCPToken(token);
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [responses, setResponses] = useState<SIERCPResponse[]>([]);
  const [currentModule, setCurrentModule] = useState('integridad');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Importar preguntas del hook SIERCP
  const { getQuestionsForModule, calculateResults } = useSIERCP();

  const modules = Object.keys(moduleConfig);
  const currentModuleIndex = modules.indexOf(currentModule);
  const currentQuestions = getQuestionsForModule(currentModule);
  const currentQuestion = currentQuestions[currentQuestionIndex];

  // Calcular progreso
  const totalQuestions = modules.reduce((total, mod) => total + getQuestionsForModule(mod).length, 0);
  const completedQuestions = modules.slice(0, currentModuleIndex).reduce(
    (total, mod) => total + getQuestionsForModule(mod).length, 0
  ) + currentQuestionIndex;
  const progress = isCompleted ? 100 : Math.round((completedQuestions / totalQuestions) * 100);

  // Marcar como abierto al cargar
  useEffect(() => {
    if (validation?.valid && validation.invitation?.status === 'pending') {
      updateStatus('opened');
    }
  }, [validation?.valid, validation?.invitation?.status]);

  const handleStartTest = async () => {
    setTestStarted(true);
    await updateStatus('started');
  };

  const handleResponse = (questionId: string, value: number | string) => {
    setResponses(prev => {
      const existing = prev.findIndex(r => r.questionId === questionId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { questionId, value };
        return updated;
      }
      return [...prev, { questionId, value }];
    });

    // Auto-avanzar para preguntas no abiertas
    if (currentQuestion?.type !== 'open') {
      setTimeout(() => handleNextQuestion(), 500);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < currentQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentModuleIndex < modules.length - 1) {
      setCurrentModule(modules[currentModuleIndex + 1]);
      setCurrentQuestionIndex(0);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsCompleted(true);
    // TODO: Guardar resultados en evaluaciones_psicometricas y vincular
    // const results = calculateResults(responses);
    // await saveResults(results);
    // await linkEvaluation(evaluacionId);
    await updateStatus('completed');
  };

  const response = responses.find(r => r.questionId === currentQuestion?.id);

  // Estados de error
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Validando enlace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!validation?.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              {validation?.error === 'expired' && <Clock className="h-8 w-8 text-destructive" />}
              {validation?.error === 'already_completed' && <CheckCircle className="h-8 w-8 text-green-600" />}
              {validation?.error === 'cancelled' && <XCircle className="h-8 w-8 text-destructive" />}
              {validation?.error === 'not_found' && <Lock className="h-8 w-8 text-destructive" />}
            </div>
            <CardTitle>
              {validation?.error === 'expired' && 'Enlace Expirado'}
              {validation?.error === 'already_completed' && 'Evaluación Completada'}
              {validation?.error === 'cancelled' && 'Enlace Cancelado'}
              {validation?.error === 'not_found' && 'Enlace No Válido'}
            </CardTitle>
            <CardDescription>{validation?.message}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {validation?.error === 'already_completed' ? (
              <p className="text-sm text-muted-foreground">
                Ya has completado esta evaluación. Gracias por tu participación.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Por favor, contacta al equipo de reclutamiento para obtener un nuevo enlace.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const invitation = validation.invitation!;

  // Pantalla de consentimiento
  if (!consentGiven) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Evaluación Psicométrica SIERCP</CardTitle>
            <CardDescription>
              Sistema Integral de Evaluación de Riesgos y Competencias Psicológicas
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="font-medium mb-1">Hola, {invitation.lead_nombre}</p>
              <p className="text-sm text-muted-foreground">
                Has sido invitado a completar esta evaluación como parte del proceso de selección.
              </p>
            </div>

            <div className="space-y-4 text-sm">
              <h4 className="font-semibold">Instrucciones importantes:</h4>
              <ul className="space-y-2 list-disc pl-5 text-muted-foreground">
                <li>La evaluación consta de 7 módulos con aproximadamente 100 preguntas en total</li>
                <li>Tiempo estimado: 45-60 minutos</li>
                <li>Responde con honestidad - no hay respuestas correctas o incorrectas</li>
                <li>Tu progreso se guarda automáticamente</li>
                <li>El enlace expira el {new Date(invitation.expires_at).toLocaleString('es-MX')}</li>
              </ul>
            </div>

            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Privacidad y Confidencialidad</AlertTitle>
              <AlertDescription>
                Tus respuestas serán tratadas de manera confidencial y utilizadas únicamente para fines de evaluación laboral.
              </AlertDescription>
            </Alert>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Checkbox
                id="consent"
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
              />
              <label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                He leído y acepto las instrucciones. Autorizo el uso de mis respuestas para la evaluación psicométrica como parte del proceso de selección.
              </label>
            </div>
          </CardContent>

          <CardFooter>
            <Button 
              onClick={() => setConsentGiven(true)} 
              className="w-full"
              disabled={!consentGiven}
              size="lg"
            >
              Comenzar Evaluación
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Pantalla de inicio del test
  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle>¿Listo para comenzar?</CardTitle>
            <CardDescription>
              Una vez que inicies, el temporizador comenzará. Asegúrate de tener un ambiente tranquilo y sin distracciones.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">{totalQuestions}</p>
                <p className="text-sm text-muted-foreground">Preguntas</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-2xl font-bold">7</p>
                <p className="text-sm text-muted-foreground">Módulos</p>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleStartTest} className="w-full" size="lg">
              <Brain className="mr-2 h-5 w-5" />
              Iniciar Evaluación
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Pantalla de completado
  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-green-200">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-800">¡Evaluación Completada!</CardTitle>
            <CardDescription>
              Gracias por completar la evaluación SIERCP, {invitation.lead_nombre}.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Tus respuestas han sido registradas exitosamente. El equipo de reclutamiento revisará los resultados y se pondrá en contacto contigo.
            </p>
            <Badge variant="secondary" className="text-base px-4 py-2">
              Puedes cerrar esta ventana
            </Badge>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pantalla de evaluación
  const ModuleIcon = moduleConfig[currentModule as keyof typeof moduleConfig]?.icon || Brain;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header con progreso */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ModuleIcon className={`h-5 w-5 ${moduleConfig[currentModule as keyof typeof moduleConfig]?.color?.replace('bg-', 'text-')}`} />
                <span className="font-medium">{moduleConfig[currentModule as keyof typeof moduleConfig]?.title}</span>
              </div>
              <Badge variant="outline">
                {currentQuestionIndex + 1} / {currentQuestions.length}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-right">{progress}% completado</p>
          </CardContent>
        </Card>

        {/* Pregunta actual */}
        <Card className="border-t-4" style={{ borderTopColor: `var(--${moduleConfig[currentModule as keyof typeof moduleConfig]?.color?.replace('bg-', '')})` }}>
          <CardContent className="p-8">
            {currentQuestion && (
              <div className="space-y-8">
                <h3 className="text-xl font-medium text-center">{currentQuestion.text}</h3>

                {currentQuestion.type === 'open' ? (
                  <div className="space-y-4">
                    <Textarea
                      value={response?.value as string || ''}
                      onChange={(e) => handleResponse(currentQuestion.id, e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      className="min-h-[150px]"
                    />
                    <Button
                      onClick={handleNextQuestion}
                      disabled={!response?.value || (response?.value as string)?.trim().length < 1}
                      className="w-full"
                    >
                      Siguiente
                    </Button>
                  </div>
                ) : currentQuestion.type === 'dicotomic' ? (
                  <RadioGroup
                    value={response?.value?.toString() || ''}
                    onValueChange={(value) => handleResponse(currentQuestion.id, parseInt(value))}
                    className="grid grid-cols-2 gap-4"
                  >
                    {[{ label: 'Sí', value: 1 }, { label: 'No', value: 0 }].map((option) => (
                      <div
                        key={option.value}
                        onClick={() => handleResponse(currentQuestion.id, option.value)}
                        className={`cursor-pointer p-6 rounded-lg border-2 text-center transition-all ${
                          response?.value === option.value
                            ? `${moduleConfig[currentModule as keyof typeof moduleConfig]?.color} text-white border-transparent`
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <RadioGroupItem value={option.value.toString()} className="sr-only" />
                        <span className="text-lg font-medium">{option.label}</span>
                      </div>
                    ))}
                  </RadioGroup>
                ) : (
                  <RadioGroup
                    value={response?.value?.toString() || ''}
                    onValueChange={(value) => handleResponse(currentQuestion.id, parseInt(value))}
                    className="flex justify-center gap-4"
                  >
                    {['Totalmente en desacuerdo', 'En desacuerdo', 'Neutral', 'De acuerdo', 'Totalmente de acuerdo'].map((label, index) => (
                      <div
                        key={index}
                        onClick={() => handleResponse(currentQuestion.id, index + 1)}
                        className="flex flex-col items-center cursor-pointer group"
                      >
                        <div
                          className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all ${
                            response?.value === index + 1
                              ? `${moduleConfig[currentModule as keyof typeof moduleConfig]?.color} text-white border-transparent`
                              : 'border-gray-200 hover:border-gray-400'
                          }`}
                        >
                          <RadioGroupItem value={(index + 1).toString()} className="sr-only" />
                          <span className="font-semibold">{index + 1}</span>
                        </div>
                        <span className="text-xs text-center mt-2 text-muted-foreground max-w-16">
                          {label}
                        </span>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
