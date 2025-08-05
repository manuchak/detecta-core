import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, DollarSign, CreditCard } from 'lucide-react';
import { useEmpresasInstaladora } from '@/hooks/useEmpresasInstaladora';

const schema = z.object({
  razon_social: z.string().min(1, 'La razón social es requerida'),
  nombre_comercial: z.string().optional(),
  rfc: z.string().min(12, 'RFC debe tener al menos 12 caracteres').max(13, 'RFC debe tener máximo 13 caracteres'),
  telefono_principal: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  email_principal: z.string().email('Email inválido'),
  direccion_fiscal: z.string().optional(),
  cobertura_geografica: z.string().min(1, 'Al menos una ciudad de cobertura es requerida'),
  especialidades: z.string().min(1, 'Al menos una especialidad es requerida'),
  años_experiencia: z.number().min(0, 'Años de experiencia debe ser positivo').optional(),
  capacidad_instaladores: z.number().min(1, 'Capacidad debe ser al menos 1').optional(),
  observaciones: z.string().optional(),
  
  // Tarifas por instalación
  tarifa_instalacion_basica: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  tarifa_gps_vehicular: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  tarifa_gps_personal: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  tarifa_instalacion_compleja: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  
  // Componentes adicionales
  tarifa_camara_seguridad: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  tarifa_sensor_combustible: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  tarifa_boton_panico: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  tarifa_sensor_temperatura: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  
  // Servicios adicionales
  tarifa_mantenimiento: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  tarifa_kilometraje: z.number().min(0, 'La tarifa debe ser mayor a 0').optional(),
  
  // Formas de pago
  acepta_pagos_efectivo: z.boolean().optional(),
  acepta_pagos_transferencia: z.boolean().optional(),
  acepta_pagos_cheque: z.boolean().optional(),
  requiere_anticipo: z.boolean().optional(),
  porcentaje_anticipo: z.number().min(0).max(100).optional(),
  
  // Datos bancarios
  banco: z.string().optional(),
  cuenta: z.string().optional(),
  clabe: z.string().optional(),
  titular: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface RegistroEmpresaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistroEmpresaDialog: React.FC<RegistroEmpresaDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const { createEmpresa } = useEmpresasInstaladora();
  const [coberturaItems, setCoberturaItems] = React.useState<string[]>([]);
  const [especialidadItems, setEspecialidadItems] = React.useState<string[]>([]);
  const [coberturaInput, setCoberturaInput] = React.useState('');
  const [especialidadInput, setEspecialidadInput] = React.useState('');

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      razon_social: '',
      nombre_comercial: '',
      rfc: '',
      telefono_principal: '',
      email_principal: '',
      direccion_fiscal: '',
      años_experiencia: undefined,
      capacidad_instaladores: undefined,
      observaciones: '',
      acepta_pagos_efectivo: false,
      acepta_pagos_transferencia: true,
      acepta_pagos_cheque: false,
      requiere_anticipo: false,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Crear objeto de tarifas negociadas con todos los valores de cobro
      const tarifasNegociadas = {
        tarifa_instalacion_basica: data.tarifa_instalacion_basica,
        tarifa_gps_vehicular: data.tarifa_gps_vehicular,
        tarifa_gps_personal: data.tarifa_gps_personal,
        tarifa_instalacion_compleja: data.tarifa_instalacion_compleja,
        tarifa_camara_seguridad: data.tarifa_camara_seguridad,
        tarifa_sensor_combustible: data.tarifa_sensor_combustible,
        tarifa_boton_panico: data.tarifa_boton_panico,
        tarifa_sensor_temperatura: data.tarifa_sensor_temperatura,
        tarifa_mantenimiento: data.tarifa_mantenimiento,
        tarifa_kilometraje: data.tarifa_kilometraje,
        acepta_pagos_efectivo: data.acepta_pagos_efectivo,
        acepta_pagos_transferencia: data.acepta_pagos_transferencia,
        acepta_pagos_cheque: data.acepta_pagos_cheque,
        requiere_anticipo: data.requiere_anticipo,
        porcentaje_anticipo: data.porcentaje_anticipo,
        datos_bancarios: {
          banco: data.banco,
          cuenta: data.cuenta,
          clabe: data.clabe,
          titular: data.titular,
        }
      };

      await createEmpresa.mutateAsync({
        razon_social: data.razon_social,
        nombre_comercial: data.nombre_comercial,
        rfc: data.rfc,
        telefono_principal: data.telefono_principal,
        email_principal: data.email_principal,
        direccion_fiscal: data.direccion_fiscal,
        cobertura_geografica: coberturaItems,
        especialidades: especialidadItems,
        tarifas_negociadas: tarifasNegociadas,
        certificaciones: [],
        años_experiencia: data.años_experiencia,
        capacidad_instaladores: data.capacidad_instaladores,
        observaciones: data.observaciones,
      });
      
      form.reset();
      setCoberturaItems([]);
      setEspecialidadItems([]);
      setCoberturaInput('');
      setEspecialidadInput('');
      onOpenChange(false);
    } catch (error) {
      console.error('Error al registrar empresa:', error);
    }
  };

  const addCobertura = () => {
    if (coberturaInput.trim() && !coberturaItems.includes(coberturaInput.trim())) {
      setCoberturaItems([...coberturaItems, coberturaInput.trim()]);
      setCoberturaInput('');
    }
  };

  const removeCobertura = (item: string) => {
    setCoberturaItems(coberturaItems.filter(c => c !== item));
  };

  const addEspecialidad = () => {
    if (especialidadInput.trim() && !especialidadItems.includes(especialidadInput.trim())) {
      setEspecialidadItems([...especialidadItems, especialidadInput.trim()]);
      setEspecialidadInput('');
    }
  };

  const removeEspecialidad = (item: string) => {
    setEspecialidadItems(especialidadItems.filter(e => e !== item));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Empresa Instaladora</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Básica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Información Básica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="razon_social"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Razón Social *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: Instalaciones Técnicas SA de CV" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombre_comercial"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre Comercial</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ej: TecnoGPS" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rfc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFC *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ABC123456789" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefono_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono Principal *</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="5512345678" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email_principal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Principal *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" placeholder="contacto@empresa.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="direccion_fiscal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dirección Fiscal</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Calle, Colonia, CP, Ciudad" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Cobertura Geográfica */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Cobertura Geográfica</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={coberturaInput}
                    onChange={(e) => setCoberturaInput(e.target.value)}
                    placeholder="Agregar ciudad (ej: CDMX, Guadalajara)"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCobertura())}
                  />
                  <Button type="button" onClick={addCobertura}>
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {coberturaItems.map((item, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {item}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCobertura(item)}
                      />
                    </Badge>
                  ))}
                </div>
                {coberturaItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">Agregue al menos una ciudad de cobertura</p>
                )}
              </div>
            </div>

            {/* Especialidades */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Especialidades</h3>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={especialidadInput}
                    onChange={(e) => setEspecialidadInput(e.target.value)}
                    placeholder="Agregar especialidad (ej: GPS Vehicular, Cámaras)"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addEspecialidad())}
                  />
                  <Button type="button" onClick={addEspecialidad}>
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {especialidadItems.map((item, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-2">
                      {item}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeEspecialidad(item)}
                      />
                    </Badge>
                  ))}
                </div>
                {especialidadItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">Agregue al menos una especialidad</p>
                )}
              </div>
            </div>

            {/* Información Adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Información Adicional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="años_experiencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Años de Experiencia</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="Ej: 5"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="capacidad_instaladores"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Capacidad de Instaladores</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          placeholder="Ej: 25"
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Información adicional sobre la empresa..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tarifas y Datos de Cobro */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tarifas y Datos de Cobro
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Tarifas por tipo de instalación */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Tarifas por Instalación (MXN)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tarifa_instalacion_basica"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instalación Básica GPS</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="800"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">GPS básico sin sensores adicionales</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tarifa_gps_vehicular"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GPS Vehicular Avanzado</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="1200"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Con corta corriente y sensores</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tarifa_gps_personal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GPS Personal</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="400"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Dispositivos portátiles</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tarifa_instalacion_compleja"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instalación Compleja</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="2000"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Vehículos comerciales/blindados</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Componentes adicionales */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Componentes Adicionales (MXN)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tarifa_camara_seguridad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cámara de Seguridad</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="600"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tarifa_sensor_combustible"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sensor de Combustible</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="400"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tarifa_boton_panico"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Botón de Pánico</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="300"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tarifa_sensor_temperatura"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sensor de Temperatura</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="350"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Servicios adicionales */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Servicios Adicionales (MXN)
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="tarifa_mantenimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mantenimiento/Revisión</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="200"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Por visita de mantenimiento</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tarifa_kilometraje"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Viáticos por KM</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              placeholder="8"
                              onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">Costo por kilómetro de traslado</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Formas de pago y condiciones */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                    Formas de Pago y Condiciones
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Acepta pagos en:</Label>
                      <div className="flex flex-wrap gap-4">
                        <FormField
                          control={form.control}
                          name="acepta_pagos_efectivo"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Efectivo</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="acepta_pagos_transferencia"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Transferencia</FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="acepta_pagos_cheque"
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Cheque</FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="requiere_anticipo"
                      render={({ field }) => (
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel>Requiere anticipo</FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch('requiere_anticipo') && (
                      <FormField
                        control={form.control}
                        name="porcentaje_anticipo"
                        render={({ field }) => (
                          <FormItem className="ml-6">
                            <FormLabel>Porcentaje de anticipo (%)</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                type="number" 
                                placeholder="50"
                                className="w-32"
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Datos Bancarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Datos Bancarios (Opcional)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Banco</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del banco" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cuenta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Cuenta</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Número de cuenta" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="clabe"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CLABE</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="CLABE interbancaria" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="titular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titular</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del titular" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Botones */}
            <div className="flex justify-end gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={createEmpresa.isPending || coberturaItems.length === 0 || especialidadItems.length === 0}
              >
                {createEmpresa.isPending ? 'Registrando...' : 'Registrar Empresa'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};