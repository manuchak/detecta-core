import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Send, FileText, Loader2, Search, Info, HelpCircle, PenTool, Trash2 } from 'lucide-react';
import { SignaturePad } from '@/components/custodian/checklist/SignaturePad';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftRestoreBanner, DraftIndicator } from '@/components/ui/DraftAutoRestorePrompt';
import { IncidentTimeline, type LocalTimelineEntry } from './IncidentTimeline';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ServiceDataSummary } from './ServiceDataSummary';
import { LocationPicker } from './LocationPicker';
import { IncidentClassificationGuide } from './IncidentClassificationGuide';
import { exportIncidentePDF } from './IncidentPDFExporter';
import { useServicioLookup } from '@/hooks/useServicioLookup';
import { useAuth } from '@/contexts/AuthContext';
import {
  TIPOS_INCIDENTE, SEVERIDADES, CONTROLES,
  useCreateIncidente, useUpdateIncidente, useAddCronologiaEntry, useDeleteCronologiaEntry, useIncidenteCronologia, useDeleteIncidente,
  type IncidenteOperativo, type IncidenteFormData, type TipoEntradaCronologia,
} from '@/hooks/useIncidentesOperativos';

interface IncidentReportFormProps {
  incidente?: IncidenteOperativo | null;
  onBack: () => void;
}

interface ExtendedFormData extends IncidenteFormData {
  id_servicio_texto: string;
  id_servicio_input: string; // Correccion 1: persist search input
  ubicacion_lat: number | null;
  ubicacion_lng: number | null;
}

const TIMELINE_TTL_MS = 72 * 60 * 60 * 1000; // 72h aligned with form TTL

/** Convert a File to base64 data URL */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/** Serialize timeline entries, converting images to base64 for persistence */
const serializeTimelineEntries = async (entries: LocalTimelineEntry[]) => {
  const MAX_IMAGES = 5;
  let imageCount = 0;
  const serializedEntries = [];
  for (const { imagenFile, imagenPreview, ...rest } of entries) {
    const entry: Record<string, any> = { ...rest };
    if (imagenFile && imageCount < MAX_IMAGES) {
      try {
        entry.base64Image = await fileToBase64(imagenFile);
        entry.fileName = imagenFile.name;
        entry.fileType = imagenFile.type;
        imageCount++;
      } catch {
        // If conversion fails, just skip the image
      }
    }
    serializedEntries.push(entry);
  }
  return { timestamp: Date.now(), entries: serializedEntries };
};

const deserializeTimelineEntries = (raw: string): LocalTimelineEntry[] => {
  try {
    const parsed = JSON.parse(raw);
    // TTL check
    if (parsed.timestamp && Date.now() - parsed.timestamp > TIMELINE_TTL_MS) return [];
    const entries = (parsed.entries || []) as any[];
    return entries.map((entry) => {
      if (entry.base64Image) {
        // Reconstruct File from base64 synchronously via data URL
        try {
          const byteString = atob(entry.base64Image.split(',')[1]);
          const mimeType = entry.fileType || 'image/png';
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          const blob = new Blob([ab], { type: mimeType });
          const file = new File([blob], entry.fileName || 'restored.png', { type: mimeType });
          return {
            ...entry,
            imagenFile: file,
            imagenPreview: entry.base64Image, // use base64 directly as preview src
            base64Image: undefined,
            fileName: undefined,
            fileType: undefined,
          } as LocalTimelineEntry;
        } catch {
          return entry as LocalTimelineEntry;
        }
      }
      return entry as LocalTimelineEntry;
    });
  } catch {
    try { return JSON.parse(raw) as LocalTimelineEntry[]; } catch { return []; }
  }
};

const defaultFormData: ExtendedFormData = {
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
  id_servicio_texto: '',
  id_servicio_input: '',
  ubicacion_lat: null,
  ubicacion_lng: null,
};

export const IncidentReportForm: React.FC<IncidentReportFormProps> = ({ incidente, onBack }) => {
  const isEditing = !!incidente;
  const persistKey = isEditing ? `incident-report-${incidente.id}` : 'incident-report-new';
  const { userRole, user } = useAuth();
  const timelineKey = `${persistKey}_timeline`;

  // Firma digital de creación
  const [firmaCreacion, setFirmaCreacion] = useState<string | null>(null);
  // Firma digital de cierre
  const [firmaCierre, setFirmaCierre] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // Correccion 3: exit confirmation state
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const canDelete = isEditing && ['admin', 'owner'].includes(userRole || '');

  const form = useForm<ExtendedFormData>({
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
          id_servicio_texto: (incidente as any).id_servicio_texto || '',
          id_servicio_input: (incidente as any).id_servicio_texto || '',
          ubicacion_lat: (incidente as any).ubicacion_lat || null,
          ubicacion_lng: (incidente as any).ubicacion_lng || null,
        }
      : defaultFormData,
  });

  const persistence = useFormPersistence<ExtendedFormData>({
    key: persistKey,
    initialData: defaultFormData,
    level: 'robust',
    ttl: 72 * 60 * 60 * 1000,
    debounceMs: 300,
    form,
    enabled: true,
    moduleName: 'Reporte de Incidente',
    isMeaningful: (data) => !!(data.tipo || data.descripcion),
    getPreviewText: (data) => data.descripcion?.slice(0, 60) || data.tipo || '',
  });

  // Local timeline entries (Bloque 3)
  const [localTimelineEntries, setLocalTimelineEntries] = useState<LocalTimelineEntry[]>(() => {
    // Initialize from storage synchronously to avoid race conditions
    try {
      const sessionStored = sessionStorage.getItem(`${isEditing ? `incident-report-${incidente.id}` : 'incident-report-new'}_timeline`);
      const localStored = localStorage.getItem(`${isEditing ? `incident-report-${incidente.id}` : 'incident-report-new'}_timeline`);
      const raw = sessionStored || localStored;
      if (raw) {
        const entries = deserializeTimelineEntries(raw);
        return entries;
      }
    } catch {}
    return [];
  });
  const [timelineRestored, setTimelineRestored] = useState(false);

  // Cambio 3 (plan): Auto-restore form draft silently on mount (defense-in-depth)
  const hasAutoRestored = useRef(false);
  useEffect(() => {
    if (hasAutoRestored.current || isEditing) return;
    hasAutoRestored.current = true;
    // Give useFormPersistence a tick to restore first
    const timer = setTimeout(() => {
      const currentValues = form.getValues();
      const isFormEmpty = !currentValues.tipo && !currentValues.descripcion;
      if (!isFormEmpty) return; // useFormPersistence already restored

      // Try to restore from storage manually
      try {
        const raw = sessionStorage.getItem(persistKey) || localStorage.getItem(persistKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          const draftData = parsed?.data || parsed;
          if (draftData && (draftData.tipo || draftData.descripcion)) {
            form.reset({ ...defaultFormData, ...draftData });
            toast.info('Borrador restaurado automáticamente');
            console.log('[IncidentForm] Auto-restored draft from storage');
          }
        }
      } catch (e) {
        console.warn('[IncidentForm] Failed to auto-restore draft:', e);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [form, isEditing, persistKey]);

  // Images are now restored from base64 — no lost-image toast needed

  // Service lookup (Bloque 1) — synced with form for persistence
  const { servicio, isSearching, error: servicioError, buscarServicio } = useServicioLookup();
  const idServicioInput = form.watch('id_servicio_input') ?? '';
  const setIdServicioInput = useCallback((val: string) => {
    form.setValue('id_servicio_input', val, { shouldDirty: true });
  }, [form]);

  const createMutation = useCreateIncidente();
  const updateMutation = useUpdateIncidente();
  const deleteMutation = useDeleteIncidente();
  const addCronologiaMutation = useAddCronologiaEntry();
  const deleteCronologiaMutation = useDeleteCronologiaEntry();
  const { data: cronologia = [] } = useIncidenteCronologia(incidente?.id || null);

  const watchedValues = form.watch();

  // Bloque 4: beforeunload + visibilitychange
  useEffect(() => {
    const handleBeforeUnload = () => {
      persistence.saveDraft();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistence.saveDraft();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [persistence]);

  // Auto-search service when draft is restored with a saved id_servicio_input
  const hasAutoSearched = useRef(false);
  useEffect(() => {
    if (hasAutoSearched.current) return;
    const savedInput = form.getValues('id_servicio_input');
    if (savedInput && savedInput.trim() && !servicio && !isSearching) {
      hasAutoSearched.current = true;
      buscarServicio(savedInput).then(result => {
        if (result) {
          form.setValue('id_servicio_texto', result.id_servicio, { shouldDirty: false });
          form.setValue('cliente_nombre', result.nombre_cliente || '', { shouldDirty: false });
          if (result.origen) {
            form.setValue('zona', result.origen, { shouldDirty: false });
          }
        }
      });
    }
  }, [form, servicio, isSearching, buscarServicio]);

  // Bloque 1: Auto-fill from service
  const handleSearchServicio = async () => {
    const result = await buscarServicio(idServicioInput);
    if (result) {
      form.setValue('id_servicio_texto', result.id_servicio, { shouldDirty: true });
      form.setValue('cliente_nombre', result.nombre_cliente || '', { shouldDirty: true });
      if (result.origen) {
        form.setValue('zona', result.origen, { shouldDirty: true });
      }
      toast.success(`Servicio ${result.id_servicio} vinculado`);
    }
  };

  const toggleControl = (ctrl: string) => {
    const current = form.getValues('controles_activos');
    const next = current.includes(ctrl)
      ? current.filter((c: string) => c !== ctrl)
      : [...current, ctrl];
    form.setValue('controles_activos', next, { shouldDirty: true });
  };

  // Correccion 2: Dual backup for local timeline entries with TTL (async for base64)
  const persistLocalEntries = useCallback(async () => {
    try {
      const data = await serializeTimelineEntries(localTimelineEntries);
      const serialized = JSON.stringify(data);
      localStorage.setItem(timelineKey, serialized);
      sessionStorage.setItem(timelineKey, serialized); // dual backup
    } catch {}
  }, [localTimelineEntries, timelineKey]);

  useEffect(() => {
    persistLocalEntries();
  }, [persistLocalEntries]);

  useEffect(() => {
    return () => {
      localTimelineEntries.forEach(entry => {
        if (entry.imagenPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(entry.imagenPreview);
        }
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddCronologia = async (entry: { timestamp: string; tipo_entrada: TipoEntradaCronologia; descripcion: string; imagen?: File; ubicacion_lat?: number | null; ubicacion_lng?: number | null; ubicacion_texto?: string | null }) => {
    if (isEditing && incidente?.id) {
      try {
        await addCronologiaMutation.mutateAsync({
          incidente_id: incidente.id,
          timestamp: entry.timestamp,
          tipo_entrada: entry.tipo_entrada,
          descripcion: entry.descripcion,
          imagen: entry.imagen,
          ubicacion_lat: entry.ubicacion_lat,
          ubicacion_lng: entry.ubicacion_lng,
          ubicacion_texto: entry.ubicacion_texto,
        });
        toast.success('Entrada agregada a cronología');
      } catch (err: any) {
        toast.error(err.message);
      }
    } else {
      const localEntry: LocalTimelineEntry = {
        localId: crypto.randomUUID(),
        timestamp: entry.timestamp,
        tipo_entrada: entry.tipo_entrada,
        descripcion: entry.descripcion,
        imagenFile: entry.imagen,
        imagenPreview: entry.imagen ? URL.createObjectURL(entry.imagen) : undefined,
        ubicacion_lat: entry.ubicacion_lat,
        ubicacion_lng: entry.ubicacion_lng,
        ubicacion_texto: entry.ubicacion_texto,
      };
      setLocalTimelineEntries(prev => [...prev, localEntry]);
      toast.success('Entrada agregada (se guardará con el incidente)');
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

  const handleDeleteLocalEntry = (localId: string) => {
    setLocalTimelineEntries(prev => prev.filter(e => e.localId !== localId));
  };

  const buildPayload = () => {
    const values = form.getValues();
    const payload: Record<string, any> = {
      tipo: values.tipo,
      severidad: values.severidad,
      descripcion: values.descripcion,
      zona: values.zona,
      atribuible_operacion: values.atribuible_operacion,
      controles_activos: values.controles_activos,
      control_efectivo: values.control_efectivo,
      cliente_nombre: values.cliente_nombre,
      acciones_tomadas: values.acciones_tomadas,
      resolucion_notas: values.resolucion_notas,
      id_servicio_texto: values.id_servicio_texto || null,
      ubicacion_lat: values.ubicacion_lat,
      ubicacion_lng: values.ubicacion_lng,
    };
    payload.reportado_por = user?.id || null;
    if (servicio) {
      payload.servicio_planificado_id = servicio.id;
      payload.custodio_id = servicio.custodio_id;
    }
    return payload;
  };

  const persistCronologiaEntries = async (incidenteId: string) => {
    if (localTimelineEntries.length === 0) return;
    for (const entry of localTimelineEntries) {
      await addCronologiaMutation.mutateAsync({
        incidente_id: incidenteId,
        timestamp: entry.timestamp,
        tipo_entrada: entry.tipo_entrada,
        descripcion: entry.descripcion,
        imagen: entry.imagenFile,
        ubicacion_lat: entry.ubicacion_lat,
        ubicacion_lng: entry.ubicacion_lng,
        ubicacion_texto: entry.ubicacion_texto,
      });
    }
    setLocalTimelineEntries([]);
    localStorage.removeItem(timelineKey);
    sessionStorage.removeItem(timelineKey);
  };

  const handleSaveDraft = async () => {
    const values = form.getValues();
    if (!values.tipo || !values.descripcion) {
      toast.error('Al menos tipo y descripción son requeridos para guardar borrador');
      return;
    }

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: incidente.id, ...buildPayload(), estado: 'borrador' } as any);
        await persistCronologiaEntries(incidente.id);
      } else {
        const result = await createMutation.mutateAsync({ ...buildPayload(), estado: 'borrador' } as any);
        await persistCronologiaEntries(result.id);
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
    if (!firmaCreacion) {
      toast.error('Firma digital requerida para registrar el incidente');
      return;
    }

    const firmaPayload = {
      firma_creacion_base64: firmaCreacion,
      firma_creacion_email: user?.email || null,
      firma_creacion_timestamp: new Date().toISOString(),
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: incidente.id, ...buildPayload(), ...firmaPayload, estado: 'abierto' } as any);
        await persistCronologiaEntries(incidente.id);
      } else {
        const result = await createMutation.mutateAsync({ ...buildPayload(), ...firmaPayload, estado: 'abierto' } as any);
        await persistCronologiaEntries(result.id);
        persistence.clearDraft(true);
      }
      toast.success('Incidente registrado');
      onBack();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClose = async () => {
    if (!isEditing || !firmaCierre) return;
    try {
      await updateMutation.mutateAsync({
        id: incidente.id,
        ...buildPayload(),
        estado: 'cerrado',
        fecha_resolucion: new Date().toISOString(),
        firma_cierre_base64: firmaCierre,
        firma_cierre_email: user?.email || null,
        firma_cierre_timestamp: new Date().toISOString(),
      } as any);
      toast.success('Incidente cerrado');
      setShowCloseDialog(false);
      onBack();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleExportPDF = async () => {
    if (!incidente) return;
    try {
      await exportIncidentePDF({ incidente, cronologia, servicio: servicio || undefined });
      toast.success('PDF generado');
    } catch (err: any) {
      toast.error('Error al generar PDF');
      console.error(err);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Correccion 3: Guard onBack with exit confirmation
  const hasUnsavedWork = persistence.hasDraft || form.formState.isDirty || localTimelineEntries.length > 0;
  const handleBack = () => {
    if (hasUnsavedWork) {
      setShowExitConfirm(true);
    } else {
      onBack();
    }
  };

  return (
    <div className="space-y-4">
      {/* Correccion 3: Exit confirmation dialog */}
      <AlertDialog open={showExitConfirm} onOpenChange={setShowExitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Salir sin guardar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios sin guardar en este reporte. Si sales ahora, el borrador se conservará automáticamente para que puedas continuar después.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Seguir editando</AlertDialogCancel>
            <AlertDialogAction onClick={onBack}>Salir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
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
          <DraftIndicator lastSaved={persistence.lastSaved} />
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
          <Button size="sm" onClick={handleSubmit} disabled={isPending} className={`gap-1 h-8 text-xs ${!firmaCreacion && !incidente?.firma_creacion_base64 ? 'opacity-70' : ''}`}>
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            <Send className="h-3 w-3" />
            Registrar
            {!firmaCreacion && !incidente?.firma_creacion_base64 && (
              <Badge variant="outline" className="text-[8px] h-4 px-1 ml-1 border-amber-400 text-amber-600">Falta firma</Badge>
            )}
          </Button>
          {isEditing && incidente.estado !== 'cerrado' && ['admin', 'owner', 'coordinador_operaciones'].includes(userRole || '') && (
            <Button variant="destructive" size="sm" onClick={() => setShowCloseDialog(true)} disabled={isPending} className="h-8 text-xs">
              Cerrar incidente
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={isPending} className="gap-1 h-8 text-xs">
              <Trash2 className="h-3 w-3" />
              Eliminar
            </Button>
          )}
        </div>
      </div>

      {/* Draft restore banner */}
      <DraftRestoreBanner
        visible={persistence.showRestorePrompt}
        savedAt={persistence.lastSaved}
        previewText={persistence.previewText}
        moduleName="Reporte de Incidente"
        onRestore={persistence.acceptRestore}
        onDiscard={persistence.rejectRestore}
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Left column (60%) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Bloque 1: Vincular servicio */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Vincular Servicio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={idServicioInput}
                  onChange={e => setIdServicioInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearchServicio()}
                  placeholder="Ej: YOCOYTM-273"
                  className="h-8 text-xs flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSearchServicio}
                  disabled={isSearching || !idServicioInput.trim()}
                  className="h-8 text-xs gap-1"
                >
                  {isSearching ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  Buscar
                </Button>
              </div>
              {servicioError && (
                <p className="text-[10px] text-destructive">{servicioError}</p>
              )}
              {servicio && <ServiceDataSummary servicio={servicio} />}
            </CardContent>
          </Card>

          {/* Datos generales */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Datos Generales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <IncidentClassificationGuide />

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tipo *</Label>
                  <Select value={watchedValues.tipo} onValueChange={v => form.setValue('tipo', v, { shouldDirty: true })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent className="w-[420px]">
                      {TIPOS_INCIDENTE.map(t => (
                        <SelectItem key={t.value} value={t.value} className="py-2.5 whitespace-normal">
                          <div className="max-w-[370px]">
                            <span className="text-xs font-medium">{t.label}</span>
                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{t.descripcion}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Severidad *</Label>
                  <Select value={watchedValues.severidad} onValueChange={v => form.setValue('severidad', v, { shouldDirty: true })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent className="w-[420px]">
                      {SEVERIDADES.map(s => (
                        <SelectItem key={s.value} value={s.value} className="py-2.5 whitespace-normal">
                          <div className="max-w-[370px]">
                            <span className="text-xs font-medium">{s.label}</span>
                            <p className="text-[10px] text-muted-foreground leading-snug mt-0.5">{s.descripcion}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cliente</Label>
                  <Input {...form.register('cliente_nombre')} placeholder="Nombre cliente" className="h-8 text-xs" />
                </div>
              </div>

              {/* Contextual info for selected tipo/severidad */}
              <div className="grid grid-cols-2 gap-3">
                {watchedValues.tipo && (() => {
                  const selected = TIPOS_INCIDENTE.find(t => t.value === watchedValues.tipo);
                  return selected ? (
                    <div className="rounded-md bg-muted/50 border border-border p-2 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                        {selected.descripcion}
                      </p>
                      <p className="text-[10px] text-muted-foreground italic pl-4">Ej: {selected.ejemplo}</p>
                    </div>
                  ) : null;
                })()}
                {watchedValues.severidad && (() => {
                  const selected = SEVERIDADES.find(s => s.value === watchedValues.severidad);
                  return selected ? (
                    <div className="rounded-md bg-muted/50 border border-border p-2 space-y-0.5">
                      <p className="text-[10px] text-muted-foreground flex items-start gap-1">
                        <Info className="h-3 w-3 mt-0.5 shrink-0 text-primary" />
                        {selected.descripcion}
                      </p>
                      <p className="text-[10px] text-muted-foreground italic pl-4">Ej: {selected.ejemplo}</p>
                    </div>
                  ) : null;
                })()}
              </div>

              {/* Location - full width */}
              <div className="space-y-1.5">
                <Label className="text-xs">Ubicación / Zona</Label>
                <LocationPicker
                  value={watchedValues.zona}
                  lat={watchedValues.ubicacion_lat}
                  lng={watchedValues.ubicacion_lng}
                  onChange={({ zona, lat, lng }) => {
                    form.setValue('zona', zona, { shouldDirty: true });
                    form.setValue('ubicacion_lat', lat, { shouldDirty: true });
                    form.setValue('ubicacion_lng', lng, { shouldDirty: true });
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Descripción *</Label>
                <Textarea {...form.register('descripcion')} placeholder="Describe lo ocurrido..." rows={3} className="text-xs" />
              </div>
            </CardContent>
          </Card>

          {/* Resolution (only when editing) */}
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
                {incidente?.fecha_resolucion && (
                  <p className="text-[10px] text-muted-foreground">
                    Resuelto: {new Date(incidente.fecha_resolucion).toLocaleDateString('es-MX')}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Firma digital de creación */}
          {(!isEditing || (isEditing && !incidente?.firma_creacion_base64)) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <PenTool className="h-4 w-4 text-primary" />
                  Firma de Creación
                </CardTitle>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  La firma es <span className="font-semibold text-foreground">requerida para Registrar</span> (cambiar estado a abierto).
                  Puedes <span className="font-semibold text-foreground">Guardar borrador sin firmar</span>.
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <SignaturePad value={firmaCreacion} onChange={setFirmaCreacion} />
              </CardContent>
            </Card>
          )}
          {isEditing && incidente?.firma_creacion_base64 && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs font-medium">✅ Firma de creación</p>
                <img src={incidente.firma_creacion_base64} alt="Firma creación" className="h-16 border rounded" />
                <p className="text-[10px] text-muted-foreground">
                  {incidente.firma_creacion_email} — {incidente.firma_creacion_timestamp ? format(new Date(incidente.firma_creacion_timestamp), 'dd/MM/yy HH:mm', { locale: es }) : ''}
                </p>
              </CardContent>
            </Card>
          )}
          {isEditing && incidente?.firma_cierre_base64 && (
            <Card>
              <CardContent className="pt-4 space-y-2">
                <p className="text-xs font-medium">🔒 Firma de cierre</p>
                <img src={incidente.firma_cierre_base64} alt="Firma cierre" className="h-16 border rounded" />
                <p className="text-[10px] text-muted-foreground">
                  {incidente.firma_cierre_email} — {incidente.firma_cierre_timestamp ? format(new Date(incidente.firma_cierre_timestamp), 'dd/MM/yy HH:mm', { locale: es }) : ''}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column (40%) - Controles y Cronología */}
        <div className="lg:col-span-2 space-y-4">
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-[240px]">
                      <p className="text-xs">Marcar si el incidente fue causado o pudo prevenirse por acciones operativas internas de la empresa.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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

          {/* Cronología */}
          <Card>
            <CardContent className="pt-4">
              <IncidentTimeline
                entries={cronologia}
                localEntries={localTimelineEntries}
                onAddEntry={handleAddCronologia}
                onDeleteEntry={handleDeleteCronologia}
                onDeleteLocalEntry={handleDeleteLocalEntry}
                isAdding={addCronologiaMutation.isPending}
                readOnly={false}
              />
              {!isEditing && localTimelineEntries.length > 0 && (
                <p className="text-[10px] text-muted-foreground mt-2 text-center">
                  {localTimelineEntries.length} entrada(s) pendiente(s) — se guardarán al registrar el incidente
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AlertDialog para cierre con firma */}
      <AlertDialog open={showCloseDialog} onOpenChange={(open) => { if (!open) { setShowCloseDialog(false); setFirmaCierre(null); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cierre de incidente</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cambiará el estado a cerrado. Firma digital requerida para confirmar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <SignaturePad value={firmaCierre} onChange={setFirmaCierre} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClose} disabled={!firmaCierre || updateMutation.isPending}>
              {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Cerrar incidente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog para eliminar incidente */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar incidente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se eliminará el incidente y toda su cronología asociada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!incidente?.id) return;
                try {
                  await deleteMutation.mutateAsync(incidente.id);
                  toast.success('Incidente eliminado');
                  onBack();
                } catch (err: any) {
                  toast.error(err.message || 'Error al eliminar');
                }
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Eliminar permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
