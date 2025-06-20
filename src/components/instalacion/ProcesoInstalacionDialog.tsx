
import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, FileText, Shield, ClipboardCheck, Camera, AlertTriangle } from 'lucide-react';
import { useInstalacionDocumentacion } from '@/hooks/useInstalacionDocumentacion';
import { EnhancedPasoInstalacion } from './EnhancedPasoInstalacion';
import { SimpleValidation } from './SimpleValidation';
import { ReporteFinalDialog } from './ReporteFinalDialog';

interface ProcesoInstalacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacionId: string;
  onCerrar: () => void;
  onInstalacionCompleta?: () => void;
}

const PASOS_INSTALACION = [
  {
    id: 'inspeccion_inicial',
    titulo: 'Inspección inicial del vehículo',
    descripcion: 'Revisar el estado del vehículo y determinar la mejor ubicación para el dispositivo GPS',
    requiereFoto: true,
    requiereUbicacion: true,
    orden: 1
  },
  {
    id: 'dispositivo_gps',
    titulo: 'Verificación del dispositivo GPS',
    descripcion: 'Confirmar que el dispositivo GPS está en buen estado y funcionando',
    requiereFoto: true,
    requiereUbicacion: false,
    orden: 2
  },
  {
    id: 'ubicacion_instalacion',
    titulo: 'Selección de ubicación de instalación',
    descripcion: 'Determinar y documentar la ubicación exacta donde se instalará el dispositivo',
    requiereFoto: true,
    requiereUbicacion: false,
    orden: 3
  },
  {
    id: 'proceso_instalacion',
    titulo: 'Proceso de instalación',
    descripcion: 'Instalación física del dispositivo GPS en el vehículo',
    requiereFoto: true,
    requiereUbicacion: false,
    orden: 4
  },
  {
    id: 'cableado_conexiones',
    titulo: 'Cableado y conexiones',
    descripcion: 'Realizar todas las conexiones eléctricas necesarias',
    requiereFoto: true,
    requiereUbicacion: false,
    orden: 5
  },
  {
    id: 'dispositivo_funcionando',
    titulo: 'Verificación de funcionamiento',
    descripcion: 'Confirmar que el dispositivo está funcionando correctamente',
    requiereFoto: true,
    requiereUbicacion: false,
    orden: 6
  },
  {
    id: 'validacion_final',
    titulo: 'Validación final',
    descripcion: 'Pruebas finales y limpieza del área de trabajo',
    requiereFoto: true,
    requiereUbicacion: false,
    orden: 7
  }
];

const VALIDACIONES_TECNICAS = [
  {
    id: 'senal_gps_manual',
    titulo: 'Validación manual de señal GPS',
    descripcion: 'Confirmar manualmente que el dispositivo recibe señal GPS adecuada',
    tipo: 'senal_gps_manual'
  },
  {
    id: 'conectividad_manual',
    titulo: 'Validación manual de conectividad',
    descripcion: 'Verificar manualmente la conectividad del dispositivo con la plataforma',
    tipo: 'conectividad_manual'
  },
  {
    id: 'funcionamiento_dispositivo',
    titulo: 'Funcionamiento del dispositivo',
    descripcion: 'Validar que el dispositivo responde correctamente a los comandos',
    tipo: 'funcionamiento_dispositivo'
  },
  {
    id: 'calidad_instalacion',
    titulo: 'Calidad de la instalación',
    descripcion: 'Evaluar la calidad general de la instalación realizada',
    tipo: 'calidad_instalacion'
  }
];

export const ProcesoInstalacionDialog: React.FC<ProcesoInstalacionDialogProps> = ({
  open,
  onOpenChange,
  programacionId,
  onCerrar,
  onInstalacionCompleta
}) => {
  const [tabActiva, setTabActiva] = useState('documentacion');
  const [showReporteFinal, setShowReporteFinal] = useState(false);
  
  const {
    documentacion,
    validaciones,
    reporteFinal,
    isLoading,
    subirFoto,
    guardarDocumentacion,
    guardarValidacion,
    guardarReporteFinal
  } = useInstalacionDocumentacion(programacionId);

  const handleCompletarPaso = async (pasoId: string, data: any) => {
    try {
      // Handle multiple photos
      let fotosUrls: string[] = [];
      if (data.fotos && data.fotos.length > 0) {
        for (const foto of data.fotos) {
          const urlFoto = await subirFoto.mutateAsync({
            file: foto,
            pasoInstalacion: pasoId
          });
          fotosUrls.push(urlFoto);
        }
      }

      // Guardar documentación con la primera foto como principal
      await guardarDocumentacion.mutateAsync({
        paso_instalacion: pasoId,
        orden: PASOS_INSTALACION.find(p => p.id === pasoId)?.orden || 1,
        foto_url: fotosUrls[0] || undefined,
        descripcion: data.descripcion,
        completado: true,
        coordenadas_latitud: data.coordenadas?.lat,
        coordenadas_longitud: data.coordenadas?.lng
      });
    } catch (error) {
      console.error('Error al completar paso:', error);
    }
  };

  const handleGuardarValidacion = async (validacionId: string, data: any) => {
    const validacion = VALIDACIONES_TECNICAS.find(v => v.id === validacionId);
    if (!validacion) return;

    try {
      await guardarValidacion.mutateAsync({
        tipo_validacion: validacion.tipo,
        validado: data.validado,
        comentarios: data.comentarios,
        puntuacion: data.puntuacion
      });
    } catch (error) {
      console.error('Error al guardar validación:', error);
    }
  };

  const calcularProgreso = () => {
    const pasosCompletados = documentacion?.filter(doc => doc.completado).length || 0;
    const validacionesCompletadas = validaciones?.filter(val => val.validado !== null).length || 0;
    const totalItems = PASOS_INSTALACION.length + VALIDACIONES_TECNICAS.length;
    const completados = pasosCompletados + validacionesCompletadas;
    return Math.round((completados / totalItems) * 100);
  };

  const puedeFinalizarInstalacion = () => {
    const todosLosPasosCompletados = PASOS_INSTALACION.every(paso => 
      documentacion?.some(doc => doc.paso_instalacion === paso.id && doc.completado)
    );
    const todasLasValidacionesRealizadas = VALIDACIONES_TECNICAS.every(validacion =>
      validaciones?.some(val => val.tipo_validacion === validacion.tipo && val.validado !== null)
    );
    return todosLosPasosCompletados && todasLasValidacionesRealizadas;
  };

  const instalacionCompleta = () => {
    return puedeFinalizarInstalacion() && reporteFinal;
  };

  const handleGuardarReporteFinal = async (data: any) => {
    try {
      await guardarReporteFinal.mutateAsync(data);
      // Notificar al componente padre que la instalación está completa
      if (onInstalacionCompleta) {
        onInstalacionCompleta();
      }
    } catch (error) {
      console.error('Error al guardar reporte final:', error);
    }
  };

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-5xl overflow-y-auto">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Cargando proceso de instalación...</p>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-6xl overflow-y-auto">
          <SheetHeader className="mb-6 border-b pb-4">
            <SheetTitle className="flex items-center gap-3 text-xl">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              Proceso de Instalación GPS
            </SheetTitle>
            <SheetDescription className="text-base">
              Documenta cada paso de la instalación y realiza las validaciones técnicas necesarias.
            </SheetDescription>
            
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-base font-semibold">Progreso general</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-blue-600">{calcularProgreso()}%</span>
                  <Badge variant={instalacionCompleta() ? "default" : calcularProgreso() === 100 ? "secondary" : "outline"}>
                    {instalacionCompleta() ? "Instalación Completa" : calcularProgreso() === 100 ? "Documentación Completa" : "En progreso"}
                  </Badge>
                </div>
              </div>
              <Progress value={calcularProgreso()} className="w-full h-3" />
              
              {calcularProgreso() === 100 && !reporteFinal && (
                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Complete el reporte final para finalizar la instalación
                    </span>
                  </div>
                </div>
              )}
            </div>
          </SheetHeader>

          <Tabs value={tabActiva} onValueChange={setTabActiva} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-12">
              <TabsTrigger value="documentacion" className="flex items-center gap-2 text-base py-3">
                <Camera className="h-5 w-5" />
                Documentación
                <Badge variant={documentacion?.filter(doc => doc.completado).length === PASOS_INSTALACION.length ? "default" : "secondary"} className="ml-1">
                  {documentacion?.filter(doc => doc.completado).length || 0}/{PASOS_INSTALACION.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="validaciones" className="flex items-center gap-2 text-base py-3">
                <Shield className="h-5 w-5" />
                Validaciones
                <Badge variant={validaciones?.filter(val => val.validado !== null).length === VALIDACIONES_TECNICAS.length ? "default" : "secondary"} className="ml-1">
                  {validaciones?.filter(val => val.validado !== null).length || 0}/{VALIDACIONES_TECNICAS.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="reporte" className="flex items-center gap-2 text-base py-3" disabled={!puedeFinalizarInstalacion()}>
                <ClipboardCheck className="h-5 w-5" />
                Reporte Final
                {reporteFinal && <CheckCircle className="h-4 w-4 text-green-600" />}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documentacion" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Documentación de Instalación</h3>
                <p className="text-sm text-blue-700">
                  Complete todos los pasos de documentación tomando fotos y agregando descripciones detalladas.
                </p>
              </div>
              
              <div className="space-y-6">
                {PASOS_INSTALACION.map((paso) => {
                  const docPaso = documentacion?.find(doc => doc.paso_instalacion === paso.id);
                  return (
                    <EnhancedPasoInstalacion
                      key={paso.id}
                      paso={{
                        ...paso,
                        completado: docPaso?.completado || false
                      }}
                      onCompletarPaso={handleCompletarPaso}
                      isLoading={guardarDocumentacion.isPending || subirFoto.isPending}
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="validaciones" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Validaciones Técnicas</h3>
                <p className="text-sm text-blue-700">
                  Evalúa el funcionamiento de cada componente del sistema GPS instalado.
                </p>
              </div>
              
              <div className="space-y-6">
                {VALIDACIONES_TECNICAS.map((validacion) => {
                  const valExistente = validaciones?.find(val => val.tipo_validacion === validacion.tipo);
                  return (
                    <SimpleValidation
                      key={validacion.id}
                      validacion={{
                        ...validacion,
                        validado: valExistente?.validado,
                        comentarios: valExistente?.comentarios,
                        puntuacion: valExistente?.puntuacion
                      }}
                      onGuardarValidacion={handleGuardarValidacion}
                      isLoading={guardarValidacion.isPending}
                    />
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="reporte" className="space-y-4">
              <div className="text-center py-12">
                <div className="bg-blue-100 rounded-full p-4 w-20 h-20 mx-auto mb-6">
                  <ClipboardCheck className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Reporte Final de Instalación</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Complete el reporte final para cerrar oficialmente la instalación.
                </p>
                
                {reporteFinal ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
                    <div className="flex items-center gap-3 text-green-700 justify-center mb-3">
                      <CheckCircle className="h-6 w-6" />
                      <span className="text-lg font-semibold">Reporte final completado</span>
                    </div>
                    <p className="text-sm text-green-600">
                      La instalación está lista para ser marcada como completada.
                    </p>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowReporteFinal(true)}
                    size="lg"
                    className="px-8 py-3 text-base"
                  >
                    📋 Generar Reporte Final
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
            <Button variant="outline" onClick={onCerrar} size="lg">
              Cerrar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ReporteFinalDialog
        open={showReporteFinal}
        onOpenChange={setShowReporteFinal}
        onGuardarReporte={handleGuardarReporteFinal}
        isLoading={guardarReporteFinal.isPending}
      />
    </>
  );
};
