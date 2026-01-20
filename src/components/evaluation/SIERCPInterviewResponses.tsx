import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";

interface InterviewResponse {
  questionId: string;
  question: string;
  answer: string;
}

interface SIERCPInterviewResponsesProps {
  responses: InterviewResponse[];
  interviewScore?: number;
}

// Question categories for grouping
const questionCategories: Record<string, { label: string; description: string }> = {
  'ENT001': { label: 'Experiencia con delitos', description: 'Evalúa exposición y manejo de situaciones delictivas' },
  'ENT002': { label: 'Tentación de incumplir normas', description: 'Evalúa resistencia a la presión y adherencia a reglas' },
  'ENT003': { label: 'Reacción ante robo', description: 'Evalúa integridad y proceso de toma de decisiones éticas' },
  'ENT004': { label: 'Manejo del estrés', description: 'Evalúa regulación emocional bajo presión' },
  'ENT005': { label: 'Resolución de conflictos', description: 'Evalúa habilidades interpersonales y autocontrol' },
  'ENT009': { label: 'Reacción ante corrupción', description: 'Evalúa postura ética y consistencia con ENT003' },
  'ENT014': { label: 'Opinión sobre violencia', description: 'Evalúa actitudes hacia el uso de fuerza' },
  'ENT015': { label: 'Control de ira', description: 'Evalúa autoconciencia y regulación emocional' },
};

export const SIERCPInterviewResponses = ({ responses, interviewScore }: SIERCPInterviewResponsesProps) => {
  if (!responses || responses.length === 0) {
    return (
      <Card className="border-dashed border-muted-foreground/30">
        <CardContent className="p-6 text-center text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No hay respuestas de entrevista disponibles para esta evaluación.</p>
          <p className="text-sm mt-1">Las respuestas se capturan en evaluaciones nuevas.</p>
        </CardContent>
      </Card>
    );
  }

  // Only show open-ended questions (the ones with textual answers)
  const openResponses = responses.filter(r => 
    ['ENT001', 'ENT002', 'ENT003', 'ENT004', 'ENT005', 'ENT009', 'ENT014', 'ENT015'].includes(r.questionId)
  );

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600 bg-green-100';
    if (score >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Respuestas de Entrevista Estructurada</CardTitle>
          </div>
          {interviewScore !== undefined && (
            <Badge className={`${getScoreColor(interviewScore)} font-semibold`}>
              Score: {interviewScore}/100
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Respuestas textuales del candidato analizadas por IA para detectar señales de riesgo
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {openResponses.map((response, index) => {
          const category = questionCategories[response.questionId];
          const answerLength = response.answer?.length || 0;
          const isShortAnswer = answerLength < 50;
          
          return (
            <div 
              key={response.questionId} 
              className="border rounded-lg p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {response.questionId}
                  </Badge>
                  {category && (
                    <span className="text-sm font-medium text-foreground">
                      {category.label}
                    </span>
                  )}
                </div>
                {isShortAnswer && (
                  <div className="flex items-center gap-1 text-amber-600">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span className="text-xs">Respuesta breve</span>
                  </div>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3">
                {response.question}
              </p>
              
              <blockquote className="border-l-4 border-indigo-300 pl-4 py-2 bg-white rounded-r-md">
                <p className="text-sm italic text-foreground leading-relaxed">
                  "{response.answer}"
                </p>
              </blockquote>
              
              {category && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  {category.description}
                </p>
              )}
            </div>
          );
        })}
        
        {openResponses.length === 0 && responses.length > 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Solo se registraron respuestas Likert. Las preguntas abiertas no fueron respondidas.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
