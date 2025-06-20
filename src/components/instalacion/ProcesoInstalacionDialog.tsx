
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
import { CheckCircle, FileText, Shield, ClipboardCheck } from 'lucide-react';
import { useInstalacionDocumentacion } from '@/hooks/useInstalacionDocumentacion';
import { PasoInstalacion } from './PasoInstalacion';
import { ValidacionTecnica } from './ValidacionTecnica';
import { ReporteFinalDialog } from './ReporteFinalDialog';

interface ProcesoInstalacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programacionId: string;
  onCerrar: () => void;
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
    descripción: 'Evaluar la calidad general de la instalación realizada',
    tipo: 'calidad_instalacion'
  }
];

export const ProcesoInstalacionDialog: React.FC<ProcesoInstalacionDialogProps> = ({
  open,
  onOpenChange,
  programacionId,
  onCerrar
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
      // Subir foto si existe
      let fotoUrl = undefined;
      if (data.foto) {
        const urlFoto = await subirFoto.mutateAsync({
          file: data.foto,
          pasoInstalacion: pasoId
        });
        fotoUrl = urlFoto;
      }

      // Guardar documentación
      await guardarDocumentacion.mutateAsync({
        paso_instalacion: pasoId,
        orden: PASOS_INSTALACION.find(p => p.id === pasoId)?.orden || 1,
        foto_url: fotoUrl,
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

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
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
        <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Proceso de Instalación GPS
            </SheetTitle>
            <SheetDescription>
              Documenta cada paso de la instalación y realiza las validaciones técnicas necesarias.
            </SheetDescription>
            
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progreso general</span>
                <span className="text-sm text-gray-600">{calcularProgreso()}%</span>
              </div>
              <Progress value={calcularProgreso()} className="w-full" />
            </div>
          </SheetHeader>

          <Tabs value={tabActiva} onValueChange={setTabActiva} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="documentacion" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentación
              </TabsTrigger>
              <TabsTrigger value="validaciones" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Validaciones
              </TabsTrigger>
              <TabsTrigger value="reporte" className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" />
                Reporte Final
              </TabsTrigger>
            </TabsList>

            <TabsContent value="documentacion" className="space-y-4">
              <div className="space-y-4">
                {PASOS_INSTALACION.map((paso) => {
                  const docPaso = documentacion?.find(doc => doc.paso_instalacion === paso.id);
                  return (
                    <PasoInstalacion
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

            <TabsContent value="validaciones" className="space-y-4">
              <div className="space-y-4">
                {VALIDACIONES_TECNICAS.map((validacion) => {
                  const valExistente = validaciones?.find(val => val.tipo_validacion === validacion.tipo);
                  return (
                    <ValidacionTecnica
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
              <div className="text-center py-8">
                <ClipboardCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Reporte Final de Instalación</h3>
                <p className="text-gray-600 mb-6">
                  {puedeFinalizarInstalacion() 
                    ? 'Todos los pasos han sido completados. Genera el reporte final.'
                    : 'Complete todos los pasos de documentación y validaciones para generar el reporte final.'
                  }
                </p>
                
                {reporteFinal ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Reporte final completado</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => setShowReporteFinal(true)}
                    disabled={!puedeFinalizarInstalacion()}
                    size="lg"
                  >
                    Generar Reporte Final
                  </Button>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-6 border-t">
            <Button variant="outline" onClick={onCerrar}>
              Cerrar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ReporteFinalDialog
        open={showReporteFinal}
        onOpenChange={setShowReporteFinal}
        programacionId={programacionId}
        onGuardarReporte={guardarReporteFinal.mutateAsync}
        isLoading={guardarReporteFinal.isPending}
      />
    </>
  );
};
