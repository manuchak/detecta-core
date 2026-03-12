import { useState, useEffect, useMemo, useRef } from 'react';
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
import { Loader2, CheckCircle2, Rocket, User, Car, Pencil, Database, Save, XCircle, AlertTriangle, Info } from 'lucide-react';
import { CustodioLiberacion } from '@/types/liberacion';
import { useCustodioLiberacion } from '@/hooks/useCustodioLiberacion';
import LiberacionProgressBar from './LiberacionProgressBar';
import { useToast } from '@/hooks/use-toast';
import { LiberacionWarningsDialog } from './LiberacionWarningsDialog';
import { LiberacionSuccessModal } from './LiberacionSuccessModal';
import { useDocumentosCandidato, TipoDocumento } from '@/hooks/useDocumentosCandidato';
import { useLatestEvaluacionPsicometrica } from '@/hooks/useEvaluacionesPsicometricas';
import { useContratosProgress } from '@/hooks/useContratosCandidato';
import { useCapacitacion } from '@/hooks/useCapacitacion';
import { useLatestEstudioSocioeconomico } from '@/hooks/useEstudioSocioeconomico';
import { usePersistedForm } from '@/hooks/usePersistedForm';
import { useCandidatoUbicacion } from '@/hooks/useCandidatoUbicacion';
import { useEstadosYCiudades } from '@/hooks/useEstadosYCiudades';
import { MapPin, Home, AlertCircle } from 'lucide-react';

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
  ubicacion: {
    direccion: string;
    estadoId: string;
    ciudad: string;
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
  const esArmadoLib = initialLiberacion.tipo_operativo === 'armado';
  const vehiculoPropioLib = initialLiberacion.candidato?.vehiculo_propio ?? false;
  const tieneVehiculoLib = esArmadoLib ? vehiculoPropioLib : true;
  const { isComplete: contratosCompletos } = useContratosProgress(initialLiberacion.candidato_id, vehiculoPropioLib, tieneVehiculoLib);
  const { calcularProgresoGeneral } = useCapacitacion(initialLiberacion.candidato_id);
  const latestSocioeconomico = useLatestEstudioSocioeconomico(initialLiberacion.candidato_id);
  
  // Hook para obtener ubicación desde leads (entrevista)
  const { data: ubicacionCandidato, isLoading: loadingUbicacion } = useCandidatoUbicacion(initialLiberacion.candidato_id);
  const { estados, loadingEstados } = useEstadosYCiudades();

  // ✅ FIX: Guard para evitar reset durante hidratación del hook
  const hydrationCompleteRef = useRef(false);
  
  // ✅ FIX: Refs para memoizar prefill y evitar ejecuciones redundantes
  const lastDocPrefillHashRef = useRef<string>('');
  const lastPsicoPrefillHashRef = useRef<string>('');

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
      ubicacion: {
        direccion: initialLiberacion.direccion_residencia || '',
        estadoId: initialLiberacion.estado_residencia_id || '',
        ciudad: initialLiberacion.ciudad_residencia || '',
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
  const ubicacion = draftData.ubicacion;
  const tieneVehiculoPropio = draftData.tieneVehiculoPropio;

  // Mapeo de documentos validados a checkboxes
  const docPrefillData = useMemo(() => {
    if (!documentosExistentes) return null;
    
    const documentosValidos = documentosExistentes.filter(d => d.estado_validacion === 'valido');
    if (documentosValidos.length === 0) return null;

    const tiposValidos = documentosValidos.map(d => d.tipo_documento);
    const esArmado = liberacion.tipo_operativo === 'armado';
    
    return {
      documentacion_ine: tiposValidos.includes('ine_frente') || tiposValidos.includes('ine_reverso'),
      documentacion_licencia: esArmado 
        ? (tiposValidos.includes('portacion_arma') || tiposValidos.includes('registro_arma'))
        : (tiposValidos.includes('licencia_frente') || tiposValidos.includes('licencia_reverso')),
      documentacion_antecedentes: tiposValidos.includes('carta_antecedentes'),
      documentacion_domicilio: tiposValidos.includes('comprobante_domicilio'),
      
      documentacion_rfc: tiposValidos.includes('rfc'),
      count: documentosValidos.length
    };
  }, [documentosExistentes, liberacion.tipo_operativo]);

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

  // ✅ FIX: Esperar hidratación antes de inicializar desde servidor
  // Esto evita race condition donde se sobrescribe el draft durante hydration
  useEffect(() => {
    // Reset refs al cambiar de candidato
    hydrationCompleteRef.current = false;
    lastDocPrefillHashRef.current = '';
    lastPsicoPrefillHashRef.current = '';
    
    // Dar tiempo al hook de persistencia para hidratar (50ms es suficiente)
    const timer = setTimeout(() => {
      hydrationCompleteRef.current = true;
      
      if (!hasDraft) {
        // No existing draft - initialize from server data
        console.log('📋 [LiberacionChecklist] No draft found, initializing from server');
        updateDraft({
          liberacion: initialLiberacion,
          datosContacto: {
            nombre: initialLiberacion.candidato?.nombre || '',
            telefono: initialLiberacion.candidato?.telefono || '',
            email: initialLiberacion.candidato?.email || ''
          },
          ubicacion: {
            direccion: initialLiberacion.direccion_residencia || '',
            estadoId: initialLiberacion.estado_residencia_id || '',
            ciudad: initialLiberacion.ciudad_residencia || '',
          },
          tieneVehiculoPropio: initialLiberacion.candidato?.vehiculo_propio ?? false
        });
      } else {
        console.log('📋 [LiberacionChecklist] Existing draft found, merging server TRUE values');
        // Merge: server TRUE values always win over stale draft FALSE values
        updateDraft(prev => ({
          ...prev,
          liberacion: {
            ...prev.liberacion,
            ...(initialLiberacion.documentacion_ine && { documentacion_ine: true }),
            ...(initialLiberacion.documentacion_licencia && { documentacion_licencia: true }),
            ...(initialLiberacion.documentacion_antecedentes && { documentacion_antecedentes: true }),
            ...(initialLiberacion.documentacion_domicilio && { documentacion_domicilio: true }),
            ...(initialLiberacion.documentacion_rfc && { documentacion_rfc: true }),
            ...(initialLiberacion.psicometricos_completado && { psicometricos_completado: true }),
            ...(initialLiberacion.toxicologicos_completado && { toxicologicos_completado: true }),
            ...(initialLiberacion.vehiculo_capturado && { vehiculo_capturado: true }),
            ...(initialLiberacion.instalacion_gps_completado && { instalacion_gps_completado: true }),
            ...(initialLiberacion.vehiculo_tarjeta_circulacion && { vehiculo_tarjeta_circulacion: true }),
            ...(initialLiberacion.vehiculo_poliza_seguro && { vehiculo_poliza_seguro: true }),
          }
        }));
      }
      setPrefillApplied({ docs: false, psico: false });
    }, 50);
    
    return () => clearTimeout(timer);
  }, [initialLiberacion.id]);

  // ✅ FIX: Prellenar documentación con memoización para evitar ejecuciones redundantes
  useEffect(() => {
    if (!docPrefillData || prefillApplied.docs) return;
    if (!hydrationCompleteRef.current) return; // Esperar hidratación
    
    // Comparar hash para evitar actualizaciones redundantes
    const currentHash = JSON.stringify(docPrefillData);
    if (currentHash === lastDocPrefillHashRef.current) return;
    
    lastDocPrefillHashRef.current = currentHash;
    console.log('📋 [LiberacionChecklist] Applying doc prefill:', docPrefillData.count, 'docs');
    
    updateDraft(prev => ({
      ...prev,
      liberacion: {
        ...prev.liberacion,
        documentacion_ine: prev.liberacion.documentacion_ine || docPrefillData.documentacion_ine,
        documentacion_licencia: prev.liberacion.documentacion_licencia || docPrefillData.documentacion_licencia,
        documentacion_antecedentes: prev.liberacion.documentacion_antecedentes || docPrefillData.documentacion_antecedentes,
        documentacion_domicilio: prev.liberacion.documentacion_domicilio || docPrefillData.documentacion_domicilio,
        
        documentacion_rfc: prev.liberacion.documentacion_rfc || docPrefillData.documentacion_rfc,
      }
    }));
    setPrefillApplied(prev => ({ ...prev, docs: true }));
  }, [docPrefillData, prefillApplied.docs, updateDraft]);

  // ✅ FIX: Prellenar psicométricos con memoización para evitar ejecuciones redundantes
  useEffect(() => {
    if (!psicoPrefillData || prefillApplied.psico) return;
    if (!hydrationCompleteRef.current) return; // Esperar hidratación
    
    // Comparar hash para evitar actualizaciones redundantes
    const currentHash = JSON.stringify(psicoPrefillData);
    if (currentHash === lastPsicoPrefillHashRef.current) return;
    
    lastPsicoPrefillHashRef.current = currentHash;
    console.log('📋 [LiberacionChecklist] Applying psico prefill:', psicoPrefillData.psicometricos_puntaje);
    
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
  }, [psicoPrefillData, prefillApplied.psico, updateDraft]);

  // Prellenar ubicación desde datos de entrevista (leads)
  const lastUbicacionPrefillHashRef = useRef<string>('');
  const [ubicacionPrefillApplied, setUbicacionPrefillApplied] = useState(false);
  
  useEffect(() => {
    if (!ubicacionCandidato || ubicacionPrefillApplied) return;
    if (!hydrationCompleteRef.current) return;
    
    // Solo prefill si hay datos y el draft no tiene ubicación
    const hasExistingUbicacion = ubicacion.direccion || ubicacion.estadoId;
    if (hasExistingUbicacion) {
      setUbicacionPrefillApplied(true);
      return;
    }
    
    const currentHash = JSON.stringify(ubicacionCandidato);
    if (currentHash === lastUbicacionPrefillHashRef.current) return;
    
    lastUbicacionPrefillHashRef.current = currentHash;
    console.log('📋 [LiberacionChecklist] Applying ubicacion prefill:', ubicacionCandidato.estadoNombre);
    
    updateDraft(prev => ({
      ...prev,
      ubicacion: {
        direccion: ubicacionCandidato.direccion || prev.ubicacion.direccion,
        estadoId: ubicacionCandidato.estadoId || prev.ubicacion.estadoId,
        ciudad: ubicacionCandidato.ciudadNombre || prev.ubicacion.ciudad,
      }
    }));
    setUbicacionPrefillApplied(true);
  }, [ubicacionCandidato, ubicacionPrefillApplied, ubicacion, updateDraft]);

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

  const handleUbicacionChange = (field: 'direccion' | 'estadoId' | 'ciudad', value: string) => {
    updateDraft(prev => ({
      ...prev,
      ubicacion: { ...prev.ubicacion, [field]: value }
    }));
  };

  // Obtener nombre del estado seleccionado para mostrar zona base
  const estadoSeleccionado = useMemo(() => {
    if (!ubicacion.estadoId || !estados.length) return null;
    return estados.find(e => e.id === ubicacion.estadoId);
  }, [ubicacion.estadoId, estados]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Incluir campos de ubicación en el update de liberación
      const liberacionConUbicacion = {
        ...liberacion,
        direccion_residencia: ubicacion.direccion || undefined,
        estado_residencia_id: ubicacion.estadoId || undefined,
        ciudad_residencia: ubicacion.ciudad || undefined,
      };
      
      await updateChecklist.mutateAsync({
        id: liberacion.id,
        updates: liberacionConUbicacion,
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

  // ============ GATE SYSTEM ============
  const progresoCapacitacion = calcularProgresoGeneral();

  const gates = useMemo(() => {
    const red: string[] = [];
    const yellow: string[] = [];
    const green: string[] = [];

    // RED gates (block liberation)
    if (liberacion.toxicologicos_completado && liberacion.toxicologicos_resultado === 'positivo') {
      red.push('Toxicológico positivo');
    }
    if (!liberacion.documentacion_ine) {
      red.push('INE faltante');
    }
    if (!liberacion.documentacion_licencia) {
      if (liberacion.tipo_operativo === 'armado') {
        yellow.push('Portación de arma no registrada (opcional)');
      } else {
        red.push('Licencia de conducir faltante');
      }
    }
    // Estudio socioeconómico desfavorable = RED
    if (latestSocioeconomico?.resultado_general === 'desfavorable') {
      red.push('Estudio socioeconómico desfavorable');
    }

    // YELLOW gates (allow with justification)
    if (!liberacion.psicometricos_completado) {
      yellow.push('Psicométricos no completados');
    } else if (liberacion.psicometricos_resultado === 'condicional') {
      yellow.push('Psicométricos condicionales');
    }
    if (!liberacion.toxicologicos_completado) {
      yellow.push('Toxicológicos no completados');
    }
    if (!liberacion.documentacion_antecedentes) {
      yellow.push('Antecedentes penales faltantes');
    }
    if (!liberacion.documentacion_domicilio) {
      yellow.push('Comprobante domicilio faltante');
    }
    // Contratos no completados = YELLOW
    if (!contratosCompletos) {
      yellow.push('Contratos no completados');
    }
    // Capacitación no completada = YELLOW
    if (!progresoCapacitacion?.capacitacion_completa) {
      yellow.push('Capacitación no completada');
    }
    // Constancia de capacitación faltante = YELLOW
    if (progresoCapacitacion?.capacitacion_completa && documentosExistentes && !documentosExistentes.some(d => (d.tipo_documento as string) === 'constancia_capacitacion')) {
      yellow.push('Constancia de capacitación sin evidencia adjunta');
    }
    // Estudio socioeconómico pendiente = YELLOW
    if (!latestSocioeconomico || latestSocioeconomico.estado === 'pendiente' || latestSocioeconomico.estado === 'en_proceso') {
      yellow.push('Estudio socioeconómico pendiente');
    }

    // GREEN gates (informative, no block)
    if (liberacion.gps_pendiente || !liberacion.instalacion_gps_completado) {
      green.push('GPS pendiente');
    }
    if (!liberacion.documentacion_rfc) {
      green.push('RFC faltante');
    }

    const canLiberate = red.length === 0;
    return { red, yellow, green, canLiberate };
  }, [liberacion, contratosCompletos, progresoCapacitacion, latestSocioeconomico, documentosExistentes]);

  const handleLiberar = async () => {
    if (!gates.canLiberate) {
      toast({
        title: 'No se puede liberar',
        description: `Hay ${gates.red.length} bloqueo(s) crítico(s) que deben resolverse primero.`,
        variant: 'destructive'
      });
      return;
    }

    setIsSaving(true);
    try {
      const result = await liberarCustodio.mutateAsync({ 
        liberacion_id: liberacion.id,
        forzar: gates.yellow.length > 0 // Force only if there are yellow warnings
      });
      
      // Combine frontend yellow warnings with backend warnings
      const allWarnings = [
        ...gates.yellow.map(w => `⚠️ ${w}`),
        ...gates.green.map(w => `ℹ️ ${w}`),
        ...(result.warnings || [])
      ];
      
      if (allWarnings.length > 0) {
        setCurrentWarnings(allWarnings);
        setShowWarnings(true);
        setSuccessData({
          candidato_nombre: result.candidato_nombre,
          candidato_email: result.candidato_email,
          candidato_telefono: result.candidato_telefono,
          invitation_token: result.invitation_token,
          emailSent: result.emailSent
        });
        setIsSaving(false);
      } else {
        clearDraft(true);
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
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
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

        {/* Tip banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/60 border border-border/50 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 shrink-0" />
          <span>Tip: Puedes liberar directamente desde la pestaña <strong>Liberar</strong> en el panel de Evaluación del candidato.</span>
        </div>

        <div className="space-y-6 overflow-y-auto flex-1 min-h-0">
          {/* Progreso General */}
          <LiberacionProgressBar progress={progress} />

          {/* Checklist Accordion */}
          <Accordion type="multiple" defaultValue={['contacto', 'ubicacion', 'docs', 'psico', 'toxico', 'vehiculo', 'gps']}>
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

            {/* 0.5. Ubicación de Residencia */}
            <AccordionItem value="ubicacion">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-emerald-600" />
                  <span>0.5. Ubicación de Residencia</span>
                  {ubicacionCandidato?.estadoNombre && (
                    <Badge variant="outline" className="ml-2 text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                      <Database className="h-3 w-3 mr-1" />
                      Prellenado
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-md border border-emerald-200 dark:border-emerald-800">
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Esta información determina la <strong>zona base operativa</strong> del custodio en Planeación.
                  </p>
                </div>
                
                {loadingUbicacion || loadingEstados ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="ubicacion_direccion">Dirección completa</Label>
                        <Textarea
                          id="ubicacion_direccion"
                          value={ubicacion.direccion}
                          onChange={(e) => handleUbicacionChange('direccion', e.target.value)}
                          placeholder="Calle, número, colonia, código postal..."
                          rows={2}
                        />
                      </div>
                      <div>
                        <Label htmlFor="ubicacion_estado">Estado</Label>
                        <Select
                          value={ubicacion.estadoId}
                          onValueChange={(value) => handleUbicacionChange('estadoId', value)}
                        >
                          <SelectTrigger id="ubicacion_estado">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {estados.map((estado) => (
                              <SelectItem key={estado.id} value={estado.id}>
                                {estado.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="ubicacion_ciudad">Ciudad</Label>
                        <Input
                          id="ubicacion_ciudad"
                          value={ubicacion.ciudad}
                          onChange={(e) => handleUbicacionChange('ciudad', e.target.value)}
                          placeholder="Ciudad o municipio"
                        />
                      </div>
                    </div>
                    
                    {/* Zona Base Calculada */}
                    <div className="mt-4 p-3 bg-muted/50 rounded-md border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Zona Base Operativa:</span>
                        {estadoSeleccionado ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700">
                            {estadoSeleccionado.nombre}
                          </Badge>
                        ) : (
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-sm">Seleccione un estado</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
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
                  {/* Gate badge for docs */}
                  {(!liberacion.documentacion_ine || (liberacion.tipo_operativo !== 'armado' && !liberacion.documentacion_licencia)) && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Bloqueo
                    </Badge>
                  )}
                  {liberacion.documentacion_ine && (liberacion.tipo_operativo === 'armado' || liberacion.documentacion_licencia) && progress.documentacion === 100 && (
                    <Badge variant="success" className="ml-auto text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      OK
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { field: 'documentacion_ine', label: 'INE' },
                    { field: 'documentacion_licencia', label: liberacion.tipo_operativo === 'armado' ? 'Portación de arma' : 'Licencia de conducir' },
                    { field: 'documentacion_antecedentes', label: 'Antecedentes penales' },
                    { field: 'documentacion_domicilio', label: 'Comprobante domicilio' },
                    
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
                  {liberacion.toxicologicos_completado && liberacion.toxicologicos_resultado === 'positivo' && (
                    <Badge variant="destructive" className="ml-auto text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Positivo — Bloquea
                    </Badge>
                  )}
                  {liberacion.toxicologicos_completado && liberacion.toxicologicos_resultado === 'negativo' && (
                    <Badge variant="success" className="ml-auto text-xs">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Negativo
                    </Badge>
                  )}
                  {!liberacion.toxicologicos_completado && (
                    <Badge variant="secondary" className="ml-auto text-xs">Pendiente</Badge>
                  )}
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

            {/* 5. GPS - OPCIONAL (no bloquea liberación) */}
            <AccordionItem value="gps">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  {progress.gps === 100 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : liberacion.gps_pendiente ? (
                    <AlertCircle className="h-5 w-5 text-amber-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span>5. GPS ({progress.gps === 100 ? '100%' : liberacion.gps_pendiente ? 'Diferido' : '0%'})</span>
                  <Badge variant="outline" className="ml-2 text-xs text-muted-foreground border-muted">
                    <Info className="h-3 w-3 mr-1" />
                    Opcional — No bloquea
                  </Badge>
                  {liberacion.gps_pendiente && (
                    <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200">
                      Pendiente post-entrenamiento
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                {/* Option 1: GPS installed */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="instalacion_gps_completado"
                    checked={liberacion.instalacion_gps_completado}
                    onCheckedChange={(checked) => {
                      handleCheckboxChange('instalacion_gps_completado', checked as boolean);
                      if (checked) {
                        handleCheckboxChange('gps_pendiente' as keyof CustodioLiberacion, false);
                        handleInputChange('motivo_gps_pendiente', null);
                        handleInputChange('fecha_programacion_gps', null);
                      }
                    }}
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

                {/* Option 2: Defer GPS */}
                {!liberacion.instalacion_gps_completado && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800 space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gps_pendiente"
                        checked={liberacion.gps_pendiente}
                        onCheckedChange={(checked) => {
                          handleCheckboxChange('gps_pendiente' as keyof CustodioLiberacion, checked as boolean);
                          if (checked) {
                            handleInputChange('motivo_gps_pendiente', 'entrenamiento');
                          } else {
                            handleInputChange('motivo_gps_pendiente', null);
                            handleInputChange('fecha_programacion_gps', null);
                          }
                        }}
                      />
                      <Label htmlFor="gps_pendiente" className="text-amber-800 dark:text-amber-300 font-medium">
                        GPS pendiente — se programará post-entrenamiento
                      </Label>
                    </div>

                    {liberacion.gps_pendiente && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-6">
                        <div>
                          <Label>Motivo</Label>
                          <Select
                            value={liberacion.motivo_gps_pendiente || 'entrenamiento'}
                            onValueChange={(value) => handleInputChange('motivo_gps_pendiente', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="entrenamiento">En entrenamiento</SelectItem>
                              <SelectItem value="sin_vehiculo_asignado">Sin vehículo asignado aún</SelectItem>
                              <SelectItem value="pendiente_instalador">Pendiente instalador</SelectItem>
                              <SelectItem value="otro">Otro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Fecha programación GPS</Label>
                          <Input
                            type="date"
                            value={liberacion.fecha_programacion_gps || ''}
                            onChange={(e) => handleInputChange('fecha_programacion_gps', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* Sticky Footer with Gate Summary */}
        <div className="sticky bottom-0 bg-background border-t pt-3 pb-1 mt-auto shrink-0 space-y-2">
          {/* Gate status inline - always visible */}
          {gates.red.length > 0 && (
            <div className="p-2 rounded-md bg-destructive/10 border border-destructive/20 space-y-1">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
                <span className="text-xs font-semibold text-destructive">
                  {gates.red.length} bloqueo(s) — resolver para liberar:
                </span>
              </div>
              <ul className="pl-6 space-y-0.5">
                {gates.red.map((gate, i) => {
                  // Map each gate to the section where it can be resolved
                  const sectionMap: Record<string, string> = {
                    'INE faltante': 'Documentación',
                    'Licencia de conducir faltante': 'Documentación',
                    'Portación de arma faltante': 'Documentación',
                    'Toxicológico positivo': 'Toxicológicos',
                    'Estudio socioeconómico desfavorable': 'Estudio Socioeconómico',
                  };
                  const section = sectionMap[gate] || '';
                  return (
                    <li key={i} className="text-xs text-destructive flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-destructive shrink-0" />
                      <span>{gate}</span>
                      {section && (
                        <span className="text-destructive/60">→ Sección: {section}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
          {gates.red.length === 0 && gates.yellow.length > 0 && (
            <div className="flex items-start gap-2 p-2 rounded-md bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800">
              <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-700 dark:text-yellow-300">
                <span className="font-semibold">{gates.yellow.length} advertencia(s)</span> — se puede continuar
              </div>
            </div>
          )}
          {gates.red.length === 0 && gates.yellow.length === 0 && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-success/10 border border-success/20">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <span className="text-xs text-success font-medium">Todos los requisitos completados — listo para liberar</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSaving} className="sm:order-1">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="sm:order-2">
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
            <Button
              onClick={handleLiberar}
              disabled={isSaving || !gates.canLiberate}
              className={`sm:order-3 ${gates.canLiberate ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="mr-2 h-4 w-4" />
              )}
              {gates.canLiberate 
                ? (gates.yellow.length > 0 ? 'Liberar con advertencias' : 'Liberar a Planificación')
                : 'Resolver bloqueos primero'
              }
            </Button>
          </div>
        </div>
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
