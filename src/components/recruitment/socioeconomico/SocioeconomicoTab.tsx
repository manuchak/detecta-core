import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { 
  Home, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  FileText,
  Loader2,
  Users,
  DollarSign,
  MapPin
} from 'lucide-react';
import { useEstudiosSocioeconomicos, useCrearEstudioSocioeconomico, EstudioResultado } from '@/hooks/useEstudioSocioeconomico';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { SocioeconomicoBadge } from './SocioeconomicoBadge';

interface Props {
  candidatoId: string;
  candidatoNombre: string;
}

const SCORE_LABELS = [
  { key: 'score_vivienda', label: 'Vivienda', icon: Home, description: 'Condiciones de la vivienda' },
  { key: 'score_entorno', label: 'Entorno', icon: MapPin, description: 'Seguridad y accesos de la zona' },
  { key: 'score_familiar', label: 'Familiar', icon: Users, description: 'Estabilidad familiar' },
  { key: 'score_economico', label: 'Económico', icon: DollarSign, description: 'Situación financiera' },
  { key: 'score_referencias', label: 'Referencias', icon: FileText, description: 'Referencias vecinales y personales' },
];

export function SocioeconomicoTab({ candidatoId, candidatoNombre }: Props) {
  const { data: estudios, isLoading } = useEstudiosSocioeconomicos(candidatoId);
  const crearEstudio = useCrearEstudioSocioeconomico();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    proveedor: 'interno' as 'interno' | 'externo',
    nombre_proveedor: '',
    fecha_estudio: new Date().toISOString().split('T')[0],
    estado: 'completado',
    resultado_general: '' as '' | EstudioResultado,
    score_vivienda: 5,
    score_entorno: 5,
    score_familiar: 5,
    score_economico: 5,
    score_referencias: 5,
    observaciones: '',
    recomendacion: '',
  });

  const latestEstudio = estudios?.[0];

  const handleSubmit = async () => {
    await crearEstudio.mutateAsync({
      candidatoId,
      proveedor: formData.proveedor,
      nombre_proveedor: formData.proveedor === 'externo' ? formData.nombre_proveedor : undefined,
      fecha_estudio: formData.fecha_estudio,
      estado: formData.estado,
      resultado_general: formData.resultado_general || undefined,
      score_vivienda: formData.score_vivienda,
      score_entorno: formData.score_entorno,
      score_familiar: formData.score_familiar,
      score_economico: formData.score_economico,
      score_referencias: formData.score_referencias,
      observaciones: formData.observaciones || undefined,
      recomendacion: formData.recomendacion || undefined,
    });
    setShowForm(false);
  };

  const avgScore = [formData.score_vivienda, formData.score_entorno, formData.score_familiar, formData.score_economico, formData.score_referencias]
    .reduce((a, b) => a + b, 0) / 5;

  const getSemaforoColor = (score: number) => {
    if (score >= 7) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 5) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con badge */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Home className="h-5 w-5" />
          Estudio Socioeconómico
        </h3>
        <div className="flex items-center gap-2">
          {latestEstudio && <SocioeconomicoBadge estudio={latestEstudio} />}
          {!showForm && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              {latestEstudio ? 'Nuevo Estudio' : 'Registrar'}
            </Button>
          )}
        </div>
      </div>

      {/* Formulario de nuevo estudio */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Registrar Estudio Socioeconómico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Proveedor</Label>
                <Select value={formData.proveedor} onValueChange={(v: 'interno' | 'externo') => setFormData(prev => ({ ...prev, proveedor: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interno">Interno</SelectItem>
                    <SelectItem value="externo">Externo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.proveedor === 'externo' && (
                <div>
                  <Label>Nombre del Proveedor</Label>
                  <Input value={formData.nombre_proveedor} onChange={(e) => setFormData(prev => ({ ...prev, nombre_proveedor: e.target.value }))} placeholder="Nombre empresa" />
                </div>
              )}
              <div>
                <Label>Fecha del Estudio</Label>
                <Input type="date" value={formData.fecha_estudio} onChange={(e) => setFormData(prev => ({ ...prev, fecha_estudio: e.target.value }))} />
              </div>
              <div>
                <Label>Resultado General</Label>
                <Select value={formData.resultado_general} onValueChange={(v: EstudioResultado) => setFormData(prev => ({ ...prev, resultado_general: v }))}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="favorable">Favorable</SelectItem>
                    <SelectItem value="con_observaciones">Con Observaciones</SelectItem>
                    <SelectItem value="desfavorable">Desfavorable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scores con sliders */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Puntuaciones por Área</h4>
                <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getSemaforoColor(avgScore)}`}>
                  Promedio: {avgScore.toFixed(1)}
                </div>
              </div>

              {SCORE_LABELS.map(({ key, label, icon: Icon, description }) => {
                const value = formData[key as keyof typeof formData] as number;
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-sm">
                        <Icon className="h-3.5 w-3.5" />
                        {label}
                        <span className="text-muted-foreground text-xs font-normal">— {description}</span>
                      </Label>
                      <span className={`text-sm font-bold ${value >= 7 ? 'text-green-600' : value >= 5 ? 'text-amber-600' : 'text-red-600'}`}>
                        {value}/10
                      </span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={([v]) => setFormData(prev => ({ ...prev, [key]: v }))}
                      min={1}
                      max={10}
                      step={1}
                      className="py-1"
                    />
                  </div>
                );
              })}
            </div>

            <div>
              <Label>Observaciones</Label>
              <Textarea
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones del estudio..."
                rows={3}
              />
            </div>

            <div>
              <Label>Recomendación</Label>
              <Textarea
                value={formData.recomendacion}
                onChange={(e) => setFormData(prev => ({ ...prev, recomendacion: e.target.value }))}
                placeholder="Recomendación final..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={crearEstudio.isPending || !formData.resultado_general}>
                {crearEstudio.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Guardar Estudio
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historial de estudios */}
      {estudios && estudios.length > 0 ? (
        <div className="space-y-4">
          {estudios.map((estudio) => (
            <Card key={estudio.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <SocioeconomicoBadge estudio={estudio} />
                      <Badge variant="outline" className="text-xs">
                        {estudio.proveedor === 'interno' ? 'Interno' : estudio.nombre_proveedor || 'Externo'}
                      </Badge>
                    </div>
                    {estudio.fecha_estudio && (
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(estudio.fecha_estudio), "d MMM yyyy", { locale: es })}
                      </p>
                    )}
                  </div>
                  {estudio.score_global && (
                    <div className={`px-3 py-1 rounded-full text-lg font-bold border ${getSemaforoColor(estudio.score_global)}`}>
                      {estudio.score_global}
                    </div>
                  )}
                </div>

                {/* Mini scores bar */}
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {SCORE_LABELS.map(({ key, label }) => {
                    const val = estudio[key as keyof typeof estudio] as number | undefined;
                    return (
                      <div key={key} className="text-center">
                        <div className="text-xs text-muted-foreground">{label}</div>
                        <div className="text-sm font-semibold">{val ?? '-'}</div>
                        <Progress value={val ? val * 10 : 0} className="h-1 mt-1" />
                      </div>
                    );
                  })}
                </div>

                {estudio.observaciones && (
                  <p className="text-sm text-muted-foreground border-t pt-2">{estudio.observaciones}</p>
                )}
                {estudio.recomendacion && (
                  <p className="text-sm mt-1"><strong>Recomendación:</strong> {estudio.recomendacion}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !showForm ? (
        <Card>
          <CardContent className="text-center py-8 text-muted-foreground">
            <Home className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay estudios socioeconómicos registrados</p>
            <Button variant="outline" className="mt-4" onClick={() => setShowForm(true)}>
              Registrar Primer Estudio
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
