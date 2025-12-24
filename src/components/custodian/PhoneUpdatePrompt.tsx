import { useState } from "react";
import { Phone, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PhoneUpdatePromptProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPhone?: string;
  onPhoneUpdated: (newPhone: string) => Promise<boolean>;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const PhoneUpdatePrompt = ({
  open,
  onOpenChange,
  currentPhone,
  onPhoneUpdated,
  isLoading = false,
  errorMessage = null,
}: PhoneUpdatePromptProps) => {
  const [phone, setPhone] = useState(currentPhone || '');
  const [localLoading, setLocalLoading] = useState(false);

  const loading = isLoading || localLoading;

  // Format phone for display
  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 10 digits (Mexican phone without country code)
    const trimmed = digits.slice(0, 10);
    
    // Format as XXX XXX XXXX
    if (trimmed.length > 6) {
      return `${trimmed.slice(0, 3)} ${trimmed.slice(3, 6)} ${trimmed.slice(6)}`;
    } else if (trimmed.length > 3) {
      return `${trimmed.slice(0, 3)} ${trimmed.slice(3)}`;
    }
    return trimmed;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhone(e.target.value));
  };

  const handleSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length !== 10) return;

    setLocalLoading(true);
    try {
      // Format with country code
      const formattedPhone = `+52 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
      const success = await onPhoneUpdated(formattedPhone);
      if (success) {
        onOpenChange(false);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const isValidPhone = phone.replace(/\D/g, '').length === 10;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            Actualiza tu teléfono
          </DialogTitle>
          <DialogDescription>
            Para reportar indisponibilidad, necesitamos vincular tu cuenta con tu perfil de custodio operativo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info banner */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Ingresa el número de teléfono con el que estás registrado como custodio en el sistema de Planeación.
            </p>
          </div>

          {/* Phone input */}
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (10 dígitos)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                +52
              </span>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={handlePhoneChange}
                placeholder="55 1234 5678"
                className="pl-12 h-12 text-lg"
                disabled={loading}
              />
            </div>
            {phone && !isValidPhone && (
              <p className="text-xs text-muted-foreground">
                Ingresa los 10 dígitos de tu número
              </p>
            )}
          </div>

          {/* Error message */}
          {errorMessage && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-destructive font-medium">
                  Teléfono no encontrado
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Success indicator when valid */}
          {isValidPhone && !errorMessage && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Formato válido</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            className="flex-1 h-12"
            disabled={loading || !isValidPhone}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Verificando...
              </>
            ) : (
              'Guardar y continuar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneUpdatePrompt;
