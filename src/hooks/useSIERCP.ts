import { useState, useCallback } from 'react';

export interface SIERCPQuestion {
  id: string;
  text: string;
  type: 'likert' | 'open';
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
  { id: 'IL011', text: 'Acato las órdenes de mis superiores sin cuestionamiento.', type: 'likert', module: 'integridad' },
  { id: 'IL012', text: 'Mantengo la confidencialidad de información sensible.', type: 'likert', module: 'integridad' },
  { id: 'IL013', text: 'Respeto los bienes y recursos de la empresa.', type: 'likert', module: 'integridad' },
  { id: 'IL014', text: 'Evito conflictos de interés en mi trabajo.', type: 'likert', module: 'integridad' },
  { id: 'IL015', text: 'Considero que mentir ocasionalmente es justificable.', type: 'likert', module: 'integridad', reverse: true },
  { id: 'IL016', text: 'Mi integridad personal es inquebrantable.', type: 'likert', module: 'integridad' },
  { id: 'IL017', text: 'Denunciaría corrupción incluso si me afecta personalmente.', type: 'likert', module: 'integridad' },
  { id: 'IL018', text: 'Acepto responsabilidad por mis errores.', type: 'likert', module: 'integridad' },
  { id: 'IL019', text: 'Evito situaciones que comprometan mi ética.', type: 'likert', module: 'integridad' },
  { id: 'IL020', text: 'Mi palabra es mi compromiso más importante.', type: 'likert', module: 'integridad' },
  
  // Módulo 2: Psicopatía y Antisocialidad (20 ítems)
  { id: 'PA001', text: 'Me cuesta sentir remordimiento por mis errores.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA002', text: 'Manipular a otros es necesario para sobrevivir.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA003', text: 'No me interesa si mis actos afectan a otros.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA004', text: 'Me preocupo genuinamente por el bienestar de otros.', type: 'likert', module: 'psicopatia' },
  { id: 'PA005', text: 'Siento empatía cuando veo a alguien sufrir.', type: 'likert', module: 'psicopatia' },
  { id: 'PA006', text: 'Reconozco cuando he lastimado a alguien con mis acciones.', type: 'likert', module: 'psicopatia' },
  { id: 'PA007', text: 'Valoro las relaciones basadas en respeto mutuo.', type: 'likert', module: 'psicopatia' },
  { id: 'PA008', text: 'Me gusta ayudar a otros sin esperar nada a cambio.', type: 'likert', module: 'psicopatia' },
  { id: 'PA009', text: 'Entiendo las consecuencias de mis acciones.', type: 'likert', module: 'psicopatia' },
  { id: 'PA010', text: 'Me resulta fácil mentir cuando me conviene.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA011', text: 'Considero los sentimientos de otros antes de actuar.', type: 'likert', module: 'psicopatia' },
  { id: 'PA012', text: 'Puedo ser encantador para obtener lo que quiero.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA013', text: 'Me arrepiento sinceramente cuando hago daño.', type: 'likert', module: 'psicopatia' },
  { id: 'PA014', text: 'Los demás existen para mi beneficio.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA015', text: 'Mantengo compromisos a largo plazo.', type: 'likert', module: 'psicopatia' },
  { id: 'PA016', text: 'Soy responsable de mis propias acciones.', type: 'likert', module: 'psicopatia' },
  { id: 'PA017', text: 'Uso el encanto superficial para manipular.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA018', text: 'Respeto los derechos y límites de otros.', type: 'likert', module: 'psicopatia' },
  { id: 'PA019', text: 'Me cuesta formar vínculos emocionales profundos.', type: 'likert', module: 'psicopatia', reverse: true },
  { id: 'PA020', text: 'Valoro la confianza que otros depositan en mí.', type: 'likert', module: 'psicopatia' },
  
  // Módulo 3: Riesgo de Violencia (20 ítems)
  { id: 'RV001', text: 'He tenido problemas de conducta frecuentes desde la adolescencia.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV002', text: 'Me cuesta establecer metas a largo plazo.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV003', text: 'Me resulta difícil mantener relaciones estables.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV004', text: 'Tengo metas claras para mi futuro.', type: 'likert', module: 'violencia' },
  { id: 'RV005', text: 'Mantengo relaciones familiares estables.', type: 'likert', module: 'violencia' },
  { id: 'RV006', text: 'Resuelvo conflictos de manera pacífica.', type: 'likert', module: 'violencia' },
  { id: 'RV007', text: 'Tengo un historial laboral consistente.', type: 'likert', module: 'violencia' },
  { id: 'RV008', text: 'Controlo mis impulsos efectivamente.', type: 'likert', module: 'violencia' },
  { id: 'RV009', text: 'He sido arrestado o detenido por las autoridades.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV010', text: 'Tengo dificultades para seguir reglas y normas.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV011', text: 'Mantengo estabilidad en mi vida personal.', type: 'likert', module: 'violencia' },
  { id: 'RV012', text: 'Cumplo con mis responsabilidades familiares.', type: 'likert', module: 'violencia' },
  { id: 'RV013', text: 'He usado violencia para resolver problemas.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV014', text: 'Mantengo empleos por períodos prolongados.', type: 'likert', module: 'violencia' },
  { id: 'RV015', text: 'Planifico mis acciones cuidadosamente.', type: 'likert', module: 'violencia' },
  { id: 'RV016', text: 'Tengo problemas recurrentes con sustancias.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV017', text: 'Busco ayuda profesional cuando la necesito.', type: 'likert', module: 'violencia' },
  { id: 'RV018', text: 'Mi comportamiento es predecible y estable.', type: 'likert', module: 'violencia' },
  { id: 'RV019', text: 'He amenazado a otros verbalmente.', type: 'likert', module: 'violencia', reverse: true },
  { id: 'RV020', text: 'Respeto la autoridad y las instituciones.', type: 'likert', module: 'violencia' },
  
  // Módulo 4: Agresividad e Impulsividad (20 ítems)
  { id: 'AI001', text: 'Cuando alguien me falta al respeto, respondo con agresividad.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI002', text: 'He roto cosas por frustración.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI003', text: 'Me cuesta pedir disculpas cuando me enojo.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI004', text: 'Manejo mi ira de manera constructiva.', type: 'likert', module: 'agresividad' },
  { id: 'AI005', text: 'Pienso antes de actuar en situaciones tensas.', type: 'likert', module: 'agresividad' },
  { id: 'AI006', text: 'Busco soluciones pacíficas a los conflictos.', type: 'likert', module: 'agresividad' },
  { id: 'AI007', text: 'Puedo mantener la calma bajo presión.', type: 'likert', module: 'agresividad' },
  { id: 'AI008', text: 'Respeto las opiniones diferentes a las mías.', type: 'likert', module: 'agresividad' },
  { id: 'AI009', text: 'Actúo impulsivamente sin considerar consecuencias.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI010', text: 'Me irrito fácilmente con pequeñas molestias.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI011', text: 'Controlo mi temperamento en situaciones difíciles.', type: 'likert', module: 'agresividad' },
  { id: 'AI012', text: 'Uso técnicas de relajación cuando me siento tenso.', type: 'likert', module: 'agresividad' },
  { id: 'AI013', text: 'He empujado o golpeado a alguien en el último año.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI014', text: 'Prefiero la discusión racional al conflicto.', type: 'likert', module: 'agresividad' },
  { id: 'AI015', text: 'Me tomo tiempo para reflexionar antes de responder.', type: 'likert', module: 'agresividad' },
  { id: 'AI016', text: 'Pierdo el control cuando me contradicen.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI017', text: 'Busco mediación cuando hay desacuerdos.', type: 'likert', module: 'agresividad' },
  { id: 'AI018', text: 'Mi primer impulso es responder con calma.', type: 'likert', module: 'agresividad' },
  { id: 'AI019', text: 'He gritado o insultado a otros en discusiones.', type: 'likert', module: 'agresividad', reverse: true },
  { id: 'AI020', text: 'Puedo aceptar críticas sin alterarme.', type: 'likert', module: 'agresividad' },
  
  // Módulo 5: Estilo de Afrontamiento (20 ítems)
  { id: 'EA001', text: 'Evito enfrentar problemas que me incomodan.', type: 'likert', module: 'afrontamiento', reverse: true },
  { id: 'EA002', text: 'Me aíslo cuando las cosas van mal.', type: 'likert', module: 'afrontamiento', reverse: true },
  { id: 'EA003', text: 'Enfrento los conflictos directamente.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA004', text: 'Busco apoyo cuando tengo problemas.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA005', text: 'Analizo las situaciones antes de actuar.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA006', text: 'Mantengo una actitud positiva ante las dificultades.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA007', text: 'Uso estrategias activas para resolver problemas.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA008', text: 'Procrastino cuando debo tomar decisiones difíciles.', type: 'likert', module: 'afrontamiento', reverse: true },
  { id: 'EA009', text: 'Busco múltiples perspectivas ante los problemas.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA010', text: 'Prefiero que otros resuelvan mis problemas.', type: 'likert', module: 'afrontamiento', reverse: true },
  { id: 'EA011', text: 'Mantengo la calma en situaciones estresantes.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA012', text: 'Desarrollo planes alternativos cuando algo falla.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA013', text: 'Me culpo a mí mismo cuando las cosas van mal.', type: 'likert', module: 'afrontamiento', reverse: true },
  { id: 'EA014', text: 'Aprendo de mis errores y fracasos.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA015', text: 'Busco el lado positivo de las situaciones difíciles.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA016', text: 'Me paralizo ante problemas complejos.', type: 'likert', module: 'afrontamiento', reverse: true },
  { id: 'EA017', text: 'Pido ayuda profesional cuando es necesario.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA018', text: 'Confío en mi capacidad para superar obstáculos.', type: 'likert', module: 'afrontamiento' },
  { id: 'EA019', text: 'Evito responsabilidades cuando me siento abrumado.', type: 'likert', module: 'afrontamiento', reverse: true },
  { id: 'EA020', text: 'Uso técnicas de manejo del estrés regularmente.', type: 'likert', module: 'afrontamiento' },
  
  // Módulo 6: Veracidad de Respuesta (20 ítems)
  { id: 'VR001', text: 'Nunca he dicho una mentira en mi vida.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR002', text: 'Siempre cumplo todas las normas sin excepción.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR003', text: 'Jamás he cometido un error en mi vida.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR004', text: 'Nunca he sentido enojo hacia otra persona.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR005', text: 'Siempre soy puntual sin excepción alguna.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR006', text: 'He mentido ocasionalmente para evitar problemas.', type: 'likert', module: 'veracidad' },
  { id: 'VR007', text: 'A veces he llegado tarde a compromisos importantes.', type: 'likert', module: 'veracidad' },
  { id: 'VR008', text: 'He experimentado sentimientos de enojo justificado.', type: 'likert', module: 'veracidad' },
  { id: 'VR009', text: 'He cometido errores de los que he aprendido.', type: 'likert', module: 'veracidad' },
  { id: 'VR010', text: 'Reconozco que tengo defectos como cualquier persona.', type: 'likert', module: 'veracidad' },
  { id: 'VR011', text: 'Nunca he criticado a nadie en mi vida.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR012', text: 'He sentido envidia hacia otros en algunas ocasiones.', type: 'likert', module: 'veracidad' },
  { id: 'VR013', text: 'Siempre he sido completamente honesto en las entrevistas.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR014', text: 'He tenido pensamientos negativos sobre algunas personas.', type: 'likert', module: 'veracidad' },
  { id: 'VR015', text: 'A veces he actuado de manera egoísta.', type: 'likert', module: 'veracidad' },
  { id: 'VR016', text: 'Nunca he quebrantado una promesa en mi vida.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR017', text: 'He experimentado momentos de pereza o desmotivación.', type: 'likert', module: 'veracidad' },
  { id: 'VR018', text: 'A veces he juzgado a otros sin conocerlos bien.', type: 'likert', module: 'veracidad' },
  { id: 'VR019', text: 'Siempre he tenido pensamientos completamente puros.', type: 'likert', module: 'veracidad', reverse: true },
  { id: 'VR020', text: 'He tenido dudas sobre mis propias capacidades.', type: 'likert', module: 'veracidad' },
];

const interviewQuestions = [
  // Preguntas principales de evaluación
  { id: 'ENT001', text: '¿Ha sido testigo o víctima de un delito en su vida? Describa la situación y cómo la manejó.', type: 'open' },
  { id: 'ENT002', text: 'Describa una situación en la que se sintió tentado a incumplir una norma o regla importante. ¿Qué hizo y por qué?', type: 'open' },
  { id: 'ENT003', text: '¿Qué haría si descubre a un compañero robando algo menor en una empresa? Explique su razonamiento.', type: 'open' },
  { id: 'ENT004', text: '¿Cómo maneja situaciones de alto estrés o presión? Proporcione un ejemplo específico.', type: 'open' },
  { id: 'ENT005', text: 'Describa una ocasión en la que tuvo un conflicto significativo con otra persona. ¿Cómo lo resolvió?', type: 'open' },
  
  // Preguntas de control y validez (convertidas a Likert)
  { id: 'ENT006', text: 'He tenido problemas legales en el pasado.', type: 'likert' },
  { id: 'ENT007', text: 'Siempre he sido completamente honesto en todas las situaciones de mi vida.', type: 'likert' },
  { id: 'ENT008', text: 'Mi conducta personal es perfecta en todos los aspectos.', type: 'likert' },
  
  // Preguntas para detectar inconsistencias (repetición con reformulación)
  { id: 'ENT009', text: 'Si presenciara un acto de corrupción en su lugar de trabajo, ¿cuál sería su reacción?', type: 'open' },
  
  // Preguntas de escalas de validez (convertidas a Likert)
  { id: 'ENT010', text: 'He experimentado pensamientos agresivos hacia otras personas.', type: 'likert' },
  { id: 'ENT011', text: 'He mentido para evitar meterme en problemas.', type: 'likert' },
  { id: 'ENT012', text: 'Nunca he cometido errores de juicio en situaciones importantes.', type: 'likert' },
  
  // Pregunta trampa (escala F - infrecuencia)
  { id: 'ENT013', text: 'He respirado aire en mi vida.', type: 'likert' },
  
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
        
        // Aplicar inversión si es necesario (todas las preguntas ahora son Likert 1-5)
        if (question.reverse) {
          score = 6 - score;
        }
        
        totalScore += score;
        
        // Máximo posible para cada pregunta es 5 (escala Likert)
        maxPossibleScore += 5;
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
    
    // Revisar preguntas críticas (ahora con escala Likert 1-5)
    const criticalAnswers = interviewResponses.filter(r => 
      ['ENT006', 'ENT007', 'ENT010', 'ENT011', 'ENT012', 'ENT013'].includes(r.questionId)
    );

    criticalAnswers.forEach(response => {
      const questionId = response.questionId;
      const value = typeof response.value === 'number' ? response.value : 0;

      // Aplicar lógica de escalas de validez (escala 1-5)
      if (questionId === 'ENT013' && value !== 5) { // Pregunta trampa - debe responder 5 (totalmente de acuerdo)
        score -= 20; // Penalización severa por respuesta incorrecta
      }
      if (questionId === 'ENT007' && value >= 4) { // Claim de perfección (4-5)
        score -= 15; // Penalización por falta de honestidad
      }
      if (questionId === 'ENT012' && value >= 4) { // Nunca cometió errores (4-5)
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

    // Fórmula SIERCP normalizada (pesos suman exactamente 1.0):
    const globalScore = Math.min(100, Math.max(0, Math.round(
      (integridad * 0.25) + 
      (psicopatia * 0.20) + 
      (violencia * 0.20) + 
      (agresividad * 0.15) + 
      (afrontamiento * 0.10) + 
      (veracidad * 0.05) + 
      (entrevista * 0.05)
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
      (integridad * 0.25) + 
      (psicopatia * 0.20) + 
      (violencia * 0.20) + 
      (agresividad * 0.15) + 
      (afrontamiento * 0.10) + 
      (veracidad * 0.05) + 
      (entrevista * 0.05)
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