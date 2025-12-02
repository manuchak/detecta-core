import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useCreateInterview, InterviewFormData } from '@/hooks/useStructuredInterview';
import { Star, MessageSquare, Clock, ThumbsUp, ThumbsDown, AlertTriangle, Plus, X } from 'lucide-react';

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

export function StructuredInterviewForm({ candidatoId, candidatoNombre, onClose, onSuccess }: Props) {
  const createInterview = useCreateInterview();
  
  const [ratings, setRatings] = useState<Record<RatingKey, number>>({
    rating_comunicacion: 3,
    rating_actitud: 3,
    rating_experiencia: 3,
    rating_disponibilidad: 3,
    rating_motivacion: 3,
    rating_profesionalismo: 3,
  });
  
  const [notas, setNotas] = useState('');
  const [fortalezas, setFortalezas] = useState<string[]>([]);
  const [areasMejora, setAreasMejora] = useState<string[]>([]);
  const [decision, setDecision] = useState<'aprobar' | 'rechazar' | 'segunda_entrevista' | 'pendiente'>('pendiente');
  const [motivoDecision, setMotivoDecision] = useState('');
  const [duracion, setDuracion] = useState<number>(30);
  const [tipoEntrevista, setTipoEntrevista] = useState<string>('inicial');
  
  const [newFortaleza, setNewFortaleza] = useState('');
  const [newAreaMejora, setNewAreaMejora] = useState('');

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
      setFortalezas([...fortalezas, newFortaleza.trim()]);
      setNewFortaleza('');
    }
  };

  const handleAddAreaMejora = () => {
    if (newAreaMejora.trim() && !areasMejora.includes(newAreaMejora.trim())) {
      setAreasMejora([...areasMejora, newAreaMejora.trim()]);
      setNewAreaMejora('');
    }
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
    onSuccess?.();
    onClose();
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Entrevista Estructurada
        </CardTitle>
        <CardDescription>
          Evaluación de: <span className="font-semibold">{candidatoNombre}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tipo y Duración */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Entrevista</Label>
            <Select value={tipoEntrevista} onValueChange={setTipoEntrevista}>
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
              onChange={(e) => setDuracion(Number(e.target.value))}
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
                  onValueChange={([value]) => setRatings({ ...ratings, [key]: value })}
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
              onChange={(e) => setNewFortaleza(e.target.value)}
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
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFortalezas(fortalezas.filter((_, j) => j !== i))} />
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
              onChange={(e) => setNewAreaMejora(e.target.value)}
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
                <X className="h-3 w-3 cursor-pointer" onClick={() => setAreasMejora(areasMejora.filter((_, j) => j !== i))} />
              </Badge>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div className="space-y-2">
          <Label>Notas Generales</Label>
          <Textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
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
              <Select value={decision} onValueChange={(v) => setDecision(v as typeof decision)}>
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
                onChange={(e) => setMotivoDecision(e.target.value)}
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
