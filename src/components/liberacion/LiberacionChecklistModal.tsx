import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, Rocket, User, Car, Pencil, Database, Save } from 'lucide-react';
import { CustodioLiberacion } from '@/types/liberacion';
import { useCustodioLiberacion } from '@/hooks/useCustodioLiberacion';
import LiberacionProgressBar from './LiberacionProgressBar';
import { useToast } from '@/hooks/use-toast';
import { LiberacionWarningsDialog } from './LiberacionWarningsDialog';
import { LiberacionSuccessModal } from './LiberacionSuccessModal';
import { useDocumentosCandidato, TipoDocumento } from '@/hooks/useDocumentosCandidato';
import { useLatestEvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { usePersistedForm } from '@/hooks/usePersistedForm';

interface LiberacionChecklistModalProps {
  liberacion: CustodioLiberacion;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Interface para el estado persistible del draft
interface LiberacionDraftData {
  liberacion: Partial<CustodioLiberacion>;
  datosContacto: {
    nombre: string;
    telefono: string;
    email: string;
  };
  tieneVehiculoPropio: boolean;
}

const LiberacionChecklistModal = ({
  liberacion: initialLiberacion,
  isOpen,
  onClose,
  onSuccess,
}: LiberacionChecklistModalProps) => {
  const { updateChecklist, liberarCustodio, calculateProgress } = useCustodioLiberacion();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [currentWarnings, setCurrentWarnings] = useState<string[]>([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successData, setSuccessData] = useState<{
    candidato_nombre: string;
    candidato_email: string | null;
    candidato_telefono: string | null;
    invitation_token: string;
    emailSent: boolean;
  } | null>(null);

  // Hooks para obtener datos del workflow anterior
  const { data: documentosExistentes } = useDocumentosCandidato(initialLiberacion.candidato_id);
  const { data: evaluacionPsicometrica } = useLatestEvaluacionPsicometrica(initialLiberacion.candidato_id);

  // Track si los datos fueron prellenados
  const [prefillApplied, setPrefillApplied] = useState({ docs: false, psico: false });

  // Clave dinámica por candidato para evitar colisiones entre drafts
  const draftKey = `liberacion_checklist_${initialLiberacion.candidato_id}`;

  // Hook de persistencia con draft por candidato
  const {
    formData: draftData,
    updateFormData: updateDraft,
    hasDraft,
    clearDraft,
    getTimeSinceSave,
  } = usePersistedForm<LiberacionDraftData>({
    key: draftKey,
    initialData: {
      liberacion: initialLiberacion,
      datosContacto: {
        nombre: initialLiberacion.candidato?.nombre || '',
        telefono: initialLiberacion.candidato?.telefono || '',
        email: initialLiberacion.candidato?.email || '',
      },
      tieneVehiculoPropio: initialLiberacion.candidato?.vehiculo_propio ?? false,
    },
    hydrateOnMount: true,
    saveOnChangeDebounceMs: 800,
    isMeaningfulDraft: (data) => {
      // Consideramos significativo si hay al menos un checkbox marcado o datos editados
      const lib = data.liberacion;
      return !!(
        lib.documentacion_ine ||
        lib.documentacion_licencia ||
        lib.documentacion_antecedentes ||
        lib.documentacion_domicilio ||
        lib.documentacion_curp ||
        lib.documentacion_rfc ||
        lib.psicometricos_completado ||
        lib.toxicologicos_completado ||
        lib.vehiculo_capturado ||
        lib.instalacion_gps_completado ||
        (data.datosContacto.nombre && data.datosContacto.nombre !== initialLiberacion.candidato?.nombre) ||
        (data.datosContacto.email && data.datosContacto.email !== initialLiberacion.candidato?.email)
      );
    },
  });

  // Extraer datos del draft para uso local
  const liberacion = draftData.liberacion as CustodioLiberacion;
  const datosContacto = draftData.datosContacto;
  const tieneVehiculoPropio = draftData.tieneVehiculoPropio;

  // Mapeo de documentos validados a checkboxes
  const docPrefillData = useMemo(() => {
    if (!documentosExistentes) return null;
    
    const documentosValidos = documentosExistentes.filter(d => d.estado_validacion === 'valido');
    if (documentosValidos.length === 0) return null;

    const tiposValidos = documentosValidos.map(d => d.tipo_documento);
    
    return {
      documentacion_ine: tiposValidos.includes('ine_frente') || tiposValidos.includes('ine_reverso'),
      documentacion_licencia: tiposValidos.includes('licencia_frente') || tiposValidos.includes('licencia_reverso'),
      documentacion_antecedentes: tiposValidos.includes('carta_antecedentes'),
      documentacion_domicilio: tiposValidos.includes('comprobante_domicilio'),
      documentacion_curp: tiposValidos.includes('curp'),
      documentacion_rfc: tiposValidos.includes('rfc'),
      count: documentosValidos.length
    };
  }, [documentosExistentes]);

  // Mapeo de evaluación psicométrica
  const psicoPrefillData = useMemo(() => {
    if (!evaluacionPsicometrica) return null;
    
    const resultadoMap: Record<string, 'aprobado' | 'condicional' | 'rechazado'> = {
      'verde': 'aprobado',
      'ambar': 'condicional',
      'rojo': 'rechazado'
    };

    return {
      psicometricos_completado: evaluacionPsicometrica.estado === 'completado' || !!evaluacionPsicometrica.score_global,
      psicometricos_resultado: resultadoMap[evaluacionPsicometrica.resultado_semaforo] || undefined,
      psicometricos_puntaje: evaluacionPsicometrica.score_global
    };
  }, [evaluacionPsicometrica]);

  // Reset del draft cuando cambia el candidato
  useEffect(() => {
    updateDraft({
      liberacion: initialLiberacion,
      datosContacto: {
        nombre: initialLiberacion.candidato?.nombre || '',
        telefono: initialLiberacion.candidato?.telefono || '',
        email: initialLiberacion.candidato?.email || ''
      },
      tieneVehiculoPropio: initialLiberacion.candidato?.vehiculo_propio ?? false
    });
    setPrefillApplied({ docs: false, psico: false });
  }, [initialLiberacion.id]);

  // Prellenar documentación si hay datos del workflow
  useEffect(() => {
    if (docPrefillData && !prefillApplied.docs) {
      updateDraft(prev => ({
        ...prev,
        liberacion: {
          ...prev.liberacion,
          documentacion_ine: prev.liberacion.documentacion_ine || docPrefillData.documentacion_ine,
          documentacion_licencia: prev.liberacion.documentacion_licencia || docPrefillData.documentacion_licencia,
          documentacion_antecedentes: prev.liberacion.documentacion_antecedentes || docPrefillData.documentacion_antecedentes,
          documentacion_domicilio: prev.liberacion.documentacion_domicilio || docPrefillData.documentacion_domicilio,
          documentacion_curp: prev.liberacion.documentacion_curp || docPrefillData.documentacion_curp,
          documentacion_rfc: prev.liberacion.documentacion_rfc || docPrefillData.documentacion_rfc,
        }
      }));
      setPrefillApplied(prev => ({ ...prev, docs: true }));
    }
  }, [docPrefillData, prefillApplied.docs, updateDraft]);

  // Prellenar psicométricos si hay datos del workflow
  useEffect(() => {
    if (psicoPrefillData && !prefillApplied.psico) {
      updateDraft(prev => ({
        ...prev,
        liberacion: {
          ...prev.liberacion,
          psicometricos_completado: prev.liberacion.psicometricos_completado || psicoPrefillData.psicometricos_completado,
          psicometricos_resultado: prev.liberacion.psicometricos_resultado || psicoPrefillData.psicometricos_resultado,
          psicometricos_puntaje: prev.liberacion.psicometricos_puntaje || psicoPrefillData.psicometricos_puntaje,
        }
      }));
      setPrefillApplied(prev => ({ ...prev, psico: true }));
    }
  }, [psicoPrefillData, prefillApplied.psico, updateDraft]);

  const progress = calculateProgress(liberacion);

  const handleCheckboxChange = (field: keyof CustodioLiberacion, value: boolean) => {
    updateDraft(prev => ({
      ...prev,
      liberacion: { ...prev.liberacion, [field]: value }
    }));
  };

  const handleInputChange = (field: keyof CustodioLiberacion, value: any) => {
    updateDraft(prev => ({
      ...prev,
      liberacion: { ...prev.liberacion, [field]: value }
    }));
  };

  const handleContactoChange = (field: 'nombre' | 'telefono' | 'email', value: string) => {
    updateDraft(prev => ({
      ...prev,
      datosContacto: { ...prev.datosContacto, [field]: value }
    }));
  };

  const handleVehiculoPropioChange = (value: boolean) => {
    updateDraft(prev => ({
      ...prev,
      tieneVehiculoPropio: value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateChecklist.mutateAsync({
        id: liberacion.id,
        updates: liberacion,
        candidatoUpdates: {
          nombre: datosContacto.nombre,
          telefono: datosContacto.telefono,
          email: datosContacto.email || undefined,
          vehiculo_propio: tieneVehiculoPropio
        }
      });
      clearDraft(true); // Hard clear para evitar re-hidratación
      onSuccess();
    } catch (error) {
      console.error('Error guardando:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLiberar = async () => {
    // MODO FLEXIBLE: No validar progreso, liberar siempre
    // Los warnings se mostrarán automáticamente en el diálogo
    
    setIsSaving(true);
    try {
      const result = await liberarCustodio.mutateAsync({ 
        liberacion_id: liberacion.id,
        forzar: true // Modo flexible por defecto
      });
      
      // Si hay warnings, mostrar diálogo de warnings primero
      if (result.tiene_warnings && result.warnings.length > 0) {
        setCurrentWarnings(result.warnings);
        setShowWarnings(true);
        // Guardar datos para el modal de éxito
        setSuccessData({
          candidato_nombre: result.candidato_nombre,
          candidato_email: result.candidato_email,
          candidato_telefono: result.candidato_telefono,
          invitation_token: result.invitation_token,
          emailSent: result.emailSent
        });
        setIsSaving(false);
      } else {
        // Sin warnings - mostrar modal de éxito directamente
        clearDraft(true); // Limpiar borrador al liberar exitosamente
        setSuccessData({
          candidato_nombre: result.candidato_nombre,
          candidato_email: result.candidato_email,
          candidato_telefono: result.candidato_telefono,
          invitation_token: result.invitation_token,
          emailSent: result.emailSent
        });
        setShowSuccessModal(true);
        setIsSaving(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo liberar el custodio',
        variant: 'destructive'
      });
      setIsSaving(false);
    }
  };

  const handleConfirmWithWarnings = async () => {
    setShowWarnings(false);
    clearDraft(true); // Limpiar borrador al confirmar con warnings
    // Mostrar modal de éxito después de confirmar warnings
    setShowSuccessModal(true);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessData(null);
    onSuccess();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Checklist de Liberación
            {hasDraft && (
              <Badge variant="secondary" className="text-xs font-normal">
                <Save className="h-3 w-3 mr-1" />
                Borrador guardado {getTimeSinceSave()}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {datosContacto.nombre} - {datosContacto.telefono}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progreso General */}
          <LiberacionProgressBar progress={progress} />

          {/* Checklist Accordion */}
          <Accordion type="multiple" defaultValue={['contacto', 'docs', 'psico', 'toxico', 'vehiculo', 'gps']}>
            {/* 0. Información de Contacto - EDITABLE */}
            <AccordionItem value="contacto">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  <span>0. Información de Contacto</span>
                  <Pencil className="h-4 w-4 text-muted-foreground ml-1" />
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Puede editar los datos de contacto del candidato antes de liberarlo.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contacto_nombre">Nombre completo</Label>
                    <Input
                      id="contacto_nombre"
                      value={datosContacto.nombre}
                      onChange={(e) => handleContactoChange('nombre', e.target.value)}
                      placeholder="Nombre del candidato"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contacto_telefono">Teléfono</Label>
                    <Input
                      id="contacto_telefono"
                      value={datosContacto.telefono}
                      onChange={(e) => handleContactoChange('telefono', e.target.value)}
                      placeholder="10 dígitos"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contacto_email">Email</Label>
                    <Input
                      id="contacto_email"
                      type="email"
                      value={datosContacto.email}
                      onChange={(e) => handleContactoChange('email', e.target.value)}
                      placeholder="correo@ejemplo.com"
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 1. Documentación */}
            <AccordionItem value="docs">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  {progress.documentacion === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span>1. Documentación ({progress.documentacion}%)</span>
                  {docPrefillData && docPrefillData.count > 0 && (
                    <Badge variant="outline" className="ml-2 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                      <Database className="h-3 w-3 mr-1" />
                      {docPrefillData.count} prellenados
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: 'documentacion_ine', label: 'INE' },
                    { field: 'documentacion_licencia', label: 'Licencia' },
                    { field: 'documentacion_antecedentes', label: 'Antecedentes penales' },
                    { field: 'documentacion_domicilio', label: 'Comprobante domicilio' },
                    { field: 'documentacion_curp', label: 'CURP' },
                    { field: 'documentacion_rfc', label: 'RFC' },
                  ].map(({ field, label }) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={field}
                        checked={liberacion[field as keyof CustodioLiberacion] as boolean}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange(field as keyof CustodioLiberacion, checked as boolean)
                        }
                      />
                      <Label htmlFor={field}>{label}</Label>
                    </div>
                  ))}
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={liberacion.notas_documentacion || ''}
                    onChange={(e) => handleInputChange('notas_documentacion', e.target.value)}
                    rows={2}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 2. Psicométricos - OPCIONAL */}
            <AccordionItem value="psico">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  {progress.psicometricos === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span>2. Psicométricos ({progress.psicometricos}%)</span>
                  <Badge variant="secondary" className="ml-2 text-xs">Opcional</Badge>
                  {psicoPrefillData && (
                    <Badge variant="outline" className="ml-1 text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200">
                      <Database className="h-3 w-3 mr-1" />
                      Score: {psicoPrefillData.psicometricos_puntaje}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="psicometricos_completado"
                    checked={liberacion.psicometricos_completado}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('psicometricos_completado', checked as boolean)
                    }
                  />
                  <Label htmlFor="psicometricos_completado">Prueba completada</Label>
                </div>

                {liberacion.psicometricos_completado && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Resultado</Label>
                        <Select
                          value={liberacion.psicometricos_resultado || ''}
                          onValueChange={(value) => handleInputChange('psicometricos_resultado', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aprobado">Aprobado</SelectItem>
                            <SelectItem value="condicional">Condicional</SelectItem>
                            <SelectItem value="rechazado">Rechazado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Puntaje (0-100)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={liberacion.psicometricos_puntaje || ''}
                          onChange={(e) => handleInputChange('psicometricos_puntaje', parseFloat(e.target.value))}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>URL del archivo</Label>
                      <Input
                        value={liberacion.psicometricos_archivo_url || ''}
                        onChange={(e) => handleInputChange('psicometricos_archivo_url', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 3. Toxicológicos */}
            <AccordionItem value="toxico">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  {progress.toxicologicos === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span>3. Toxicológicos ({progress.toxicologicos}%)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="toxicologicos_completado"
                    checked={liberacion.toxicologicos_completado}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('toxicologicos_completado', checked as boolean)
                    }
                  />
                  <Label htmlFor="toxicologicos_completado">Prueba completada</Label>
                </div>

                {liberacion.toxicologicos_completado && (
                  <>
                    <div>
                      <Label>Resultado</Label>
                      <Select
                        value={liberacion.toxicologicos_resultado || ''}
                        onValueChange={(value) => handleInputChange('toxicologicos_resultado', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="negativo">Negativo</SelectItem>
                          <SelectItem value="positivo">Positivo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>URL del archivo</Label>
                      <Input
                        value={liberacion.toxicologicos_archivo_url || ''}
                        onChange={(e) => handleInputChange('toxicologicos_archivo_url', e.target.value)}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* 4. Vehículo - Siempre visible */}
            <AccordionItem value="vehiculo">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  {tieneVehiculoPropio ? (
                    progress.vehiculo === 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )
                  ) : (
                    <Car className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span>4. Vehículo ({tieneVehiculoPropio ? `${progress.vehiculo}%` : 'N/A'})</span>
                  {!tieneVehiculoPropio && (
                    <Badge variant="outline" className="ml-2 text-xs">No aplica</Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {/* Toggle para vehículo propio */}
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md">
                  <Checkbox
                    id="tiene_vehiculo_propio"
                    checked={tieneVehiculoPropio}
                    onCheckedChange={(checked) => handleVehiculoPropioChange(checked as boolean)}
                  />
                  <Label htmlFor="tiene_vehiculo_propio" className="font-medium">
                    El candidato tiene vehículo propio
                  </Label>
                </div>

                {/* Campos del vehículo - habilitados solo si tiene vehículo */}
                <div className={!tieneVehiculoPropio ? 'opacity-50 pointer-events-none' : ''}>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Marca</Label>
                      <Input
                        value={liberacion.vehiculo_marca || ''}
                        onChange={(e) => handleInputChange('vehiculo_marca', e.target.value)}
                        disabled={!tieneVehiculoPropio}
                      />
                    </div>
                    <div>
                      <Label>Modelo</Label>
                      <Input
                        value={liberacion.vehiculo_modelo || ''}
                        onChange={(e) => handleInputChange('vehiculo_modelo', e.target.value)}
                        disabled={!tieneVehiculoPropio}
                      />
                    </div>
                    <div>
                      <Label>Año</Label>
                      <Input
                        type="number"
                        value={liberacion.vehiculo_año || ''}
                        onChange={(e) => handleInputChange('vehiculo_año', parseInt(e.target.value))}
                        disabled={!tieneVehiculoPropio}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <Label>Placas</Label>
                      <Input
                        value={liberacion.vehiculo_placa || ''}
                        onChange={(e) => handleInputChange('vehiculo_placa', e.target.value)}
                        disabled={!tieneVehiculoPropio}
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input
                        value={liberacion.vehiculo_color || ''}
                        onChange={(e) => handleInputChange('vehiculo_color', e.target.value)}
                        disabled={!tieneVehiculoPropio}
                      />
                    </div>
                  </div>
                  <div className="space-y-2 mt-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vehiculo_tarjeta_circulacion"
                        checked={liberacion.vehiculo_tarjeta_circulacion}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('vehiculo_tarjeta_circulacion', checked as boolean)
                        }
                        disabled={!tieneVehiculoPropio}
                      />
                      <Label htmlFor="vehiculo_tarjeta_circulacion">Tarjeta de circulación</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vehiculo_poliza_seguro"
                        checked={liberacion.vehiculo_poliza_seguro}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('vehiculo_poliza_seguro', checked as boolean)
                        }
                        disabled={!tieneVehiculoPropio}
                      />
                      <Label htmlFor="vehiculo_poliza_seguro">Póliza de seguro</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vehiculo_capturado"
                        checked={liberacion.vehiculo_capturado}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('vehiculo_capturado', checked as boolean)
                        }
                        disabled={!tieneVehiculoPropio}
                      />
                      <Label htmlFor="vehiculo_capturado">Información completa</Label>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* 5. GPS */}
            <AccordionItem value="gps">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  {progress.gps === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span>5. GPS ({progress.gps}%)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instalacion_gps_completado"
                    checked={liberacion.instalacion_gps_completado}
                    onCheckedChange={(checked) => 
                      handleCheckboxChange('instalacion_gps_completado', checked as boolean)
                    }
                  />
                  <Label htmlFor="instalacion_gps_completado">Instalación completada</Label>
                </div>

                {liberacion.instalacion_gps_completado && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>IMEI</Label>
                        <Input
                          value={liberacion.gps_imei || ''}
                          onChange={(e) => handleInputChange('gps_imei', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Número de línea</Label>
                        <Input
                          value={liberacion.gps_numero_linea || ''}
                          onChange={(e) => handleInputChange('gps_numero_linea', e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Notas</Label>
                      <Textarea
                        value={liberacion.notas_gps || ''}
                        onChange={(e) => handleInputChange('notas_gps', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
          <Button
            onClick={handleLiberar}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            Liberar a Planificación
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Dialog de advertencias */}
      <LiberacionWarningsDialog
        open={showWarnings}
        warnings={currentWarnings}
        onConfirm={handleConfirmWithWarnings}
        onCancel={() => setShowWarnings(false)}
        isLoading={false}
      />

      {/* Modal de éxito con link de invitación */}
      {successData && (
        <LiberacionSuccessModal
          isOpen={showSuccessModal}
          onClose={handleCloseSuccessModal}
          data={successData}
        />
      )}
    </Dialog>
  );
};

export default LiberacionChecklistModal;
