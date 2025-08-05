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
import { X } from 'lucide-react';
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
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createEmpresa.mutateAsync({
        razon_social: data.razon_social,
        nombre_comercial: data.nombre_comercial,
        rfc: data.rfc,
        telefono_principal: data.telefono_principal,
        email_principal: data.email_principal,
        direccion_fiscal: data.direccion_fiscal,
        cobertura_geografica: coberturaItems,
        especialidades: especialidadItems,
        tarifas_negociadas: {},
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