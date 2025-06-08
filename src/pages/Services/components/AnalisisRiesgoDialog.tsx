
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  MapPin,
  Building,
  User,
  FileText,
  Loader2,
  TrendingUp,
  Calculator
} from 'lucide-react';
import { useAnalisisRiesgo } from '@/hooks/useAnalisisRiesgo';
import type { AnalisisRiesgo, NivelRiesgo, SituacionFinanciera, Recomendacion } from '@/types/serviciosMonitoreo';

interface AnalisisRiesgoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId: string;
}

export const AnalisisRiesgoDialog = ({ open, onOpenChange, servicioId }: AnalisisRiesgoDialogProps) => {
  const [currentSection, setCurrentSection] = useState('cliente');
  const { analisis, isLoading, saveAnalisis, calculateRiskScore, getAutoRecommendation } = useAnalisisRiesgo(servicioId);

  const form = useForm<Partial<AnalisisRiesgo>>({
    defaultValues: {
      servicio_id: servicioId,
      nivel_riesgo_cliente: 'medio',
      antecedentes_verificados: false,
      referencias_comerciales: false,
      situacion_financiera: 'desconocida',
      zona_operacion: '',
      nivel_riesgo_zona: 'medio',
      score_riesgo: 50,
      recomendacion: 'requiere_revision',
      condiciones_especiales: []
    }
  });

  // Cargar datos existentes si hay análisis previo
  useEffect(() => {
    if (analisis) {
      form.reset(analisis);
    }
  }, [analisis, form]);

  // Calcular score en tiempo real cuando cambian los valores
  const watchedValues = form.watch();
  const [realTimeScore, setRealTimeScore] = useState(50);
  const [autoRecommendation, setAutoRecommendation] = useState<Recomendacion>('requiere_revision');

  useEffect(() => {
    const score = calculateRiskScore(watchedValues);
    const recommendation = getAutoRecommendation(score);
    setRealTimeScore(score);
    setAutoRecommendation(recommendation);
    form.setValue('score_riesgo', score);
    form.setValue('recomendacion', recommendation);
  }, [watchedValues, calculateRiskScore, getAutoRecommendation, form]);

  const getScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 45) return 'text-yellow-600';
    if (score <= 70) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 25) return 'Riesgo Bajo';
    if (score <= 45) return 'Riesgo Medio';
    if (score <= 70) return 'Riesgo Alto';
    return 'Riesgo Muy Alto';
  };

  const getRecommendationBadge = (recommendation: Recomendacion) => {
    const config = {
      'aprobar': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprobar' },
      'aprobar_con_condiciones': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Aprobar con Condiciones' },
      'requiere_revision': { color: 'bg-blue-100 text-blue-800', icon: FileText, label: 'Requiere Revisión' },
      'rechazar': { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Rechazar' }
    };

    const item = config[recommendation];
    const Icon = item.icon;

    return (
      <Badge className={`${item.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {item.label}
      </Badge>
    );
  };

  const onSubmit = async (data: Partial<AnalisisRiesgo>) => {
    const analisisData = {
      ...data,
      servicio_id: servicioId,
      zona_operacion: data.zona_operacion || '',
      score_riesgo: realTimeScore,
      recomendacion: autoRecommendation
    };
    
    await saveAnalisis.mutateAsync(analisisData);
    onOpenChange(false);
  };

  const sections = [
    { id: 'cliente', label: 'Cliente', icon: User },
    { id: 'zona', label: 'Zona', icon: MapPin },
    { id: 'evaluacion', label: 'Evaluación', icon: Shield },
    { id: 'recomendacion', label: 'Recomendación', icon: FileText }
  ];

  const renderSection = () => {
    switch (currentSection) {
      case 'cliente':
        return (
          <div className="space-y-6">
            {/* Score en tiempo real */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Score de Riesgo Calculado</span>
                  </div>
                  <Badge className={`${getScoreColor(realTimeScore)} font-bold`}>
                    {realTimeScore.toFixed(0)}% - {getScoreLabel(realTimeScore)}
                  </Badge>
                </div>
                <Progress value={realTimeScore} className="mb-3" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-700">Recomendación Automática:</span>
                  {getRecommendationBadge(autoRecommendation)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Análisis del Cliente/Empresa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nivel_riesgo_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel de Riesgo del Cliente (30% del score)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bajo">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              Bajo - Cliente confiable (0 puntos)
                            </div>
                          </SelectItem>
                          <SelectItem value="medio">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              Medio - Requiere verificación (15 puntos)
                            </div>
                          </SelectItem>
                          <SelectItem value="alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              Alto - Antecedentes cuestionables (25 puntos)
                            </div>
                          </SelectItem>
                          <SelectItem value="muy_alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Muy Alto - Cliente de alto riesgo (30 puntos)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="situacion_financiera"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situación Financiera (20% del score)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="estable">Estable (0 puntos)</SelectItem>
                          <SelectItem value="regular">Regular (5 puntos)</SelectItem>
                          <SelectItem value="inestable">Inestable (15 puntos)</SelectItem>
                          <SelectItem value="desconocida">Desconocida (20 puntos)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="antecedentes_verificados"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Antecedentes Verificados
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Reduce 12.5 puntos del score
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="referencias_comerciales"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Referencias Comerciales
                          </FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Reduce 12.5 puntos del score
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'zona':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Análisis de Zona y Entorno
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="zona_operacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zona de Operación *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Describa la zona donde operará el servicio (colonias, municipios, rutas frecuentes)"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nivel_riesgo_zona"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nivel de Riesgo de la Zona (25% del score)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bajo">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              Bajo - Zona segura (0 puntos)
                            </div>
                          </SelectItem>
                          <SelectItem value="medio">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              Medio - Zona con precauciones (10 puntos)
                            </div>
                          </SelectItem>
                          <SelectItem value="alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              Alto - Zona de riesgo (20 puntos)
                            </div>
                          </SelectItem>
                          <SelectItem value="muy_alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Muy Alto - Zona de alto riesgo (25 puntos)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'evaluacion':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Resumen del Análisis de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-3">Desglose del Score de Riesgo:</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Riesgo del Cliente (30%):</span>
                      <span className="font-medium">
                        {watchedValues.nivel_riesgo_cliente === 'bajo' ? '0' :
                         watchedValues.nivel_riesgo_cliente === 'medio' ? '15' :
                         watchedValues.nivel_riesgo_cliente === 'alto' ? '25' : '30'} puntos
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Riesgo de Zona (25%):</span>
                      <span className="font-medium">
                        {watchedValues.nivel_riesgo_zona === 'bajo' ? '0' :
                         watchedValues.nivel_riesgo_zona === 'medio' ? '10' :
                         watchedValues.nivel_riesgo_zona === 'alto' ? '20' : '25'} puntos
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Situación Financiera (20%):</span>
                      <span className="font-medium">
                        {watchedValues.situacion_financiera === 'estable' ? '0' :
                         watchedValues.situacion_financiera === 'regular' ? '5' :
                         watchedValues.situacion_financiera === 'inestable' ? '15' : '20'} puntos
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verificaciones (25%):</span>
                      <span className="font-medium">
                        {25 - (watchedValues.antecedentes_verificados ? 12.5 : 0) - (watchedValues.referencias_comerciales ? 12.5 : 0)} puntos
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Score Total:</span>
                      <span className={getScoreColor(realTimeScore)}>{realTimeScore.toFixed(0)} puntos</span>
                    </div>
                  </div>
                </div>

                <Progress value={realTimeScore} className="h-3" />
                
                <div className="flex items-center justify-center">
                  <Badge className={`${getScoreColor(realTimeScore)} text-lg py-2 px-4`}>
                    {getScoreLabel(realTimeScore)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'recomendacion':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Recomendación Automática
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-6">
                  <div className="mb-4">
                    {getRecommendationBadge(autoRecommendation)}
                  </div>
                  <p className="text-gray-600 mb-4">
                    Basado en el análisis realizado, la recomendación automática es:
                  </p>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium text-blue-900">
                      {autoRecommendation === 'aprobar' && 'Se recomienda APROBAR este servicio. El cliente presenta un riesgo bajo.'}
                      {autoRecommendation === 'aprobar_con_condiciones' && 'Se recomienda APROBAR CON CONDICIONES. El cliente presenta un riesgo medio que puede ser mitigado.'}
                      {autoRecommendation === 'requiere_revision' && 'REQUIERE REVISIÓN ADICIONAL. El cliente presenta factores de riesgo que deben ser evaluados por un supervisor.'}
                      {autoRecommendation === 'rechazar' && 'Se recomienda RECHAZAR este servicio. El cliente presenta un riesgo muy alto.'}
                    </p>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="recomendacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Recomendación (Opcional - Anular recomendación automática)</FormLabel>
                      <Select onValueChange={field.onChange} value={autoRecommendation}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aprobar">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Aprobar - Servicio autorizado
                            </div>
                          </SelectItem>
                          <SelectItem value="aprobar_con_condiciones">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              Aprobar con Condiciones
                            </div>
                          </SelectItem>
                          <SelectItem value="requiere_revision">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              Requiere Revisión Adicional
                            </div>
                          </SelectItem>
                          <SelectItem value="rechazar">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-600" />
                              Rechazar - No autorizado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análisis de Riesgo de Seguridad
          </DialogTitle>
          <DialogDescription>
            Evaluación automática basada en estándares ISO 31000 y BASC
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Navigation */}
          <div className="w-48 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-left rounded-lg transition-colors ${
                    currentSection === section.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {section.label}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {renderSection()}

                <div className="flex items-center justify-end pt-6 border-t">
                  <Button 
                    type="submit" 
                    disabled={saveAnalisis.isPending}
                    className="min-w-[120px]"
                  >
                    {saveAnalisis.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Guardando...
                      </>
                    ) : (
                      'Guardar Análisis'
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
