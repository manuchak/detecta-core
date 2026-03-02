import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  UserCheck,
  Upload,
  FileText,
  Image,
  X,
  Loader2
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

const ACCEPTED_TYPES = '.pdf,.jpg,.jpeg,.png';
const MAX_SIZE_MB = 20;

export const TrainingTab = ({ candidatoId }: TrainingTabProps) => {
  const { modulos, progreso, isLoading, calcularProgresoGeneral, marcarCapacitacionManual } = useCapacitacion(candidatoId);
  const [moduloQuiz, setModuloQuiz] = useState<ModuloCapacitacion | null>(null);
  const [showManualDialog, setShowManualDialog] = useState(false);
  const [manualNotas, setManualNotas] = useState('');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const progresoGeneral = calcularProgresoGeneral();

  const getProgresoModulo = (moduloId: string) => {
    return progreso?.find(p => p.modulo_id === moduloId);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      alert(`El archivo excede el límite de ${MAX_SIZE_MB}MB`);
      return;
    }
    setArchivo(file);
    if (file.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(file));
    } else {
      setPreview(null);
    }
  };

  const handleRemoveFile = () => {
    setArchivo(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleMarcarManual = async () => {
    if (!marcarCapacitacionManual || !archivo) return;
    await marcarCapacitacionManual.mutateAsync({ notas: manualNotas, archivo });
    setShowManualDialog(false);
    setManualNotas('');
    handleRemoveFile();
  };

  const handleCloseDialog = (open: boolean) => {
    if (!open) {
      handleRemoveFile();
      setManualNotas('');
    }
    setShowManualDialog(open);
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

      {/* Dialog de Capacitación Manual con Upload */}
      <Dialog open={showManualDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Completar Capacitación Presencial
            </DialogTitle>
            <DialogDescription>
              Sube la constancia de inducción firmada y, opcionalmente, agrega notas. 
              Se registrará quién y cuándo realizó esta acción.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Upload zone */}
            <div>
              <Label>Constancia de Inducción *</Label>
              {!archivo ? (
                <label className="flex flex-col items-center justify-center w-full h-32 mt-2 border-2 border-dashed rounded-lg cursor-pointer border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Sube foto o PDF de la constancia firmada</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF, JPG o PNG (máx. {MAX_SIZE_MB}MB)</span>
                  <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="border rounded-lg p-3 mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {archivo.type.startsWith('image/') ? (
                        <Image className="h-4 w-4 text-muted-foreground shrink-0" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="text-sm truncate">{archivo.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(archivo.size / 1024 / 1024).toFixed(1)}MB)
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleRemoveFile}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  {preview && (
                    <img src={preview} alt="Preview" className="w-full max-h-48 object-contain rounded" />
                  )}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="manual-notas">Notas (opcional)</Label>
              <Textarea
                id="manual-notas"
                placeholder="Ej: Capacitación presencial realizada el 24/02/2026 en oficina central..."
                value={manualNotas}
                onChange={(e) => setManualNotas(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseDialog(false)} disabled={marcarCapacitacionManual.isPending}>
              Cancelar
            </Button>
            <Button onClick={handleMarcarManual} disabled={!archivo || marcarCapacitacionManual.isPending}>
              {marcarCapacitacionManual.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Completar Capacitación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
