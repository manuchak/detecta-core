import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCapacitacion } from '@/hooks/useCapacitacion';
import { ModuloCapacitacion, QUIZ_MIN_SCORE } from '@/types/capacitacion';
import { 
  BookOpen, 
  Video, 
  Gamepad2, 
  CheckCircle2, 
  Clock, 
  Play,
  FileQuestion,
  Trophy,
  UserCheck
} from 'lucide-react';
import { QuizDialog } from './QuizDialog';

interface TrainingTabProps {
  candidatoId: string;
}

const iconosTipo = {
  documento: BookOpen,
  video: Video,
  interactivo: Gamepad2
};

export const TrainingTab = ({ candidatoId }: TrainingTabProps) => {
  const { modulos, progreso, isLoading, calcularProgresoGeneral, marcarCapacitacionManual } = useCapacitacion(candidatoId);
  const [moduloQuiz, setModuloQuiz] = useState<ModuloCapacitacion | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualNotas, setManualNotas] = useState('');

  const progresoGeneral = calcularProgresoGeneral();

  const getProgresoModulo = (moduloId: string) => {
    return progreso?.find(p => p.modulo_id === moduloId);
  };

  const handleMarcarManual = async () => {
    if (!marcarCapacitacionManual) return;
    await marcarCapacitacionManual.mutateAsync({ notas: manualNotas });
    setShowManualDialog(false);
    setManualNotas('');
  };

  // Check if any module has completado_manual
  const tieneCompletadoManual = progreso?.some((p: any) => p.completado_manual);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumen de progreso */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Progreso de Capacitación
            {tieneCompletadoManual && (
              <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                <UserCheck className="h-3 w-3 mr-1" />
                Presencial
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {progresoGeneral?.quizzes_aprobados || 0}/{progresoGeneral?.total_modulos || 0}
              </div>
              <div className="text-xs text-muted-foreground">Módulos aprobados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {progresoGeneral?.porcentaje || 0}%
              </div>
              <div className="text-xs text-muted-foreground">Completado</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {progresoGeneral?.quizzes_obligatorios_aprobados || 0}/{progresoGeneral?.modulos_obligatorios || 0}
              </div>
              <div className="text-xs text-muted-foreground">Obligatorios</div>
            </div>
            <div className="text-center">
              {progresoGeneral?.capacitacion_completa ? (
                <Badge className="bg-green-500 text-white">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Completada
                </Badge>
              ) : (
                <Badge variant="secondary">En progreso</Badge>
              )}
            </div>
          </div>
          <Progress value={progresoGeneral?.porcentaje || 0} className="h-2" />

          {/* Botón Capacitación Manual */}
          {!progresoGeneral?.capacitacion_completa && (
            <div className="mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setShowManualDialog(true)}
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Marcar como Completada (Presencial)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de módulos */}
      <div className="grid gap-4">
        {modulos?.map((modulo) => {
          const progresoMod = getProgresoModulo(modulo.id);
          const Icono = iconosTipo[modulo.tipo_contenido] || BookOpen;
          const esManual = (progresoMod as any)?.completado_manual;
          
          return (
            <Card key={modulo.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    progresoMod?.quiz_aprobado || esManual
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-secondary text-muted-foreground'
                  }`}>
                    {progresoMod?.quiz_aprobado || esManual ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      <Icono className="h-6 w-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium truncate">{modulo.nombre}</h3>
                      {modulo.es_obligatorio && (
                        <Badge variant="outline" className="text-xs">Obligatorio</Badge>
                      )}
                      {esManual && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Presencial
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {modulo.descripcion}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {modulo.duracion_estimada_min} min
                      </span>
                      {progresoMod?.quiz_mejor_puntaje !== undefined && (
                        <span className="flex items-center gap-1">
                          <FileQuestion className="h-3 w-3" />
                          Mejor: {progresoMod.quiz_mejor_puntaje}%
                        </span>
                      )}
                      {progresoMod?.quiz_intentos !== undefined && progresoMod.quiz_intentos > 0 && (
                        <span>Intentos: {progresoMod.quiz_intentos}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {progresoMod?.quiz_aprobado || esManual ? (
                      <Badge className="bg-green-500">
                        {esManual ? '✓' : `${progresoMod?.quiz_mejor_puntaje}%`}
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => setModuloQuiz(modulo)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        {progresoMod?.quiz_intentos ? 'Reintentar' : 'Iniciar Quiz'}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Se requiere un mínimo de {QUIZ_MIN_SCORE}% en cada quiz para aprobar el módulo.
      </p>

      {/* Dialog de Quiz */}
      {moduloQuiz && (
        <QuizDialog
          modulo={moduloQuiz}
          candidatoId={candidatoId}
          open={!!moduloQuiz}
          onClose={() => setModuloQuiz(null)}
        />
      )}

      {/* Dialog de Capacitación Manual */}
      <AlertDialog open={showManualDialog} onOpenChange={setShowManualDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Completar Capacitación Presencial
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esto marcará todos los módulos como completados manualmente. 
              Se registrará quién y cuándo realizó esta acción.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="manual-notas">Notas (opcional)</Label>
            <Textarea
              id="manual-notas"
              placeholder="Ej: Capacitación presencial realizada el 24/02/2026 en oficina central..."
              value={manualNotas}
              onChange={(e) => setManualNotas(e.target.value)}
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarcarManual}>
              Confirmar Completada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
