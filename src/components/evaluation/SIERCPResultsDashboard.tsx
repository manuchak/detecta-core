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
  Lightbulb,
  Eye,
  ArrowLeft,
  Loader2,
  Brain
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { SIERCPReport } from '@/hooks/useSIERCPReport';
import { SIERCPScoreGauge } from './SIERCPScoreGauge';
import { SIERCPDecisionBadge } from './SIERCPDecisionBadge';
import { SIERCPRadarProfile } from './SIERCPRadarProfile';
import { SIERCPInterviewResponses } from './SIERCPInterviewResponses';

interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
}

interface SIERCPResultsDashboardProps {
  report: SIERCPReport | null;
  results: {
    globalScore: number;
    integridad?: number;
    psicopatia?: number;
    violencia?: number;
    impulsos?: number;
    estres?: number;
    veracidad?: number;
    entrevista?: number;
    clinicalInterpretation?: { validityFlags?: string[] };
  };
  candidateName?: string;
  interviewResponses?: InterviewResponse[];
  onPrint: () => void;
  onNewEvaluation: () => void;
  isGenerating?: boolean;
  isHistorical?: boolean;
}

const getScoreLevel = (score: number) => {
  if (score >= 80) return { label: 'Alto', color: 'text-green-700 bg-green-50 border-green-200' };
  if (score >= 60) return { label: 'Medio', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
  if (score >= 40) return { label: 'Bajo', color: 'text-orange-700 bg-orange-50 border-orange-200' };
  return { label: 'Crítico', color: 'text-red-700 bg-red-50 border-red-200' };
};

const getFitBackgroundColor = (nivel: string) => {
  switch (nivel) {
    case 'Alta':
      return 'bg-gradient-to-br from-green-600 to-green-700 text-white';
    case 'Media':
      return 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white';
    case 'Baja':
      return 'bg-gradient-to-br from-orange-500 to-orange-600 text-white';
    case 'No apto':
      return 'bg-gradient-to-br from-red-600 to-red-700 text-white';
    default:
      return 'bg-gradient-to-br from-gray-500 to-gray-600 text-white';
  }
};

const moduleShortNames: Record<string, string> = {
  'Integridad Moral': 'Integridad',
  'Indicadores de Psicopatía': 'Psicopatía',
  'Tendencia a la Violencia': 'Violencia',
  'Control de Impulsos': 'Impulsos',
  'Afrontamiento al Estrés': 'Estrés',
  'Escala de Veracidad': 'Veracidad',
  'Entrevista Estructurada': 'Entrevista',
};

const moduleConfig = {
  integridad: { title: 'Integridad Moral', icon: Shield, color: 'bg-emerald-500' },
  psicopatia: { title: 'Indicadores de Psicopatía', icon: Brain, color: 'bg-purple-500' },
  violencia: { title: 'Tendencia a la Violencia', icon: AlertTriangle, color: 'bg-red-500' },
  impulsos: { title: 'Control de Impulsos', icon: Target, color: 'bg-amber-500' },
  estres: { title: 'Afrontamiento al Estrés', icon: TrendingUp, color: 'bg-blue-500' },
  veracidad: { title: 'Escala de Veracidad', icon: Eye, color: 'bg-indigo-500' },
};

export const SIERCPResultsDashboard: React.FC<SIERCPResultsDashboardProps> = ({
  report,
  results,
  candidateName,
  interviewResponses = [],
  onPrint,
  onNewEvaluation,
  isGenerating = false,
  isHistorical = false,
}) => {
  const formattedDate = report?.metadata?.fecha_generacion 
    ? format(new Date(report.metadata.fecha_generacion), "d 'de' MMMM 'de' yyyy", { locale: es })
    : format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: es });

  const radarModules = report?.analisis_modulos?.map((m) => ({
    modulo: m.modulo,
    shortName: moduleShortNames[m.modulo] || m.modulo,
    score: m.score,
  })) || Object.entries(moduleConfig).map(([key, config]) => ({
    modulo: config.title,
    shortName: moduleShortNames[config.title] || config.title,
    score: results[key as keyof typeof results] as number || 0,
  }));

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ============================================= */}
        {/* HERO SECTION - Mirror of PDF Design          */}
        {/* ============================================= */}
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8 rounded-2xl shadow-xl overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 25% 25%, white 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          {/* Header bar */}
          <div className="relative flex justify-between items-center mb-6 pb-4 border-b border-white/20">
            <div>
              <h1 className="text-xl font-bold tracking-tight">DETECTA</h1>
              <p className="text-xs text-white/60">Sistema de Evaluación de Confiabilidad</p>
            </div>
            <div className="text-right text-xs text-white/60">
              <p>Informe SIERCP</p>
              <p className="font-mono">{formattedDate}</p>
            </div>
          </div>

          {/* Hero Content: Score + Aptitude */}
          <div className="relative flex flex-col md:flex-row items-center justify-center gap-8 py-6">
            <div className="bg-white rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-transform">
              <SIERCPScoreGauge 
                score={results.globalScore || 0} 
                size="xl" 
              />
            </div>
            
            <div className="text-center md:text-left">
              <p className="text-sm uppercase tracking-widest text-white/60 mb-2">
                Aptitud para Custodio
              </p>
              {report?.fit_custodio ? (
                <>
                  <p className="text-4xl font-bold mb-2">
                    {report.fit_custodio.nivel}
                  </p>
                  <p className="text-sm text-white/70">
                    {report.fit_custodio.porcentaje_confianza}% de confianza
                  </p>
                </>
              ) : isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Analizando...</span>
                </div>
              ) : (
                <p className="text-2xl font-semibold text-white/80">
                  Puntuación: {results.globalScore}/100
                </p>
              )}
            </div>
          </div>

          {/* Candidate Info */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/20 text-sm">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-white/50" />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide">Candidato</p>
                <p className="font-semibold">{candidateName || 'No especificado'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-white/50" />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide">Fecha</p>
                <p className="font-semibold">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-white/50" />
              <div>
                <p className="text-xs text-white/50 uppercase tracking-wide">Posición</p>
                <p className="font-semibold">Custodio de Mercancía</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================= */}
        {/* RADAR + EXECUTIVE SUMMARY                    */}
        {/* ============================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Radar Chart */}
          <Card className="lg:col-span-2 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                Perfil Multidimensional
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <SIERCPRadarProfile modules={radarModules} size="md" />
            </CardContent>
          </Card>
          
          {/* Executive Summary */}
          <Card className="lg:col-span-3 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Resumen Ejecutivo
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {report?.resumen_ejecutivo ? (
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {report.resumen_ejecutivo}
                </p>
              ) : isGenerating ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generando análisis...</span>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Puntuación global de {results.globalScore}/100 obtenida en la evaluación SIERCP.
                </p>
              )}
              
              {/* Justification */}
              {report?.fit_custodio?.justificacion && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <p className="text-xs font-semibold text-blue-800 mb-1 uppercase tracking-wide">
                    Justificación de Aptitud
                  </p>
                  <p className="text-sm text-blue-900">
                    {report.fit_custodio.justificacion}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ============================================= */}
        {/* MODULE CARDS GRID                            */}
        {/* ============================================= */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Análisis por Módulo
            </CardTitle>
            <CardDescription>
              Puntuaciones específicas de cada área evaluada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {report?.analisis_modulos ? (
                // AI Report modules with interpretations
                report.analisis_modulos.map((modulo, index) => {
                  const level = getScoreLevel(modulo.score);
                  return (
                    <Tooltip key={index}>
                      <TooltipTrigger asChild>
                        <Card className="border-2 hover:shadow-lg transition-all cursor-pointer group">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="text-sm font-semibold text-foreground leading-tight">
                                  {moduleShortNames[modulo.modulo] || modulo.modulo}
                                </h3>
                                <Badge 
                                  variant="outline" 
                                  className={`mt-1 text-xs ${level.color} border`}
                                >
                                  {level.label}
                                </Badge>
                              </div>
                              <div className="transform group-hover:scale-110 transition-transform">
                                <SIERCPScoreGauge score={modulo.score} size="sm" />
                              </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {modulo.interpretacion}
                            </p>
                          </CardContent>
                        </Card>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-semibold">{modulo.modulo}</p>
                          <p className="text-sm">{modulo.interpretacion}</p>
                          {modulo.implicacion_custodio && (
                            <p className="text-xs text-muted-foreground">
                              <strong>Implicación:</strong> {modulo.implicacion_custodio}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })
              ) : (
                // Fallback: Basic score display
                Object.entries(moduleConfig).map(([key, config]) => {
                  const score = results[key as keyof typeof results] as number || 0;
                  const level = getScoreLevel(score);
                  const Icon = config.icon;
                  
                  return (
                    <Card key={key} className="border-2 hover:shadow-lg transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-lg ${config.color} bg-opacity-20 flex items-center justify-center`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h3 className="text-sm font-semibold text-foreground">
                                {moduleShortNames[config.title] || config.title}
                              </h3>
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${level.color} border`}
                              >
                                {level.label}
                              </Badge>
                            </div>
                          </div>
                          <SIERCPScoreGauge score={score} size="sm" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* ============================================= */}
        {/* RISK & PROTECTION FACTORS                    */}
        {/* ============================================= */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Risk Factors */}
            <Card className="border-2 border-red-200 bg-gradient-to-br from-red-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-5 w-5" />
                  Factores de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.factores_riesgo?.length > 0 ? (
                    report.factores_riesgo.map((factor, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <XCircle className="h-4 w-4 mt-0.5 text-red-500 flex-shrink-0" />
                        <span className="text-red-900">{factor}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-red-600 italic flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      No se identificaron factores de riesgo significativos
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Protection Factors */}
            <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Shield className="h-5 w-5" />
                  Factores de Protección
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {report.factores_proteccion?.length > 0 ? (
                    report.factores_proteccion.map((factor, index) => (
                      <li key={index} className="flex items-start gap-3 text-sm">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                        <span className="text-green-900">{factor}</span>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm text-green-600 italic">
                      No se identificaron factores de protección adicionales
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ============================================= */}
        {/* RECOMMENDATIONS                              */}
        {/* ============================================= */}
        {report?.recomendaciones && report.recomendaciones.length > 0 && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Lightbulb className="h-5 w-5" />
                Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {report.recomendaciones.map((rec, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-4 bg-white rounded-xl border border-blue-100 hover:shadow-md transition-shadow"
                  >
                    <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-blue-900">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================= */}
        {/* FOLLOW-UP AREAS                              */}
        {/* ============================================= */}
        {report?.areas_seguimiento && report.areas_seguimiento.length > 0 && (
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-amber-800">
                <Target className="h-5 w-5" />
                Áreas de Seguimiento Post-Contratación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {report.areas_seguimiento.map((area, index) => (
                  <li 
                    key={index} 
                    className="flex items-start gap-2 text-sm text-amber-900 p-3 bg-white rounded-xl border border-amber-100"
                  >
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* ============================================= */}
        {/* INTERVIEW RESPONSES (Module 7)               */}
        {/* ============================================= */}
        {interviewResponses && interviewResponses.length > 0 && (
          <SIERCPInterviewResponses 
            responses={interviewResponses}
            interviewScore={results?.entrevista}
          />
        )}

        {/* ============================================= */}
        {/* CONCLUSION & DECISION BADGE                  */}
        {/* ============================================= */}
        {report?.conclusion_profesional && (
          <Card className="border-2 border-slate-300 bg-gradient-to-br from-slate-50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-800">Conclusión Profesional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                {report.conclusion_profesional}
              </p>
              
              {/* Decision Badge Centered */}
              <div className="flex justify-center pt-4 border-t border-slate-200">
                <SIERCPDecisionBadge 
                  nivel={report.fit_custodio?.nivel || 'Media'} 
                  size="lg" 
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* ============================================= */}
        {/* ACTIONS                                      */}
        {/* ============================================= */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <Button
            variant="outline"
            onClick={onNewEvaluation}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Nueva Evaluación
          </Button>
          
          <div className="flex flex-col items-end gap-2">
            <Button
              onClick={onPrint}
              disabled={isGenerating}
              className="bg-gradient-to-r from-slate-800 to-slate-900 text-white hover:from-slate-700 hover:to-slate-800 flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando Informe...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {report ? 'Imprimir / Guardar PDF' : 'Generar Informe PDF'}
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground max-w-xs text-right">
              💡 Para un PDF limpio, desmarque "Encabezados y pies de página" en el diálogo de impresión
            </p>
          </div>
        </div>

        {/* ============================================= */}
        {/* DISCLAIMER                                   */}
        {/* ============================================= */}
        <Card className="bg-slate-50 border">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Información importante:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Esta evaluación es una herramienta de apoyo y no sustituye el criterio profesional.</li>
                <li>Los resultados deben ser interpretados por personal calificado.</li>
                <li>Se recomienda complementar con entrevistas y verificación de referencias.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};

export default SIERCPResultsDashboard;
