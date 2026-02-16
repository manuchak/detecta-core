import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftRestoreBanner, DraftIndicator } from '@/components/ui/DraftAutoRestorePrompt';
import { IncidentTimeline } from './IncidentTimeline';
import { exportIncidentePDF } from './IncidentPDFExporter';
import {
  TIPOS_INCIDENTE, SEVERIDADES, CONTROLES,
  useCreateIncidente, useUpdateIncidente, useAddCronologiaEntry, useDeleteCronologiaEntry, useIncidenteCronologia,
  type IncidenteOperativo, type IncidenteFormData, type TipoEntradaCronologia,
} from '@/hooks/useIncidentesOperativos';

interface IncidentReportFormProps {
  incidente?: IncidenteOperativo | null;
  onBack: () => void;
}

const defaultFormData: IncidenteFormData = {
  tipo: '',
  severidad: '',
  descripcion: '',
  zona: '',
  atribuible_operacion: false,
  controles_activos: [],
  control_efectivo: false,
  cliente_nombre: '',
  acciones_tomadas: '',
  resolucion_notas: '',
};

export const IncidentReportForm: React.FC<IncidentReportFormProps> = ({ incidente, onBack }) => {
  const isEditing = !!incidente;
  const persistKey = isEditing ? `incident-report-${incidente.id}` : 'incident-report-new';

  const form = useForm<IncidenteFormData>({
    defaultValues: isEditing
      ? {
          tipo: incidente.tipo,
          severidad: incidente.severidad,
          descripcion: incidente.descripcion,
          zona: incidente.zona || '',
          atribuible_operacion: incidente.atribuible_operacion,
          controles_activos: incidente.controles_activos || [],
          control_efectivo: incidente.control_efectivo || false,
          cliente_nombre: incidente.cliente_nombre || '',
          acciones_tomadas: incidente.acciones_tomadas || '',
          resolucion_notas: incidente.resolucion_notas || '',
        }
      : defaultFormData,
  });

  const persistence = useFormPersistence<IncidenteFormData>({
    key: persistKey,
    initialData: defaultFormData,
    level: 'robust',
    ttl: 72 * 60 * 60 * 1000,
    form,
    enabled: !isEditing,
    moduleName: 'Reporte de Incidente',
    isMeaningful: (data) => !!(data.tipo || data.descripcion),
    getPreviewText: (data) => data.descripcion?.slice(0, 60) || data.tipo || '',
  });

  const createMutation = useCreateIncidente();
  const updateMutation = useUpdateIncidente();
  const addCronologiaMutation = useAddCronologiaEntry();
  const deleteCronologiaMutation = useDeleteCronologiaEntry();
  const { data: cronologia = [] } = useIncidenteCronologia(incidente?.id || null);

  const watchedValues = form.watch();

  const toggleControl = (ctrl: string) => {
    const current = form.getValues('controles_activos');
    const next = current.includes(ctrl)
      ? current.filter((c: string) => c !== ctrl)
      : [...current, ctrl];
    form.setValue('controles_activos', next, { shouldDirty: true });
  };

  const handleSaveDraft = async () => {
    const values = form.getValues();
    if (!values.tipo || !values.descripcion) {
      toast.error('Al menos tipo y descripción son requeridos para guardar borrador');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: incidente.id, ...values, estado: 'borrador' } as any);
      } else {
        const result = await createMutation.mutateAsync({ ...values, estado: 'borrador' } as any);
        persistence.clearDraft(true);
      }
      toast.success('Borrador guardado');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSubmit = async () => {
    const values = form.getValues();
    if (!values.tipo || !values.severidad || !values.descripcion) {
      toast.error('Completa tipo, severidad y descripción');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: incidente.id, ...values, estado: 'abierto' } as any);
      } else {
        await createMutation.mutateAsync({ ...values, estado: 'abierto' } as any);
        persistence.clearDraft(true);
      }
      toast.success('Incidente registrado');
      onBack();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClose = async () => {
    if (!isEditing) return;
    const values = form.getValues();
    try {
      await updateMutation.mutateAsync({
        id: incidente.id,
        ...values,
        estado: 'cerrado',
        fecha_resolucion: new Date().toISOString(),
      } as any);
      toast.success('Incidente cerrado');
      onBack();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddCronologia = async (entry: { timestamp: string; tipo_entrada: TipoEntradaCronologia; descripcion: string }) => {
    if (!incidente?.id) {
      toast.error('Guarda el incidente primero para agregar cronología');
      return;
    }
    try {
      await addCronologiaMutation.mutateAsync({ incidente_id: incidente.id, ...entry });
      toast.success('Entrada agregada a cronología');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteCronologia = async (id: string) => {
    if (!incidente?.id) return;
    try {
      await deleteCronologiaMutation.mutateAsync({ id, incidente_id: incidente.id });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExportPDF = () => {
    if (!incidente) return;
    exportIncidentePDF({ incidente, cronologia });
    toast.success('PDF generado');
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{isEditing ? 'Editar Incidente' : 'Nuevo Reporte de Incidente'}</h2>
            {isEditing && (
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-[10px]">{incidente.estado}</Badge>
                <span className="text-[10px] text-muted-foreground">ID: {incidente.id.slice(0, 8)}</span>
              </div>
            )}
          </div>
          {!isEditing && <DraftIndicator lastSaved={persistence.lastSaved} />}
        </div>
        <div className="flex items-center gap-2">
          {isEditing && (
            <Button variant="outline" size="sm" onClick={handleExportPDF} className="gap-1 h-8 text-xs">
              <FileText className="h-3 w-3" />
              PDF
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleSaveDraft} disabled={isPending} className="gap-1 h-8 text-xs">
            <Save className="h-3 w-3" />
            Guardar borrador
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className="gap-1 h-8 text-xs">
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            <Send className="h-3 w-3" />
            Registrar
          </Button>
          {isEditing && incidente.estado !== 'cerrado' && (
            <Button variant="destructive" size="sm" onClick={handleClose} disabled={isPending} className="h-8 text-xs">
              Cerrar incidente
            </Button>
          )}
        </div>
      </div>

      {/* Draft restore banner */}
      {!isEditing && (
        <DraftRestoreBanner
          visible={persistence.showRestorePrompt}
          savedAt={persistence.lastSaved}
          previewText={persistence.previewText}
          moduleName="Reporte de Incidente"
          onRestore={persistence.acceptRestore}
          onDiscard={persistence.rejectRestore}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Form fields */}
        <div className="lg:col-span-2 space-y-4">
          {/* Datos generales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datos Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo *</Label>
                  <Select value={watchedValues.tipo} onValueChange={v => form.setValue('tipo', v, { shouldDirty: true })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_INCIDENTE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Severidad *</Label>
                  <Select value={watchedValues.severidad} onValueChange={v => form.setValue('severidad', v, { shouldDirty: true })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>
                      {SEVERIDADES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Zona</Label>
                  <Input {...form.register('zona')} placeholder="Ej: CDMX Norte" className="h-8 text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cliente</Label>
                  <Input {...form.register('cliente_nombre')} placeholder="Nombre cliente" className="h-8 text-xs" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción *</Label>
                <Textarea {...form.register('descripcion')} placeholder="Describe lo ocurrido..." rows={3} className="text-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Cronología */}
          <Card>
            <CardContent className="pt-4">
              <IncidentTimeline
                entries={cronologia}
                onAddEntry={handleAddCronologia}
                onDeleteEntry={handleDeleteCronologia}
                isAdding={addCronologiaMutation.isPending}
                readOnly={!isEditing}
              />
              {!isEditing && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  Guarda el incidente para poder agregar entradas a la cronología
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Controls & Resolution */}
        <div className="space-y-4">
          {/* Controles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Controles y Atribución</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={watchedValues.atribuible_operacion}
                  onCheckedChange={v => form.setValue('atribuible_operacion', !!v, { shouldDirty: true })}
                />
                <Label className="text-xs">Atribuible a la operación</Label>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Controles activos al momento</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CONTROLES.map(ctrl => (
                    <button
                      key={ctrl}
                      type="button"
                      onClick={() => toggleControl(ctrl)}
                      className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
                        watchedValues.controles_activos.includes(ctrl)
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      {ctrl}
                    </button>
                  ))}
                </div>
              </div>

              {watchedValues.controles_activos.length > 0 && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={watchedValues.control_efectivo}
                    onCheckedChange={v => form.setValue('control_efectivo', !!v, { shouldDirty: true })}
                  />
                  <Label className="text-xs">Los controles fueron efectivos</Label>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Acciones tomadas</Label>
                <Textarea {...form.register('acciones_tomadas')} placeholder="Describe acciones..." rows={2} className="text-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Resolución */}
          {isEditing && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resolución</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Notas de resolución</Label>
                  <Textarea {...form.register('resolucion_notas')} placeholder="Notas sobre cómo se resolvió..." rows={3} className="text-xs" />
                </div>
                {incidente.fecha_resolucion && (
                  <p className="text-[10px] text-muted-foreground">
                    Resuelto: {new Date(incidente.fecha_resolucion).toLocaleDateString('es-MX')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
