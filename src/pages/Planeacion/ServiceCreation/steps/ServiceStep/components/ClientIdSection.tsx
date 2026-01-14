/**
 * ClientIdSection - Optional client internal reference ID
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tag } from 'lucide-react';

interface ClientIdSectionProps {
  idInterno: string;
  onIdInternoChange: (value: string) => void;
}

export function ClientIdSection({ idInterno, onIdInternoChange }: ClientIdSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="idInterno" className="flex items-center gap-2">
        <Tag className="h-4 w-4" />
        ID Interno del Cliente
        <span className="text-xs text-muted-foreground font-normal">(Opcional)</span>
      </Label>
      <Input
        id="idInterno"
        value={idInterno}
        onChange={(e) => onIdInternoChange(e.target.value)}
        placeholder="OT-2026-001234"
        maxLength={200}
      />
      <p className="text-xs text-muted-foreground">
        Código de referencia interno del cliente para este servicio
      </p>
    </div>
  );
}
