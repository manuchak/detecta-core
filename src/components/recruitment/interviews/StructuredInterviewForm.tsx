import { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useCreateInterview, InterviewFormData } from '@/hooks/useStructuredInterview';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useAuth } from '@/contexts/AuthContext';
import { Star, MessageSquare, Clock, ThumbsUp, ThumbsDown, AlertTriangle, Plus, X, Save } from 'lucide-react';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const RATING_DIMENSIONS = [
  { key: 'rating_comunicacion', label: 'Comunicación', description: 'Claridad y fluidez al expresarse' },
  { key: 'rating_actitud', label: 'Actitud', description: 'Disposición y profesionalismo' },
  { key: 'rating_experiencia', label: 'Experiencia', description: 'Conocimientos y habilidades relevantes' },
  { key: 'rating_disponibilidad', label: 'Disponibilidad', description: 'Flexibilidad de horarios' },
  { key: 'rating_motivacion', label: 'Motivación', description: 'Interés genuino en el puesto' },
  { key: 'rating_profesionalismo', label: 'Profesionalismo', description: 'Presentación y comportamiento' },
] as const;

type RatingKey = typeof RATING_DIMENSIONS[number]['key'];

interface InterviewDraftData {
  ratings: Record<RatingKey, number>;
  notas: string;
  fortalezas: string[];
  areasMejora: string[];
  decision: 'aprobar' | 'rechazar' | 'segunda_entrevista' | 'pendiente';
  motivoDecision: string;
  duracion: number;
  tipoEntrevista: string;
  newFortaleza: string;
  newAreaMejora: string;
}

const INITIAL_INTERVIEW_DATA: InterviewDraftData = {
  ratings: {
    rating_comunicacion: 3,
    rating_actitud: 3,
    rating_experiencia: 3,
    rating_disponibilidad: 3,
    rating_motivacion: 3,
    rating_profesionalismo: 3,
  },
  notas: '',
  fortalezas: [],
  areasMejora: [],
  decision: 'pendiente',
  motivoDecision: '',
  duracion: 30,
  tipoEntrevista: 'inicial',
  newFortaleza: '',
  newAreaMejora: '',
};

export function StructuredInterviewForm({ candidatoId, candidatoNombre, onClose, onSuccess }: Props) {
  const createInterview = useCreateInterview();
  const { user } = useAuth();
  
  // Build user-scoped key for persistence
  const persistenceKey = user 
    ? `structured_interview_${candidatoId}_${user.id}` 
    : `structured_interview_${candidatoId}`;
  
  const {
    data: formData,
    updateData,
    hasDraft,
    clearDraft,
    getTimeSinceSave,
    lastSaved,
  } = useFormPersistence<InterviewDraftData>({
    key: persistenceKey,
    initialData: INITIAL_INTERVIEW_DATA,
    level: 'standard',
    debounceMs: 800,
    isMeaningful: (data) => {
      return !!(
        data.notas || 
        data.fortalezas.length > 0 || 
        data.areasMejora.length > 0 ||
        data.decision !== 'pendiente' ||
        Object.values(data.ratings).some(r => r !== 3)
      );
    },
  });

  // Destructure for easier access
  const { ratings, notas, fortalezas, areasMejora, decision, motivoDecision, duracion, tipoEntrevista, newFortaleza, newAreaMejora } = formData;

  const promedio = useMemo(() => {
    const values = Object.values(ratings);
    return values.reduce((a, b) => a + b, 0) / values.length;
  }, [ratings]);

  const getPromedioColor = (value: number) => {
    if (value >= 4) return 'text-green-600';
    if (value >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingLabel = (value: number) => {
    if (value === 1) return 'Muy bajo';
    if (value === 2) return 'Bajo';
    if (value === 3) return 'Aceptable';
    if (value === 4) return 'Bueno';
    return 'Excelente';
  };

  const handleAddFortaleza = () => {
    if (newFortaleza.trim() && !fortalezas.includes(newFortaleza.trim())) {
      updateData({ 
        fortalezas: [...fortalezas, newFortaleza.trim()],
        newFortaleza: '',
      });
    }
  };

  const handleAddAreaMejora = () => {
    if (newAreaMejora.trim() && !areasMejora.includes(newAreaMejora.trim())) {
      updateData({
        areasMejora: [...areasMejora, newAreaMejora.trim()],
        newAreaMejora: '',
      });
    }
  };

  const handleRemoveFortaleza = (index: number) => {
    updateData({ fortalezas: fortalezas.filter((_, j) => j !== index) });
  };

  const handleRemoveAreaMejora = (index: number) => {
    updateData({ areasMejora: areasMejora.filter((_, j) => j !== index) });
  };

  const handleSubmit = async () => {
    const data: InterviewFormData = {
      candidato_id: candidatoId,
      ...ratings,
      notas_generales: notas || undefined,
      fortalezas,
      areas_mejora: areasMejora,
      decision,
      motivo_decision: motivoDecision || undefined,
      tipo_entrevista: tipoEntrevista,
      duracion_minutos: duracion,
    };

    await createInterview.mutateAsync(data);
    clearDraft();
    onSuccess?.();
    onClose();
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Entrevista Estructurada
            </CardTitle>
            <CardDescription>
              Evaluación de: <span className="font-semibold">{candidatoNombre}</span>
            </CardDescription>
          </div>
          {hasDraft && lastSaved && (
            <Badge variant="outline" className="text-xs gap-1">
              <Save className="h-3 w-3" />
              Borrador guardado {getTimeSinceSave()}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tipo y Duración */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Entrevista</Label>
            <Select value={tipoEntrevista} onValueChange={(v) => updateData({ tipoEntrevista: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inicial">Inicial</SelectItem>
                <SelectItem value="segunda">Segunda Entrevista</SelectItem>
                <SelectItem value="tecnica">Técnica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Duración (minutos)
            </Label>
            <Input
              type="number"
              value={duracion}
              onChange={(e) => updateData({ duracion: Number(e.target.value) })}
              min={5}
              max={180}
            />
          </div>
        </div>

        {/* Ratings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Evaluación por Dimensiones</h3>
            <Badge variant="outline" className={`text-lg ${getPromedioColor(promedio)}`}>
              <Star className="h-4 w-4 mr-1 fill-current" />
              {promedio.toFixed(1)} / 5.0
            </Badge>
          </div>

          <div className="grid gap-4">
            {RATING_DIMENSIONS.map(({ key, label, description }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="font-medium">{label}</Label>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <Badge variant={ratings[key] >= 4 ? 'default' : ratings[key] >= 3 ? 'secondary' : 'destructive'}>
                    {ratings[key]} - {getRatingLabel(ratings[key])}
                  </Badge>
                </div>
                <Slider
                  value={[ratings[key]]}
                  onValueChange={([value]) => updateData({ ratings: { ...ratings, [key]: value } })}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fortalezas */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ThumbsUp className="h-4 w-4 text-green-500" />
            Fortalezas Identificadas
          </Label>
          <div className="flex gap-2">
            <Input
              value={newFortaleza}
              onChange={(e) => updateData({ newFortaleza: e.target.value })}
              placeholder="Agregar fortaleza..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFortaleza())}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddFortaleza}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {fortalezas.map((f, i) => (
              <Badge key={i} variant="secondary" className="gap-1">
                {f}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveFortaleza(i)} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Áreas de Mejora */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <ThumbsDown className="h-4 w-4 text-orange-500" />
            Áreas de Mejora
          </Label>
          <div className="flex gap-2">
            <Input
              value={newAreaMejora}
              onChange={(e) => updateData({ newAreaMejora: e.target.value })}
              placeholder="Agregar área de mejora..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAreaMejora())}
            />
            <Button type="button" variant="outline" size="icon" onClick={handleAddAreaMejora}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {areasMejora.map((a, i) => (
              <Badge key={i} variant="outline" className="gap-1 border-orange-300">
                {a}
                <X className="h-3 w-3 cursor-pointer" onClick={() => handleRemoveAreaMejora(i)} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label>Notas Generales</Label>
          <Textarea
            value={notas}
            onChange={(e) => updateData({ notas: e.target.value })}
            placeholder="Observaciones adicionales de la entrevista..."
            rows={3}
          />
        </div>

        {/* Decisión */}
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold">Decisión Final</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Decisión</Label>
              <Select value={decision} onValueChange={(v) => updateData({ decision: v as typeof decision })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aprobar">Aprobar</SelectItem>
                  <SelectItem value="segunda_entrevista">Requiere Segunda Entrevista</SelectItem>
                  <SelectItem value="rechazar">Rechazar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {decision !== 'pendiente' && (
            <div className="space-y-2">
              <Label>Motivo de la Decisión</Label>
              <Textarea
                value={motivoDecision}
                onChange={(e) => updateData({ motivoDecision: e.target.value })}
                placeholder={`Justificación para ${decision === 'aprobar' ? 'aprobar' : decision === 'rechazar' ? 'rechazar' : 'requerir segunda entrevista'}...`}
                rows={2}
              />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={createInterview.isPending}>
          {createInterview.isPending ? 'Guardando...' : 'Guardar Entrevista'}
        </Button>
      </CardFooter>
    </Card>
  );
}
