
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Shield, User, Building, Phone, Mail, MapPin } from 'lucide-react';
import { useServiciosMonitoreo } from '@/hooks/useServiciosMonitoreo';
import type { CreateServicioData, TipoServicio, Prioridad } from '@/types/serviciosMonitoreo';

interface ServicioFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ServicioForm = ({ open, onOpenChange }: ServicioFormProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { createServicio } = useServiciosMonitoreo();

  const form = useForm<CreateServicioData>({
    defaultValues: {
      nombre_cliente: '',
      empresa: '',
      telefono_contacto: '',
      email_contacto: '',
      direccion_cliente: '',
      tipo_servicio: 'vehicular',
      prioridad: 'media',
      observaciones: ''
    }
  });

  const onSubmit = async (data: CreateServicioData) => {
    await createServicio.mutateAsync(data);
    onOpenChange(false);
    form.reset();
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Información del Cliente</h3>
            </div>

            <FormField
              control={form.control}
              name="nombre_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Cliente *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre completo del cliente" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empresa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nombre de la empresa (opcional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telefono_contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono de Contacto *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+52 55 1234 5678" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email_contacto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Contacto *</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="cliente@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="direccion_cliente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección del Cliente *</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Dirección completa del cliente"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Tipo de Servicio</h3>
            </div>

            <FormField
              control={form.control}
              name="tipo_servicio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Servicio *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione el tipo de servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">
                        <div className="flex flex-col">
                          <span className="font-medium">Protección Personal</span>
                          <span className="text-sm text-gray-500">
                            Monitoreo y protección de personas
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="vehicular">
                        <div className="flex flex-col">
                          <span className="font-medium">Monitoreo Vehicular</span>
                          <span className="text-sm text-gray-500">
                            Rastreo y seguridad de vehículos
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="flotilla">
                        <div className="flex flex-col">
                          <span className="font-medium">Gestión de Flotilla</span>
                          <span className="text-sm text-gray-500">
                            Monitoreo de múltiples vehículos
                          </span>
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
              name="prioridad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prioridad del Servicio *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione la prioridad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baja">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Baja - Servicio estándar</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="media">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Media - Atención prioritaria</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="alta">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <span>Alta - Respuesta rápida</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="critica">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Crítica - Respuesta inmediata</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Building className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold">Observaciones</h3>
            </div>

            <FormField
              control={form.control}
              name="observaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones Adicionales</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Cualquier información adicional relevante para el servicio..."
                      rows={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Próximos pasos:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Evaluación de riesgo de seguridad</li>
                <li>• Validación de documentación</li>
                <li>• Aprobación del coordinador de operaciones</li>
                <li>• Programación de instalación GPS (si aplica)</li>
                <li>• Configuración del sistema de monitoreo</li>
                <li>• Activación del servicio</li>
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Nuevo Servicio de Monitoreo
          </DialogTitle>
          <DialogDescription>
            Complete la información para iniciar el proceso de evaluación y aprobación
          </DialogDescription>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center justify-between mb-6">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`h-1 w-12 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {renderStep()}

            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
              >
                Anterior
              </Button>
              
              {currentStep < 3 ? (
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={createServicio.isPending}
                  className="min-w-[120px]"
                >
                  {createServicio.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    'Crear Servicio'
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
