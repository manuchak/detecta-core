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

const personalDataSchemaCustodio = z.object({
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

const personalDataSchemaArmado = z.object({
  nombre: z.string().trim().min(2, 'Nombre requerido').max(200),
  telefono: z.string().trim().regex(/^\d{10}$/, 'Debe ser un teléfono de 10 dígitos').optional().or(z.literal('')),
  email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  vehiculo_propio: z.boolean(),
});

type PersonalDataCustodio = z.infer<typeof personalDataSchemaCustodio>;
type PersonalDataArmado = z.infer<typeof personalDataSchemaArmado>;
type PersonalData = PersonalDataCustodio;

const FIELD_LIST_CUSTODIO: (keyof PersonalDataCustodio)[] = [
  'nombre', 'telefono', 'email', 'curp', 'direccion',
  'vehiculo_propio', 'marca_vehiculo', 'modelo_vehiculo',
  'placas_vehiculo', 'color_vehiculo', 'numero_serie',
  'numero_motor', 'numero_licencia',
];

const FIELD_LIST_ARMADO: (keyof PersonalDataArmado)[] = [
  'nombre', 'telefono', 'email', 'vehiculo_propio',
];

const EMPTY_FORM_CUSTODIO: PersonalDataCustodio = {
  nombre: '', telefono: '', email: '', curp: '', direccion: '',
  vehiculo_propio: false, marca_vehiculo: '', modelo_vehiculo: '',
  placas_vehiculo: '', color_vehiculo: '', numero_serie: '',
  numero_motor: '', numero_licencia: '',
};

const EMPTY_FORM_ARMADO: PersonalDataArmado = {
  nombre: '', telefono: '', email: '', vehiculo_propio: false,
};

interface Props {
  candidatoId: string;
  tipoOperativo?: 'custodio' | 'armado';
}

export function PersonalDataTab({ candidatoId, tipoOperativo = 'custodio' }: Props) {
  const queryClient = useQueryClient();
  const isArmado = tipoOperativo === 'armado';
  const tableName = isArmado ? 'candidatos_armados' : 'candidatos_custodios';
  const FIELD_LIST = isArmado ? FIELD_LIST_ARMADO : FIELD_LIST_CUSTODIO;
  const EMPTY_FORM = isArmado ? EMPTY_FORM_ARMADO : EMPTY_FORM_CUSTODIO;
  const schema = isArmado ? personalDataSchemaArmado : personalDataSchemaCustodio;

  const selectFields = isArmado
    ? 'nombre, telefono, email, vehiculo_propio, updated_at'
    : 'nombre, telefono, email, curp, direccion, vehiculo_propio, marca_vehiculo, modelo_vehiculo, placas_vehiculo, color_vehiculo, numero_serie, numero_motor, numero_licencia, updated_at';

  const { data: candidato, isLoading } = useQuery({
    queryKey: ['candidato-personal-data', candidatoId, tipoOperativo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select(selectFields)
        .eq('id', candidatoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!candidatoId,
  });

  const { data: formData, setData: setFormData, updateData, clearDraft, hasDraft } = useFormPersistence<any>({
    key: `personal-data-${candidatoId}`,
    initialData: EMPTY_FORM,
    level: 'light',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (candidato && !initialized) {
      if (!hasDraft) {
        const baseData: any = {
          nombre: candidato.nombre || '',
          telefono: candidato.telefono || '',
          email: candidato.email || '',
          vehiculo_propio: candidato.vehiculo_propio ?? false,
        };
        if (!isArmado) {
          baseData.curp = (candidato as any).curp || '';
          baseData.direccion = (candidato as any).direccion || '';
          baseData.marca_vehiculo = (candidato as any).marca_vehiculo || '';
          baseData.modelo_vehiculo = (candidato as any).modelo_vehiculo || '';
          baseData.placas_vehiculo = (candidato as any).placas_vehiculo || '';
          baseData.color_vehiculo = (candidato as any).color_vehiculo || '';
          baseData.numero_serie = (candidato as any).numero_serie || '';
          baseData.numero_motor = (candidato as any).numero_motor || '';
          baseData.numero_licencia = (candidato as any).numero_licencia || '';
        }
        setFormData(baseData);
      }
      setInitialized(true);
    }
  }, [candidato, initialized, hasDraft, setFormData, isArmado]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const updatePayload: any = {
        nombre: data.nombre.trim(),
        telefono: data.telefono?.trim() || null,
        email: data.email?.trim() || null,
        vehiculo_propio: data.vehiculo_propio,
      };
      if (!isArmado) {
        updatePayload.curp = data.curp?.trim() || null;
        updatePayload.direccion = data.direccion?.trim() || null;
        updatePayload.marca_vehiculo = data.marca_vehiculo?.trim() || null;
        updatePayload.modelo_vehiculo = data.modelo_vehiculo?.trim() || null;
        updatePayload.placas_vehiculo = data.placas_vehiculo?.trim() || null;
        updatePayload.color_vehiculo = data.color_vehiculo?.trim() || null;
        updatePayload.numero_serie = data.numero_serie?.trim() || null;
        updatePayload.numero_motor = data.numero_motor?.trim() || null;
        updatePayload.numero_licencia = data.numero_licencia?.trim() || null;
      }
      const { error } = await supabase
        .from(tableName)
        .update(updatePayload)
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
    const result = schema.safeParse(formData);
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

  const updateField = (field: string, value: string | boolean) => {
    updateData({ [field]: value });
    if (errors[field]) {
      setErrors(prev => { const n = { ...prev }; delete n[field]; return n; });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const completedFields = (FIELD_LIST as string[]).filter(f => {
    const v = formData[f];
    if (typeof v === 'boolean') return true;
    return !!v && String(v).trim() !== '';
  }).length;

  return (
    <div className="space-y-5">
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
          {!isArmado && (
            <>
              <Field label="CURP" value={formData.curp || ''} onChange={v => updateField('curp', v.toUpperCase())} error={errors.curp} maxLength={18} />
              <div className="sm:col-span-2">
                <Field label="Dirección" value={formData.direccion || ''} onChange={v => updateField('direccion', v)} error={errors.direccion} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Datos del Vehículo — solo custodios tienen campos detallados */}
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
        {!isArmado && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Marca" value={formData.marca_vehiculo || ''} onChange={v => updateField('marca_vehiculo', v)} />
            <Field label="Modelo" value={formData.modelo_vehiculo || ''} onChange={v => updateField('modelo_vehiculo', v)} />
            <Field label="Placas" value={formData.placas_vehiculo || ''} onChange={v => updateField('placas_vehiculo', v)} maxLength={20} />
            <Field label="Color" value={formData.color_vehiculo || ''} onChange={v => updateField('color_vehiculo', v)} />
            <Field label="Número de serie" value={formData.numero_serie || ''} onChange={v => updateField('numero_serie', v)} />
            <Field label="Número de motor" value={formData.numero_motor || ''} onChange={v => updateField('numero_motor', v)} />
            <Field label="Número de licencia" value={formData.numero_licencia || ''} onChange={v => updateField('numero_licencia', v)} />
          </div>
        )}
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
export function computePersonalDataCompletion(data: Record<string, any> | null, tipoOperativo: 'custodio' | 'armado' = 'custodio'): { completed: number; total: number } {
  const fieldList = tipoOperativo === 'armado' ? FIELD_LIST_ARMADO : FIELD_LIST_CUSTODIO;
  if (!data) return { completed: 0, total: fieldList.length };
  let completed = 0;
  for (const f of fieldList) {
    const v = data[f];
    if (typeof v === 'boolean') { completed++; continue; }
    if (v && String(v).trim() !== '') completed++;
  }
  return { completed, total: fieldList.length };
}
