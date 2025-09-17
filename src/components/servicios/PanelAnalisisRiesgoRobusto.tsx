// @ts-nocheck
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, CheckCircle, XCircle, FileText, Calculator } from 'lucide-react';
import { useAprobacionesWorkflow } from '@/hooks/useAprobacionesWorkflow';
import { useToast } from '@/hooks/use-toast';
import type { AnalisisRiesgoSeguridad } from '@/types/serviciosMonitoreoCompleto';

interface FormularioAnalisisRiesgo {
  // A. Información del Cliente y Operación
  tipo_monitoreo_requerido: 'activo' | 'pasivo' | 'predictivo' | '';
  tipo_activo_proteger: 'vehiculo' | 'persona' | 'carga' | 'inmueble' | '';
  perfil_usuario: 'ejecutivo' | 'operador' | 'custodio' | 'familia' | 'empresario' | '';
  
  // B. Riesgo del Cliente o Giro (valores ponderados)
  carga_alto_valor: boolean; // +25 puntos
  carga_regulada: boolean; // +20 puntos
  robos_ultimos_12_meses: boolean; // +30 puntos
  rutas_alto_riesgo: boolean; // +25 puntos
  sin_politicas_seguridad: boolean; // +15 puntos
  sin_responsable_seguridad: boolean; // +10 puntos
  
  // C. Riesgo de la Unidad y Operación
  vehiculos_sin_blindaje: boolean; // +20 puntos
  conductores_sin_protocolos: boolean; // +15 puntos
  gps_no_homologado: boolean; // +20 puntos
  sin_boton_panico: boolean; // +15 puntos
  sin_centro_monitoreo_24h: boolean; // +25 puntos
  sin_bitacora_trazabilidad: boolean; // +10 puntos
  
  // D. Verificación de Cumplimiento (CTPAT/ASIS)
  identidad_legal_validada: boolean; // -10 puntos
  antecedentes_revisados: boolean; // -10 puntos
  politica_seguridad_escrita: boolean; // -15 puntos
  procedimientos_siniestros: boolean; // -10 puntos
  terceriza_operacion: boolean; // +15 puntos
  manual_rutas_seguras: boolean; // -15 puntos
  
  // E. Factores Adicionales de Contexto
  zona_operacion: 'muy_alta' | 'alta' | 'media' | 'baja' | '';
  experiencia_cliente: 'nuevo' | 'menos_1_año' | '1_3_años' | 'mas_3_años' | '';
  volumen_operacion: 'bajo' | 'medio' | 'alto' | 'muy_alto' | '';
  
  // F. Recomendaciones del Analista
  capacitacion_requerida: boolean;
  boton_panico_recomendado: boolean;
  observaciones_generales: string;
  
  // Resultado del análisis - Fixed types to match expected schema
  score_calculado: number;
  nivel_riesgo_final: 'bajo' | 'medio' | 'alto' | 'critico';
  decision_final: 'aprobado_sin_observaciones' | 'aprobado_con_recomendaciones' | 'no_autorizado';
}

export const PanelAnalisisRiesgoRobusto = () => {
  const { serviciosPendientesRiesgo, loadingRiesgo, crearAnalisisRiesgo } = useAprobacionesWorkflow();
  const { toast } = useToast();
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormularioAnalisisRiesgo>({
    tipo_monitoreo_requerido: '',
    tipo_activo_proteger: '',
    perfil_usuario: '',
    carga_alto_valor: false,
    carga_regulada: false,
    robos_ultimos_12_meses: false,
    rutas_alto_riesgo: false,
    sin_politicas_seguridad: false,
    sin_responsable_seguridad: false,
    vehiculos_sin_blindaje: false,
    conductores_sin_protocolos: false,
    gps_no_homologado: false,
    sin_boton_panico: false,
    sin_centro_monitoreo_24h: false,
    sin_bitacora_trazabilidad: false,
    identidad_legal_validada: false,
    antecedentes_revisados: false,
    politica_seguridad_escrita: false,
    procedimientos_siniestros: false,
    terceriza_operacion: false,
    manual_rutas_seguras: false,
    zona_operacion: '',
    experiencia_cliente: '',
    volumen_operacion: '',
    capacitacion_requerida: false,
    boton_panico_recomendado: false,
    observaciones_generales: '',
    score_calculado: 0,
    nivel_riesgo_final: 'bajo',
    decision_final: 'aprobado_sin_observaciones'
  });

  // Función de cálculo de score basada en metodologías de riesgo logístico
  const calcularScoreRiesgo = (data: FormularioAnalisisRiesgo): number => {
    let score = 0; // Base neutra
    
    // Factores de riesgo del cliente/giro (peso alto)
    if (data.carga_alto_valor) score += 25;
    if (data.carga_regulada) score += 20;
    if (data.robos_ultimos_12_meses) score += 30; // Factor crítico
    if (data.rutas_alto_riesgo) score += 25;
    if (data.sin_politicas_seguridad) score += 15;
    if (data.sin_responsable_seguridad) score += 10;
    
    // Factores de riesgo operacional
    if (data.vehiculos_sin_blindaje) score += 20;
    if (data.conductores_sin_protocolos) score += 15;
    if (data.gps_no_homologado) score += 20;
    if (data.sin_boton_panico) score += 15;
    if (data.sin_centro_monitoreo_24h) score += 25; // Factor crítico
    if (data.sin_bitacora_trazabilidad) score += 10;
    
    // Factores de mitigación (reducen el riesgo)
    if (data.identidad_legal_validada) score -= 10;
    if (data.antecedentes_revisados) score -= 10;
    if (data.politica_seguridad_escrita) score -= 15;
    if (data.procedimientos_siniestros) score -= 10;
    if (data.manual_rutas_seguras) score -= 15;
    
    // Factores de contexto
    if (data.terceriza_operacion) score += 15;
    
    // Ponderación por zona
    const zonaPonderacion = {
      'muy_alta': 30,
      'alta': 20,
      'media': 10,
      'baja': 0
    };
    score += zonaPonderacion[data.zona_operacion as keyof typeof zonaPonderacion] || 0;
    
    // Ponderación por experiencia del cliente (factor de confianza)
    const experienciaPonderacion = {
      'nuevo': 15,
      'menos_1_año': 10,
      '1_3_años': 5,
      'mas_3_años': -5
    };
    score += experienciaPonderacion[data.experiencia_cliente as keyof typeof experienciaPonderacion] || 0;
    
    // Ponderación por volumen (mayor volumen = mayor exposición)
    const volumenPonderacion = {
      'muy_alto': 15,
      'alto': 10,
      'medio': 5,
      'bajo': 0
    };
    score += volumenPonderacion[data.volumen_operacion as keyof typeof volumenPonderacion] || 0;
    
    return Math.max(0, Math.min(100, score)); // Normalizar entre 0-100
  };

  // Updated to match expected risk levels: bajo, medio, alto, critico
  const determinarNivelRiesgo = (score: number): 'bajo' | 'medio' | 'alto' | 'critico' => {
    if (score <= 20) return 'bajo';
    if (score <= 40) return 'medio';
    if (score <= 70) return 'alto';
    return 'critico'; // Changed from 'no_viable' to 'critico'
  };

  const sugerirDecision = (nivel: string, data: FormularioAnalisisRiesgo): 'aprobado_sin_observaciones' | 'aprobado_con_recomendaciones' | 'no_autorizado' => {
    // Factores que automáticamente requieren rechazo
    if (nivel === 'critico' || 
        (data.robos_ultimos_12_meses && data.sin_centro_monitoreo_24h) ||
        (data.carga_regulada && data.sin_politicas_seguridad)) {
      return 'no_autorizado';
    }
    
    if (nivel === 'bajo' && data.identidad_legal_validada && data.antecedentes_revisados) {
      return 'aprobado_sin_observaciones';
    }
    
    return 'aprobado_con_recomendaciones';
  };

  const actualizarCalculos = (newData: FormularioAnalisisRiesgo) => {
    const score = calcularScoreRiesgo(newData);
    const nivel = determinarNivelRiesgo(score);
    const decision = sugerirDecision(nivel, newData);
    
    setFormData({
      ...newData,
      score_calculado: score,
      nivel_riesgo_final: nivel,
      decision_final: decision
    });
  };

  const handleCheckboxChange = (field: keyof FormularioAnalisisRiesgo, checked: boolean) => {
    const newData = { ...formData, [field]: checked };
    actualizarCalculos(newData);
  };

  const handleSelectChange = (field: keyof FormularioAnalisisRiesgo, value: string) => {
    const newData = { ...formData, [field]: value };
    actualizarCalculos(newData);
  };

  const handleCompletarAnalisis = async () => {
    if (!servicioSeleccionado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un servicio para analizar.",
        variant: "destructive",
      });
      return;
    }

    // Validar campos requeridos
    if (!formData.tipo_monitoreo_requerido || !formData.tipo_activo_proteger || !formData.perfil_usuario) {
      toast({
        title: "Campos requeridos",
        description: "Debe completar la información básica del servicio.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Iniciando análisis de riesgo para servicio:', servicioSeleccionado);
      console.log('Datos del formulario:', formData);

      const analisisData: Partial<AnalisisRiesgoSeguridad> = {
        servicio_id: servicioSeleccionado,
        tipo_monitoreo_requerido: formData.tipo_monitoreo_requerido,
        tipo_activo_proteger: formData.tipo_activo_proteger,
        perfil_usuario: formData.perfil_usuario,
        calificacion_riesgo: formData.nivel_riesgo_final,
        recomendaciones: formData.observaciones_generales,
        aprobado_seguridad: formData.decision_final !== 'no_autorizado',
        estado_analisis: 'completado'
      };

      console.log('Enviando análisis de riesgo:', analisisData);

      await crearAnalisisRiesgo.mutateAsync(analisisData);
      
      toast({
        title: "Análisis completado",
        description: `El análisis de riesgo ha sido ${formData.decision_final === 'no_autorizado' ? 'rechazado' : 'aprobado'}.`,
      });

      // Limpiar formulario y selección
      setServicioSeleccionado(null);
      resetForm();

    } catch (error) {
      console.error('Error al completar análisis:', error);
      toast({
        title: "Error",
        description: "No se pudo completar el análisis. Intente nuevamente.",
        variant: "destructive",
      });
    }
  };

  const getRiesgoColor = (nivel: string) => {
    switch (nivel) {
      case 'bajo': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'alto': return 'bg-orange-100 text-orange-800';
      case 'critico': return 'bg-red-100 text-red-800'; // Updated from 'no_viable' to 'critico'
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_monitoreo_requerido: '',
      tipo_activo_proteger: '',
      perfil_usuario: '',
      carga_alto_valor: false,
      carga_regulada: false,
      robos_ultimos_12_meses: false,
      rutas_alto_riesgo: false,
      sin_politicas_seguridad: false,
      sin_responsable_seguridad: false,
      vehiculos_sin_blindaje: false,
      conductores_sin_protocolos: false,
      gps_no_homologado: false,
      sin_boton_panico: false,
      sin_centro_monitoreo_24h: false,
      sin_bitacora_trazabilidad: false,
      identidad_legal_validada: false,
      antecedentes_revisados: false,
      politica_seguridad_escrita: false,
      procedimientos_siniestros: false,
      terceriza_operacion: false,
      manual_rutas_seguras: false,
      zona_operacion: '',
      experiencia_cliente: '',
      volumen_operacion: '',
      capacitacion_requerida: false,
      boton_panico_recomendado: false,
      observaciones_generales: '',
      score_calculado: 0,
      nivel_riesgo_final: 'bajo',
      decision_final: 'aprobado_sin_observaciones'
    });
  };

  if (loadingRiesgo) {
    return <div className="p-6">Cargando servicios pendientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Análisis de Riesgo Logístico - Metodología Avanzada</h2>
        <Badge variant="outline" className="text-orange-600">
          {serviciosPendientesRiesgo?.length || 0} análisis pendientes
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lista de servicios pendientes */}
        <Card>
          <CardHeader>
            <CardTitle>Servicios Pendientes de Análisis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {serviciosPendientesRiesgo?.map((servicio) => (
              <div
                key={servicio.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  servicioSeleccionado === servicio.id 
                    ? 'border-orange-500 bg-orange-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setServicioSeleccionado(servicio.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{servicio.numero_servicio}</span>
                  <Badge variant="outline" className="text-green-600">
                    Aprobado por Ops
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{servicio.nombre_cliente}</p>
                <p className="text-xs text-gray-500">
                  {servicio.tipo_servicio} • {servicio.cantidad_vehiculos} vehículo(s)
                </p>
              </div>
            ))}

            {(!serviciosPendientesRiesgo || serviciosPendientesRiesgo.length === 0) && (
              <p className="text-gray-500 text-center py-8">No hay servicios pendientes de análisis</p>
            )}
          </CardContent>
        </Card>

        {/* Formulario robusto de análisis */}
        {servicioSeleccionado && (
          <div className="space-y-6">
            {/* Panel de Score en Tiempo Real */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Score de Riesgo Calculado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{formData.score_calculado}</div>
                  <Badge className={`${getRiesgoColor(formData.nivel_riesgo_final)} text-sm px-3 py-1`}>
                    Riesgo {formData.nivel_riesgo_final.toUpperCase()}
                  </Badge>
                  {formData.decision_final && (
                    <div className="mt-4 p-3 rounded-lg bg-blue-50">
                      <p className="text-sm font-medium text-blue-800">
                        Recomendación: {formData.decision_final.replace(/_/g, ' ').toUpperCase()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Formulario Principal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Evaluación de Riesgo Logístico (CTPAT/ASIS)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* A. Información Básica */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">A. Información del Cliente y Operación</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Monitoreo</label>
                      <Select
                        value={formData.tipo_monitoreo_requerido}
                        onValueChange={(value) => handleSelectChange('tipo_monitoreo_requerido', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="activo">Monitoreo Activo</SelectItem>
                          <SelectItem value="pasivo">Monitoreo Pasivo</SelectItem>
                          <SelectItem value="predictivo">Monitoreo Predictivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tipo de Activo</label>
                      <Select
                        value={formData.tipo_activo_proteger}
                        onValueChange={(value) => handleSelectChange('tipo_activo_proteger', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vehiculo">Vehículo</SelectItem>
                          <SelectItem value="persona">Persona</SelectItem>
                          <SelectItem value="carga">Carga</SelectItem>
                          <SelectItem value="inmueble">Inmueble</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Perfil del Usuario</label>
                      <Select
                        value={formData.perfil_usuario}
                        onValueChange={(value) => handleSelectChange('perfil_usuario', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
                          <SelectItem value="operador">Operador</SelectItem>
                          <SelectItem value="custodio">Custodio</SelectItem>
                          <SelectItem value="familia">Familia</SelectItem>
                          <SelectItem value="empresario">Empresario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* B. Riesgo del Cliente o Giro */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">B. Riesgo del Cliente o Giro (Factores Críticos)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'carga_alto_valor', label: 'Carga de alto valor o fácil disposición (+25pts)', puntos: 25 },
                      { key: 'carga_regulada', label: 'Carga regulada (químicos, alcohol, tabaco) (+20pts)', puntos: 20 },
                      { key: 'robos_ultimos_12_meses', label: 'Cliente sufrió robos últimos 12 meses (+30pts)', puntos: 30 },
                      { key: 'rutas_alto_riesgo', label: 'Opera en rutas de alto riesgo (+25pts)', puntos: 25 },
                      { key: 'sin_politicas_seguridad', label: 'Sin políticas de seguridad documentadas (+15pts)', puntos: 15 },
                      { key: 'sin_responsable_seguridad', label: 'Sin responsable de seguridad (+10pts)', puntos: 10 }
                    ].map(item => (
                      <div key={item.key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData[item.key as keyof FormularioAnalisisRiesgo] as boolean}
                          onCheckedChange={(checked) => handleCheckboxChange(item.key as keyof FormularioAnalisisRiesgo, checked as boolean)}
                        />
                        <label className="text-sm flex-1">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* C. Riesgo de la Unidad y Operación */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">C. Riesgo de la Unidad y Operación</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'vehiculos_sin_blindaje', label: 'Vehículos sin blindaje ni custodia (+20pts)', puntos: 20 },
                      { key: 'conductores_sin_protocolos', label: 'Conductores sin protocolos de incidentes (+15pts)', puntos: 15 },
                      { key: 'gps_no_homologado', label: 'GPS no homologado o baja frecuencia (+20pts)', puntos: 20 },
                      { key: 'sin_boton_panico', label: 'Carencia de botón de pánico (+15pts)', puntos: 15 },
                      { key: 'sin_centro_monitoreo_24h', label: 'Sin centro de monitoreo 24/7 (+25pts)', puntos: 25 },
                      { key: 'sin_bitacora_trazabilidad', label: 'Sin bitácora ni trazabilidad (+10pts)', puntos: 10 }
                    ].map(item => (
                      <div key={item.key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData[item.key as keyof FormularioAnalisisRiesgo] as boolean}
                          onCheckedChange={(checked) => handleCheckboxChange(item.key as keyof FormularioAnalisisRiesgo, checked as boolean)}
                        />
                        <label className="text-sm flex-1">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* D. Verificación de Cumplimiento */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">D. Verificación de Cumplimiento (CTPAT/ASIS)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'identidad_legal_validada', label: 'Identidad legal validada (RFC, INE) (-10pts)', puntos: -10 },
                      { key: 'antecedentes_revisados', label: 'Antecedentes de incidentes revisados (-10pts)', puntos: -10 },
                      { key: 'politica_seguridad_escrita', label: 'Política escrita de seguridad (-15pts)', puntos: -15 },
                      { key: 'procedimientos_siniestros', label: 'Procedimientos ante siniestros (-10pts)', puntos: -10 },
                      { key: 'terceriza_operacion', label: 'Terceriza operación de transporte (+15pts)', puntos: 15 },
                      { key: 'manual_rutas_seguras', label: 'Manual de rutas con zonas seguras (-15pts)', puntos: -15 }
                    ].map(item => (
                      <div key={item.key} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData[item.key as keyof FormularioAnalisisRiesgo] as boolean}
                          onCheckedChange={(checked) => handleCheckboxChange(item.key as keyof FormularioAnalisisRiesgo, checked as boolean)}
                        />
                        <label className="text-sm flex-1">{item.label}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* E. Factores de Contexto */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">E. Factores de Contexto</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Zona de Operación</label>
                      <Select
                        value={formData.zona_operacion}
                        onValueChange={(value) => handleSelectChange('zona_operacion', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja (+0pts)</SelectItem>
                          <SelectItem value="media">Media (+10pts)</SelectItem>
                          <SelectItem value="alta">Alta (+20pts)</SelectItem>
                          <SelectItem value="muy_alta">Muy Alta (+30pts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Experiencia del Cliente</label>
                      <Select
                        value={formData.experiencia_cliente}
                        onValueChange={(value) => handleSelectChange('experiencia_cliente', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mas_3_años">Más de 3 años (-5pts)</SelectItem>
                          <SelectItem value="1_3_años">1-3 años (+5pts)</SelectItem>
                          <SelectItem value="menos_1_año">Menos 1 año (+10pts)</SelectItem>
                          <SelectItem value="nuevo">Nuevo (+15pts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">Volumen de Operación</label>
                      <Select
                        value={formData.volumen_operacion}
                        onValueChange={(value) => handleSelectChange('volumen_operacion', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bajo">Bajo (+0pts)</SelectItem>
                          <SelectItem value="medio">Medio (+5pts)</SelectItem>
                          <SelectItem value="alto">Alto (+10pts)</SelectItem>
                          <SelectItem value="muy_alto">Muy Alto (+15pts)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* F. Recomendaciones */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-lg">F. Recomendaciones del Analista</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.capacitacion_requerida}
                        onCheckedChange={(checked) => handleCheckboxChange('capacitacion_requerida', checked as boolean)}
                      />
                      <label className="text-sm">Se sugiere capacitación al personal operativo</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={formData.boton_panico_recomendado}
                        onCheckedChange={(checked) => handleCheckboxChange('boton_panico_recomendado', checked as boolean)}
                      />
                      <label className="text-sm">Se recomienda incluir botones de pánico</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Observaciones Generales</label>
                    <Textarea
                      placeholder="Observaciones y recomendaciones específicas del analista..."
                      value={formData.observaciones_generales}
                      onChange={(e) => {
                        const newData = { ...formData, observaciones_generales: e.target.value };
                        setFormData(newData);
                      }}
                      rows={4}
                    />
                  </div>
                </div>

                <Separator />

                <div className="flex gap-3">
                  <Button
                    onClick={handleCompletarAnalisis}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={crearAnalisisRiesgo.isPending || !formData.tipo_monitoreo_requerido || !formData.tipo_activo_proteger}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {crearAnalisisRiesgo.isPending ? 'Procesando...' : 'Completar Análisis'}
                  </Button>
                  <Button
                    onClick={() => {
                      setServicioSeleccionado(null);
                      resetForm();
                    }}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
