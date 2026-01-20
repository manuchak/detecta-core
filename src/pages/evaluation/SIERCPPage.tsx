import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle, FileText, Brain, Shield, Zap, Heart, Eye, MessageSquare, ArrowRight, ArrowLeft, UserCheck, History, Clock, AlertTriangle, Target, Briefcase, Lock, Users, Bot, RefreshCw, FlaskConical, Loader2, User, Mail, Phone, XCircle } from "lucide-react";
import { useSIERCP, SIERCPQuestion } from "@/hooks/useSIERCP";
import { useSIERCPResults } from "@/hooks/useSIERCPResults";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useSIERCPAI } from "@/hooks/useSIERCPAI";
import { useSIERCPReport, SIERCPReport } from "@/hooks/useSIERCPReport";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecruitmentErrorBoundary } from "@/components/recruitment/ErrorBoundary";
import { supabase } from "@/integrations/supabase/client";
import { SIERCPPrintableReport } from "@/components/evaluation/SIERCPPrintableReport";
import { StructuredInterviewSection } from "@/components/evaluation/StructuredInterviewSection";


// Estilos CSS para impresión
const printStyles = `
  @media print {
    @page {
      margin: 10mm;
      size: A4;
    }
    
    body * {
      visibility: hidden;
    }
    
    .print-content, .print-content * {
      visibility: visible !important;
      display: block !important;
    }
    
    .print-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      display: block !important;
      background: white !important;
      color: black !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    .no-print {
      display: none !important;
    }

    /* AI Report specific styles */
    #siercp-detailed-report {
      padding: 20px !important;
    }

    #siercp-detailed-report .bg-green-100,
    #siercp-detailed-report .bg-yellow-100,
    #siercp-detailed-report .bg-orange-100,
    #siercp-detailed-report .bg-red-100,
    #siercp-detailed-report .bg-slate-50,
    #siercp-detailed-report .bg-blue-50\\/50,
    #siercp-detailed-report .bg-amber-50\\/50,
    #siercp-detailed-report .bg-green-50\\/50,
    #siercp-detailed-report .bg-red-50\\/50,
    #siercp-detailed-report .bg-slate-100 {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    #siercp-detailed-report .border {
      border-width: 1px !important;
    }

    #siercp-detailed-report .rounded-lg {
      border-radius: 8px !important;
    }

    /* Progress bars in print */
    #siercp-detailed-report .bg-green-500,
    #siercp-detailed-report .bg-yellow-500,
    #siercp-detailed-report .bg-red-500 {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Page breaks */
    #siercp-detailed-report > div {
      page-break-inside: avoid;
    }

    /* Ensure grid layouts print correctly */
    #siercp-detailed-report .grid {
      display: grid !important;
    }

    #siercp-detailed-report .grid-cols-2 {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    #siercp-detailed-report .grid-cols-3 {
      grid-template-columns: repeat(3, 1fr) !important;
    }
    
    /* Legacy print styles for fallback */
    .print-header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    
    .print-header h1 {
      font-size: 18px;
      font-weight: bold;
      margin: 0 0 5px 0;
      color: #333;
    }
    
    .print-header p {
      font-size: 12px;
      margin: 0;
      color: #666;
    }
    
    .print-score-section {
      display: flex;
      justify-content: space-between;
      margin: 20px 0;
      padding: 15px;
      border: 2px solid #333;
      background: #f9f9f9 !important;
      -webkit-print-color-adjust: exact !important;
    }
    
    .print-global-score {
      text-align: center;
      flex: 1;
    }
    
    .print-global-score .score {
      font-size: 36px;
      font-weight: bold;
      margin: 5px 0;
    }
    
    .print-classification {
      flex: 2;
      margin-left: 20px;
    }
    
    .print-modules {
      margin: 20px 0;
    }
    
    .print-modules h3 {
      font-size: 14px;
      font-weight: bold;
      margin: 15px 0 10px 0;
      border-bottom: 1px solid #333;
      padding-bottom: 5px;
    }
    
    .print-module-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-bottom: 20px;
    }
    
    .print-module {
      border: 1px solid #333;
      padding: 10px;
      background: #f9f9f9 !important;
      -webkit-print-color-adjust: exact !important;
    }
    
    .print-module-header {
      display: flex;
      align-items: center;
      margin-bottom: 8px;
    }
    
    .print-module-score {
      font-size: 18px;
      font-weight: bold;
      margin-left: auto;
    }
    
    .print-footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #333;
      font-size: 10px;
      color: #666;
    }
    
    .print-footer ul {
      margin: 5px 0;
      padding-left: 15px;
    }
    
    .print-progress-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin: 5px 0;
    }
    
    .print-progress-fill {
      height: 100%;
      background: #333;
      border-radius: 4px;
    }
  }
`;

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
  const [searchParams] = useSearchParams();
  const resultIdParam = searchParams.get('result');

  const {
    responses,
    currentModule,
    currentQuestionIndex,
    isCompleted,
    testStarted,
    sessionRestored,
    persistenceInitialized,
    addResponse,
    setCurrentModule,
    setCurrentQuestionIndex,
    setIsCompleted,
    getQuestionsForModule,
    calculateResults,
    resetTest,
    startTest,
    completeTest,
    finalizeAndClearSession,
    getRemainingTime,
    SESSION_TIMEOUT_MS
  } = useSIERCP();

  const {
    existingResult,
    loading,
    isAdmin,
    canTakeEvaluation,
    saveResult
  } = useSIERCPResults();

  // Hook para verificar conexión con IA automáticamente
  const { loading: aiLoading, connected, validateConnection } = useSIERCPAI();
  
  // Hook para generar reportes con IA
  const { loading: generatingReport, report: aiReport, generateReport } = useSIERCPReport();

  const [showResults, setShowResults] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [animation, setAnimation] = useState('');
  const [saving, setSaving] = useState(false);
  const [remainingTime, setRemainingTime] = useState(SESSION_TIMEOUT_MS);
  const [consentGiven, setConsentGiven] = useState(false);
  const [savedResults, setSavedResults] = useState<any>(null); // Almacenar resultados calculados
  const [loadingHistorical, setLoadingHistorical] = useState(!!resultIdParam);
  const [historicalError, setHistoricalError] = useState<string | null>(null);
  const [generatedAIReport, setGeneratedAIReport] = useState<SIERCPReport | null>(null);
  const [evalueeProfile, setEvalueeProfile] = useState<{
    display_name: string | null;
    email: string | null;
    phone: string | null;
  } | null>(null);

  // Cargar resultado histórico si viene por parámetro ?result=ID usando RPC segura
  useEffect(() => {
    if (resultIdParam && !savedResults && !historicalError) {
      setLoadingHistorical(true);
      setHistoricalError(null);
      
      supabase
        .rpc('get_siercp_result_by_id', { p_result_id: resultIdParam })
        .then(({ data, error }) => {
          if (error) {
            console.error('SIERCP: Error cargando resultado histórico:', error);
            setHistoricalError('No se pudo cargar el resultado. Es posible que no tengas permisos para verlo.');
            setLoadingHistorical(false);
            return;
          }
          
          // RPC devuelve array, tomar el primer elemento
          const resultRow = Array.isArray(data) ? data[0] : data;
          
          if (!resultRow) {
            setHistoricalError('No se encontró el resultado solicitado o no tienes permisos para verlo.');
            setLoadingHistorical(false);
            return;
          }
          
          // Extraer perfil del evaluado
          setEvalueeProfile({
            display_name: resultRow.display_name,
            email: resultRow.email,
            phone: resultRow.phone
          });
          
          // Transformar el resultado almacenado al formato del UI
          const transformedResult = {
            globalScore: resultRow.global_score,
            ...(resultRow.scores as Record<string, number>),
            percentiles: resultRow.percentiles,
            clinicalInterpretation: {
              interpretation: resultRow.clinical_interpretation,
              validityFlags: resultRow.risk_flags
            },
            classification: resultRow.clinical_interpretation
          };
          setSavedResults(transformedResult);
          
          // Si hay ai_report almacenado, usarlo directamente
          if (resultRow.ai_report) {
            setGeneratedAIReport(resultRow.ai_report);
          }
          
          setShowResults(true);
          setLoadingHistorical(false);
        });
    }
  }, [resultIdParam, savedResults, historicalError]);

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

  // Timer: actualizar tiempo restante cada segundo
  useEffect(() => {
    if (!testStarted || isCompleted || showResults) return;
    
    const interval = setInterval(() => {
      const remaining = getRemainingTime();
      setRemainingTime(remaining);
      
      // Advertencia a los 10 minutos
      if (remaining <= 10 * 60 * 1000 && remaining > 9.9 * 60 * 1000) {
        toast({
          title: "⏰ Tiempo limitado",
          description: "Te quedan menos de 10 minutos para completar la evaluación.",
          variant: "destructive"
        });
      }
      
      // Auto-submit si se acaba el tiempo
      if (remaining <= 0) {
        toast({
          title: "Tiempo agotado",
          description: "El tiempo de la evaluación ha expirado. Se guardarán tus respuestas actuales.",
          variant: "destructive"
        });
        completeTest();
        setShowResults(true);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [testStarted, isCompleted, showResults, getRemainingTime, completeTest]);

  // Print styles effect - MOVED outside conditional render to comply with React hooks rules
  useEffect(() => {
    if (!showResults) return;
    
    const styleElement = document.createElement('style');
    styleElement.textContent = printStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, [showResults]);

  // Bloqueo de navegación: beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testStarted && !isCompleted && !showResults) {
        e.preventDefault();
        e.returnValue = 'Tienes una evaluación en progreso. Si sales, tu progreso se guardará automáticamente y podrás continuar después.';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [testStarted, isCompleted, showResults]);

  // Formatear tiempo restante
  const formatTime = useCallback((ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);
  
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
      // Complete test - calcular resultados ANTES de completar
      const results = calculateResults();
      setSavedResults(results); // Guardar resultados calculados
      completeTest(); // Esto ya NO limpia la sesión
      setShowResults(true);
    }
  };
  
  // This is now only used for the "Skip" button
  const handleNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModule(modules[currentModuleIndex + 1]);
      setCurrentQuestionIndex(0);
    } else {
      const results = calculateResults();
      setSavedResults(results);
      completeTest();
      setShowResults(true);
    }
  };

  // Iniciar test cuando el usuario comienza
  const handleStartTest = () => {
    startTest();
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
  // Usar resultados guardados o calcular nuevos
  const results = showResults ? (savedResults || calculateResults()) : null;

  // Manejar guardado de resultados (ahora incluye ai_report)
  const handleSaveResults = async (resultsToSave: any, aiReportToSave?: any) => {
    if (!resultsToSave) {
      console.error('SIERCP: No hay resultados para guardar');
      return;
    }

    if (!isAdmin && existingResult) {
      toast({
        title: "Evaluación ya completada",
        description: "Ya has completado esta evaluación anteriormente.",
        variant: "destructive"
      });
      return;
    }

    console.log('SIERCP: Intentando guardar resultados:', {
      globalScore: resultsToSave.globalScore,
      hasScores: !!resultsToSave.integridad,
      hasAIReport: !!aiReportToSave,
      isAdmin,
      hasExistingResult: !!existingResult
    });

    setSaving(true);
    try {
      await saveResult({
        scores: {
          integridad: resultsToSave.integridad,
          psicopatia: resultsToSave.psicopatia,
          violencia: resultsToSave.violencia,
          agresividad: resultsToSave.agresividad,
          afrontamiento: resultsToSave.afrontamiento,
          veracidad: resultsToSave.veracidad,
          entrevista: resultsToSave.entrevista
        },
        percentiles: resultsToSave.percentiles || {},
        clinical_interpretation: resultsToSave.clinicalInterpretation?.interpretation || resultsToSave.classification,
        risk_flags: resultsToSave.clinicalInterpretation?.validityFlags || [],
        global_score: resultsToSave.globalScore,
        ai_report: aiReportToSave || null
      });

      console.log('SIERCP: Resultados guardados exitosamente');
      
      // Limpiar sesión DESPUÉS de guardar exitosamente
      finalizeAndClearSession();

      toast({
        title: "Resultados guardados",
        description: "Los resultados de tu evaluación han sido guardados exitosamente.",
      });
    } catch (error) {
      console.error('SIERCP: Error al guardar resultados:', error);
      toast({
        title: "Error al guardar",
        description: "Hubo un problema al guardar los resultados. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Generar análisis de IA cuando se completa la evaluación (no cuando se visualiza)
  const generateAndSaveWithAI = useCallback(async (resultsToProcess: any) => {
    // Preparar datos para el reporte con IA
    const moduleScores = Object.entries(moduleConfig)
      .filter(([key]) => key !== 'entrevista')
      .map(([key, config]) => ({
        name: config.title,
        score: resultsToProcess[key as keyof typeof resultsToProcess] as number,
        maxScore: 100,
        percentage: resultsToProcess[key as keyof typeof resultsToProcess] as number
      }));

    const riskFlags = resultsToProcess.clinicalInterpretation?.validityFlags || [];

    console.log('SIERCP: Generando análisis de IA...');
    
    const report = await generateReport({
      globalScore: resultsToProcess.globalScore,
      moduleScores,
      riskFlags,
      candidateName: 'Candidato', // Se actualiza con el nombre real en perfil
      evaluationDate: new Date().toISOString()
    });

    if (report) {
      console.log('SIERCP: Análisis de IA generado exitosamente');
      setGeneratedAIReport(report);
      return report;
    }
    
    console.warn('SIERCP: No se pudo generar análisis de IA');
    return null;
  }, [generateReport]);

  // Auto-guardar resultados para todos los usuarios
  // Admins: siempre guardar (modo calibración, pueden repetir)
  // No-admins: solo si no tienen resultado previo
  // IMPORTANTE: NO auto-guardar cuando se está viendo un resultado histórico
  useEffect(() => {
    // Si estamos viendo un resultado histórico por parámetro, NO auto-guardar
    if (resultIdParam) {
      return;
    }
    
    // Si ya hay un ai_report generado (ya guardamos), no volver a guardar
    if (showResults && savedResults && !saving && !generatedAIReport) {
      const shouldSave = isAdmin || !existingResult;
      if (shouldSave) {
        console.log('SIERCP: Generando IA y guardando resultados', { isAdmin, existingResult: !!existingResult });
        
        // Primero generar IA, luego guardar con el reporte
        generateAndSaveWithAI(savedResults).then((aiReport) => {
          handleSaveResults(savedResults, aiReport);
        });
      }
    }
  }, [showResults, savedResults, isAdmin, existingResult, resultIdParam, generatedAIReport, saving, generateAndSaveWithAI]);

  if (loading || aiLoading || !persistenceInitialized || loadingHistorical) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-muted-foreground">
                {loadingHistorical ? 'Cargando resultado...' : aiLoading ? 'Verificando conexión con ChatGPT...' : 'Cargando evaluación...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si hay resultIdParam, estamos en modo "ver detalle" - no requiere IA
  const isViewingHistoricalResult = Boolean(resultIdParam);
  
  // Mostrar error si falló la carga del resultado histórico
  if (historicalError) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-red-800">Error al cargar resultado</CardTitle>
                <CardDescription>
                  No se pudo cargar el resultado de la evaluación
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{historicalError}</p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                onClick={() => {
                  setHistoricalError(null);
                  setLoadingHistorical(true);
                }}
                variant="outline"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reintentar
              </Button>
              <Button
                onClick={() => window.history.back()}
                variant="default"
              >
                Volver
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar conexión con IA antes de permitir continuar (excepto para resultados históricos)
  if (connected === false && !isViewingHistoricalResult) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <div>
                <CardTitle className="text-red-800">Conexión con IA requerida</CardTitle>
                <CardDescription>
                  La evaluación SIERCP requiere asistencia de ChatGPT para el análisis
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="font-medium text-red-800">
                    No se pudo conectar con ChatGPT
                  </p>
                  <p className="text-sm text-red-600">
                    Esta evaluación requiere asistencia de inteligencia artificial para garantizar análisis precisos
                  </p>
                </div>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Para continuar con la evaluación, es necesario:
              <ul className="mt-2 ml-4 list-disc">
                <li>Configurar la API key de OpenAI en Configuración</li>
                <li>Verificar que la conexión esté activa</li>
                <li>Intentar nuevamente la conexión</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={validateConnection}
                disabled={aiLoading}
                className="flex items-center gap-2"
              >
                {aiLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Brain className="h-4 w-4" />
                )}
                Reintentar Conexión
              </Button>
              
              <Button
                variant="outline"
                onClick={() => window.location.href = '/settings'}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Ir a Configuración
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mostrar mensaje si ya completó la evaluación (solo si NO está viendo un resultado histórico)
  if (!canTakeEvaluation && existingResult && !showResults && !resultIdParam) {
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

            {/* Botón para ver resultados propios - disponible para todos */}
            <div className="pt-4 border-t space-y-2">
              <Button
                onClick={() => {
                  // Transformar resultado existente al formato del UI
                  const transformedResult = {
                    globalScore: existingResult.global_score,
                    ...(existingResult.scores as Record<string, number>),
                    percentiles: existingResult.percentiles,
                    clinicalInterpretation: {
                      interpretation: existingResult.clinical_interpretation,
                      validityFlags: existingResult.risk_flags
                    },
                    classification: existingResult.clinical_interpretation
                  };
                  setSavedResults(transformedResult);
                  setShowResults(true);
                }}
                variant="outline"
                className="w-full"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver mis resultados
              </Button>

              {isAdmin && (
                <Button
                  onClick={() => {
                    resetTest();
                    setShowResults(false);
                    setSavedResults(null);
                  }}
                  className="w-full"
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Realizar nueva evaluación (Modo Admin)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults && results) {
    // Nueva estrategia de colores basada en psicología del color y emocionalidad
    const getScoreColor = (score: number) => {
      if (score >= 85) return 'text-emerald-600'; // Verde esmeralda - tranquilidad, éxito
      if (score >= 70) return 'text-teal-600';    // Verde azulado - confianza, balance
      if (score >= 55) return 'text-amber-600';   // Ámbar - precaución sin alarma
      return 'text-rose-600';                     // Rosa suave - alerta sin agresividad
    };
    
    const getBgColor = (score: number) => {
      if (score >= 85) return 'bg-emerald-50 border-emerald-200';
      if (score >= 70) return 'bg-teal-50 border-teal-200';
      if (score >= 55) return 'bg-amber-50 border-amber-200';
      return 'bg-rose-50 border-rose-200';
    };

    const getGradientColor = (score: number) => {
      if (score >= 85) return 'from-emerald-500 to-teal-600';
      if (score >= 70) return 'from-teal-500 to-cyan-600';
      if (score >= 55) return 'from-amber-500 to-orange-500';
      return 'from-rose-500 to-pink-600';
    };

    const getRiskLevel = (score: number) => {
      if (score >= 85) return { level: 'Riesgo Bajo', icon: CheckCircle, color: 'text-emerald-600' };
      if (score >= 70) return { level: 'Riesgo Moderado-Bajo', icon: AlertCircle, color: 'text-teal-600' };
      if (score >= 55) return { level: 'Riesgo Moderado', icon: AlertCircle, color: 'text-amber-600' };
      return { level: 'Riesgo Alto', icon: AlertCircle, color: 'text-rose-600' };
    };

    const getRecommendation = (score: number) => {
      if (score >= 85) return 'Contratar con seguimiento estándar';
      if (score >= 70) return 'Contratar con seguimiento reforzado';
      if (score >= 55) return 'Evaluar con precaución';
      return 'No recomendado para contratación';
    };

    // Función para obtener el estado del módulo con colores mejorados
    const getModuleStatus = (score: number) => {
      if (score >= 85) return { 
        label: 'Excelente', 
        variant: 'default' as const, 
        bgColor: 'bg-emerald-100', 
        textColor: 'text-emerald-700',
        borderColor: 'border-emerald-300'
      };
      if (score >= 70) return { 
        label: 'Satisfactorio', 
        variant: 'secondary' as const, 
        bgColor: 'bg-teal-100', 
        textColor: 'text-teal-700',
        borderColor: 'border-teal-300'
      };
      if (score >= 55) return { 
        label: 'Moderado', 
        variant: 'outline' as const, 
        bgColor: 'bg-amber-100', 
        textColor: 'text-amber-700',
        borderColor: 'border-amber-300'
      };
      return { 
        label: 'Requiere Atención', 
        variant: 'outline' as const, 
        bgColor: 'bg-rose-100', 
        textColor: 'text-rose-700',
        borderColor: 'border-rose-300'
      };
    };

    // Color de fondo para nivel de aptitud de IA
    const getFitBackgroundColor = (nivel: string) => {
      switch (nivel) {
        case 'Alta': return 'bg-green-100 border-green-300 text-green-800';
        case 'Media': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        case 'Baja': return 'bg-orange-100 border-orange-300 text-orange-800';
        case 'No apto': return 'bg-red-100 border-red-300 text-red-800';
        default: return 'bg-gray-100 border-gray-300 text-gray-800';
      }
    };

    const riskInfo = getRiskLevel(results.globalScore);
    
    return (
      <>
        {/* Print-only content - AI Generated Report */}
        {generatedAIReport ? (
          <div className="print-content" style={{ display: 'none' }}>
            <SIERCPPrintableReport 
              report={generatedAIReport} 
              candidateName={evalueeProfile?.display_name || undefined}
            />
          </div>
        ) : (
          <div className="print-content" style={{ display: 'none' }}>
            <div className="print-header">
              <h1>RESULTADOS SIERCP</h1>
              <p>Sistema Integrado de Evaluación de Riesgo y Confiabilidad Psico-Criminológica</p>
              <p>Fecha de evaluación: {new Date().toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}</p>
            </div>

            <div className="print-score-section">
              <div className="print-global-score">
                <h2>Puntuación Global</h2>
                <div className="score">{results.globalScore}</div>
                <div className="print-progress-bar">
                  <div className="print-progress-fill" style={{ width: `${results.globalScore}%` }}></div>
                </div>
              </div>
              
              <div className="print-classification">
                <h3>Clasificación de Riesgo</h3>
                <p><strong>{riskInfo.level}</strong></p>
                <p>Basado en la puntuación global de {results.globalScore}/100</p>
                
                <h3>Recomendación</h3>
                <p><strong>{getRecommendation(results.globalScore)}</strong></p>
              </div>
            </div>

            <div className="print-modules">
              <h3>Detalle por Módulos</h3>
              <div className="print-module-grid">
                {Object.entries(moduleConfig).map(([key, config]) => {
                  if (key === 'entrevista') return null;
                  
                  const score = results[key as keyof typeof results] as number;
                  
                  return (
                    <div key={key} className="print-module">
                      <div className="print-module-header">
                        <div>
                          <strong>{config.title}</strong>
                          <div style={{ fontSize: '10px', color: '#666' }}>{config.description}</div>
                        </div>
                        <div className="print-module-score">{score}</div>
                      </div>
                      <div className="print-progress-bar">
                        <div className="print-progress-fill" style={{ width: `${score}%` }}></div>
                      </div>
                      <div style={{ fontSize: '10px', marginTop: '5px' }}>
                        Estado: {score >= 70 ? 'Normal' : 'Requiere Atención'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="print-footer">
              <h4>Información Importante:</h4>
              <ul>
                <li>Esta evaluación es una herramienta de apoyo y no sustituye el criterio profesional.</li>
                <li>Los resultados deben ser interpretados por personal calificado.</li>
                <li>Se recomienda complementar con entrevistas y verificación de referencias.</li>
                <li>Este documento contiene información confidencial y debe ser tratado con la debida reserva.</li>
              </ul>
              <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px' }}>
                Sistema SIERCP - Documento generado automáticamente - Confidencial
              </p>
            </div>
          </div>
        )}

        {/* Screen content */}
        <div className="container mx-auto p-6 space-y-6 max-w-5xl no-print">
          {/* Header Card */}
          <Card className="overflow-hidden">
            <CardHeader className={`bg-gradient-to-r ${getGradientColor(results.globalScore)} text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <FileText className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Resultados SIERCP</CardTitle>
                    <CardDescription className="text-white/90 text-base">
                      Sistema Integrado de Evaluación de Riesgo y Confiabilidad Psico-Criminológica
                    </CardDescription>
                  </div>
                </div>
                {isAdmin && (
                  <Badge className="bg-white/20 text-white border-white/30 gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5" />
                    Modo Calibración
                  </Badge>
                )}
              </div>
            </CardHeader>
            {/* Confirmación de guardado para admins */}
            {isAdmin && saving && (
              <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-amber-700 text-sm">
                <div className="h-3 w-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                Guardando resultados de calibración...
              </div>
            )}
            {isAdmin && !saving && savedResults && (
              <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-200 flex items-center gap-2 text-emerald-700 text-sm">
                <CheckCircle className="h-4 w-4" />
                Resultados guardados en el dashboard de calibración
              </div>
            )}
          </Card>

          {/* Evaluee Profile Card */}
          {evalueeProfile && (
            <Card className="border-l-4 border-l-primary bg-gradient-to-r from-primary/5 to-transparent">
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">
                        {evalueeProfile.display_name || 'Candidato sin nombre'}
                      </h3>
                      <Badge variant="outline" className="text-xs">Evaluado</Badge>
                    </div>
                    {evalueeProfile.email && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" />
                        {evalueeProfile.email}
                      </p>
                    )}
                    {evalueeProfile.phone && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {evalueeProfile.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Results */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Global Score */}
            <Card className="lg:col-span-1">
              <CardContent className="p-6 text-center">
                <div className="space-y-4">
                  <div className={`relative w-32 h-32 mx-auto rounded-full ${getBgColor(results.globalScore)} border-4 flex items-center justify-center`}>
                    <div className={`text-4xl font-bold ${getScoreColor(results.globalScore)}`}>
                      {results.globalScore}
                    </div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <Badge variant="secondary" className="text-xs">
                        Puntuación Global
                      </Badge>
                    </div>
                  </div>
                  <Progress value={results.globalScore} className="w-full h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Classification and AI-Powered Recommendation */}
            <div className="lg:col-span-2 space-y-4">
              {/* AI Analysis Loading State */}
              {!generatedAIReport && generatingReport && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <div>
                        <p className="font-medium">Analizando perfil con IA...</p>
                        <p className="text-sm text-muted-foreground">
                          Generando evaluación de aptitud para custodio de mercancía
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* AI-Powered Aptitude Card */}
              {generatedAIReport?.fit_custodio ? (
                <Card className="overflow-hidden border-2">
                  <div className={`p-5 ${getFitBackgroundColor(generatedAIReport.fit_custodio.nivel)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wide opacity-75 font-medium">
                          Aptitud para Custodio de Mercancía
                        </p>
                        <p className="text-2xl font-bold mt-1">
                          {generatedAIReport.fit_custodio.nivel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs opacity-75">Confianza</p>
                        <p className="text-xl font-bold">
                          {generatedAIReport.fit_custodio.porcentaje_confianza}%
                        </p>
                      </div>
                    </div>
                    {generatedAIReport.fit_custodio.justificacion && (
                      <p className="mt-3 text-sm border-t border-current/20 pt-3 opacity-90">
                        {generatedAIReport.fit_custodio.justificacion}
                      </p>
                    )}
                  </div>
                </Card>
              ) : !generatingReport && (
                // Fallback: Score-based classification when no AI report
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <riskInfo.icon className={`h-5 w-5 ${riskInfo.color}`} />
                      Clasificación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className={`p-4 rounded-lg border-2 ${getBgColor(results.globalScore)}`}>
                      <div className={`text-xl font-semibold ${riskInfo.color}`}>
                        {riskInfo.level}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Basado en puntuación global de {results.globalScore}/100
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Risk Factors Alert */}
              {generatedAIReport?.factores_riesgo && generatedAIReport.factores_riesgo.length > 0 && (
                <Alert variant="destructive" className="border-2">
                  <AlertTriangle className="h-4 w-4" />
                  <div className="ml-2">
                    <p className="font-semibold text-sm">Factores de Riesgo Identificados</p>
                    <ul className="mt-2 space-y-1.5">
                      {generatedAIReport.factores_riesgo.map((factor: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Alert>
              )}

              {/* Actionable Recommendations */}
              {generatedAIReport?.recomendaciones && generatedAIReport.recomendaciones.length > 0 && (
                <Card className="border-2 border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-blue-800">
                      <Target className="h-4 w-4" />
                      Acciones Recomendadas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2">
                      {generatedAIReport.recomendaciones.map((rec: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                          <span className="font-bold text-blue-800 min-w-[20px]">{i + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Protection Factors (if any) */}
              {generatedAIReport?.factores_proteccion && generatedAIReport.factores_proteccion.length > 0 && (
                <Card className="border-2 border-green-200 bg-green-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-green-800">
                      <CheckCircle className="h-4 w-4" />
                      Factores de Protección
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-1.5">
                      {generatedAIReport.factores_proteccion.map((factor: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-green-700">
                          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Module Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                Detalle por Módulos
              </CardTitle>
              <CardDescription>
                Puntuaciones específicas de cada área evaluada
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(moduleConfig).map(([key, config]) => {
                  if (key === 'entrevista') return null; // Skip interview module for now
                  
                  const score = results[key as keyof typeof results] as number;
                  const Icon = config.icon;
                  
                  return (
                    <Card key={key} className="relative overflow-hidden border-2 hover:shadow-md transition-shadow">
                      <div className={`absolute top-0 left-0 w-full h-1 ${config.color}`}></div>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`w-10 h-10 rounded-lg ${config.color} bg-opacity-20 flex items-center justify-center`}>
                            <Icon className={`h-5 w-5 ${config.color.replace('bg-', 'text-')}`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-sm">{config.title}</h3>
                            <p className="text-xs text-gray-500">{config.description}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className={`text-2xl font-bold ${getScoreColor(score)}`}>
                              {score}
                            </span>
                            {(() => {
                              const status = getModuleStatus(score);
                              return (
                                <Badge 
                                  variant={status.variant} 
                                  className={`text-xs ${status.bgColor} ${status.textColor} ${status.borderColor} border`}
                                >
                                  {status.label}
                                </Badge>
                              );
                            })()}
                          </div>
                          <Progress value={score} className="h-2" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Structured Interview Section */}
          <StructuredInterviewSection
            resultId={resultIdParam}
            candidatoEmail={evalueeProfile?.email}
            candidatoNombre={evalueeProfile?.display_name}
          />

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button
              variant="outline"
              onClick={() => {
                resetTest();
                setShowResults(false);
                setCurrentQuestionIndex(0);
                setGeneratedAIReport(null);
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Nueva Evaluación
            </Button>
            
            <Button
              onClick={async () => {
                // Si ya tenemos el reporte de IA, solo imprimir
                if (generatedAIReport) {
                  window.print();
                  return;
                }

                // Si no, generar el reporte primero
                const moduleScores = Object.entries(moduleConfig)
                  .filter(([key]) => key !== 'entrevista')
                  .map(([key, config]) => ({
                    name: config.title,
                    score: results[key as keyof typeof results] as number,
                    maxScore: 100,
                    percentage: results[key as keyof typeof results] as number
                  }));

                const riskFlags = results.clinicalInterpretation?.validityFlags || [];

                const report = await generateReport({
                  globalScore: results.globalScore,
                  moduleScores,
                  riskFlags,
                  candidateName: evalueeProfile?.display_name || 'Candidato',
                  evaluationDate: new Date().toISOString()
                });

                if (report) {
                  setGeneratedAIReport(report);
                  setTimeout(() => window.print(), 800);
                }
              }}
              disabled={generatingReport}
              className={`bg-gradient-to-r ${getGradientColor(results.globalScore)} text-white hover:opacity-90 flex items-center gap-2`}
            >
              {generatingReport ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando Informe con IA...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {generatedAIReport ? 'Imprimir Informe' : 'Generar e Imprimir Informe'}
                </>
              )}
            </Button>
          </div>

          {/* AI Report Status - only show if report was generated for printing */}
          {generatedAIReport && !resultIdParam && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Análisis de IA completado y almacenado. Puedes imprimir el informe detallado cuando lo necesites.
              </AlertDescription>
            </Alert>
          )}

          {/* Additional Information */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p className="font-medium">Información importante:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Esta evaluación es una herramienta de apoyo y no sustituye el criterio profesional.</li>
                  <li>Los resultados deben ser interpretados por personal calificado.</li>
                  <li>Se recomienda complementar con entrevistas y verificación de referencias.</li>
                  <li>Fecha de evaluación: {new Date().toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {saving && (
            <div className="flex items-center justify-center gap-2 pt-4 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Guardando resultados...
            </div>
          )}
        </div>
      </>
    );
  }

  const currentModuleConfig = moduleConfig[currentModule as keyof typeof moduleConfig];
  const Icon = currentModuleConfig.icon;

  // Pantalla de intro con consentimiento informado si no ha iniciado el test
  if (!testStarted && !sessionRestored) {
    return (
      <div className="container mx-auto p-6 space-y-6 max-w-3xl">
        <Card>
          <CardHeader className="text-center pb-2">
            <CardTitle className="flex items-center justify-center gap-2 text-xl">
              <Brain className="h-6 w-6 text-primary" />
              Sistema Integrado de Evaluación de Riesgo y Confiabilidad Psico-Criminológica
            </CardTitle>
            <CardDescription>
              (SIERCP)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Advertencia principal */}
            <Alert className="border-amber-500 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 font-medium">
                Lea cuidadosamente la siguiente información antes de continuar
              </AlertDescription>
            </Alert>

            {/* Bloque 1: Propósito */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">Propósito de la evaluación</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                Esta evaluación mide rasgos de confiabilidad, integridad y riesgo psico-criminológico. 
                Su objetivo es determinar la aptitud para posiciones en el sector de seguridad privada.
              </p>
            </div>

            {/* Bloque 2: Uso de resultados */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">Uso de los resultados</h3>
              </div>
              <p className="text-sm text-muted-foreground pl-10">
                Los resultados serán utilizados como parte del proceso de evaluación laboral y 
                <strong> pueden influir en decisiones de contratación o asignación</strong> a servicios específicos.
              </p>
            </div>

            {/* Bloque 3: Acceso y confidencialidad */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">Acceso y confidencialidad</h3>
              </div>
              <ul className="text-sm text-muted-foreground pl-10 space-y-1">
                <li>• <strong>Acceso:</strong> Recursos Humanos, Jefes de Seguridad y administradores autorizados</li>
                <li>• <strong>Retención:</strong> Los datos se almacenan de forma segura según políticas internas</li>
                <li className="flex items-start gap-1">
                  <Bot className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>Se utiliza <strong>inteligencia artificial</strong> para análisis de respuestas y generación de informes</span>
                </li>
              </ul>
            </div>

            {/* Bloque 4: Condiciones */}
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-semibold">Condiciones de la evaluación</h3>
              </div>
              <ul className="text-sm text-muted-foreground pl-10 space-y-1">
                <li>• Tiempo máximo: <strong>90 minutos</strong></li>
                <li>• Debe completarse en <strong>una sola sesión</strong></li>
                <li>• Las respuestas se guardan automáticamente ante fallos técnicos</li>
                <li>• Una vez enviada, <strong>no puede modificarse</strong></li>
                <li>• Es un <strong>único intento</strong> (no se puede repetir sin autorización)</li>
              </ul>
            </div>

            {/* Bloque 5: Participación voluntaria */}
            <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <Users className="h-4 w-4 text-amber-700" />
                </div>
                <h3 className="font-semibold text-amber-900">Participación voluntaria</h3>
              </div>
              <p className="text-sm text-amber-800 pl-10">
                Su participación es <strong>completamente voluntaria</strong>. Sin embargo, declinar la evaluación 
                puede afectar su proceso de evaluación o contratación.
              </p>
            </div>

            {/* Separador */}
            <div className="border-t my-4"></div>

            {/* Checkbox de consentimiento */}
            <div className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
              <Checkbox 
                id="consent" 
                checked={consentGiven}
                onCheckedChange={(checked) => setConsentGiven(checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="consent" className="text-sm leading-relaxed cursor-pointer">
                He leído y comprendo las condiciones anteriores. <strong>Acepto participar voluntariamente</strong> en 
                esta evaluación y <strong>autorizo el uso de mis resultados</strong> según lo descrito.
              </Label>
            </div>

            {/* Timer preview */}
            <div className="flex items-center justify-center gap-2 py-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg font-mono font-medium">90:00</span>
              <span className="text-sm text-muted-foreground">minutos disponibles</span>
            </div>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => window.history.back()}
              >
                No deseo participar
              </Button>
              <Button 
                onClick={handleStartTest} 
                className="flex-1" 
                size="lg"
                disabled={!consentGiven}
              >
                <Brain className="h-5 w-5 mr-2" />
                Iniciar Evaluación
              </Button>
            </div>

            {!consentGiven && (
              <p className="text-xs text-center text-muted-foreground">
                Debe aceptar las condiciones para iniciar la evaluación
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Mensaje de sesión restaurada
  const showRestoredNotice = sessionRestored && testStarted && !showResults;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-3xl">
      
      {/* Timer y estado de sesión */}
      {showRestoredNotice && (
        <Alert className="border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Se restauró tu progreso anterior. Continúa donde te quedaste.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              SIERCP
            </CardTitle>
            {/* Timer visible */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm ${
              remainingTime <= 10 * 60 * 1000 
                ? 'bg-red-100 text-red-700 animate-pulse' 
                : 'bg-muted text-muted-foreground'
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-medium">{formatTime(remainingTime)}</span>
            </div>
          </div>
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

// Componente wrapper con ErrorBoundary
const SIERCPPageWithErrorBoundary = () => {
  return (
    <RecruitmentErrorBoundary>
      <SIERCPPage />
    </RecruitmentErrorBoundary>
  );
};

export default SIERCPPageWithErrorBoundary;