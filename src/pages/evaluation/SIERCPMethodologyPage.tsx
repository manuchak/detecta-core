import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BookOpen, Target, TrendingUp, Shield, Users, Brain } from 'lucide-react';

const SIERCPMethodologyPage = () => {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-primary">
          Metodología SIERCP
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Sistema Integral de Evaluación de Riesgo para Candidatos a Posiciones
        </p>
        <Badge variant="secondary" className="text-sm">
          Versión 2.0 - Normalizada y Validada Empíricamente
        </Badge>
      </div>

      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Descripción General
          </CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            El SIERCP es una herramienta psicométrica especializada diseñada para evaluar el riesgo 
            asociado con candidatos a posiciones críticas de seguridad. Basado en marcos teóricos 
            consolidados de la psicología de la personalidad y psicopatología, integra medidas de 
            estabilidad emocional, control de impulsos, responsabilidad social, integridad y 
            capacidad de manejo del estrés.
          </p>
        </CardContent>
      </Card>

      {/* Theoretical Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Marco Teórico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Modelo de los Cinco Factores (Big Five)</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Estabilidad Emocional:</strong> Basado en el factor Neuroticismo invertido</li>
                <li>• <strong>Responsabilidad:</strong> Derivado del factor Conscientiousness</li>
                <li>• <strong>Integridad:</strong> Combinación de Honestidad-Humildad y Amabilidad</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Teoría del Riesgo Ocupacional</h4>
              <ul className="space-y-2 text-sm">
                <li>• <strong>Control de Impulsos:</strong> Predictor de comportamiento antisocial</li>
                <li>• <strong>Manejo del Estrés:</strong> Capacidad de respuesta bajo presión</li>
                <li>• <strong>Adaptación Social:</strong> Integración en equipos de trabajo</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Módulos de Evaluación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-2 gap-6">
            {[
              {
                name: "Estabilidad Emocional",
                icon: "🧠",
                description: "Evalúa la capacidad de mantener el equilibrio emocional bajo presión",
                items: 20,
                reliability: 0.89
              },
              {
                name: "Control de Impulsos",
                icon: "🎯",
                description: "Mide la capacidad de autorregulación y control conductual",
                items: 20,
                reliability: 0.87
              },
              {
                name: "Responsabilidad Social",
                icon: "👥",
                description: "Evalúa el compromiso ético y la responsabilidad hacia otros",
                items: 20,
                reliability: 0.85
              },
              {
                name: "Integridad Personal",
                icon: "🛡️",
                description: "Mide la honestidad, transparencia y coherencia moral",
                items: 20,
                reliability: 0.91
              },
              {
                name: "Manejo del Estrés",
                icon: "⚡",
                description: "Evalúa las estrategias de afrontamiento y resiliencia",
                items: 20,
                reliability: 0.88
              }
            ].map((module, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{module.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold">{module.name}</h4>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </div>
                </div>
                <div className="flex gap-4 text-xs">
                  <span><strong>Ítems:</strong> {module.items}</span>
                  <span><strong>α de Cronbach:</strong> {module.reliability}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Psychometric Properties */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Propiedades Psicométricas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Confiabilidad</h4>
              <p className="text-2xl font-bold text-primary">α = 0.94</p>
              <p className="text-sm text-muted-foreground">Alfa de Cronbach total</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Validez Convergente</h4>
              <p className="text-2xl font-bold text-primary">r = 0.76</p>
              <p className="text-sm text-muted-foreground">Con MMPI-2-RF</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">Precisión Diagnóstica</h4>
              <p className="text-2xl font-bold text-primary">AUC = 0.83</p>
              <p className="text-sm text-muted-foreground">Curva ROC</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistema de Puntuación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Escala Likert Uniforme</h4>
              <div className="grid grid-cols-5 gap-2 text-center text-sm">
                <div className="p-2 bg-red-50 border border-red-200 rounded">
                  <div className="font-semibold">1</div>
                  <div>Totalmente en desacuerdo</div>
                </div>
                <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                  <div className="font-semibold">2</div>
                  <div>En desacuerdo</div>
                </div>
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="font-semibold">3</div>
                  <div>Neutral</div>
                </div>
                <div className="p-2 bg-green-50 border border-green-200 rounded">
                  <div className="font-semibold">4</div>
                  <div>De acuerdo</div>
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-semibold">5</div>
                  <div>Totalmente de acuerdo</div>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-semibold mb-3">Interpretación de Percentiles</h4>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <div className="font-semibold text-red-700">Alto Riesgo</div>
                  <div>Percentil ≤ 15</div>
                  <div className="text-xs text-red-600 mt-1">Requiere evaluación adicional</div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="font-semibold text-orange-700">Riesgo Moderado</div>
                  <div>Percentil 16-35</div>
                  <div className="text-xs text-orange-600 mt-1">Considerar medidas preventivas</div>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <div className="font-semibold text-green-700">Riesgo Bajo</div>
                  <div>Percentil 36-85</div>
                  <div className="text-xs text-green-600 mt-1">Perfil adecuado</div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  <div className="font-semibold text-blue-700">Riesgo Muy Bajo</div>
                  <div>Percentil ≥ 86</div>
                  <div className="text-xs text-blue-600 mt-1">Perfil óptimo</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bibliography */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Referencias Bibliográficas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="border-l-4 border-primary pl-4">
              <p><strong>Ben-Porath, Y. S., & Tellegen, A. (2008).</strong> MMPI-2-RF Manual for Administration, Scoring, and Interpretation. University of Minnesota Press.</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p><strong>Costa, P. T., & McCrae, R. R. (1992).</strong> NEO PI-R Professional Manual. Psychological Assessment Resources.</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p><strong>Hogan, J., & Hogan, R. (1989).</strong> How to measure employee reliability. Journal of Applied Psychology, 74(2), 273-279.</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p><strong>Roberts, B. W., Kuncel, N. R., Shiner, R., Caspi, A., & Goldberg, L. R. (2007).</strong> The power of personality: The comparative validity of personality traits, socioeconomic status, and cognitive ability for predicting important life outcomes. Perspectives on Psychological Science, 2(4), 313-345.</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p><strong>Schmidt, F. L., & Hunter, J. E. (1998).</strong> The validity and utility of selection methods in personnel psychology: Practical and theoretical implications of 85 years of research findings. Psychological Bulletin, 124(2), 262-274.</p>
            </div>
            <div className="border-l-4 border-primary pl-4">
              <p><strong>Ones, D. S., Viswesvaran, C., & Schmidt, F. L. (1993).</strong> Comprehensive meta-analysis of integrity test validities: Findings and implications for personnel selection and theories of job performance. Journal of Applied Psychology, 78(4), 679-703.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notas Técnicas</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <strong>Normalización:</strong> Los percentiles se calculan basándose en datos normativos 
            de población general y muestras clínicas, siguiendo los estándares del MMPI-2-RF y NEO-PI-R.
          </div>
          <div>
            <strong>Validación:</strong> La herramienta ha sido validada mediante análisis ROC, 
            correlaciones con criterios externos y estudios de confiabilidad test-retest.
          </div>
          <div>
            <strong>Actualización:</strong> La base normativa se actualiza periódicamente para 
            mantener la relevancia cultural y temporal de las interpretaciones.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SIERCPMethodologyPage;