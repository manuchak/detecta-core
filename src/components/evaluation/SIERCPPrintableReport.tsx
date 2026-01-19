import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Target,
  FileText,
  User,
  Calendar,
  Award
} from 'lucide-react';
import type { SIERCPReport } from '@/hooks/useSIERCPReport';

interface SIERCPPrintableReportProps {
  report: SIERCPReport;
  candidateName?: string;
}

const getFitColor = (nivel: string) => {
  switch (nivel) {
    case 'Alta': return 'bg-green-100 text-green-800 border-green-300';
    case 'Media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'Baja': return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'No apto': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
};

const getNivelColor = (nivel: string) => {
  switch (nivel) {
    case 'Alto': return 'bg-green-100 text-green-700';
    case 'Medio': return 'bg-yellow-100 text-yellow-700';
    case 'Bajo': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export const SIERCPPrintableReport: React.FC<SIERCPPrintableReportProps> = ({ 
  report, 
  candidateName 
}) => {
  const formattedDate = report.metadata?.fecha_generacion 
    ? format(new Date(report.metadata.fecha_generacion), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es })
    : format(new Date(), "d 'de' MMMM 'de' yyyy, HH:mm", { locale: es });

  return (
    <div className="print-content bg-white p-8 max-w-4xl mx-auto" id="siercp-detailed-report">
      {/* Header */}
      <div className="border-b-2 border-primary pb-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-primary">
              INFORME DE EVALUACIÓN SIERCP
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Sistema Integral de Evaluación de Riesgo y Confiabilidad Psico-Criminológica
            </p>
          </div>
          <div className="text-right">
            <div className="bg-primary/10 px-4 py-2 rounded-lg">
              <p className="text-xs text-muted-foreground">Score Global</p>
              <p className={`text-3xl font-bold ${getScoreColor(report.metadata?.score_global || 0)}`}>
                {report.metadata?.score_global || 0}
                <span className="text-sm text-muted-foreground">/100</span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Candidato:</span>
            <span className="font-medium">{candidateName || report.metadata?.candidato || 'No especificado'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">{formattedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Evaluación:</span>
            <span className="font-medium">Custodio de Mercancía</span>
          </div>
        </div>
      </div>

      {/* Fit para Custodio - Hero Section */}
      <div className={`rounded-lg border-2 p-6 mb-6 ${getFitColor(report.fit_custodio?.nivel || 'Media')}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8" />
            <div>
              <p className="text-xs uppercase tracking-wide opacity-75">Aptitud para Custodio de Mercancía</p>
              <p className="text-2xl font-bold">{report.fit_custodio?.nivel || 'Pendiente'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs opacity-75">Confianza del análisis</p>
            <p className="text-xl font-bold">{report.fit_custodio?.porcentaje_confianza || 0}%</p>
          </div>
        </div>
        <p className="mt-3 text-sm border-t border-current/20 pt-3">
          {report.fit_custodio?.justificacion}
        </p>
      </div>

      {/* Resumen Ejecutivo */}
      <div className="bg-slate-50 rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-3">
          <Target className="h-5 w-5 text-primary" />
          Resumen Ejecutivo
        </h2>
        <p className="text-slate-700 leading-relaxed">
          {report.resumen_ejecutivo}
        </p>
      </div>

      {/* Análisis por Módulo */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          Análisis Detallado por Módulo
        </h2>
        <div className="space-y-4">
          {report.analisis_modulos?.map((modulo, index) => (
            <div key={index} className="border rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">{modulo.modulo}</h3>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getNivelColor(modulo.nivel)}`}>
                    {modulo.nivel}
                  </span>
                  <span className={`text-xl font-bold ${getScoreColor(modulo.score)}`}>
                    {modulo.score}%
                  </span>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="h-2 bg-gray-200 rounded-full mb-3">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    modulo.score >= 70 ? 'bg-green-500' :
                    modulo.score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${modulo.score}%` }}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Interpretación Psicológica
                  </p>
                  <p className="text-slate-700">{modulo.interpretacion}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">
                    Implicación para Custodio
                  </p>
                  <p className="text-slate-700">{modulo.implicacion_custodio}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Factores de Riesgo y Protección */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Factores de Riesgo */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50/50">
          <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5" />
            Factores de Riesgo
          </h3>
          <ul className="space-y-2">
            {report.factores_riesgo?.length > 0 ? (
              report.factores_riesgo.map((factor, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-red-700">
                  <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-red-600 italic">
                No se identificaron factores de riesgo significativos
              </li>
            )}
          </ul>
        </div>

        {/* Factores de Protección */}
        <div className="border border-green-200 rounded-lg p-4 bg-green-50/50">
          <h3 className="font-semibold text-green-800 flex items-center gap-2 mb-3">
            <Shield className="h-5 w-5" />
            Factores de Protección
          </h3>
          <ul className="space-y-2">
            {report.factores_proteccion?.length > 0 ? (
              report.factores_proteccion.map((factor, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>{factor}</span>
                </li>
              ))
            ) : (
              <li className="text-sm text-green-600 italic">
                No se identificaron factores de protección adicionales
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="border rounded-lg p-4 mb-6 bg-blue-50/50 border-blue-200">
        <h3 className="font-semibold text-blue-800 flex items-center gap-2 mb-3">
          <CheckCircle className="h-5 w-5" />
          Recomendaciones para Contratación
        </h3>
        <ul className="space-y-2">
          {report.recomendaciones?.map((rec, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-blue-700">
              <span className="font-bold text-blue-500">{index + 1}.</span>
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Áreas de Seguimiento */}
      {report.areas_seguimiento?.length > 0 && (
        <div className="border rounded-lg p-4 mb-6 bg-amber-50/50 border-amber-200">
          <h3 className="font-semibold text-amber-800 flex items-center gap-2 mb-3">
            <Target className="h-5 w-5" />
            Áreas de Seguimiento Post-Contratación
          </h3>
          <ul className="space-y-2">
            {report.areas_seguimiento.map((area, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                <span>{area}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Conclusión Profesional */}
      <div className="border-2 border-slate-300 rounded-lg p-5 mb-6 bg-slate-100">
        <h3 className="font-semibold text-slate-800 mb-3">Conclusión Profesional</h3>
        <p className="text-slate-700 leading-relaxed">
          {report.conclusion_profesional}
        </p>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-muted-foreground border-t pt-4 mt-6">
        <p className="font-medium mb-2">AVISO LEGAL:</p>
        <p>
          Este informe es generado con asistencia de inteligencia artificial y debe ser interpretado 
          por profesionales calificados en psicología o recursos humanos. Los resultados son orientativos 
          y no sustituyen una evaluación clínica completa. La decisión final de contratación debe 
          considerar múltiples factores adicionales incluyendo entrevistas, verificación de antecedentes 
          y referencias laborales.
        </p>
        <p className="mt-2 text-right">
          Generado por: {report.metadata?.generado_por || 'SIERCP AI Assistant'} | 
          Versión: 2.0 | 
          © Detecta {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default SIERCPPrintableReport;
