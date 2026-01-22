import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Brain, TestTube, Users, AlertTriangle, Loader2 } from 'lucide-react';
import { PsychometricEvaluationTab } from '@/components/recruitment/psychometrics/PsychometricEvaluationTab';
import { ToxicologyTab } from '@/components/recruitment/toxicology/ToxicologyTab';

interface EvaluacionesTabProps {
  candidatoId: string | null;
  candidatoNombre: string;
}

export function EvaluacionesTab({ candidatoId, candidatoNombre }: EvaluacionesTabProps) {
  const [activeTab, setActiveTab] = useState('psicometrica');

  if (!candidatoId) {
    return (
      <Card>
        <CardContent className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Este perfil no tiene un candidato asociado</p>
          <p className="text-sm mt-2">
            Las evaluaciones están vinculadas al proceso de reclutamiento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="psicometrica" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Psicométrica</span>
        </TabsTrigger>
        <TabsTrigger value="toxicologica" className="flex items-center gap-2">
          <TestTube className="h-4 w-4" />
          <span className="hidden sm:inline">Toxicológica</span>
        </TabsTrigger>
        <TabsTrigger value="referencias" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Referencias</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="psicometrica">
        <PsychometricEvaluationTab 
          candidatoId={candidatoId} 
          candidatoNombre={candidatoNombre} 
        />
      </TabsContent>

      <TabsContent value="toxicologica">
        <ToxicologyTab 
          candidatoId={candidatoId} 
          candidatoNombre={candidatoNombre} 
        />
      </TabsContent>

      <TabsContent value="referencias">
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Verificación de referencias en desarrollo</p>
            <p className="text-sm mt-2">
              Próximamente podrás ver el historial de referencias verificadas
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
