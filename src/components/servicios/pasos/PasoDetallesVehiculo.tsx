
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoDetallesVehiculoProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoDetallesVehiculo = ({ form }: PasoDetallesVehiculoProps) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="cantidad_vehiculos"
          rules={{ 
            required: "La cantidad es requerida",
            min: { value: 1, message: "Mínimo 1 vehículo" }
          }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cantidad de Vehículos *</FormLabel>
              <FormControl>
                <Input 
                  {...field} 
                  type="number" 
                  min="1"
                  onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_vehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Vehículo</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="automovil">Automóvil</SelectItem>
                  <SelectItem value="camioneta">Camioneta</SelectItem>
                  <SelectItem value="camion">Camión</SelectItem>
                  <SelectItem value="trailer">Tráiler</SelectItem>
                  <SelectItem value="motocicleta">Motocicleta</SelectItem>
                  <SelectItem value="autobus">Autobús</SelectItem>
                  <SelectItem value="maquinaria">Maquinaria Pesada</SelectItem>
                  <SelectItem value="otro">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="modelo_vehiculo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Modelo del Vehículo</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Ej: Toyota Hilux 2023" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Información sobre tipos de vehículo</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Automóvil/Camioneta:</strong> Vehículos particulares y comerciales ligeros</li>
          <li>• <strong>Camión/Tráiler:</strong> Vehículos de carga pesada y comercial</li>
          <li>• <strong>Maquinaria:</strong> Equipo de construcción, agrícola e industrial</li>
          <li>• <strong>Motocicleta:</strong> Vehículos de dos ruedas</li>
        </ul>
      </div>
    </div>
  );
};
