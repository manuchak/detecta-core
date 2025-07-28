import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, FileText, Users, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ServiceWorkflowDocumentation = () => {
  const documentRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!documentRef.current) return;

    try {
      const canvas = await html2canvas(documentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        height: documentRef.current.scrollHeight,
        width: documentRef.current.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('Documentacion-Proceso-Solicitudes-Servicio.pdf');
    } catch (error) {
      console.error('Error al generar PDF:', error);
    }
  };

  const workflowStages = [
    {
      id: 1,
      title: "Solicitud Inicial",
      status: "pendiente_evaluacion",
      description: "El cliente envía una solicitud de servicio de custodia GPS a través del formulario web.",
      responsible: "Cliente / Equipo de Ventas",
      duration: "1-2 días hábiles",
      icon: <FileText className="h-5 w-5" />,
      color: "border-blue-200 bg-blue-50",
      criteria: [
        "Información completa del cliente",
        "Tipo de servicio claramente definido",
        "Datos de contacto verificables",
        "Prioridad asignada correctamente"
      ]
    },
    {
      id: 2,
      title: "Aprobación del Coordinador",
      status: "evaluacion_coordinador",
      description: "El Coordinador de Operaciones revisa la solicitud y valida los criterios técnicos y operativos.",
      responsible: "Coordinador de Operaciones",
      duration: "1-3 días hábiles",
      icon: <Users className="h-5 w-5" />,
      color: "border-yellow-200 bg-yellow-50",
      criteria: [
        "Viabilidad técnica del servicio",
        "Disponibilidad de recursos",
        "Cumplimiento de políticas internas",
        "Validación de datos del cliente"
      ]
    },
    {
      id: 3,
      title: "Análisis de Riesgo de Seguridad",
      status: "pendiente_analisis_riesgo",
      description: "El equipo de seguridad evalúa los riesgos asociados al servicio y determina las medidas necesarias.",
      responsible: "Analista de Seguridad / Jefe de Seguridad",
      duration: "2-5 días hábiles",
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "border-orange-200 bg-orange-50",
      criteria: [
        "Evaluación de riesgo geográfico",
        "Análisis de perfil del cliente",
        "Determinar nivel de custodia requerido",
        "Identificar medidas de seguridad específicas"
      ]
    },
    {
      id: 4,
      title: "Programación de Instalación",
      status: "programacion_instalacion",
      description: "Se programa la instalación del equipo GPS y se asigna el técnico instalador.",
      responsible: "Coordinador de Instalaciones",
      duration: "1-2 días hábiles",
      icon: <Clock className="h-5 w-5" />,
      color: "border-purple-200 bg-purple-50",
      criteria: [
        "Disponibilidad del cliente",
        "Asignación de técnico especializado",
        "Preparación de equipos y materiales",
        "Confirmación de cita de instalación"
      ]
    },
    {
      id: 5,
      title: "Instalación GPS",
      status: "en_instalacion",
      description: "El técnico realiza la instalación del equipo GPS y configura el sistema de monitoreo.",
      responsible: "Técnico Instalador",
      duration: "2-4 horas",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "border-green-200 bg-green-50",
      criteria: [
        "Instalación física del dispositivo",
        "Configuración de parámetros",
        "Pruebas de funcionamiento",
        "Capacitación básica al usuario"
      ]
    },
    {
      id: 6,
      title: "Servicio Activo",
      status: "servicio_activo",
      description: "El servicio de custodia GPS está operativo y el cliente puede acceder al monitoreo 24/7.",
      responsible: "Centro de Monitoreo",
      duration: "Continuo",
      icon: <CheckCircle className="h-5 w-5" />,
      color: "border-green-200 bg-green-50",
      criteria: [
        "Monitoreo activo 24/7",
        "Alertas funcionando correctamente",
        "Reportes automáticos generándose",
        "Soporte técnico disponible"
      ]
    }
  ];

  const roles = [
    {
      name: "Cliente",
      responsibilities: ["Enviar solicitud completa", "Proporcionar información veraz", "Estar disponible para instalación"],
      permissions: ["Visualizar estado de solicitud", "Modificar datos de contacto"]
    },
    {
      name: "Coordinador de Operaciones",
      responsibilities: ["Revisar solicitudes", "Validar viabilidad técnica", "Aprobar o rechazar servicios"],
      permissions: ["Acceso a todas las solicitudes", "Modificar estado de solicitudes", "Asignar prioridades"]
    },
    {
      name: "Analista de Seguridad",
      responsibilities: ["Evaluar riesgos", "Determinar medidas de seguridad", "Aprobar nivel de custodia"],
      permissions: ["Acceso a análisis de riesgo", "Modificar evaluaciones", "Aprobar/rechazar por seguridad"]
    },
    {
      name: "Jefe de Seguridad",
      responsibilities: ["Supervisar análisis", "Aprobar casos de alto riesgo", "Definir políticas"],
      permissions: ["Acceso completo a análisis", "Override de decisiones", "Configurar criterios"]
    },
    {
      name: "Técnico Instalador",
      responsibilities: ["Realizar instalaciones", "Configurar equipos", "Capacitar usuarios"],
      permissions: ["Actualizar estado de instalación", "Reportar incidencias", "Acceso a manuales técnicos"]
    }
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Documentación del Proceso de Solicitudes de Servicio</h1>
            <p className="text-muted-foreground mt-2">Workflow completo de custodia GPS desde solicitud hasta activación</p>
          </div>
          <Button onClick={exportToPDF} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
        </div>

        <div ref={documentRef} className="bg-white p-8 rounded-lg shadow-sm">
          {/* Diagrama de Flujo */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Diagrama de Flujo del Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="text-center text-sm text-gray-600 mb-4">
                  Diagrama de flujo del proceso de solicitud de servicio GPS
                </div>
                <div className="bg-white p-4 rounded border">
                  <div className="text-xs text-gray-500 mb-2">Proceso simplificado - Para el diagrama completo usar la exportación PDF</div>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-blue-100 p-3 rounded text-center font-medium">1. Solicitud Inicial</div>
                    <div className="text-xl">↓</div>
                    <div className="bg-yellow-100 p-3 rounded text-center font-medium">2. Aprobación Coordinador</div>
                    <div className="text-xl">↓</div>
                    <div className="bg-orange-100 p-3 rounded text-center font-medium">3. Análisis de Riesgo</div>
                    <div className="text-xl">↓</div>
                    <div className="bg-purple-100 p-3 rounded text-center font-medium">4. Programación Instalación</div>
                    <div className="text-xl">↓</div>
                    <div className="bg-green-100 p-3 rounded text-center font-medium">5. Instalación GPS</div>
                    <div className="text-xl">↓</div>
                    <div className="bg-green-200 p-3 rounded text-center font-medium">6. Servicio Activo</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Etapas Detalladas */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Etapas del Proceso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {workflowStages.map((stage, index) => (
                  <div key={stage.id} className={`border rounded-lg p-6 ${stage.color}`}>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                          {stage.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {stage.id}. {stage.title}
                        </h3>
                        <p className="text-gray-700 mb-4">{stage.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-sm text-gray-600 mb-1">Responsable</h4>
                            <p className="text-sm">{stage.responsible}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-600 mb-1">Duración</h4>
                            <p className="text-sm">{stage.duration}</p>
                          </div>
                          <div>
                            <h4 className="font-medium text-sm text-gray-600 mb-1">Estado</h4>
                            <p className="text-sm font-mono">{stage.status}</p>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm text-gray-600 mb-2">Criterios de Validación</h4>
                          <ul className="text-sm space-y-1">
                            {stage.criteria.map((criterion, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {criterion}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Matriz de Roles y Responsabilidades */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Matriz de Roles y Responsabilidades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 p-3 text-left font-semibold">Rol</th>
                      <th className="border border-gray-200 p-3 text-left font-semibold">Responsabilidades</th>
                      <th className="border border-gray-200 p-3 text-left font-semibold">Permisos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role, index) => (
                      <tr key={index} className="hover:bg-gray-25">
                        <td className="border border-gray-200 p-3 font-medium">{role.name}</td>
                        <td className="border border-gray-200 p-3">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {role.responsibilities.map((resp, idx) => (
                              <li key={idx}>{resp}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="border border-gray-200 p-3">
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            {role.permissions.map((perm, idx) => (
                              <li key={idx}>{perm}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* SLAs y Métricas */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                SLAs y Métricas del Proceso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Tiempo Total</h3>
                  <p className="text-2xl font-bold text-blue-600">5-12 días</p>
                  <p className="text-sm text-blue-600">Desde solicitud hasta activación</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Meta de Aprobación</h3>
                  <p className="text-2xl font-bold text-green-600">≤ 3 días</p>
                  <p className="text-sm text-green-600">Coordinador + Análisis</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Instalación</h3>
                  <p className="text-2xl font-bold text-purple-600">2-4 hrs</p>
                  <p className="text-sm text-purple-600">Tiempo en sitio</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800">Disponibilidad</h3>
                  <p className="text-2xl font-bold text-orange-600">99.9%</p>
                  <p className="text-sm text-orange-600">Uptime del servicio</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estados Alternativos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Estados Alternativos y Excepciones
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 text-red-700">Estados de Rechazo</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span><strong>rechazado_coordinador:</strong> No cumple criterios técnicos</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span><strong>rechazado_seguridad:</strong> Riesgo demasiado alto</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span><strong>cancelado:</strong> Cliente cancela el servicio</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold mb-3 text-yellow-700">Estados de Espera</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span><strong>requiere_aclaracion:</strong> Información incompleta</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span><strong>suspendido:</strong> Proceso pausado temporalmente</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      <span><strong>reprogramado:</strong> Instalación reagendada</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator className="my-8" />
          
          <div className="text-center text-sm text-gray-500">
            <p>Documentación generada automáticamente - {new Date().toLocaleDateString('es-ES')}</p>
            <p>Sistema de Gestión de Servicios GPS v2.0</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceWorkflowDocumentation;