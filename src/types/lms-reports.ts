// Tipos para Reportes LMS - Fase 5
// Nota: Importar EstadoInscripcion desde types/lms.ts para consistencia
import type { EstadoInscripcion } from './lms';

// Re-export para compatibilidad
export type { EstadoInscripcion };

// Métricas de Adopción
export interface InscripcionPorMes {
  mes: string;
  inscripciones: number;
}

export interface CursoPopular {
  cursoId: string;
  titulo: string;
  inscripciones: number;
}

export interface LMSAdopcionMetrics {
  totalUsuariosActivos: number;
  usuariosConInscripciones: number;
  tasaAdopcion: number;
  totalInscripciones: number;
  inscripcionesEsteMes: number;
  inscripcionesMesPasado: number;
  inscripcionesPorMes: InscripcionPorMes[];
  cursosMasPopulares: CursoPopular[];
  distribucionPorEstado: Record<EstadoInscripcion, number>;
}

// Métricas de Progreso
export interface ProgresoPorCurso {
  cursoId: string;
  titulo: string;
  progresoPromedio: number;
  inscritos: number;
  completados: number;
  tasaAbandono: number;
}

export interface ContenidoVisto {
  contenidoId: string;
  titulo: string;
  tipo: string;
  vistas: number;
}

export interface LMSProgresoMetrics {
  progresoPromedioGeneral: number;
  tasaCompletacion: number;
  contenidosCompletadosHoy: number;
  tiempoPromedioSesionMin: number;
  progresoPromedioPorCurso: ProgresoPorCurso[];
  contenidosMasVistos: ContenidoVisto[];
  distribucionPorTipo: Record<string, number>;
}

// Métricas de Rendimiento
export interface QuizRendimiento {
  contenidoId: string;
  titulo: string;
  cursoTitulo: string;
  calificacionPromedio: number;
  intentosPromedio: number;
  tasaAprobacion: number;
  totalIntentos: number;
}

export interface RangoCalificacion {
  rango: string;
  cantidad: number;
  porcentaje: number;
}

export interface LMSRendimientoMetrics {
  calificacionPromedioGeneral: number;
  tasaAprobacionGeneral: number;
  quizzesPerfectos: number;
  intentosPromedioGeneral: number;
  quizzesPorRendimiento: QuizRendimiento[];
  distribucionCalificaciones: RangoCalificacion[];
}

// Métricas de Gamificación
export interface DistribucionNivel {
  nivel: number;
  usuarios: number;
  porcentaje: number;
}

export interface TopUsuario {
  usuarioId: string;
  nombre: string;
  email: string;
  puntos: number;
  nivel: number;
  badges: number;
  rachaActual: number;
}

export interface BadgeComun {
  badgeId: string;
  codigo: string;
  nombre: string;
  otorgados: number;
}

export interface LMSGamificacionMetrics {
  puntosTotalesOtorgados: number;
  badgesTotalesOtorgados: number;
  nivelPromedio: number;
  rachaPromedio: number;
  usuariosConPuntos: number;
  distribucionNiveles: DistribucionNivel[];
  topUsuariosPorPuntos: TopUsuario[];
  badgesMasComunes: BadgeComun[];
}
