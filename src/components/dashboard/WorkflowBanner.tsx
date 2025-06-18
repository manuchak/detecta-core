
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Calendar,
  Wrench,
  ArrowRight,
  Eye
} from 'lucide-react';
import { useAprobacionesWorkflow } from '@/hooks/useAprobacionesWorkflow';
import { Link } from 'react-router-dom';

const WorkflowBanner = () => {
  const { serviciosPorEtapa, isLoading } = useAprobacionesWorkflow();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="animate-pulse h-16 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const etapasInfo = [
    {
      key: 'pendiente_evaluacion',
      titulo: 'Pendiente Evaluación',
      descripcion: 'Servicios nuevos esperando revisión inicial',
      icon: Clock,
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      urgencia: 'alta',
      ruta: '/services?filter=pendiente_evaluacion'
    },
    {
      key: 'pendiente_analisis_riesgo',
      titulo: 'Análisis de Riesgo',
      descripcion: 'Requieren evaluación de seguridad',
      icon: AlertTriangle,
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      urgencia: 'alta',
      ruta: '/services?filter=pendiente_analisis_riesgo'
    },
    {
      key: 'en_evaluacion_riesgo',
      titulo: 'En Evaluación',
      descripcion: 'Análisis de riesgo en proceso',
      icon: Users,
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      urgencia: 'media',
      ruta: '/services?filter=en_evaluacion_riesgo'
    },
    {
      key: 'pendiente_aprobacion',
      titulo: 'Pendiente Aprobación',
      descripcion: 'Esperando aprobación final',
      icon: CheckCircle,
      color: 'bg-purple-100 text-purple-800 border-purple-300',
      urgencia: 'alta',
      ruta: '/services?filter=pendiente_aprobacion'
    },
    {
      key: 'programacion_instalacion',
      titulo: 'Programar Instalación',
      descripcion: 'Aprobados, listos para instalar',
      icon: Calendar,
      color: 'bg-green-100 text-green-800 border-green-300',
      urgencia: 'alta',
      ruta: '/installers/schedule'
    },
    {
      key: 'instalacion_programada',
      titulo: 'Instalación Programada',
      descripcion: 'Citas agendadas con instaladores',
      icon: Wrench,
      color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      urgencia: 'media',
      ruta: '/installers/calendar'
    }
  ];

  const etapasConAtencion = etapasInfo.filter(etapa => {
    const cantidad = serviciosPorEtapa?.[etapa.key]?.length || 0;
    return cantidad > 0;
  });

  if (etapasConAtencion.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-gray-500">
            <CheckCircle className="h-5 w-5 mr-2" />
            <span>Todas las etapas del workflow están al día</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-gray-900">Elementos que Requieren Atención</h3>
          <Badge variant="outline" className="text-xs">
            {etapasConAtencion.length} etapa(s) activa(s)
          </Badge>
        </div>
        
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {etapasConAtencion.map((etapa) => {
            const cantidad = serviciosPorEtapa?.[etapa.key]?.length || 0;
            const IconComponent = etapa.icon;
            
            return (
              <div 
                key={etapa.key}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`p-2 rounded-lg ${etapa.color.split(' ')[0]} ${etapa.color.split(' ')[1]}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{etapa.titulo}</span>
                      <Badge 
                        className={`${etapa.color} text-xs`}
                        variant="outline"
                      >
                        {cantidad}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{etapa.descripcion}</p>
                  </div>
                </div>
                
                <Button asChild variant="ghost" size="sm">
                  <Link to={etapa.ruta} className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
        
        {etapasConAtencion.some(e => e.urgencia === 'alta') && (
          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">
                Hay {etapasConAtencion.filter(e => e.urgencia === 'alta').length} etapa(s) que requieren atención urgente
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WorkflowBanner;
