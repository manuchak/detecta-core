import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Loader2, Save, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { Form } from '@/components/ui/form';
import { useServiciosMonitoreoCompleto } from '@/hooks/useServiciosMonitoreoCompleto';
import { usePersistedForm } from '@/hooks';
import { toast } from 'sonner';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

// Importar componentes de pasos
import { PasoInformacionBasica } from './pasos/PasoInformacionBasica';
import { PasoDetallesVehiculo } from './pasos/PasoDetallesVehiculo';
import { PasoOperacionRutas } from './pasos/PasoOperacionRutas';
import { PasoGPSActual } from './pasos/PasoGPSActual';
import { PasoPreferenciasGPS } from './pasos/PasoPreferenciasGPS';
import { PasoConfiguracionSensores } from './pasos/PasoConfiguracionSensores';
import { PasoContactosEmergencia } from './pasos/PasoContactosEmergencia';
import { PasoConfiguracionReportes } from './pasos/PasoConfiguracionReportes';

interface FormularioServicioCompletoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PASOS = [
  { id: 'basica', titulo: 'Información Básica', descripcion: 'Datos del cliente y servicio' },
  { id: 'vehiculo', titulo: 'Detalles del Vehículo', descripcion: 'Información vehicular' },
  { id: 'operacion', titulo: 'Operación y Rutas', descripcion: 'Horarios y rutas habituales' },
  { id: 'gps-actual', titulo: 'GPS Actual', descripcion: 'Equipamiento existente' },
  { id: 'preferencias-gps', titulo: 'Preferencias GPS', descripcion: 'Especificaciones deseadas' },
  { id: 'sensores', titulo: 'Configuración de Sensores', descripcion: 'Funcionalidades del equipo' },
  { id: 'contactos', titulo: 'Contactos de Emergencia', descripcion: 'Personas de contacto' },
  { id: 'reportes', titulo: 'Configuración de Reportes', descripcion: 'Frecuencia y comunicación' }
];

export const FormularioServicioCompleto = ({ open, onOpenChange }: FormularioServicioCompletoProps) => {
  // Persisted form state
  const {
    formData: persistedData,
    updateFormData: updatePersistedData,
    hasDraft,
    lastSaved,
    isRestoring,
    restoreDraft,
    clearDraft,
    saveDraft,
    getTimeSinceSave,
  } = usePersistedForm<{
    pasoActual: number;
    formValues: Partial<CreateServicioMonitoreoCompleto>;
  }>({
    key: 'gps_service_creation_form',
    initialData: {
      pasoActual: 0,
      formValues: {},
    },
    autoSaveInterval: 30000,
    onRestore: (data) => {
      console.log('🔄 Restaurando borrador de servicio GPS:', data);
      toast.info('Borrador restaurado', {
        description: 'Se ha recuperado tu progreso anterior'
      });
    },
  });

  const [pasoActual, setPasoActual] = useState(persistedData.pasoActual);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const { createServicioCompleto } = useServiciosMonitoreoCompleto();

  const form = useForm<CreateServicioMonitoreoCompleto>({
    defaultValues: persistedData.formValues.nombre_cliente ? persistedData.formValues : {
      nombre_cliente: '',
      empresa: '',
      telefono_contacto: '',
      email_contacto: '',
      direccion_cliente: '',
      tipo_servicio: 'vehicular',
      prioridad: 'media',
      plan_rastreo_satelital: 'camino_seguro',
      cantidad_vehiculos: 1,
      modelo_vehiculo: '',
      tipo_vehiculo: '',
      zonas_riesgo_identificadas: false,
      cuenta_gps_instalado: false,
      cuenta_boton_panico: false,
      requiere_paro_motor: false,
      configuracion_sensores: {
        sensor_puerta: false,
        sensor_ignicion: false,
        boton_panico: false,
        corte_ignicion_paro_motor: false,
        deteccion_jamming: false,
        sensor_presencia_vibracion: false,
        geocercas_dinamicas: false,
        lectura_obdii_can_bus: false,
        sensor_combustible: false,
        sensor_temperatura: false,
        sensor_carga_peso: false,
        bateria_interna_respaldo: false,
        alerta_desconexion_electrica: false,
        monitoreo_voltaje: false,
        bluetooth_wifi: false,
        compatibilidad_sensores_rs232: false
      },
      contactos_emergencia: [],
      configuracion_reportes: {
        frecuencia_reportes: 'diario',
        medio_contacto_preferido: 'correo'
      }
    }
  });

  // Check for draft on mount
  useEffect(() => {
    if (hasDraft && !isRestoring && open) {
      setShowRestoreDialog(true);
    }
  }, [hasDraft, isRestoring, open]);

  // Persist state changes
  useEffect(() => {
    const subscription = form.watch((formValues) => {
      updatePersistedData({
        pasoActual,
        formValues: formValues as Partial<CreateServicioMonitoreoCompleto>,
      });
    });
    return () => subscription.unsubscribe();
  }, [form, pasoActual, updatePersistedData]);

  const onSubmit = async (data: CreateServicioMonitoreoCompleto) => {
    await createServicioCompleto.mutateAsync(data);
    clearDraft();
    onOpenChange(false);
    form.reset();
    setPasoActual(0);
  };

  const handleRestoreDraft = () => {
    restoreDraft();
    setShowRestoreDialog(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestoreDialog(false);
  };

  const siguientePaso = () => {
    if (pasoActual < PASOS.length - 1) {
      setPasoActual(pasoActual + 1);
    }
  };

  const pasoAnterior = () => {
    if (pasoActual > 0) {
      setPasoActual(pasoActual - 1);
    }
  };

  const renderPasoActual = () => {
    const paso = PASOS[pasoActual];
    
    switch (paso.id) {
      case 'basica':
        return <PasoInformacionBasica form={form} />;
      case 'vehiculo':
        return <PasoDetallesVehiculo form={form} />;
      case 'operacion':
        return <PasoOperacionRutas form={form} />;
      case 'gps-actual':
        return <PasoGPSActual form={form} />;
      case 'preferencias-gps':
        return <PasoPreferenciasGPS form={form} />;
      case 'sensores':
        return <PasoConfiguracionSensores form={form} />;
      case 'contactos':
        return <PasoContactosEmergencia form={form} />;
      case 'reportes':
        return <PasoConfiguracionReportes form={form} />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Restore Draft Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Continuar con el servicio GPS anterior?</AlertDialogTitle>
            <AlertDialogDescription>
              Se detectó un borrador guardado {getTimeSinceSave()}. ¿Deseas continuar desde donde lo dejaste o empezar uno nuevo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft}>
              Empezar nuevo
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleRestoreDraft}>
              Continuar borrador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-xl font-bold">
              Nuevo Servicio de Monitoreo GPS
            </DialogTitle>
            <div className="flex items-center gap-2">
              {hasDraft && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                    <Save className="h-3 w-3 mr-1" />
                    Borrador guardado
                  </Badge>
                  {lastSaved && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {getTimeSinceSave()}
                    </span>
                  )}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={saveDraft}
                className="h-8"
              >
                <Save className="h-3 w-3 mr-1" />
                Guardar
              </Button>
            </div>
          </DialogHeader>

        {/* Indicador de progreso */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Paso {pasoActual + 1} de {PASOS.length}
            </span>
            <Badge variant="outline">
              {Math.round(((pasoActual + 1) / PASOS.length) * 100)}% Completado
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((pasoActual + 1) / PASOS.length) * 100}%` }}
            />
          </div>

          <div className="mt-3">
            <h3 className="font-medium text-lg">{PASOS[pasoActual].titulo}</h3>
            <p className="text-sm text-gray-600">{PASOS[pasoActual].descripcion}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">
                  {PASOS[pasoActual].titulo}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderPasoActual()}
              </CardContent>
            </Card>

            {/* Navegación */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={pasoAnterior}
                disabled={pasoActual === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              <div className="flex gap-2">
                {PASOS.map((_, index) => (
                  <div
                    key={index}
                    className={`w-3 h-3 rounded-full ${
                      index <= pasoActual ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>

              {pasoActual < PASOS.length - 1 ? (
                <Button type="button" onClick={siguientePaso}>
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createServicioCompleto.isPending}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {createServicioCompleto.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  <Save className="h-4 w-4 mr-2" />
                  Crear Servicio
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    </>
  );
};
