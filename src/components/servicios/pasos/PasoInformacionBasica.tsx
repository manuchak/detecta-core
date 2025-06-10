
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoInformacionBasicaProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoInformacionBasica = ({ form }: PasoInformacionBasicaProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="nombre_cliente"
          rules={{ required: "El nombre del cliente es requerido" }}
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
                <Input {...field} placeholder="Nombre de la empresa" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="telefono_contacto"
          rules={{ required: "El teléfono es requerido" }}
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
          rules={{ 
            required: "El email es requerido",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Email inválido"
            }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email de Contacto *</FormLabel>
              <FormControl>
                <Input {...field} type="email" placeholder="cliente@empresa.com" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="direccion_cliente"
        rules={{ required: "La dirección es requerida" }}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Dirección del Cliente *</FormLabel>
            <FormControl>
              <Textarea {...field} placeholder="Dirección completa del cliente" rows={3} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="tipo_servicio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Servicio *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="personal">Protección Personal</SelectItem>
                  <SelectItem value="vehicular">Monitoreo Vehicular</SelectItem>
                  <SelectItem value="flotilla">Gestión de Flotilla</SelectItem>
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
                    <SelectValue placeholder="Seleccionar prioridad" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="baja">Baja - Servicio estándar</SelectItem>
                  <SelectItem value="media">Media - Atención prioritaria</SelectItem>
                  <SelectItem value="alta">Alta - Respuesta rápida</SelectItem>
                  <SelectItem value="critica">Crítica - Respuesta inmediata</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};
