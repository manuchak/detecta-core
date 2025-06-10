
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MessageSquare, FileText } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoConfiguracionReportesProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoConfiguracionReportes = ({ form }: PasoConfiguracionReportesProps) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Frecuencia de Reportes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="configuracion_reportes.frecuencia_reportes"
            rules={{ required: "La frecuencia de reportes es requerida" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Frecuencia de Reportes *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar frecuencia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="cada_30_minutos">Cada 30 minutos</SelectItem>
                    <SelectItem value="diario">Diario</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensual">Mensual</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-600">
                  Define con qué frecuencia recibirá reportes automáticos del sistema
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="configuracion_reportes.limitantes_protocolos"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limitantes y Protocolos Especiales</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe cualquier limitante operativa o protocolo especial que deba considerarse para los reportes (ej: no contactar en horario nocturno, solo reportes críticos los fines de semana, etc.)"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Medio de Contacto Preferido
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="configuracion_reportes.medio_contacto_preferido"
            rules={{ required: "El medio de contacto es requerido" }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medio de Contacto Preferido *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar medio de contacto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="llamada">
                      <div className="flex flex-col">
                        <span className="font-medium">Llamada Telefónica</span>
                        <span className="text-sm text-gray-500">Contacto directo e inmediato</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="whatsapp">
                      <div className="flex flex-col">
                        <span className="font-medium">WhatsApp</span>
                        <span className="text-sm text-gray-500">Mensajes y reportes por WhatsApp</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="sms">
                      <div className="flex flex-col">
                        <span className="font-medium">SMS</span>
                        <span className="text-sm text-gray-500">Mensajes de texto</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="correo">
                      <div className="flex flex-col">
                        <span className="font-medium">Correo Electrónico</span>
                        <span className="text-sm text-gray-500">Reportes detallados por email</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Observaciones Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="configuracion_reportes.observaciones_adicionales"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones Adicionales del Servicio</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Cualquier información adicional relevante para el servicio de monitoreo, requerimientos especiales, condiciones particulares, etc."
                    rows={4}
                  />
                </FormControl>
                <p className="text-xs text-gray-600">
                  Esta información será revisada por nuestro equipo técnico y comercial
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <div className="bg-green-50 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 mb-2">¡Último Paso!</h4>
        <p className="text-sm text-green-800">
          Ha completado toda la información necesaria para su servicio de monitoreo GPS. 
          Nuestro equipo revisará su solicitud y se pondrá en contacto con usted dentro de las 
          próximas 24 horas para coordinar la evaluación técnica y cotización del servicio.
        </p>
      </div>
    </div>
  );
};
