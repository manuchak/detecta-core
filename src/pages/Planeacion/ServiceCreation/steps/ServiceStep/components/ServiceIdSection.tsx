/**
 * ServiceIdSection - Service ID input with auto-generation and validation
 */

import { Check, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ServiceIdSectionProps {
  servicioId: string;
  onServicioIdChange: (value: string) => void;
  isValidating: boolean;
  isValid: boolean;
  errorMessage: string | null;
}

export function ServiceIdSection({
  servicioId,
  onServicioIdChange,
  isValidating,
  isValid,
  errorMessage,
}: ServiceIdSectionProps) {
  const handleRegenerate = () => {
    onServicioIdChange(crypto.randomUUID());
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="servicioId">ID del Servicio</Label>
      <div className="relative">
        <Input
          id="servicioId"
          value={servicioId}
          onChange={(e) => onServicioIdChange(e.target.value)}
          className={cn(
            "pr-20 font-mono text-sm",
            !isValid && "border-destructive focus-visible:ring-destructive"
          )}
          placeholder="UUID del servicio..."
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isValidating ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : isValid ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-destructive" />
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRegenerate}
            title="Regenerar ID"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      {errorMessage ? (
        <p className="text-xs text-destructive">{errorMessage}</p>
      ) : (
        <p className="text-xs text-muted-foreground">
          Identificador único generado automáticamente
        </p>
      )}
    </div>
  );
}
