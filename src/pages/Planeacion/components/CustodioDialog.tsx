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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Custodio, CustodioForm } from '@/types/planeacion';

const custodioSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  tel: z.string().min(1, 'El teléfono es requerido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  zona_base: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  tiene_gadgets: z.boolean(),
  tipo_custodia: z.enum(['armado', 'no_armado']),
  certificaciones: z.array(z.string()),
  comentarios: z.string().optional(),
});

interface CustodioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodio?: Custodio | null;
  onSubmit: (data: CustodioForm) => Promise<void>;
  loading?: boolean;
}

const certificacionesDisponibles = [
  'Manejo de Armas',
  'Primeros Auxilios',
  'Defensa Personal',
  'Conducción Defensiva',
  'Manejo de Situaciones de Crisis',
  'Protección Ejecutiva',
  'Seguridad Privada',
  'Vigilancia',
];

export default function CustodioDialog({
  open,
  onOpenChange,
  custodio,
  onSubmit,
  loading = false,
}: CustodioDialogProps) {
  const isEditing = !!custodio;

  const form = useForm<z.infer<typeof custodioSchema>>({
    resolver: zodResolver(custodioSchema),
    defaultValues: {
      nombre: '',
      tel: '',
      email: '',
      zona_base: '',
      lat: undefined,
      lng: undefined,
      tiene_gadgets: false,
      tipo_custodia: 'no_armado',
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
        tiene_gadgets: custodio.tiene_gadgets,
        tipo_custodia: custodio.tipo_custodia,
        certificaciones: custodio.certificaciones,
        comentarios: custodio.comentarios || '',
      });
    } else {
      form.reset({
        nombre: '',
        tel: '',
        email: '',
        zona_base: '',
        lat: undefined,
        lng: undefined,
        tiene_gadgets: false,
        tipo_custodia: 'no_armado',
        certificaciones: [],
        comentarios: '',
      });
    }
  }, [custodio, form]);

  const handleSubmit = async (values: z.infer<typeof custodioSchema>) => {
    const data: CustodioForm = {
      ...values,
      email: values.email || undefined,
      zona_base: values.zona_base || undefined,
      comentarios: values.comentarios || undefined,
    };
    
    await onSubmit(data);
    form.reset();
  };

  const certificaciones = form.watch('certificaciones');

  const addCertificacion = (cert: string) => {
    if (!certificaciones.includes(cert)) {
      form.setValue('certificaciones', [...certificaciones, cert]);
    }
  };

  const removeCertificacion = (cert: string) => {
    form.setValue('certificaciones', certificaciones.filter(c => c !== cert));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Custodio' : 'Nuevo Custodio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del custodio'
              : 'Ingresa los datos del nuevo custodio'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Juan Pérez García" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. +52 55 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Ej. custodio@email.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zona_base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona Base (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Polanco, CDMX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_custodia"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Custodia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no_armado">No Armado</SelectItem>
                        <SelectItem value="armado">Armado</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tiene_gadgets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Tiene Gadgets</FormLabel>
                      <FormDescription>
                        Cuenta con equipamiento tecnológico
                      </FormDescription>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitud (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="Ej. 19.4326" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any"
                        placeholder="Ej. -99.1332" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="certificaciones"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certificaciones</FormLabel>
                  <div className="space-y-2">
                    <Select onValueChange={addCertificacion}>
                      <SelectTrigger>
                        <SelectValue placeholder="Agregar certificación" />
                      </SelectTrigger>
                      <SelectContent>
                        {certificacionesDisponibles
                          .filter(cert => !certificaciones.includes(cert))
                          .map((cert) => (
                            <SelectItem key={cert} value={cert}>
                              {cert}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    
                    {certificaciones.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {certificaciones.map((cert) => (
                          <Badge key={cert} variant="secondary" className="flex items-center gap-1">
                            {cert}
                            <X 
                              className="h-3 w-3 cursor-pointer" 
                              onClick={() => removeCertificacion(cert)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comentarios"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentarios (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información adicional sobre el custodio..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}