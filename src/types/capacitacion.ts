// =====================================================
// TIPOS PARA MÓDULO DE CAPACITACIÓN - SPRINT 4
// =====================================================

export interface ModuloCapacitacion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string;
  orden: number;
  duracion_estimada_min: number;
  contenido_url?: string;
  tipo_contenido: 'documento' | 'video' | 'interactivo';
  activo: boolean;
  es_obligatorio: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreguntaQuiz {
  id: string;
  modulo_id: string;
  pregunta: string;
  opciones: OpcionQuiz[];
  explicacion?: string;
  orden: number;
  puntos: number;
  activa: boolean;
  created_at: string;
}

export interface OpcionQuiz {
  texto: string;
  es_correcta: boolean;
}

export interface ProgresoCapacitacion {
  id: string;
  candidato_id: string;
  modulo_id: string;
  contenido_iniciado: boolean;
  contenido_completado: boolean;
  fecha_inicio_contenido?: string;
  fecha_completado_contenido?: string;
  tiempo_dedicado_min: number;
  quiz_iniciado: boolean;
  quiz_completado: boolean;
  quiz_intentos: number;
  quiz_mejor_puntaje?: number;
  quiz_ultimo_puntaje?: number;
  quiz_aprobado: boolean;
  fecha_primer_quiz?: string;
  fecha_aprobacion_quiz?: string;
  respuestas_ultimo_intento?: RespuestaQuiz[];
  created_at: string;
  updated_at: string;
  // Relación opcional
  modulo?: ModuloCapacitacion;
}

export interface RespuestaQuiz {
  pregunta_id: string;
  opcion_seleccionada: number;
  es_correcta: boolean;
}

export interface ResultadoQuiz {
  puntaje: number;
  total_preguntas: number;
  respuestas_correctas: number;
  porcentaje: number;
  aprobado: boolean;
  respuestas: RespuestaQuiz[];
}

export interface ProgresoGeneralCapacitacion {
  candidato_id: string;
  candidato_nombre: string;
  total_modulos: number;
  quizzes_aprobados: number;
  porcentaje_completado: number;
  capacitacion_completa: boolean;
}

// Constante para puntaje mínimo de aprobación
export const QUIZ_MIN_SCORE = 80;
