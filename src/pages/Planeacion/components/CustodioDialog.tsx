import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Custodio, CustodioForm } from '@/types/planeacion';

const custodioSchema = z.object({
  nombre: z.string().min(1, 'Nombre es requerido'),
  tel: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  zona_base: z.string().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  tipo_custodia: z.enum(['armado', 'no_armado']),
  tiene_gadgets: z.boolean().default(false),
  certificaciones: z.array(z.string()).default([]),
  comentarios: z.string().optional(),
});

interface CustodioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodio?: Custodio | null;
  onSubmit: (data: CustodioForm) => Promise<void>;
  loading?: boolean;
}

export default function CustodioDialog({
  open,
  onOpenChange,
  custodio,
  onSubmit,
  loading = false,
}: CustodioDialogProps) {
  const form = useForm<CustodioForm>({
    resolver: zodResolver(custodioSchema),
    defaultValues: {
      nombre: '',
      tel: '',
      email: '',
      zona_base: '',
      tipo_custodia: 'no_armado',
      tiene_gadgets: false,
      certificaciones: [],
      comentarios: '',
    },
  });

  useEffect(() => {
    if (custodio) {
      form.reset({
        nombre: custodio.nombre,
        tel: custodio.tel,
        email: custodio.email || '',
        zona_base: custodio.zona_base || '',
        lat: custodio.lat,
        lng: custodio.lng,
        tipo_custodia: custodio.tipo_custodia,
        tiene_gadgets: custodio.tiene_gadgets,
        certificaciones: custodio.certificaciones || [],
        comentarios: custodio.comentarios || '',
      });
    } else {
      form.reset();
    }
  }, [custodio, form]);

  const handleSubmit = async (data: CustodioForm) => {
    await onSubmit(data);
    form.reset();
  };

  const addCertificacion = () => {
    const certificaciones = form.getValues('certificaciones');
    const nuevaCert = prompt('Ingrese la certificación:');
    if (nuevaCert?.trim()) {
      form.setValue('certificaciones', [...certificaciones, nuevaCert.trim()]);
    }
  };

  const removeCertificacion = (index: number) => {
    const certificaciones = form.getValues('certificaciones');
    form.setValue('certificaciones', certificaciones.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {custodio ? 'Editar Custodio' : 'Nuevo Custodio'}
          </DialogTitle>
          <DialogDescription>
            {custodio 
              ? 'Modifica los datos del custodio'
              : 'Registra un nuevo custodio en el sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Personal</h3>
              
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre del custodio" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+52 555 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="custodio@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Configuración del Servicio */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración del Servicio</h3>
              
              <FormField
                control={form.control}
                name="tipo_custodia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Custodia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="armado">Armado</SelectItem>
                        <SelectItem value="no_armado">No Armado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Ubicación */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Ubicación Base</h3>
              
              <FormField
                control={form.control}
                name="zona_base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Base</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Polanco, CDMX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Configuración Adicional */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración Adicional</h3>
              
              <FormField
                control={form.control}
                name="tiene_gadgets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Tiene Gadgets</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        El custodio cuenta con equipamiento tecnológico
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Certificaciones */}
              <div className="space-y-2">
                <FormLabel>Certificaciones</FormLabel>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.watch('certificaciones').map((cert, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {cert}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeCertificacion(index)}
                      />
                    </Badge>
                  ))}
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={addCertificacion}
                >
                  Agregar Certificación
                </Button>
              </div>

              <FormField
                control={form.control}
                name="comentarios"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comentarios</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones adicionales sobre el custodio..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (custodio ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}