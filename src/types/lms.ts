// =====================================================
// LMS Module Types
// =====================================================

// Categorías de cursos
export type LMSCategoria = 'onboarding' | 'procesos' | 'herramientas' | 'compliance' | 'habilidades';

// Niveles de dificultad
export type LMSNivel = 'basico' | 'intermedio' | 'avanzado';

// Tipos de contenido
export type TipoContenido = 'video' | 'documento' | 'embed' | 'texto_enriquecido' | 'quiz' | 'interactivo';

// Tipos de pregunta
export type TipoPregunta = 'opcion_multiple' | 'verdadero_falso' | 'respuesta_corta' | 'ordenar';

// Tipos de inscripción
export type TipoInscripcion = 'obligatoria' | 'voluntaria' | 'asignada';

// Estados de inscripción
export type EstadoInscripcion = 'inscrito' | 'en_progreso' | 'completado' | 'vencido' | 'abandonado';

// Tipos de contenido interactivo
export type TipoInteractivo = 'flashcards' | 'timeline' | 'dragdrop' | 'hotspots' | 'accordion' | 'tabs' | 'video_interactivo';

// =====================================================
// Interfaces principales
// =====================================================

export interface LMSCurso {
  id: string;
  codigo: string;
  titulo: string;
  descripcion?: string;
  imagen_portada_url?: string;
  categoria?: LMSCategoria;
  nivel: LMSNivel;
  duracion_estimada_min: number;
  es_obligatorio: boolean;
  roles_objetivo: string[];
  plazo_dias_default: number;
  orden: number;
  activo: boolean;
  publicado: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  modulos?: LMSModulo[];
  // Datos de inscripción del usuario (desde RPC)
  inscripcion_id?: string;
  inscripcion_estado?: EstadoInscripcion;
  inscripcion_progreso?: number;
  inscripcion_fecha_limite?: string;
  tipo_inscripcion?: TipoInscripcion;
}

export interface LMSModulo {
  id: string;
  curso_id: string;
  titulo: string;
  descripcion?: string;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  contenidos?: LMSContenido[];
}

export interface LMSContenido {
  id: string;
  modulo_id: string;
  tipo: TipoContenido;
  titulo: string;
  contenido: ContenidoData;
  duracion_min: number;
  es_obligatorio: boolean;
  orden: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  // Progreso del usuario (opcional)
  progreso?: LMSProgresoContenido;
}

// =====================================================
// Tipos de contenido JSONB
// =====================================================

export type ContenidoData = 
  | VideoContent 
  | DocumentoContent 
  | EmbedContent 
  | TextoEnriquecidoContent 
  | QuizContent 
  | InteractivoContent;

export interface VideoContent {
  url: string;
  provider: 'youtube' | 'vimeo' | 'storage';
  subtitles_url?: string;
  thumbnail_url?: string;
  duracion_segundos?: number;
}

export interface DocumentoContent {
  url: string;
  tipo: 'pdf' | 'docx' | 'pptx' | 'xlsx';
  nombre_archivo?: string;
  paginas?: number;
}

export interface EmbedContent {
  html: string;
  altura: number;
  ancho?: number | string;
}

export interface TextoEnriquecidoContent {
  html: string;
}

export interface QuizContent {
  preguntas_ids: string[];
  puntuacion_minima: number; // porcentaje mínimo para aprobar (0-100)
  intentos_permitidos: number;
  mostrar_respuestas_correctas: boolean;
  tiempo_limite_min?: number;
}

export interface InteractivoContent {
  tipo: TipoInteractivo;
  data: FlashcardsData | TimelineData | DragDropData | HotspotsData | AccordionData | TabsData | VideoInteractivoData;
}

// =====================================================
// Datos de contenido interactivo
// =====================================================

export interface FlashcardsData {
  cards: Array<{
    id: string;
    front: string;
    back: string;
    image_url?: string;
  }>;
}

export interface TimelineData {
  events: Array<{
    id: string;
    date: string;
    title: string;
    content: string;
    media_url?: string;
    media_type?: 'image' | 'video';
  }>;
}

export interface DragDropData {
  items: Array<{
    id: string;
    content: string;
    image_url?: string;
  }>;
  zones: Array<{
    id: string;
    label: string;
  }>;
  correctMatches: Record<string, string>; // item_id -> zone_id
}

export interface HotspotsData {
  image_url: string;
  hotspots: Array<{
    id: string;
    x: number; // porcentaje (0-100)
    y: number; // porcentaje (0-100)
    title: string;
    content: string;
  }>;
}

export interface AccordionData {
  sections: Array<{
    id: string;
    title: string;
    content: string; // HTML
  }>;
}

export interface VideoInteractivoData {
  video_url: string;
  provider: 'youtube' | 'vimeo' | 'storage';
  preguntas: Array<{
    id: string;
    tiempo_seg: number;
    pregunta: string;
    opciones: Array<{ texto: string; es_correcta: boolean }>;
    explicacion?: string;
    es_obligatoria: boolean;
  }>;
  resumen_final: boolean;
  permitir_saltar: boolean;
}

export interface TabsData {
  tabs: Array<{
    id: string;
    label: string;
    content: string; // HTML
  }>;
}

// =====================================================
// Preguntas y Quiz
// =====================================================

export interface LMSPregunta {
  id: string;
  curso_id?: string;
  tipo: TipoPregunta;
  pregunta: string;
  opciones: OpcionPregunta[];
  explicacion?: string;
  puntos: number;
  activa: boolean;
  created_at: string;
  updated_at: string;
}

export interface OpcionPregunta {
  id: string;
  texto: string;
  es_correcta: boolean;
  feedback?: string;
  orden?: number; // para tipo 'ordenar'
}

export interface RespuestaQuiz {
  pregunta_id: string;
  respuesta: string | string[]; // string para única, array para múltiple/ordenar
  es_correcta: boolean;
  puntos_obtenidos: number;
}

// =====================================================
// Inscripciones y Progreso
// =====================================================

export interface LMSInscripcion {
  id: string;
  usuario_id: string;
  curso_id: string;
  tipo_inscripcion: TipoInscripcion;
  asignado_por?: string;
  fecha_inscripcion: string;
  fecha_inicio?: string;
  fecha_completado?: string;
  fecha_limite?: string;
  estado: EstadoInscripcion;
  progreso_porcentaje: number;
  calificacion_final?: number;
  certificado_generado: boolean;
  certificado_url?: string;
  created_at: string;
  updated_at: string;
  // Relaciones opcionales
  curso?: LMSCurso;
  usuario?: {
    id: string;
    email: string;
    display_name?: string;
  };
}

export interface LMSProgreso {
  id: string;
  inscripcion_id: string;
  contenido_id: string;
  iniciado: boolean;
  completado: boolean;
  fecha_inicio?: string;
  fecha_completado?: string;
  tiempo_dedicado_seg: number;
  veces_visto: number;
  video_posicion_seg: number;
  video_porcentaje_visto: number;
  quiz_intentos: number;
  quiz_mejor_puntaje?: number;
  quiz_ultimo_puntaje?: number;
  quiz_respuestas?: RespuestaQuiz[];
  created_at: string;
  updated_at: string;
}

// Progreso simplificado para UI
export interface LMSProgresoContenido {
  iniciado: boolean;
  completado: boolean;
  porcentaje?: number;
  quiz_puntaje?: number;
}

// =====================================================
// Tipos para respuestas de RPC
// =====================================================

export interface CursoDisponible {
  id: string;
  codigo: string;
  titulo: string;
  descripcion?: string;
  imagen_portada_url?: string;
  categoria?: LMSCategoria;
  nivel: LMSNivel;
  duracion_estimada_min: number;
  es_obligatorio: boolean;
  orden: number;
  inscripcion_id?: string;
  inscripcion_estado?: EstadoInscripcion;
  inscripcion_progreso?: number;
  inscripcion_fecha_limite?: string;
  tipo_inscripcion?: TipoInscripcion;
}

export interface ProgresoCalculado {
  total: number;
  completados: number;
  porcentaje: number;
  calificacion: number;
  estado: EstadoInscripcion;
}

export interface ResultadoInscripcion {
  success: boolean;
  inscripcion_id?: string;
  mensaje?: string;
  error?: string;
}

// =====================================================
// Tipos para formularios de editor
// =====================================================

export interface CursoFormData {
  codigo: string;
  titulo: string;
  descripcion?: string;
  imagen_portada_url?: string;
  categoria?: LMSCategoria;
  nivel: LMSNivel;
  duracion_estimada_min: number;
  es_obligatorio: boolean;
  roles_objetivo: string[];
  plazo_dias_default: number;
  activo: boolean;
  publicado: boolean;
}

export interface ModuloFormData {
  titulo: string;
  descripcion?: string;
  orden: number;
}

export interface ContenidoFormData {
  tipo: TipoContenido;
  titulo: string;
  contenido: ContenidoData;
  duracion_min: number;
  es_obligatorio: boolean;
  orden: number;
}

export interface PreguntaFormData {
  tipo: TipoPregunta;
  pregunta: string;
  opciones: Omit<OpcionPregunta, 'id'>[];
  explicacion?: string;
  puntos: number;
}

// =====================================================
// Constantes útiles
// =====================================================

export const LMS_CATEGORIAS: { value: LMSCategoria; label: string }[] = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'procesos', label: 'Procesos' },
  { value: 'herramientas', label: 'Herramientas' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'habilidades', label: 'Habilidades' },
];

export const LMS_NIVELES: { value: LMSNivel; label: string }[] = [
  { value: 'basico', label: 'Básico' },
  { value: 'intermedio', label: 'Intermedio' },
  { value: 'avanzado', label: 'Avanzado' },
];

export const LMS_TIPOS_CONTENIDO: { value: TipoContenido; label: string; icon: string }[] = [
  { value: 'video', label: 'Video', icon: 'Play' },
  { value: 'documento', label: 'Documento', icon: 'FileText' },
  { value: 'embed', label: 'Contenido Embed', icon: 'Code' },
  { value: 'texto_enriquecido', label: 'Texto', icon: 'AlignLeft' },
  { value: 'quiz', label: 'Evaluación', icon: 'HelpCircle' },
  { value: 'interactivo', label: 'Interactivo', icon: 'Sparkles' },
];

export const LMS_ESTADOS_INSCRIPCION: { value: EstadoInscripcion; label: string; color: string }[] = [
  { value: 'inscrito', label: 'Inscrito', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_progreso', label: 'En Progreso', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completado', label: 'Completado', color: 'bg-green-100 text-green-800' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-100 text-red-800' },
  { value: 'abandonado', label: 'Abandonado', color: 'bg-gray-100 text-gray-800' },
];

export const LMS_ROLES_OBJETIVO: { value: string; label: string }[] = [
  { value: 'custodio', label: 'Custodio' },
  { value: 'supply_admin', label: 'Admin Supply' },
  { value: 'capacitacion_admin', label: 'Admin Capacitación' },
  { value: 'admin', label: 'Administrador' },
  { value: 'owner', label: 'Owner' },
  { value: 'operador', label: 'Operador' },
  { value: 'monitoreo', label: 'Monitoreo' },
  { value: 'instalador', label: 'Instalador' },
];
