
import { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Car } from 'lucide-react';
import { useVehicleData } from '@/hooks/useVehicleData';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoDetallesVehiculoProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

interface VehiculoDetalle {
  marca: string;
  modelo: string;
  año: string;
  tipo: string;
}

export const PasoDetallesVehiculo = ({ form }: PasoDetallesVehiculoProps) => {
  const { marcas, loadingMarcas, fetchModelosPorMarca } = useVehicleData();
  const [vehiculos, setVehiculos] = useState<VehiculoDetalle[]>([{ marca: '', modelo: '', año: '', tipo: '' }]);
  const [modelosPorMarca, setModelosPorMarca] = useState<{[key: string]: any[]}>({});

  const cantidadVehiculos = form.watch('cantidad_vehiculos') || 1;

  // Fix infinite loop by removing vehiculos.length from dependencies
  useEffect(() => {
    const nuevaCantidad = cantidadVehiculos;
    if (nuevaCantidad !== vehiculos.length) {
      if (nuevaCantidad > vehiculos.length) {
        // Agregar vehículos
        const nuevosVehiculos = [...vehiculos];
        for (let i = vehiculos.length; i < nuevaCantidad; i++) {
          nuevosVehiculos.push({ marca: '', modelo: '', año: '', tipo: '' });
        }
        setVehiculos(nuevosVehiculos);
      } else {
        // Quitar vehículos
        setVehiculos(vehiculos.slice(0, nuevaCantidad));
      }
    }
  }, [cantidadVehiculos]); // Remove vehiculos.length from dependencies

  const handleMarcaChange = async (marcaNombre: string, index: number) => {
    const nuevosVehiculos = [...vehiculos];
    nuevosVehiculos[index] = { ...nuevosVehiculos[index], marca: marcaNombre, modelo: '' };
    setVehiculos(nuevosVehiculos);

    // Cargar modelos para esta marca
    if (marcaNombre && !modelosPorMarca[marcaNombre]) {
      const modelos = await fetchModelosPorMarca(marcaNombre);
      setModelosPorMarca(prev => ({ ...prev, [marcaNombre]: modelos }));
    }
  };

  const handleVehiculoChange = (field: keyof VehiculoDetalle, value: string, index: number) => {
    const nuevosVehiculos = [...vehiculos];
    nuevosVehiculos[index] = { ...nuevosVehiculos[index], [field]: value };
    setVehiculos(nuevosVehiculos);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  max="20"
                  onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo_servicio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Servicio</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar servicio" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="vehicular">Monitoreo Vehicular</SelectItem>
                  <SelectItem value="flotilla">Gestión de Flotilla</SelectItem>
                  <SelectItem value="personal">Protección Personal</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Detalles de Vehículos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Detalles de Vehículos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {vehiculos.map((vehiculo, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-lg">Vehículo {index + 1}</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <FormLabel>Marca del Vehículo *</FormLabel>
                  <Select
                    value={vehiculo.marca}
                    onValueChange={(value) => handleMarcaChange(value, index)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar marca" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingMarcas ? (
                        <SelectItem value="loading" disabled>Cargando marcas...</SelectItem>
                      ) : (
                        marcas.map((marca) => (
                          <SelectItem key={marca.id} value={marca.nombre}>
                            {marca.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FormLabel>Modelo del Vehículo</FormLabel>
                  <Select
                    value={vehiculo.modelo}
                    onValueChange={(value) => handleVehiculoChange('modelo', value, index)}
                    disabled={!vehiculo.marca}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehiculo.marca && modelosPorMarca[vehiculo.marca] ? (
                        modelosPorMarca[vehiculo.marca].length > 0 ? (
                          modelosPorMarca[vehiculo.marca].map((modelo) => (
                            <SelectItem key={modelo.id} value={modelo.nombre}>
                              {modelo.nombre}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-models" disabled>No hay modelos disponibles</SelectItem>
                        )
                      ) : (
                        <SelectItem value="select-brand" disabled>Selecciona una marca primero</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FormLabel>Año</FormLabel>
                  <Select
                    value={vehiculo.año}
                    onValueChange={(value) => handleVehiculoChange('año', value, index)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Año" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <FormLabel>Tipo de Vehículo</FormLabel>
                  <Select
                    value={vehiculo.tipo}
                    onValueChange={(value) => handleVehiculoChange('tipo', value, index)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
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
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
