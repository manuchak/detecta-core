
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building, Phone, Mail, MapPin, Shield } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoInformacionBasicaProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoInformacionBasica = ({ form }: PasoInformacionBasicaProps) => {
  return (
    <div className="space-y-8">
      {/* Datos del Cliente */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-blue-600" />
            Información del Cliente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Todos los campos marcados con (*) son obligatorios
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nombre_cliente"
              rules={{ 
                required: "El nombre del cliente es obligatorio",
                minLength: {
                  value: 2,
                  message: "El nombre debe tener al menos 2 caracteres"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Nombre del Cliente *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        placeholder="Nombre completo del cliente" 
                        className="pl-10 h-11"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empresa"
              rules={{ 
                required: "La empresa es obligatoria para servicios corporativos" 
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Empresa *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        placeholder="Nombre de la empresa" 
                        className="pl-10 h-11"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="telefono_contacto"
              rules={{ 
                required: "El teléfono es obligatorio",
                pattern: {
                  value: /^[\+]?[\d\s\-\(\)]{10,}$/,
                  message: "Ingrese un teléfono válido (mínimo 10 dígitos)"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Teléfono de Contacto *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        placeholder="+52 55 1234 5678" 
                        className="pl-10 h-11"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email_contacto"
              rules={{ 
                required: "El email es obligatorio",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Ingrese un email válido"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Email de Contacto *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="cliente@empresa.com" 
                        className="pl-10 h-11"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="direccion_cliente"
            rules={{ 
              required: "La dirección es obligatoria",
              minLength: {
                value: 10,
                message: "La dirección debe ser más específica (mínimo 10 caracteres)"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Dirección del Cliente *
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea 
                      {...field} 
                      placeholder="Dirección completa del cliente (calle, número, colonia, ciudad, estado, CP)" 
                      rows={3} 
                      className="pl-10 resize-none"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Configuración del Servicio */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5 text-green-600" />
            Configuración del Servicio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="tipo_servicio"
              rules={{ required: "Debe seleccionar un tipo de servicio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Tipo de Servicio *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar tipo de servicio" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">Protección Personal</span>
                          <span className="text-xs text-gray-500">
                            Monitoreo y protección de personas
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="vehicular">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">Monitoreo Vehicular</span>
                          <span className="text-xs text-gray-500">
                            Rastreo y seguridad de vehículos individuales
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="flotilla">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">Gestión de Flotilla</span>
                          <span className="text-xs text-gray-500">
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
              rules={{ required: "Debe seleccionar una prioridad de servicio" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    Prioridad del Servicio *
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar prioridad" />
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
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Información Importante</h4>
            <p className="text-sm text-blue-800">
              Esta información es crítica para el proceso de evaluación de riesgo y aprobación del servicio. 
              Asegúrese de proporcionar datos precisos y completos para evitar retrasos en la activación.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
