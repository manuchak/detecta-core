import { useState, useCallback } from 'react';

export interface SIERCPQuestion {
  id: string;
  text: string;
  type: 'likert' | 'dicotomic' | 'frequency' | 'open';
  module: string;
  reverse?: boolean;
}

export interface SIERCPResponse {
  questionId: string;
  value: number | string;
}

export interface SIERCPResults {
  integridad: number;
  psicopatia: number;
  violencia: number;
  agresividad: number;
  afrontamiento: number;
  veracidad: number;
  entrevista: number;
  globalScore: number;
  classification: string;
  recommendation: string;
}

const questionBank: SIERCPQuestion[] = [
  // Módulo 1: Integridad Laboral (20 ítems)
  { id: 'IL001', text: 'Es aceptable tomar materiales de trabajo si nadie lo nota.', type: 'likert', module: 'integridad', reverse: true },
  { id: 'IL002', text: 'A veces hay que romper las reglas para que el trabajo salga bien.', type: 'likert', module: 'integridad', reverse: true },
  { id: 'IL003', text: 'Preferiría callar antes que acusar a un compañero de una falta.', type: 'likert', module: 'integridad', reverse: true },
  { id: 'IL004', text: 'La honestidad es fundamental en cualquier trabajo.', type: 'likert', module: 'integridad' },
  { id: 'IL005', text: 'Reportaría cualquier irregularidad que observe en mi trabajo.', type: 'likert', module: 'integridad' },
  { id: 'IL006', text: 'Es mi responsabilidad seguir todos los procedimientos establecidos.', type: 'likert', module: 'integridad' },
  { id: 'IL007', text: 'Nunca tomaría algo que no me pertenece, sin importar el valor.', type: 'likert', module: 'integridad' },
  { id: 'IL008', text: 'Si cometo un error, lo reporto inmediatamente.', type: 'likert', module: 'integridad' },
  { id: 'IL009', text: 'La confianza de mi empleador es más importante que cualquier beneficio personal.', type: 'likert', module: 'integridad' },
  { id: 'IL010', text: 'Cumplo con los horarios establecidos sin excepción.', type: 'likert', module: 'integridad' },
  
  // Módulo 2: Psicopatía y Antisocialidad (20 ítems)
  { id: 'PA001', text: 'Me cuesta sentir remordimiento por mis errores.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA002', text: 'Manipular a otros es necesario para sobrevivir.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA003', text: 'No me interesa si mis actos afectan a otros.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA004', text: 'Me preocupo genuinamente por el bienestar de otros.', type: 'likert', module: 'psicopatia' },
  { id: 'PA005', text: 'Siento empatía cuando veo a alguien sufrir.', type: 'likert', module: 'psicopatia' },
  { id: 'PA006', text: 'Reconozco cuando he lastimado a alguien con mis acciones.', type: 'likert', module: 'psicopatia' },
  { id: 'PA007', text: 'Valoro las relaciones basadas en respeto mutuo.', type: 'likert', module: 'psicopatia' },
  { id: 'PA008', text: 'Me gusta ayudar a otros sin esperar nada a cambio.', type: 'likert', module: 'psicopatia' },
  
  // Módulo 3: Riesgo de Violencia (20 ítems)
  { id: 'RV001', text: 'He tenido problemas de conducta desde la adolescencia.', type: 'dicotomic', module: 'violencia', reverse: true },
  { id: 'RV002', text: 'No tengo planes concretos para los próximos 6 meses.', type: 'dicotomic', module: 'violencia', reverse: true },
  { id: 'RV003', text: 'Me cuesta mantener relaciones estables.', type: 'dicotomic', module: 'violencia', reverse: true },
  { id: 'RV004', text: 'Tengo metas claras para mi futuro.', type: 'likert', module: 'violencia' },
  { id: 'RV005', text: 'Mantengo relaciones familiares estables.', type: 'likert', module: 'violencia' },
  { id: 'RV006', text: 'Resuelvo conflictos de manera pacífica.', type: 'likert', module: 'violencia' },
  { id: 'RV007', text: 'Tengo un historial laboral consistente.', type: 'likert', module: 'violencia' },
  { id: 'RV008', text: 'Controlo mis impulsos efectivamente.', type: 'likert', module: 'violencia' },
  
  // Módulo 4: Agresividad e Impulsividad (20 ítems)
  { id: 'AI001', text: 'Cuando alguien me falta al respeto, respondo con agresividad.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI002', text: 'He roto cosas por frustración.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI003', text: 'Me cuesta pedir disculpas cuando me enojo.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI004', text: 'Manejo mi ira de manera constructiva.', type: 'likert', module: 'agresividad' },
  { id: 'AI005', text: 'Pienso antes de actuar en situaciones tensas.', type: 'likert', module: 'agresividad' },
  { id: 'AI006', text: 'Busco soluciones pacíficas a los conflictos.', type: 'likert', module: 'agresividad' },
  { id: 'AI007', text: 'Puedo mantener la calma bajo presión.', type: 'likert', module: 'agresividad' },
  { id: 'AI008', text: 'Respeto las opiniones diferentes a las mías.', type: 'likert', module: 'agresividad' },
  
  // Módulo 5: Estilo de Afrontamiento (20 ítems)
  { id: 'EA001', text: 'Evito enfrentar lo que me molesta.', type: 'frequency', module: 'afrontamiento', reverse: true },
  { id: 'EA002', text: 'Me aíslo cuando algo me sale mal.', type: 'frequency', module: 'afrontamiento', reverse: true },
  { id: 'EA003', text: 'Enfrento los conflictos directamente.', type: 'frequency', module: 'afrontamiento' },
  { id: 'EA004', text: 'Busco apoyo cuando tengo problemas.', type: 'frequency', module: 'afrontamiento' },
  { id: 'EA005', text: 'Analizo las situaciones antes de actuar.', type: 'frequency', module: 'afrontamiento' },
  { id: 'EA006', text: 'Mantengo una actitud positiva ante las dificultades.', type: 'frequency', module: 'afrontamiento' },
  
  // Módulo 6: Veracidad de Respuesta (10 ítems)
  { id: 'VR001', text: 'Nunca he dicho una mentira en mi vida.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR002', text: 'Siempre cumplo todas las normas.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR003', text: 'Jamás he cometido un error en mi vida.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR004', text: 'Nunca he sentido enojo hacia otra persona.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR005', text: 'Siempre soy puntual sin excepción.', type: 'likert', module: 'veracidad', reverse: true },
];

const interviewQuestions = [
  // Preguntas principales de evaluación
  { id: 'ENT001', text: '¿Ha sido testigo o víctima de un delito en su vida? Describa la situación y cómo la manejó.', type: 'open' },
  { id: 'ENT002', text: 'Describa una situación en la que se sintió tentado a incumplir una norma o regla importante. ¿Qué hizo y por qué?', type: 'open' },
  { id: 'ENT003', text: '¿Qué haría si descubre a un compañero robando algo menor en una empresa? Explique su razonamiento.', type: 'open' },
  { id: 'ENT004', text: '¿Cómo maneja situaciones de alto estrés o presión? Proporcione un ejemplo específico.', type: 'open' },
  { id: 'ENT005', text: 'Describa una ocasión en la que tuvo un conflicto significativo con otra persona. ¿Cómo lo resolvió?', type: 'open' },
  
  // Preguntas de control y validez (basadas en escalas MMPI)
  { id: 'ENT006', text: '¿Ha tenido algún problema legal en el pasado?', type: 'dicotomic' },
  { id: 'ENT007', text: '¿Considera que siempre ha sido una persona completamente honesta en todas las situaciones de su vida?', type: 'dicotomic' },
  { id: 'ENT008', text: 'En una escala del 1 al 5, ¿qué tan perfecta considera que es su conducta?', type: 'likert' },
  
  // Preguntas para detectar inconsistencias (repetición con reformulación)
  { id: 'ENT009', text: 'Si presenciara un acto de corrupción en su lugar de trabajo, ¿cuál sería su reacción?', type: 'open' },
  
  // Preguntas de escalas de validez (detección de sobrereporte/subreporte)
  { id: 'ENT010', text: '¿Alguna vez ha experimentado pensamientos agresivos hacia otra persona?', type: 'dicotomic' },
  { id: 'ENT011', text: '¿Ha mentido alguna vez para evitar meterse en problemas?', type: 'dicotomic' },
  { id: 'ENT012', text: '¿Considera que nunca ha cometido errores de juicio en situaciones importantes?', type: 'dicotomic' },
  
  // Pregunta trampa (escala F - infrecuencia)
  { id: 'ENT013', text: '¿Alguna vez ha respirado aire?', type: 'dicotomic' },
  
  // Preguntas de riesgo específico
  { id: 'ENT014', text: '¿Qué opina sobre las personas que justifican el uso de violencia para resolver conflictos?', type: 'open' },
  { id: 'ENT015', text: 'Describa una situación en la que sintió una ira intensa. ¿Cómo la controló?', type: 'open' }
];

export const useSIERCP = () => {
  const [responses, setResponses] = useState<SIERCPResponse[]>([]);
  const [currentModule, setCurrentModule] = useState<string>('integridad');
  const [isCompleted, setIsCompleted] = useState(false);

  const getQuestionsForModule = useCallback((module: string) => {
    if (module === 'entrevista') {
      return interviewQuestions;
    }
    return questionBank.filter(q => q.module === module);
  }, []);

  const addResponse = useCallback((questionId: string, value: number | string) => {
    setResponses(prev => {
      const existing = prev.findIndex(r => r.questionId === questionId);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = { questionId, value };
        return updated;
      }
      return [...prev, { questionId, value }];
    });
  }, []);

  const calculateModuleScore = useCallback((module: string): number => {
    const moduleQuestions = questionBank.filter(q => q.module === module);
    const moduleResponses = responses.filter(r => 
      moduleQuestions.some(q => q.id === r.questionId)
    );

    if (moduleResponses.length === 0) return 0;

    let totalScore = 0;
    let maxPossibleScore = 0;
    
    moduleResponses.forEach(response => {
      const question = moduleQuestions.find(q => q.id === response.questionId);
      if (question && typeof response.value === 'number') {
        let score = response.value;
        
        // Aplicar inversión si es necesario
        if (question.reverse) {
          score = question.type === 'likert' ? 6 - score : 
                 question.type === 'frequency' ? 6 - score : 
                 question.type === 'dicotomic' ? (score === 1 ? 0 : 1) : score;
        }
        
        totalScore += score;
        
        // Calcular el máximo posible para cada pregunta individualmente
        maxPossibleScore += question.type === 'dicotomic' ? 1 : 5;
      }
    });

    if (maxPossibleScore === 0) return 0;
    
    return Math.round((totalScore / maxPossibleScore) * 100);
  }, [responses]);

  const calculateInterviewScore = useCallback(async (): Promise<number> => {
    const interviewResponses = responses.filter(r => 
      interviewQuestions.some(q => q.id === r.questionId)
    );

    if (interviewResponses.length === 0) return 0;

    // Preparar datos para análisis automático
    const analysisData = interviewResponses.map(response => {
      const question = interviewQuestions.find(q => q.id === response.questionId);
      return {
        questionId: response.questionId,
        question: question?.text || '',
        response: response.value.toString()
      };
    });

    try {
      // Importar y usar la función de análisis
      const { analyzeInterview } = await import('./useInterviewAnalysis');
      const analysis = await analyzeInterview(analysisData);
      
      if (analysis && analysis.overallScore) {
        return Math.round(analysis.overallScore);
      }
    } catch (error) {
      console.error('Error en análisis automático de entrevista:', error);
    }

    // Fallback: scoring básico si falla el análisis automático
    return calculateBasicInterviewScore(interviewResponses);
  }, [responses]);

  const calculateBasicInterviewScore = (interviewResponses: SIERCPResponse[]): number => {
    // Análisis básico como fallback
    let score = 75; // Base score
    
    // Revisar preguntas críticas
    const criticalAnswers = interviewResponses.filter(r => 
      ['ENT006', 'ENT007', 'ENT010', 'ENT011', 'ENT012', 'ENT013'].includes(r.questionId)
    );

    criticalAnswers.forEach(response => {
      const questionId = response.questionId;
      const value = response.value;

      // Aplicar lógica de escalas de validez
      if (questionId === 'ENT013' && value !== 1) { // Pregunta trampa
        score -= 20; // Penalización severa por respuesta incorrecta
      }
      if (questionId === 'ENT007' && value === 1) { // Claim de perfección
        score -= 15; // Penalización por falta de honestidad
      }
      if (questionId === 'ENT012' && value === 1) { // Nunca cometió errores
        score -= 15; // Penalización por falta de autocrítica
      }
    });

    return Math.max(0, Math.min(100, score));
  };

  const calculateResults = useCallback((): SIERCPResults => {
    const integridad = calculateModuleScore('integridad');
    const psicopatia = calculateModuleScore('psicopatia');
    const violencia = calculateModuleScore('violencia');
    const agresividad = calculateModuleScore('agresividad');
    const afrontamiento = calculateModuleScore('afrontamiento');
    const veracidad = calculateModuleScore('veracidad');
    
    // Para resultados síncronos, usar scoring básico de entrevista
    const entrevista = 75; // Se calculará asíncronamente en la página

    // Fórmula SIERCP corregida:
    const globalScore = Math.min(100, Math.max(0, Math.round(
      (integridad * 0.20) + 
      (psicopatia * 0.20) + 
      (violencia * 0.20) + 
      (agresividad * 0.15) + 
      (afrontamiento * 0.10) + 
      (veracidad * 0.05) + 
      (entrevista * 0.10)
    )));

    const getClassification = (score: number): string => {
      if (score >= 85) return 'Sin riesgo';
      if (score >= 70) return 'Riesgo bajo';
      if (score >= 55) return 'Riesgo moderado';
      return 'Riesgo alto';
    };

    const getRecommendation = (score: number): string => {
      if (score >= 85) return 'Contratar sin restricciones';
      if (score >= 70) return 'Contratar con seguimiento';
      if (score >= 55) return 'Validación cruzada + entrevista';
      return 'No recomendado';
    };

    return {
      integridad,
      psicopatia,
      violencia,
      agresividad,
      afrontamiento,
      veracidad,
      entrevista,
      globalScore,
      classification: getClassification(globalScore),
      recommendation: getRecommendation(globalScore)
    };
  }, [calculateModuleScore]);

  // Nueva función para cálculo completo con entrevista asíncrona
  const calculateCompleteResults = useCallback(async (): Promise<SIERCPResults> => {
    const integridad = calculateModuleScore('integridad');
    const psicopatia = calculateModuleScore('psicopatia');
    const violencia = calculateModuleScore('violencia');
    const agresividad = calculateModuleScore('agresividad');
    const afrontamiento = calculateModuleScore('afrontamiento');
    const veracidad = calculateModuleScore('veracidad');
    
    // Análisis automático de entrevista
    const entrevista = await calculateInterviewScore();

    const globalScore = Math.min(100, Math.max(0, Math.round(
      (integridad * 0.20) + 
      (psicopatia * 0.20) + 
      (violencia * 0.20) + 
      (agresividad * 0.15) + 
      (afrontamiento * 0.10) + 
      (veracidad * 0.05) + 
      (entrevista * 0.10)
    )));

    const getClassification = (score: number): string => {
      if (score >= 85) return 'Sin riesgo';
      if (score >= 70) return 'Riesgo bajo';
      if (score >= 55) return 'Riesgo moderado';
      return 'Riesgo alto';
    };

    const getRecommendation = (score: number): string => {
      if (score >= 85) return 'Contratar sin restricciones';
      if (score >= 70) return 'Contratar con seguimiento';
      if (score >= 55) return 'Validación cruzada + entrevista';
      return 'No recomendado';
    };

    return {
      integridad,
      psicopatia,
      violencia,
      agresividad,
      afrontamiento,
      veracidad,
      entrevista,
      globalScore,
      classification: getClassification(globalScore),
      recommendation: getRecommendation(globalScore)
    };
  }, [calculateModuleScore, calculateInterviewScore]);

  const resetTest = useCallback(() => {
    setResponses([]);
    setCurrentModule('integridad');
    setIsCompleted(false);
  }, []);

  return {
    responses,
    currentModule,
    isCompleted,
    addResponse,
    setCurrentModule,
    setIsCompleted,
    getQuestionsForModule,
    calculateResults,
    calculateCompleteResults,
    resetTest
  };
};