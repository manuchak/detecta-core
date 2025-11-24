import { useState, useEffect } from 'react';
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
import { Loader2, CheckCircle2, Rocket } from 'lucide-react';
import { CustodioLiberacion } from '@/types/liberacion';
import { useCustodioLiberacion } from '@/hooks/useCustodioLiberacion';
import LiberacionProgressBar from './LiberacionProgressBar';
import { useToast } from '@/hooks/use-toast';
import { LiberacionWarningsDialog } from './LiberacionWarningsDialog';

interface LiberacionChecklistModalProps {
  liberacion: CustodioLiberacion;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const LiberacionChecklistModal = ({
  liberacion: initialLiberacion,
  isOpen,
  onClose,
  onSuccess,
}: LiberacionChecklistModalProps) => {
  const { updateChecklist, liberarCustodio, calculateProgress } = useCustodioLiberacion();
  const { toast } = useToast();
  const [liberacion, setLiberacion] = useState<CustodioLiberacion>(initialLiberacion);
  const [isSaving, setIsSaving] = useState(false);
  const [showWarnings, setShowWarnings] = useState(false);
  const [currentWarnings, setCurrentWarnings] = useState<string[]>([]);

  useEffect(() => {
    setLiberacion(initialLiberacion);
  }, [initialLiberacion]);

  const progress = calculateProgress(liberacion);

  const handleCheckboxChange = (field: keyof CustodioLiberacion, value: boolean) => {
    setLiberacion(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof CustodioLiberacion, value: any) => {
    setLiberacion(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateChecklist.mutateAsync({
        id: liberacion.id,
        updates: liberacion
      });
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
      
      // Si hay warnings, mostrar diálogo
      if (result.tiene_warnings && result.warnings.length > 0) {
        setCurrentWarnings(result.warnings);
        setShowWarnings(true);
        setIsSaving(false);
      } else {
        // Liberación sin warnings, continuar
        onSuccess();
        onClose();
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
    onSuccess();
    onClose();
  };

  const esVehiculoRequerido = liberacion.candidato?.vehiculo_propio === true;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Checklist de Liberación</DialogTitle>
          <DialogDescription>
            {liberacion.candidato?.nombre} - {liberacion.candidato?.telefono}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progreso General */}
          <LiberacionProgressBar progress={progress} />

          {/* Checklist Accordion */}
          <Accordion type="multiple" defaultValue={['docs', 'psico', 'toxico', 'gps']}>
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

            {/* 4. Vehículo (condicional) */}
            {esVehiculoRequerido && (
              <AccordionItem value="vehiculo">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    {progress.vehiculo === 100 ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                    )}
                    <span>4. Vehículo ({progress.vehiculo}%)</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>Marca</Label>
                      <Input
                        value={liberacion.vehiculo_marca || ''}
                        onChange={(e) => handleInputChange('vehiculo_marca', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Modelo</Label>
                      <Input
                        value={liberacion.vehiculo_modelo || ''}
                        onChange={(e) => handleInputChange('vehiculo_modelo', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Año</Label>
                      <Input
                        type="number"
                        value={liberacion.vehiculo_año || ''}
                        onChange={(e) => handleInputChange('vehiculo_año', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Placas</Label>
                      <Input
                        value={liberacion.vehiculo_placa || ''}
                        onChange={(e) => handleInputChange('vehiculo_placa', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Color</Label>
                      <Input
                        value={liberacion.vehiculo_color || ''}
                        onChange={(e) => handleInputChange('vehiculo_color', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vehiculo_tarjeta_circulacion"
                        checked={liberacion.vehiculo_tarjeta_circulacion}
                        onCheckedChange={(checked) => 
                          handleCheckboxChange('vehiculo_tarjeta_circulacion', checked as boolean)
                        }
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
                      />
                      <Label htmlFor="vehiculo_capturado">Información completa</Label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

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
    </Dialog>
  );
};

export default LiberacionChecklistModal;
