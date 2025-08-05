import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInstaladorData } from '@/hooks/useInstaladorData';
import { 
  MapPin, 
  Clock, 
  Wrench, 
  Car, 
  Building, 
  CheckCircle,
  Plus,
  X
} from 'lucide-react';

const especialidadesDisponibles = [
  'GPS Vehicular',
  'GPS Personal',
  'Cámaras de Seguridad',
  'Alarmas Vehiculares',
  'Sistemas de Audio',
  'Iluminación LED',
  'Blindaje Vehicular',
  'Inmovilizadores',
  'Sensores de Combustible',
  'Botón de Pánico'
];

const estadosDesMexico = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Ciudad de México', 'Coahuila', 'Colima',
  'Durango', 'Estado de México', 'Guanajuato', 'Guerrero', 'Hidalgo',
  'Jalisco', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca',
  'Puebla', 'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
  'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

const tiposVehiculos = [
  'Automóviles',
  'Camionetas',
  'Motocicletas',
  'Camiones de Carga',
  'Autobuses',
  'Vehículos de Lujo',
  'Vehículos Eléctricos',
  'Maquinaria Pesada'
];

const herramientasBasicas = [
  'Multímetro',
  'Taladro',
  'Kit de Destornilladores',
  'Soldadora',
  'Pistola de Calor',
  'Crimpeadora',
  'Probador de Circuitos',
  'Herramientas de Tapicería',
  'Kit de Instalación GPS',
  'Escalera'
];

const schema = z.object({
  // Información básica
  nombre_completo: z.string().min(1, 'Nombre completo es requerido'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  cedula_profesional: z.string().optional(),
  
  // Ubicación y trabajo
  estado_trabajo: z.string().min(1, 'Estado de trabajo es requerido'),
  ciudad_trabajo: z.string().min(1, 'Ciudad de trabajo es requerida'),
  zonas_trabajo: z.array(z.string()).min(1, 'Debe seleccionar al menos una zona'),
  
  // Especialidades y experiencia
  especialidades: z.array(z.string()).min(1, 'Debe seleccionar al menos una especialidad'),
  experiencia_anos: z.number().min(0, 'La experiencia no puede ser negativa').optional(),
  experiencia_especifica: z.record(z.number().min(0)).optional(),
  
  // Capacidades técnicas
  tiene_taller: z.boolean().optional(),
  direccion_taller: z.string().optional(),
  herramientas_disponibles: z.array(z.string()).optional(),
  capacidad_vehiculos: z.array(z.string()).optional(),
  
  // Disponibilidad
  horario_atencion: z.object({
    lunes: z.boolean(),
    martes: z.boolean(),
    miercoles: z.boolean(),
    jueves: z.boolean(),
    viernes: z.boolean(),
    sabado: z.boolean(),
    domingo: z.boolean()
  }),
  
  // Vehículo y equipamiento
  vehiculo_propio: z.boolean().optional(),
  
  // Datos bancarios
  banco: z.string().optional(),
  cuenta: z.string().optional(),
  clabe: z.string().optional(),
  titular: z.string().optional(),
  
  // Observaciones
  observaciones_adicionales: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface RegistroInstaladorFormularioRobustoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistroInstaladorFormularioRobusto: React.FC<RegistroInstaladorFormularioRobustoProps> = ({
  open,
  onOpenChange
}) => {
  const { createInstalador } = useInstaladorData();
  const [nuevaZona, setNuevaZona] = useState('');

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    getValues
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      vehiculo_propio: false,
      tiene_taller: false,
      especialidades: [],
      zonas_trabajo: [],
      herramientas_disponibles: [],
      capacidad_vehiculos: [],
      horario_atencion: {
        lunes: true,
        martes: true,
        miercoles: true,
        jueves: true,
        viernes: true,
        sabado: false,
        domingo: false
      },
      experiencia_especifica: {}
    }
  });

  const tieneTaller = watch('tiene_taller');
  const zonasSeleccionadas = watch('zonas_trabajo') || [];
  const especialidadesSeleccionadas = watch('especialidades') || [];
  const herramientasSeleccionadas = watch('herramientas_disponibles') || [];
  const vehiculosSeleccionados = watch('capacidad_vehiculos') || [];

  const agregarZona = () => {
    if (nuevaZona.trim() && !zonasSeleccionadas.includes(nuevaZona.trim())) {
      setValue('zonas_trabajo', [...zonasSeleccionadas, nuevaZona.trim()]);
      setNuevaZona('');
    }
  };

  const removerZona = (zona: string) => {
    setValue('zonas_trabajo', zonasSeleccionadas.filter(z => z !== zona));
  };

  const toggleEspecialidad = (especialidad: string) => {
    const nuevas = especialidadesSeleccionadas.includes(especialidad)
      ? especialidadesSeleccionadas.filter(e => e !== especialidad)
      : [...especialidadesSeleccionadas, especialidad];
    setValue('especialidades', nuevas);
  };

  const toggleHerramienta = (herramienta: string) => {
    const nuevas = herramientasSeleccionadas.includes(herramienta)
      ? herramientasSeleccionadas.filter(h => h !== herramienta)
      : [...herramientasSeleccionadas, herramienta];
    setValue('herramientas_disponibles', nuevas);
  };

  const toggleVehiculo = (vehiculo: string) => {
    const nuevos = vehiculosSeleccionados.includes(vehiculo)
      ? vehiculosSeleccionados.filter(v => v !== vehiculo)
      : [...vehiculosSeleccionados, vehiculo];
    setValue('capacidad_vehiculos', nuevos);
  };

  const onSubmit = async (data: FormData) => {
    try {
      const bancoData = data.banco ? {
        banco: data.banco,
        cuenta: data.cuenta,
        clabe: data.clabe,
        titular: data.titular
      } : undefined;

      await createInstalador({
        nombre_completo: data.nombre_completo,
        telefono: data.telefono,
        email: data.email,
        cedula_profesional: data.cedula_profesional,
        especialidades: data.especialidades,
        vehiculo_propio: data.vehiculo_propio,
        banco_datos: bancoData,
        // Nuevos campos
        estado_trabajo: data.estado_trabajo,
        ciudad_trabajo: data.ciudad_trabajo,
        zonas_trabajo: data.zonas_trabajo,
        tiene_taller: data.tiene_taller,
        direccion_taller: data.direccion_taller,
        horario_atencion: data.horario_atencion,
        experiencia_especifica: data.experiencia_especifica,
        herramientas_disponibles: data.herramientas_disponibles,
        capacidad_vehiculos: data.capacidad_vehiculos,
        observaciones_adicionales: data.observaciones_adicionales
      });
      
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating installer:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registro Completo de Instalador</DialogTitle>
          <DialogDescription>
            Complete toda la información para registrar un nuevo instalador certificado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                  <Input
                    {...register('nombre_completo')}
                    placeholder="Nombre completo del instalador"
                  />
                  {errors.nombre_completo && (
                    <p className="text-sm text-destructive">{errors.nombre_completo.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cedula_profesional">Cédula Profesional</Label>
                  <Input
                    {...register('cedula_profesional')}
                    placeholder="Número de cédula profesional"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono *</Label>
                  <Input
                    {...register('telefono')}
                    placeholder="Número de teléfono"
                  />
                  {errors.telefono && (
                    <p className="text-sm text-destructive">{errors.telefono.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="Correo electrónico"
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ubicación y Zona de Trabajo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Ubicación y Zona de Trabajo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estado de Trabajo *</Label>
                  <Controller
                    name="estado_trabajo"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {estadosDesMexico.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.estado_trabajo && (
                    <p className="text-sm text-destructive">{errors.estado_trabajo.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ciudad_trabajo">Ciudad Principal *</Label>
                  <Input
                    {...register('ciudad_trabajo')}
                    placeholder="Ciudad donde trabaja principalmente"
                  />
                  {errors.ciudad_trabajo && (
                    <p className="text-sm text-destructive">{errors.ciudad_trabajo.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Zonas de Cobertura *</Label>
                <div className="flex gap-2">
                  <Input
                    value={nuevaZona}
                    onChange={(e) => setNuevaZona(e.target.value)}
                    placeholder="Agregar zona de cobertura"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarZona())}
                  />
                  <Button type="button" onClick={agregarZona} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {zonasSeleccionadas.map((zona) => (
                    <Badge key={zona} variant="secondary" className="flex items-center gap-1">
                      {zona}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 w-4 h-4"
                        onClick={() => removerZona(zona)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
                {errors.zonas_trabajo && (
                  <p className="text-sm text-destructive">{errors.zonas_trabajo.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Especialidades y Experiencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Especialidades y Experiencia
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Especialidades *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {especialidadesDisponibles.map((especialidad) => (
                    <div key={especialidad} className="flex items-center space-x-2">
                      <Checkbox
                        id={especialidad}
                        checked={especialidadesSeleccionadas.includes(especialidad)}
                        onCheckedChange={() => toggleEspecialidad(especialidad)}
                      />
                      <Label htmlFor={especialidad} className="text-sm">
                        {especialidad}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.especialidades && (
                  <p className="text-sm text-destructive">{errors.especialidades.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Experiencia General (años)</Label>
                <Input
                  {...register('experiencia_anos', { valueAsNumber: true })}
                  type="number"
                  min="0"
                  placeholder="Años de experiencia total"
                />
              </div>
            </CardContent>
          </Card>

          {/* Taller y Herramientas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Taller y Herramientas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Controller
                  name="tiene_taller"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="tiene_taller"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="tiene_taller">Cuenta con taller propio</Label>
              </div>

              {tieneTaller && (
                <div className="space-y-2">
                  <Label htmlFor="direccion_taller">Dirección del Taller</Label>
                  <Input
                    {...register('direccion_taller')}
                    placeholder="Dirección completa del taller"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Herramientas Disponibles</Label>
                <div className="grid grid-cols-2 gap-2">
                  {herramientasBasicas.map((herramienta) => (
                    <div key={herramienta} className="flex items-center space-x-2">
                      <Checkbox
                        id={herramienta}
                        checked={herramientasSeleccionadas.includes(herramienta)}
                        onCheckedChange={() => toggleHerramienta(herramienta)}
                      />
                      <Label htmlFor={herramienta} className="text-sm">
                        {herramienta}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipos de Vehículos que Maneja</Label>
                <div className="grid grid-cols-2 gap-2">
                  {tiposVehiculos.map((vehiculo) => (
                    <div key={vehiculo} className="flex items-center space-x-2">
                      <Checkbox
                        id={vehiculo}
                        checked={vehiculosSeleccionados.includes(vehiculo)}
                        onCheckedChange={() => toggleVehiculo(vehiculo)}
                      />
                      <Label htmlFor={vehiculo} className="text-sm">
                        {vehiculo}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disponibilidad */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Disponibilidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Días de Trabajo</Label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries({
                    lunes: 'Lunes',
                    martes: 'Martes',
                    miercoles: 'Miércoles',
                    jueves: 'Jueves',
                    viernes: 'Viernes',
                    sabado: 'Sábado',
                    domingo: 'Domingo'
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Controller
                        name={`horario_atencion.${key}` as any}
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={key}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                      <Label htmlFor={key} className="text-sm">
                        {label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Controller
                  name="vehiculo_propio"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="vehiculo_propio"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label htmlFor="vehiculo_propio">Cuenta con vehículo propio</Label>
              </div>
            </CardContent>
          </Card>

          {/* Datos Bancarios */}
          <Card>
            <CardHeader>
              <CardTitle>Datos Bancarios (Opcional)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="banco">Banco</Label>
                  <Input
                    {...register('banco')}
                    placeholder="Nombre del banco"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cuenta">Número de Cuenta</Label>
                  <Input
                    {...register('cuenta')}
                    placeholder="Número de cuenta"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clabe">CLABE</Label>
                  <Input
                    {...register('clabe')}
                    placeholder="CLABE interbancaria"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="titular">Titular</Label>
                  <Input
                    {...register('titular')}
                    placeholder="Nombre del titular"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardHeader>
              <CardTitle>Información Adicional</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="observaciones_adicionales">Observaciones</Label>
                <Textarea
                  {...register('observaciones_adicionales')}
                  placeholder="Cualquier información adicional relevante..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Instalador'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};