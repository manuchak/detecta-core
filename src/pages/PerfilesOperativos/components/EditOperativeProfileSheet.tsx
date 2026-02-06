import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
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
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Loader2, Save, User, MapPin, Settings, Shield } from 'lucide-react';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftAutoRestorePrompt';
import { useUpdateOperativeProfile } from '@/hooks/useUpdateOperativeProfile';
import type { OperativeProfileFull, ArmadoProfileFull } from '../hooks/useOperativeProfile';

// Mexican states for zona_base
const ZONAS_MEXICO = [
  'CDMX', 'Estado de México', 'Jalisco', 'Nuevo León', 'Puebla',
  'Guanajuato', 'Chihuahua', 'Veracruz', 'Querétaro', 'Coahuila',
  'Michoacán', 'San Luis Potosí', 'Aguascalientes', 'Baja California',
  'Baja California Sur', 'Campeche', 'Chiapas', 'Colima', 'Durango',
  'Guerrero', 'Hidalgo', 'Morelos', 'Nayarit', 'Oaxaca', 'Quintana Roo',
  'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Yucatán', 'Zacatecas'
];

// Base schema for common fields
const baseSchema = z.object({
  nombre: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  telefono: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos').nullable(),
  email: z.string().email('Email inválido').nullable().or(z.literal('')),
  zona_base: z.string().nullable(),
});

// Custodio specific schema
const custodioSchema = baseSchema.extend({
  experiencia_seguridad: z.boolean().nullable(),
  vehiculo_propio: z.boolean().nullable(),
});

// Armado specific schema
const armadoSchema = baseSchema.extend({
  tipo_armado: z.enum(['interno', 'externo', 'freelance']),
  licencia_portacion: z.string().nullable(),
  fecha_vencimiento_licencia: z.string().nullable(),
  experiencia_anos: z.coerce.number().min(0).max(50).nullable(),
});

type CustodioFormData = z.infer<typeof custodioSchema>;
type ArmadoFormData = z.infer<typeof armadoSchema>;

interface EditOperativeProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: OperativeProfileFull | ArmadoProfileFull;
  tipo: 'custodio' | 'armado';
}

export function EditOperativeProfileSheet({
  open,
  onOpenChange,
  profile,
  tipo,
}: EditOperativeProfileSheetProps) {
  const isCustodio = tipo === 'custodio';
  const updateMutation = useUpdateOperativeProfile();

  // Form persistence for draft recovery
  const persistence = useFormPersistence<Partial<CustodioFormData | ArmadoFormData>>({
    key: `edit_operative_profile_${tipo}_${profile?.id || 'new'}`,
    level: 'light',
    initialData: {},
    isMeaningful: (data) => !!(data?.nombre || data?.telefono || data?.email),
  });

  const custodioForm = useForm<CustodioFormData>({
    resolver: zodResolver(custodioSchema),
    defaultValues: {
      nombre: '',
      telefono: null,
      email: null,
      zona_base: null,
      experiencia_seguridad: null,
      vehiculo_propio: null,
    },
  });

  const armadoForm = useForm<ArmadoFormData>({
    resolver: zodResolver(armadoSchema),
    defaultValues: {
      nombre: '',
      telefono: null,
      email: null,
      zona_base: null,
      tipo_armado: 'interno',
      licencia_portacion: null,
      fecha_vencimiento_licencia: null,
      experiencia_anos: null,
    },
  });

  const form = isCustodio ? custodioForm : armadoForm;

  // Sync form changes to persistence
  const formValues = form.watch();
  useEffect(() => {
    if (open && formValues) {
      persistence.updateData(formValues);
    }
  }, [formValues, open]);

  // Reset form when profile changes or sheet opens
  useEffect(() => {
    if (open && profile) {
      // Check for existing draft first
      if (persistence.hasDraft && persistence.data) {
        form.reset(persistence.data as any);
      } else if (isCustodio) {
        const custodioProfile = profile as OperativeProfileFull;
        custodioForm.reset({
          nombre: custodioProfile.nombre || '',
          telefono: custodioProfile.telefono || null,
          email: custodioProfile.email || null,
          zona_base: custodioProfile.zona_base || null,
          experiencia_seguridad: custodioProfile.experiencia_seguridad ?? null,
          vehiculo_propio: custodioProfile.vehiculo_propio ?? null,
        });
      } else {
        const armadoProfile = profile as ArmadoProfileFull;
        armadoForm.reset({
          nombre: armadoProfile.nombre || '',
          telefono: armadoProfile.telefono || null,
          email: armadoProfile.email || null,
          zona_base: armadoProfile.zona_base || null,
          tipo_armado: (armadoProfile.tipo_armado as 'interno' | 'externo' | 'freelance') || 'interno',
          licencia_portacion: armadoProfile.licencia_portacion || null,
          fecha_vencimiento_licencia: armadoProfile.fecha_vencimiento_licencia || null,
          experiencia_anos: armadoProfile.experiencia_anos ?? null,
        });
      }
    }
  }, [open, profile, isCustodio]);

  const onSubmit = async (data: CustodioFormData | ArmadoFormData) => {
    // Clean empty strings to null
    const cleanedData = Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value === '' ? null : value,
      ])
    );

    await updateMutation.mutateAsync({
      id: profile.id,
      tipo,
      data: cleanedData,
    });
    
    // Clear draft on successful save
    persistence.clearDraft(true);
    onOpenChange(false);
  };

  const handleClose = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      persistence.confirmDiscard();
    }
    onOpenChange(newOpen);
  }, [onOpenChange, persistence]);

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Editar Perfil Operativo
            <DraftIndicator lastSaved={persistence.lastSaved} />
          </SheetTitle>
          <SheetDescription>
            Modifica los datos del {isCustodio ? 'custodio' : 'armado'}. Los cambios se guardarán inmediatamente.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Datos de Contacto
              </h3>
              
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre completo *</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez González" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="5512345678" 
                          {...field} 
                          value={field.value || ''} 
                        />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="email@ejemplo.com" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </h3>

              <FormField
                control={form.control}
                name="zona_base"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zona base</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar zona" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ZONAS_MEXICO.map((zona) => (
                          <SelectItem key={zona} value={zona}>
                            {zona}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Custodio-specific fields */}
            {isCustodio && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Configuración Custodio
                </h3>

                <FormField
                  control={custodioForm.control}
                  name="experiencia_seguridad"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Experiencia en seguridad</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={custodioForm.control}
                  name="vehiculo_propio"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Vehículo propio</FormLabel>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Armado-specific fields */}
            {!isCustodio && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Configuración Armado
                </h3>

                <FormField
                  control={armadoForm.control}
                  name="tipo_armado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de armado *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="interno">Interno</SelectItem>
                          <SelectItem value="externo">Externo</SelectItem>
                          <SelectItem value="freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={armadoForm.control}
                  name="licencia_portacion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Licencia de portación</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Número de licencia" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={armadoForm.control}
                  name="fecha_vencimiento_licencia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha vencimiento licencia</FormLabel>
                      <FormControl>
                        <Input 
                          type="date"
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={armadoForm.control}
                  name="experiencia_anos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Años de experiencia</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          min={0}
                          max={50}
                          placeholder="0"
                          {...field} 
                          value={field.value ?? ''} 
                          onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <SheetFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
