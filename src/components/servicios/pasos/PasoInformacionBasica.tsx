import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Building, Phone, Mail, MapPin, Shield, AlertTriangle, Satellite } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoInformacionBasicaProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoInformacionBasica = ({ form }: PasoInformacionBasicaProps) => {
  return (
    <div className="space-y-8">
      {/* Alert sobre la importancia de completar la información */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-amber-900 mb-1">Información Crítica Requerida</h4>
            <p className="text-sm text-amber-800">
              <strong>Es fundamental completar todos los campos obligatorios</strong> para evitar retrasos en el proceso de evaluación. 
              La información faltante resultará en llamadas adicionales al cliente y demoras en la activación del servicio.
            </p>
          </div>
        </div>
      </div>

      {/* Datos del Cliente */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-blue-600" />
            Información del Cliente
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            <strong>Campos críticos para evaluación de riesgo y contacto de emergencia</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="nombre_cliente"
              rules={{ 
                required: "CRÍTICO: El nombre del cliente es obligatorio para identificación legal",
                minLength: {
                  value: 3,
                  message: "El nombre debe tener al menos 3 caracteres completos"
                },
                pattern: {
                  value: /^[a-zA-ZÀ-ÿ\u00f1\u00d1\s]+$/,
                  message: "Solo se permiten letras y espacios en el nombre"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    <span className="text-red-600">*</span> Nombre Completo del Cliente
                    <span className="text-xs text-red-600 block">OBLIGATORIO - Para verificación de identidad</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        placeholder="Nombre completo (nombre y apellidos)" 
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
                required: "CRÍTICO: Empresa obligatoria para servicios corporativos y evaluación financiera",
                minLength: {
                  value: 2,
                  message: "Nombre de empresa debe tener al menos 2 caracteres"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    <span className="text-red-600">*</span> Empresa o Razón Social
                    <span className="text-xs text-red-600 block">OBLIGATORIO - Para evaluación crediticia</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        placeholder="Nombre completo de la empresa" 
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
                required: "CRÍTICO: Teléfono principal obligatorio para contacto de emergencia",
                pattern: {
                  value: /^[\+]?[0-9\s\-\(\)]{10,15}$/,
                  message: "Formato válido: +52 55 1234 5678 (10-15 dígitos)"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    <span className="text-red-600">*</span> Teléfono Principal
                    <span className="text-xs text-red-600 block">OBLIGATORIO - Contacto de emergencia 24/7</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        placeholder="+52 55 1234 5678 (incluir código de área)" 
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
                required: "CRÍTICO: Email principal obligatorio para reportes y notificaciones",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email inválido - debe tener formato usuario@dominio.com"
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    <span className="text-red-600">*</span> Email Principal
                    <span className="text-xs text-red-600 block">OBLIGATORIO - Para reportes automáticos</span>
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input 
                        {...field} 
                        type="email" 
                        placeholder="email@empresa.com (verificar ortografía)" 
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
              required: "CRÍTICO: Dirección completa obligatoria para evaluación de zona de riesgo",
              minLength: {
                value: 20,
                message: "Dirección debe ser completa: calle, número, colonia, ciudad, estado, CP (mínimo 20 caracteres)"
              },
              validate: (value) => {
                if (!value.includes(',') || value.split(',').length < 3) {
                  return "Incluir: calle y número, colonia, ciudad, estado, código postal separados por comas";
                }
                return true;
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  <span className="text-red-600">*</span> Dirección Completa del Cliente
                  <span className="text-xs text-red-600 block">OBLIGATORIO - Para análisis de zona de riesgo y ruteo</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea 
                      {...field} 
                      placeholder="Ejemplo: Av. Reforma 123, Col. Centro, Ciudad de México, CDMX, CP 06000" 
                      rows={3} 
                      className="pl-10 resize-none"
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-xs text-amber-600 mt-1">
                  ⚠️ Dirección imprecisa causará retrasos en instalación y evaluación de riesgo
                </p>
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
          <p className="text-sm text-muted-foreground">
            <strong>Definición del tipo de protección y nivel de respuesta requerido</strong>
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="tipo_servicio"
              rules={{ 
                required: "CRÍTICO: Tipo de servicio obligatorio para asignación de recursos y equipamiento" 
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    <span className="text-red-600">*</span> Tipo de Servicio
                    <span className="text-xs text-red-600 block">OBLIGATORIO - Define equipamiento y protocolos</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar tipo de servicio (requerido)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="personal">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">Protección Personal</span>
                          <span className="text-xs text-gray-500">
                            Monitoreo de personas, botón de pánico, seguimiento personal
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="vehicular">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">Monitoreo Vehicular</span>
                          <span className="text-xs text-gray-500">
                            GPS vehicular, geocercas, alertas de velocidad, corte de motor
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="flotilla">
                        <div className="flex flex-col items-start py-1">
                          <span className="font-medium">Gestión de Flotilla</span>
                          <span className="text-xs text-gray-500">
                            Múltiples vehículos, reportes consolidados, gestión operativa
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
              rules={{ 
                required: "CRÍTICO: Prioridad obligatoria para definir SLA y tiempo de respuesta" 
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold text-gray-700">
                    <span className="text-red-600">*</span> Prioridad del Servicio
                    <span className="text-xs text-red-600 block">OBLIGATORIO - Define tiempo de respuesta en emergencias</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Seleccionar prioridad (requerido)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="baja">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <div className="flex flex-col">
                            <span>Baja - Respuesta en 2-4 horas</span>
                            <span className="text-xs text-gray-500">Seguimiento rutinario, reportes diarios</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="media">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="flex flex-col">
                            <span>Media - Respuesta en 30-60 min</span>
                            <span className="text-xs text-gray-500">Monitoreo activo, alertas inmediatas</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="alta">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                          <div className="flex flex-col">
                            <span>Alta - Respuesta en 10-15 min</span>
                            <span className="text-xs text-gray-500">Monitoreo prioritario, contacto autoridades</span>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="critica">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="flex flex-col">
                            <span>Crítica - Respuesta inmediata (2-5 min)</span>
                            <span className="text-xs text-gray-500">Escolta virtual, respuesta coordinada</span>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Nuevo campo: Plan de Rastreo Satelital */}
          <FormField
            control={form.control}
            name="plan_rastreo_satelital"
            rules={{ 
              required: "CRÍTICO: Plan de rastreo satelital obligatorio para definir alcance del servicio" 
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  <span className="text-red-600">*</span> Tipo de Plan de Rastreo Satelital
                  <span className="text-xs text-red-600 block">OBLIGATORIO - Define el alcance y características del servicio</span>
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <div className="relative">
                      <Satellite className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                      <SelectTrigger className="h-11 pl-10">
                        <SelectValue placeholder="Seleccionar plan de rastreo (requerido)" />
                      </SelectTrigger>
                    </div>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="camino_seguro">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">Camino Seguro</span>
                        <span className="text-xs text-gray-500">
                          Ideal para usuarios individuales y familias
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="flota_segura">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">Flota Segura</span>
                        <span className="text-xs text-gray-500">
                          Para PYMES con flotas pequeñas
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cadena_segura">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">Cadena Segura</span>
                        <span className="text-xs text-gray-500">
                          Para grandes empresas y cadenas de suministro complejas
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="a_tu_medida">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">A tu Medida</span>
                        <span className="text-xs text-gray-500">
                          Un servicio a la medida de tus necesidades
                        </span>
                      </div>
                    </SelectItem>
                    <SelectItem value="freightwatch">
                      <div className="flex flex-col items-start py-1">
                        <span className="font-medium">Freightwatch</span>
                        <span className="text-xs text-gray-500">
                          Custodias físicas especializadas
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
            name="cantidad_vehiculos"
            rules={{ 
              required: "CRÍTICO: Número de vehículos obligatorio para cálculo de costos y equipamiento",
              min: {
                value: 1,
                message: "Debe ser al menos 1 vehículo"
              },
              max: {
                value: 1000,
                message: "Para flotillas de más de 1000 vehículos contactar gerencia"
              }
            }}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  <span className="text-red-600">*</span> Cantidad de Vehículos a Monitorear
                  <span className="text-xs text-red-600 block">OBLIGATORIO - Para cálculo de equipamiento y costos</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number"
                    min="1"
                    max="1000"
                    placeholder="Número exacto de vehículos"
                    className="h-11"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Recordatorio Final */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-red-900 mb-1">Verificación Obligatoria</h4>
            <ul className="text-sm text-red-800 space-y-1">
              <li>• <strong>Nombre y empresa:</strong> Verificar ortografía exacta para contratos</li>
              <li>• <strong>Teléfono:</strong> Confirmar que sea el número principal disponible 24/7</li>
              <li>• <strong>Email:</strong> Validar que reciba correos (revisar spam/junk)</li>
              <li>• <strong>Dirección:</strong> Debe ser específica para instalación y evaluación de zona</li>
              <li>• <strong>Tipo, prioridad y plan:</strong> Determinan equipamiento y protocolos de respuesta</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
