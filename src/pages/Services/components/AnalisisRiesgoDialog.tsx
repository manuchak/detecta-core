
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
import { Input } from '@/components/ui/input';
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
  Calculator,
  DollarSign,
  Clock,
  Users,
  Award
} from 'lucide-react';
import { useAnalisisRiesgo } from '@/hooks/useAnalisisRiesgo';
import type { AnalisisRiesgo, CriterioEvaluacionFinanciera } from '@/types/serviciosMonitoreo';

interface AnalisisRiesgoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId: string;
}

export const AnalisisRiesgoDialog = ({ open, onOpenChange, servicioId }: AnalisisRiesgoDialogProps) => {
  const [currentSection, setCurrentSection] = useState('cliente');
  const [respuestasCriterios, setRespuestasCriterios] = useState<Record<string, { respuesta: string; valor_numerico?: number; observaciones?: string }>>({});
  
  const { 
    analisis, 
    isLoading, 
    saveAnalisis, 
    criterios, 
    respuestas,
    calculateAdvancedRiskScore, 
    getAdvancedRecommendation 
  } = useAnalisisRiesgo(servicioId);

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
      condiciones_especiales: [],
      tipo_cliente: 'nuevo',
      tiempo_en_actividad: 0,
      comprobantes_ingresos: false,
      historial_crediticio: 'desconocido'
    }
  });

  // Cargar datos existentes
  useEffect(() => {
    if (analisis) {
      form.reset(analisis);
    }
    if (respuestas.length > 0) {
      const respuestasMap: Record<string, any> = {};
      respuestas.forEach(respuesta => {
        respuestasMap[respuesta.criterio_id] = {
          respuesta: respuesta.respuesta,
          valor_numerico: respuesta.valor_numerico,
          observaciones: respuesta.observaciones
        };
      });
      setRespuestasCriterios(respuestasMap);
    }
  }, [analisis, respuestas, form]);

  // Calcular score en tiempo real
  const watchedValues = form.watch();
  const [realTimeScore, setRealTimeScore] = useState(50);
  const [autoRecommendation, setAutoRecommendation] = useState<AnalisisRiesgo['recomendacion']>('requiere_revision');

  useEffect(() => {
    const respuestasArray = Object.entries(respuestasCriterios).map(([criterio_id, data]) => ({
      criterio_id,
      respuesta: data.respuesta,
      valor_numerico: data.valor_numerico,
      observaciones: data.observaciones,
      analisis_id: '',
      id: '',
      created_at: ''
    }));

    const score = calculateAdvancedRiskScore(watchedValues, respuestasArray);
    const recommendation = getAdvancedRecommendation(score, watchedValues);
    setRealTimeScore(score);
    setAutoRecommendation(recommendation);
    form.setValue('score_riesgo', score);
    form.setValue('recomendacion', recommendation);
  }, [watchedValues, respuestasCriterios, calculateAdvancedRiskScore, getAdvancedRecommendation, form]);

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

  const getRecommendationBadge = (recommendation: AnalisisRiesgo['recomendacion']) => {
    const config = {
      'aprobar': { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Aprobar' },
      'aprobar_con_condiciones': { color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle, label: 'Aprobar con Condiciones' },
      'requiere_revision': { color: 'bg-blue-100 text-blue-800', icon: FileText, label: 'Requiere Revisión' },
      'rechazar': { color: 'bg-red-100 text-red-800', icon: AlertTriangle, label: 'Rechazar' }
    };

    const item = config[recommendation || 'requiere_revision'];
    const Icon = item.icon;

    return (
      <Badge className={`${item.color} flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {item.label}
      </Badge>
    );
  };

  const handleCriterioChange = (criterioId: string, field: string, value: any) => {
    setRespuestasCriterios(prev => ({
      ...prev,
      [criterioId]: {
        ...prev[criterioId],
        [field]: value
      }
    }));
  };

  const onSubmit = async (data: Partial<AnalisisRiesgo>) => {
    const respuestasArray = Object.entries(respuestasCriterios)
      .filter(([_, respuesta]) => respuesta.respuesta)
      .map(([criterio_id, respuesta]) => ({
        criterio_id,
        respuesta: respuesta.respuesta,
        valor_numerico: respuesta.valor_numerico,
        observaciones: respuesta.observaciones
      }));
    
    const analisisData = {
      ...data,
      servicio_id: servicioId,
      zona_operacion: data.zona_operacion || '',
      score_riesgo: realTimeScore,
      recomendacion: autoRecommendation
    };
    
    await saveAnalisis.mutateAsync({
      analisisData,
      respuestas: respuestasArray
    });
    onOpenChange(false);
  };

  const sections = [
    { id: 'cliente', label: 'Información del Cliente', icon: User },
    { id: 'financiero', label: 'Evaluación Financiera', icon: DollarSign },
    { id: 'zona', label: 'Análisis de Zona', icon: MapPin },
    { id: 'criterios', label: 'Criterios Específicos', icon: Award },
    { id: 'resumen', label: 'Resumen y Decisión', icon: Shield }
  ];

  const renderCriteriosPorCategoria = (categoria: string) => {
    const criteriosFiltrados = criterios.filter(c => c.categoria === categoria);
    
    return criteriosFiltrados.map(criterio => (
      <Card key={criterio.id} className="mb-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">{criterio.nombre}</CardTitle>
          {criterio.descripcion && (
            <p className="text-xs text-gray-600">{criterio.descripcion}</p>
          )}
          <Badge variant={criterio.peso_score < 0 ? "default" : "destructive"} className="w-fit">
            {criterio.peso_score > 0 ? '+' : ''}{criterio.peso_score} puntos
          </Badge>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select
            value={respuestasCriterios[criterio.id]?.respuesta || ''}
            onValueChange={(value) => {
              const valorNumerico = value === 'aplica' ? criterio.peso_score : 0;
              handleCriterioChange(criterio.id, 'respuesta', value);
              handleCriterioChange(criterio.id, 'valor_numerico', valorNumerico);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccione una opción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aplica">Aplica / Sí</SelectItem>
              <SelectItem value="no_aplica">No Aplica / No</SelectItem>
              <SelectItem value="parcial">Aplica Parcialmente</SelectItem>
            </SelectContent>
          </Select>
          
          <Textarea
            placeholder="Observaciones adicionales..."
            value={respuestasCriterios[criterio.id]?.observaciones || ''}
            onChange={(e) => handleCriterioChange(criterio.id, 'observaciones', e.target.value)}
            rows={2}
          />
        </CardContent>
      </Card>
    ));
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'cliente':
        return (
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Score de Riesgo en Tiempo Real</span>
                  </div>
                  <Badge className={`${getScoreColor(realTimeScore)} font-bold text-lg py-2 px-4`}>
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
                  <User className="h-5 w-5" />
                  Información General del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tipo_cliente"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Cliente</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="nuevo">Nuevo Cliente</SelectItem>
                            <SelectItem value="recurrente">Cliente Recurrente</SelectItem>
                            <SelectItem value="referido">Cliente Referido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tiempo_en_actividad"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tiempo en Actividad (meses)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field}
                            onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="nivel_riesgo_cliente"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evaluación Inicial del Cliente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bajo">Bajo - Cliente de confianza establecida</SelectItem>
                          <SelectItem value="medio">Medio - Cliente estándar</SelectItem>
                          <SelectItem value="alto">Alto - Cliente requiere verificación adicional</SelectItem>
                          <SelectItem value="muy_alto">Muy Alto - Cliente de alto riesgo</SelectItem>
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
                          <FormLabel className="text-base">Antecedentes Verificados</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Verificación de antecedentes completa
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
                          <FormLabel className="text-base">Referencias Comerciales</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            Referencias comerciales verificadas
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

      case 'financiero':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Evaluación Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ingresos_declarados"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingresos Declarados (MXN)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0.00"
                            {...field}
                            onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="historial_crediticio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Historial Crediticio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="excelente">Excelente</SelectItem>
                            <SelectItem value="bueno">Bueno</SelectItem>
                            <SelectItem value="regular">Regular</SelectItem>
                            <SelectItem value="malo">Malo</SelectItem>
                            <SelectItem value="desconocido">Desconocido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="situacion_financiera"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situación Financiera General</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="estable">Estable - Ingresos consistentes y verificables</SelectItem>
                          <SelectItem value="regular">Regular - Ingresos variables pero aceptables</SelectItem>
                          <SelectItem value="inestable">Inestable - Ingresos irregulares o dudosos</SelectItem>
                          <SelectItem value="desconocida">Desconocida - Información insuficiente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comprobantes_ingresos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Comprobantes de Ingresos</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Cliente proporcionó comprobantes oficiales
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
                  Análisis de Zona de Operación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="zona_operacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción de la Zona de Operación *</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field}
                          placeholder="Describa detalladamente la zona donde operará el servicio: colonias, municipios, rutas frecuentes, características del área..."
                          rows={4}
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
                      <FormLabel>Nivel de Riesgo de la Zona</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bajo">Bajo - Zona segura con baja incidencia delictiva</SelectItem>
                          <SelectItem value="medio">Medio - Zona estándar con precauciones normales</SelectItem>
                          <SelectItem value="alto">Alto - Zona con incidencia delictiva moderada</SelectItem>
                          <SelectItem value="muy_alto">Muy Alto - Zona de alto riesgo delictivo</SelectItem>
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

      case 'criterios':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Criterios Específicos de Evaluación
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Evalúe cada criterio según aplique al cliente. Cada criterio tiene un peso específico en el score final.
                </p>
              </CardHeader>
            </Card>

            {['ingresos', 'estabilidad', 'referencias', 'historial_crediticio'].map(categoria => (
              <div key={categoria}>
                <h3 className="text-lg font-semibold mb-3 capitalize flex items-center gap-2">
                  {categoria === 'ingresos' && <DollarSign className="h-5 w-5" />}
                  {categoria === 'estabilidad' && <Clock className="h-5 w-5" />}
                  {categoria === 'referencias' && <Users className="h-5 w-5" />}
                  {categoria === 'historial_crediticio' && <FileText className="h-5 w-5" />}
                  {categoria.replace('_', ' ')}
                </h3>
                {renderCriteriosPorCategoria(categoria)}
              </div>
            ))}
          </div>
        );

      case 'resumen':
        return (
          <div className="space-y-6">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Resumen del Análisis de Riesgo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="mb-4">
                    <Badge className={`${getScoreColor(realTimeScore)} text-2xl py-3 px-6 font-bold`}>
                      Score Final: {realTimeScore.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold mb-2">{getScoreLabel(realTimeScore)}</h3>
                    <Progress value={realTimeScore} className="h-4" />
                  </div>
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Recomendación del Sistema:</p>
                    {getRecommendationBadge(autoRecommendation)}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="recomendacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decisión Final del Ejecutivo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || autoRecommendation}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aprobar">Aprobar - Servicio autorizado</SelectItem>
                          <SelectItem value="aprobar_con_condiciones">Aprobar con Condiciones</SelectItem>
                          <SelectItem value="requiere_revision">Requiere Revisión de Supervisor</SelectItem>
                          <SelectItem value="rechazar">Rechazar - No autorizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="condiciones_especiales"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones Especiales / Observaciones Finales</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Especifique condiciones especiales, observaciones o justificaciones para la decisión..."
                          rows={4}
                          value={field.value?.join('\n') || ''}
                          onChange={(e) => field.onChange(e.target.value.split('\n').filter(Boolean))}
                        />
                      </FormControl>
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análisis Integral de Riesgo de Seguridad
          </DialogTitle>
          <DialogDescription>
            Evaluación profesional basada en estándares ISO 31000 y metodologías de gestión de riesgo financiero
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-6">
          {/* Navigation */}
          <div className="w-64 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setCurrentSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    currentSection === section.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{section.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {renderSection()}

                <div className="flex items-center justify-between pt-6 border-t">
                  <div className="flex gap-2">
                    {currentSection !== 'cliente' && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          const currentIndex = sections.findIndex(s => s.id === currentSection);
                          if (currentIndex > 0) {
                            setCurrentSection(sections[currentIndex - 1].id);
                          }
                        }}
                      >
                        Anterior
                      </Button>
                    )}
                    {currentSection !== 'resumen' && (
                      <Button 
                        type="button"
                        onClick={() => {
                          const currentIndex = sections.findIndex(s => s.id === currentSection);
                          if (currentIndex < sections.length - 1) {
                            setCurrentSection(sections[currentIndex + 1].id);
                          }
                        }}
                      >
                        Siguiente
                      </Button>
                    )}
                  </div>
                  
                  {currentSection === 'resumen' && (
                    <Button 
                      type="submit" 
                      disabled={saveAnalisis.isPending}
                      className="min-w-[150px]"
                    >
                      {saveAnalisis.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Guardando...
                        </>
                      ) : (
                        'Guardar Análisis Completo'
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
