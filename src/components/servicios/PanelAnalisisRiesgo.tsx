
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useAprobacionesWorkflow } from '@/hooks/useAprobacionesWorkflow';
import type { AnalisisRiesgoSeguridad } from '@/types/serviciosMonitoreoCompleto';

export const PanelAnalisisRiesgo = () => {
  const { serviciosPendientesRiesgo, loadingRiesgo, crearAnalisisRiesgo } = useAprobacionesWorkflow();
  const [servicioSeleccionado, setServicioSeleccionado] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<AnalisisRiesgoSeguridad>>({});

  const tiposMonitoreo = ['persona', 'vehiculo_individual', 'flotilla'];
  const tiposActivo = ['vehiculo', 'persona', 'ambos'];
  const perfilesUsuario = ['ejecutivo', 'operador', 'custodio', 'familia', 'empresario'];
  const tiposRiesgo = ['robo', 'secuestro', 'sabotaje', 'vandalismo', 'fraude'];
  const nivelesExposicion = ['alto', 'medio', 'bajo'];
  const controlesExistentes = ['escolta', 'boton_panico', 'gps_basico', 'camara', 'alarma'];
  const dispositivosSeguridad = ['gps_avanzado', 'boton_panico_mejorado', 'sensor_jamming', 'camara_interior', 'paro_motor'];
  const mediosComunicacion = ['llamada', 'correo', 'app', 'whatsapp', 'sms'];
  const calificacionesRiesgo = ['bajo', 'medio', 'alto', 'critico'];

  const handleCompletarAnalisis = async (aprobado: boolean) => {
    if (!servicioSeleccionado) return;

    await crearAnalisisRiesgo.mutateAsync({
      ...formData,
      servicio_id: servicioSeleccionado,
      estado_analisis: 'completado',
      aprobado_seguridad: aprobado
    });

    setServicioSeleccionado(null);
    setFormData({});
  };

  const handleArrayFieldChange = (field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = (prev[field as keyof AnalisisRiesgoSeguridad] as string[]) || [];
      const updatedArray = checked 
        ? [...currentArray, value]
        : currentArray.filter(item => item !== value);
      return { ...prev, [field]: updatedArray };
    });
  };

  if (loadingRiesgo) {
    return <div className="p-6">Cargando servicios pendientes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Panel de Análisis de Riesgo - Seguridad</h2>
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

        {/* Formulario de análisis de riesgo */}
        {servicioSeleccionado && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Cuestionario de Análisis de Riesgo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tipo de Monitoreo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">1. Tipo de monitoreo requerido</label>
                <Select
                  value={formData.tipo_monitoreo_requerido || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_monitoreo_requerido: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposMonitoreo.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipo de Activo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">2. Tipo de activo a proteger</label>
                <Select
                  value={formData.tipo_activo_proteger || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_activo_proteger: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar activo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposActivo.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Perfil del Usuario */}
              <div className="space-y-2">
                <label className="text-sm font-medium">3. Perfil del usuario</label>
                <Select
                  value={formData.perfil_usuario || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, perfil_usuario: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfilesUsuario.map(perfil => (
                      <SelectItem key={perfil} value={perfil}>
                        {perfil.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tipos de Riesgo Principal */}
              <div className="space-y-3">
                <label className="text-sm font-medium">7. Tipos de riesgo más probables</label>
                <div className="grid grid-cols-2 gap-2">
                  {tiposRiesgo.map(riesgo => (
                    <div key={riesgo} className="flex items-center space-x-2">
                      <Checkbox
                        checked={(formData.tipo_riesgo_principal || []).includes(riesgo)}
                        onCheckedChange={(checked) => 
                          handleArrayFieldChange('tipo_riesgo_principal', riesgo, checked as boolean)
                        }
                      />
                      <label className="text-sm">{riesgo.toUpperCase()}</label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nivel de Exposición */}
              <div className="space-y-2">
                <label className="text-sm font-medium">8. Nivel de exposición</label>
                <Select
                  value={formData.nivel_exposicion || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, nivel_exposicion: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {nivelesExposicion.map(nivel => (
                      <SelectItem key={nivel} value={nivel}>
                        {nivel.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Calificación de Riesgo */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Calificación de Riesgo</label>
                <Select
                  value={formData.calificacion_riesgo || ''}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, calificacion_riesgo: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Calificar riesgo" />
                  </SelectTrigger>
                  <SelectContent>
                    {calificacionesRiesgo.map(cal => (
                      <SelectItem key={cal} value={cal}>
                        {cal.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Recomendaciones */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Recomendaciones</label>
                <Textarea
                  placeholder="Recomendaciones de seguridad específicas..."
                  value={formData.recomendaciones || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    recomendaciones: e.target.value 
                  }))}
                  rows={4}
                />
              </div>

              <Separator />

              <div className="flex gap-3">
                <Button
                  onClick={() => handleCompletarAnalisis(true)}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={crearAnalisisRiesgo.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Aprobar Servicio
                </Button>
                <Button
                  onClick={() => handleCompletarAnalisis(false)}
                  variant="destructive"
                  className="flex-1"
                  disabled={crearAnalisisRiesgo.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Rechazar Servicio
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
