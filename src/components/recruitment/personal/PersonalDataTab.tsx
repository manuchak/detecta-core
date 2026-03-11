import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { Loader2, Save, Car, UserCircle, CheckCircle2 } from 'lucide-react';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const personalDataSchema = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido').max(200),
  telefono: z.string().trim().regex(/^\d{10}$/, 'Debe ser un teléfono de 10 dígitos').optional().or(z.literal('')),
  email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  curp: z.string().trim().regex(/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/, 'CURP inválido').optional().or(z.literal('')),
  direccion: z.string().trim().max(500).optional().or(z.literal('')),
  vehiculo_propio: z.boolean(),
  marca_vehiculo: z.string().trim().max(100).optional().or(z.literal('')),
  modelo_vehiculo: z.string().trim().max(100).optional().or(z.literal('')),
  placas_vehiculo: z.string().trim().max(20).optional().or(z.literal('')),
  color_vehiculo: z.string().trim().max(50).optional().or(z.literal('')),
  numero_serie: z.string().trim().max(50).optional().or(z.literal('')),
  numero_motor: z.string().trim().max(50).optional().or(z.literal('')),
  numero_licencia: z.string().trim().max(50).optional().or(z.literal('')),
});

type PersonalData = z.infer<typeof personalDataSchema>;

const FIELD_LIST: (keyof PersonalData)[] = [
  'nombre', 'telefono', 'email', 'curp', 'direccion',
  'vehiculo_propio', 'marca_vehiculo', 'modelo_vehiculo',
  'placas_vehiculo', 'color_vehiculo', 'numero_serie',
  'numero_motor', 'numero_licencia',
];

const EMPTY_FORM: PersonalData = {
  nombre: '', telefono: '', email: '', curp: '', direccion: '',
  vehiculo_propio: false, marca_vehiculo: '', modelo_vehiculo: '',
  placas_vehiculo: '', color_vehiculo: '', numero_serie: '',
  numero_motor: '', numero_licencia: '',
};

interface Props {
  candidatoId: string;
}

export function PersonalDataTab({ candidatoId }: Props) {
  const queryClient = useQueryClient();

  const { data: candidato, isLoading } = useQuery({
    queryKey: ['candidato-personal-data', candidatoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidatos_custodios')
        .select('nombre, telefono, email, curp, direccion, vehiculo_propio, marca_vehiculo, modelo_vehiculo, placas_vehiculo, color_vehiculo, numero_serie, numero_motor, numero_licencia, updated_at')
        .eq('id', candidatoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!candidatoId,
  });

  const { data: formData, setData: setFormData, updateData, clearDraft, hasDraft } = useFormPersistence<PersonalData>({
    key: `personal-data-${candidatoId}`,
    initialData: EMPTY_FORM,
    level: 'light',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  // Populate form from DB on first load (if no draft)
  useEffect(() => {
    if (candidato && !initialized) {
      if (!hasDraft) {
        setFormData({
          nombre: candidato.nombre || '',
          telefono: candidato.telefono || '',
          email: candidato.email || '',
          curp: candidato.curp || '',
          direccion: candidato.direccion || '',
          vehiculo_propio: candidato.vehiculo_propio ?? false,
          marca_vehiculo: candidato.marca_vehiculo || '',
          modelo_vehiculo: candidato.modelo_vehiculo || '',
          placas_vehiculo: candidato.placas_vehiculo || '',
          color_vehiculo: candidato.color_vehiculo || '',
          numero_serie: candidato.numero_serie || '',
          numero_motor: candidato.numero_motor || '',
          numero_licencia: candidato.numero_licencia || '',
        });
      }
      setInitialized(true);
    }
  }, [candidato, initialized, hasDraft, setFormData]);

  const mutation = useMutation({
    mutationFn: async (data: PersonalData) => {
      const { error } = await supabase
        .from('candidatos_custodios')
        .update({
          nombre: data.nombre.trim(),
          telefono: data.telefono?.trim() || null,
          email: data.email?.trim() || null,
          curp: data.curp?.trim() || null,
          direccion: data.direccion?.trim() || null,
          vehiculo_propio: data.vehiculo_propio,
          marca_vehiculo: data.marca_vehiculo?.trim() || null,
          modelo_vehiculo: data.modelo_vehiculo?.trim() || null,
          placas_vehiculo: data.placas_vehiculo?.trim() || null,
          color_vehiculo: data.color_vehiculo?.trim() || null,
          numero_serie: data.numero_serie?.trim() || null,
          numero_motor: data.numero_motor?.trim() || null,
          numero_licencia: data.numero_licencia?.trim() || null,
        })
        .eq('id', candidatoId);
      if (error) throw error;
    },
    onSuccess: () => {
      clearDraft();
      queryClient.invalidateQueries({ queryKey: ['candidato-personal-data', candidatoId] });
      queryClient.invalidateQueries({ queryKey: ['candidato-vehiculo', candidatoId] });
      toast({ title: 'Datos verificados guardados', description: 'La información del candidato ha sido actualizada.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error al guardar', description: err.message, variant: 'destructive' });
    },
  });

  const handleSave = () => {
    const result = personalDataSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(e => {
        if (e.path[0]) fieldErrors[String(e.path[0])] = e.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    mutation.mutate(result.data);
  };

  const updateField = (field: keyof PersonalData, value: string | boolean) => {
    updateData({ [field]: value } as Partial<PersonalData>);
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const completedFields = FIELD_LIST.filter(f => {
    const v = formData[f];
    if (typeof v === 'boolean') return true; // toggle always counts
    return !!v && String(v).trim() !== '';
  }).length;

  return (
    <div className="space-y-5">
      {/* Last update indicator */}
      {candidato?.updated_at && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CheckCircle2 className="h-3 w-3" />
          Última actualización: {format(new Date(candidato.updated_at), "d MMM yyyy, HH:mm", { locale: es })}
        </div>
      )}

      {/* Datos Personales */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Datos Personales</h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Nombre completo" value={formData.nombre} onChange={v => updateField('nombre', v)} error={errors.nombre} required />
          <Field label="Teléfono (10 dígitos)" value={formData.telefono || ''} onChange={v => updateField('telefono', v)} error={errors.telefono} maxLength={10} />
          <Field label="Email" value={formData.email || ''} onChange={v => updateField('email', v)} error={errors.email} type="email" />
          <Field label="CURP" value={formData.curp || ''} onChange={v => updateField('curp', v.toUpperCase())} error={errors.curp} maxLength={18} />
          <div className="sm:col-span-2">
            <Field label="Dirección" value={formData.direccion || ''} onChange={v => updateField('direccion', v)} error={errors.direccion} />
          </div>
        </div>
      </div>

      {/* Datos del Vehículo */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          <h4 className="text-sm font-semibold">Datos del Vehículo</h4>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <Switch
            checked={formData.vehiculo_propio}
            onCheckedChange={v => updateField('vehiculo_propio', v)}
          />
          <Label className="text-sm">Vehículo propio</Label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Marca" value={formData.marca_vehiculo || ''} onChange={v => updateField('marca_vehiculo', v)} />
          <Field label="Modelo" value={formData.modelo_vehiculo || ''} onChange={v => updateField('modelo_vehiculo', v)} />
          <Field label="Placas" value={formData.placas_vehiculo || ''} onChange={v => updateField('placas_vehiculo', v)} maxLength={20} />
          <Field label="Color" value={formData.color_vehiculo || ''} onChange={v => updateField('color_vehiculo', v)} />
          <Field label="Número de serie" value={formData.numero_serie || ''} onChange={v => updateField('numero_serie', v)} />
          <Field label="Número de motor" value={formData.numero_motor || ''} onChange={v => updateField('numero_motor', v)} />
          <Field label="Número de licencia" value={formData.numero_licencia || ''} onChange={v => updateField('numero_licencia', v)} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <span className="text-xs text-muted-foreground">{completedFields}/{FIELD_LIST.length} campos completados</span>
        <Button onClick={handleSave} disabled={mutation.isPending} size="sm">
          {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Save className="h-3.5 w-3.5 mr-1" />}
          Guardar datos verificados
        </Button>
      </div>
    </div>
  );
}

// --- Field sub-component ---
function Field({ label, value, onChange, error, required, type = 'text', maxLength }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: string;
  maxLength?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        className="h-8 text-sm"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Helper to compute completion for external use (badge/gate)
export function computePersonalDataCompletion(data: Record<string, any> | null): { completed: number; total: number } {
  if (!data) return { completed: 0, total: FIELD_LIST.length };
  let completed = 0;
  for (const f of FIELD_LIST) {
    const v = data[f];
    if (typeof v === 'boolean') { completed++; continue; }
    if (v && String(v).trim() !== '') completed++;
  }
  return { completed, total: FIELD_LIST.length };
}
