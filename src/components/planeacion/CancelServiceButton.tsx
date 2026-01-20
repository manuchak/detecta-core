import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { XCircle, AlertTriangle, CalendarX, UserX, Copy, HelpCircle, MapPinOff, Loader2 } from 'lucide-react';

// Predefined cancellation reasons with icons - "Cancelado por cliente" allows cancelling started services
const CANCEL_REASONS = [
  { value: 'cliente_cancelo', label: 'Cancelado por cliente', allowsStartedCancellation: true, icon: UserX },
  { value: 'posicionamiento_falso', label: 'Posicionamiento en Falso', allowsStartedCancellation: true, requiresFalsePositioningFlow: true, icon: MapPinOff },
  { value: 'cambio_fecha', label: 'Cambio de fecha/hora', allowsStartedCancellation: false, icon: CalendarX },
  { value: 'falta_disponibilidad', label: 'Falta de disponibilidad', allowsStartedCancellation: false, icon: AlertTriangle },
  { value: 'error_datos', label: 'Error en datos del servicio', allowsStartedCancellation: false, icon: HelpCircle },
  { value: 'duplicado', label: 'Servicio duplicado', allowsStartedCancellation: false, icon: Copy },
  { value: 'otro', label: 'Otro motivo', allowsStartedCancellation: false, icon: HelpCircle },
] as const;

interface CancelServiceButtonProps {
  serviceId: string;
  serviceName: string;
  onCancel: (serviceId: string, reason?: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  serviceStarted?: boolean;
}

export function CancelServiceButton({ 
  serviceId, 
  serviceName, 
  onCancel, 
  disabled = false, 
  className = "",
  serviceStarted = false
}: CancelServiceButtonProps) {
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Set body flag when dialog opens/closes
  useEffect(() => {
    if (open) {
      document.body.dataset.dialogOpen = "1";
    } else {
      // Delay removal to allow animations to complete
      const timeout = setTimeout(() => {
        delete document.body.dataset.dialogOpen;
      }, 200);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedReason('');
      setCustomReason('');
    }
  }, [open]);

  const selectedReasonConfig = CANCEL_REASONS.find(r => r.value === selectedReason);
  const canCancelStarted = selectedReasonConfig?.allowsStartedCancellation ?? false;
  
  // If service started, only allow cancellation with specific reasons
  const canProceed = selectedReason && (!serviceStarted || canCancelStarted);

  const getFinalReason = useCallback(() => {
    if (selectedReason === 'posicionamiento_falso') {
      return 'posicionamiento_falso';
    }
    if (selectedReason === 'otro') {
      return customReason.trim() || 'Otro motivo';
    }
    const reason = CANCEL_REASONS.find(r => r.value === selectedReason);
    return reason?.label || selectedReason;
  }, [selectedReason, customReason]);

  const handleCancel = async () => {
    if (!canProceed) return;
    
    setIsProcessing(true);
    try {
      await onCancel(serviceId, getFinalReason());
      setOpen(false);
    } catch (error) {
      console.error('Error cancelling service:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={handleTriggerClick}
        className={`h-7 w-7 p-0 opacity-60 hover:opacity-100 hover:bg-destructive/10 transition-all ${className}`}
        title="Cancelar servicio"
      >
        <XCircle className="h-3.5 w-3.5 text-destructive" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen} modal={true}>
        <DialogContent 
          className="bg-card border border-border/50 rounded-xl shadow-lg p-6 max-w-md z-[200]"
          onPointerDownOutside={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle className="apple-text-headline text-foreground">
                ¿Cancelar servicio?
              </DialogTitle>
            </div>
            <DialogDescription className="apple-text-body text-muted-foreground">
              Se cancelará el servicio para <strong className="text-foreground">{serviceName}</strong>. 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {/* Reason selector */}
            <div className="space-y-2">
              <label className="apple-text-caption text-muted-foreground block">
                Motivo de cancelación <span className="text-destructive">*</span>
              </label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecciona un motivo..." />
                </SelectTrigger>
                <SelectContent className="z-[250]">
                  {CANCEL_REASONS.map((reason) => {
                    const Icon = reason.icon;
                    return (
                      <SelectItem key={reason.value} value={reason.value}>
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{reason.label}</span>
                          {reason.allowsStartedCancellation && (
                            <span className="text-[10px] text-muted-foreground ml-1">
                              (iniciados)
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Custom reason text area - only show when "Otro" is selected */}
            {selectedReason === 'otro' && (
              <div className="space-y-2 animate-fade-in">
                <label htmlFor="custom-reason" className="apple-text-caption text-muted-foreground block">
                  Especificar motivo
                </label>
                <Textarea
                  id="custom-reason"
                  placeholder="Describe el motivo de cancelación..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="apple-input resize-none h-20"
                />
              </div>
            )}

            {/* Warning for started services */}
            {serviceStarted && selectedReason && !canCancelStarted && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 animate-fade-in">
                <p className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Este servicio ya inició. Solo se puede cancelar con motivo "Cancelado por cliente" o "Posicionamiento en Falso".</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button 
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isProcessing}
              className="apple-button-ghost"
            >
              Mantener servicio
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isProcessing || !canProceed}
              className="apple-button-primary bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Cancelando...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4" />
                  Confirmar cancelación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
