/**
 * ObservationsSection - Additional notes textarea
 */

import { FileText } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ObservationsSectionProps {
  observaciones: string;
  onObservacionesChange: (value: string) => void;
}

export function ObservationsSection({ observaciones, onObservacionesChange }: ObservationsSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="observaciones" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Observaciones
        <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
      </Label>
      <Textarea
        id="observaciones"
        value={observaciones}
        onChange={(e) => onObservacionesChange(e.target.value)}
        placeholder="Instrucciones especiales, notas adicionales, etc."
        rows={3}
        className="resize-none"
      />
    </div>
  );
}
