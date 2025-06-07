
import { useState } from 'react';
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
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  MapPin,
  Building,
  User,
  FileText,
  Loader2
} from 'lucide-react';
import { useAnalisisRiesgo } from '@/hooks/useServiciosMonitoreo';
import type { AnalisisRiesgo, NivelRiesgo, SituacionFinanciera, Recomendacion } from '@/types/serviciosMonitoreo';

interface AnalisisRiesgoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId: string;
}

export const AnalisisRiesgoDialog = ({ open, onOpenChange, servicioId }: AnalisisRiesgoDialogProps) => {
  const [currentSection, setCurrentSection] = useState('cliente');
  const { analisis, isLoading, saveAnalisis } = useAnalisisRiesgo(servicioId);

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

  const scoreRiesgo = form.watch('score_riesgo') || 50;

  const getScoreColor = (score: number) => {
    if (score <= 25) return 'text-green-600';
    if (score <= 50) return 'text-yellow-600';
    if (score <= 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score <= 25) return 'Riesgo Bajo';
    if (score <= 50) return 'Riesgo Medio';
    if (score <= 75) return 'Riesgo Alto';
    return 'Riesgo Muy Alto';
  };

  const onSubmit = async (data: Partial<AnalisisRiesgo>) => {
    await saveAnalisis.mutateAsync(data);
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
                      <FormLabel>Nivel de Riesgo del Cliente</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bajo">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              Bajo - Cliente confiable
                            </div>
                          </SelectItem>
                          <SelectItem value="medio">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              Medio - Requiere verificación
                            </div>
                          </SelectItem>
                          <SelectItem value="alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              Alto - Antecedentes cuestionables
                            </div>
                          </SelectItem>
                          <SelectItem value="muy_alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Muy Alto - Cliente de alto riesgo
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
                      <FormLabel>Situación Financiera</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="estable">Estable</SelectItem>
                          <SelectItem value="regular">Regular</SelectItem>
                          <SelectItem value="inestable">Inestable</SelectItem>
                          <SelectItem value="desconocida">Desconocida</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
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
                            Se verificaron antecedentes penales y comerciales
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
                            Se validaron referencias comerciales
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
                      <FormLabel>Zona de Operación</FormLabel>
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
                      <FormLabel>Nivel de Riesgo de la Zona</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="bajo">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-green-500"></div>
                              Bajo - Zona segura
                            </div>
                          </SelectItem>
                          <SelectItem value="medio">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                              Medio - Zona con precauciones
                            </div>
                          </SelectItem>
                          <SelectItem value="alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                              Alto - Zona de riesgo
                            </div>
                          </SelectItem>
                          <SelectItem value="muy_alto">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-red-500"></div>
                              Muy Alto - Zona de alto riesgo
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Factores de Riesgo Zonal
                  </h4>
                  <ul className="text-sm text-yellow-800 space-y-1">
                    <li>• Índice de criminalidad de la zona</li>
                    <li>• Presencia de grupos delictivos</li>
                    <li>• Calidad de infraestructura vial</li>
                    <li>• Cobertura de seguridad pública</li>
                    <li>• Historial de incidentes en la zona</li>
                  </ul>
                </div>
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
                  <Shield className="h-5 w-5" />
                  Evaluación de Riesgo General
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="score_riesgo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        <span>Score de Riesgo</span>
                        <Badge className={getScoreColor(scoreRiesgo)}>
                          {scoreRiesgo}% - {getScoreLabel(scoreRiesgo)}
                        </Badge>
                      </FormLabel>
                      <FormControl>
                        <div className="px-2">
                          <Slider
                            value={[field.value || 50]}
                            onValueChange={(value) => field.onChange(value[0])}
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>0% - Sin Riesgo</span>
                            <span>100% - Riesgo Máximo</span>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Factores de Riesgo Alto
                    </h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Antecedentes penales del cliente</li>
                      <li>• Zona de alta criminalidad</li>
                      <li>• Falta de documentación</li>
                      <li>• Referencias comerciales negativas</li>
                      <li>• Actividad económica irregular</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Factores de Protección
                    </h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Documentación completa y válida</li>
                      <li>• Referencias comerciales positivas</li>
                      <li>• Estabilidad financiera comprobada</li>
                      <li>• Zona de baja criminalidad</li>
                      <li>• Historial comercial limpio</li>
                    </ul>
                  </div>
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
                  Recomendación Final
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="recomendacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recomendación</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Criterios de Evaluación ISO 31000
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Identificación de riesgos</li>
                    <li>• Análisis de probabilidad e impacto</li>
                    <li>• Evaluación de controles existentes</li>
                    <li>• Determinación del riesgo residual</li>
                    <li>• Recomendaciones de tratamiento</li>
                  </ul>
                </div>
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Análisis de Riesgo de Seguridad
          </DialogTitle>
          <DialogDescription>
            Evaluación completa basada en estándares ISO 31000 y BASC
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
