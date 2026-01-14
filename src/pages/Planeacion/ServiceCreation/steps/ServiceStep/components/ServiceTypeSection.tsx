/**
 * ServiceTypeSection - Service type selector with armed guard toggle
 * Bidirectional synchronization between type and armed flag
 */

import { Shield, ShieldCheck, ShieldPlus, Sparkles } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

type ServiceType = 'custodia_sin_arma' | 'custodia_armada' | 'custodia_armada_reforzada';

interface ServiceTypeOption {
  value: ServiceType;
  label: string;
  description: string;
}

interface ServiceTypeSectionProps {
  tipoServicio: ServiceType;
  requiereArmado: boolean;
  onTipoServicioChange: (value: ServiceType) => void;
  onRequiereArmadoChange: (checked: boolean) => void;
  options: readonly ServiceTypeOption[];
  wasAutoFilled: boolean;
}

const TYPE_ICONS: Record<ServiceType, React.ReactNode> = {
  'custodia_sin_arma': <Shield className="h-4 w-4" />,
  'custodia_armada': <ShieldCheck className="h-4 w-4" />,
  'custodia_armada_reforzada': <ShieldPlus className="h-4 w-4" />,
};

export function ServiceTypeSection({
  tipoServicio,
  requiereArmado,
  onTipoServicioChange,
  onRequiereArmadoChange,
  options,
  wasAutoFilled,
}: ServiceTypeSectionProps) {
  const currentOption = options.find(o => o.value === tipoServicio);

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm flex items-center gap-2">
        <ShieldCheck className="h-4 w-4" />
        Tipo de Custodia
      </h4>

      {/* Type selector */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="tipoServicio" className="text-sm">
            Tipo de servicio
          </Label>
          {wasAutoFilled && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              <Sparkles className="h-2.5 w-2.5 mr-0.5" />
              Auto-detectado
            </Badge>
          )}
        </div>
        
        <Select
          value={tipoServicio}
          onValueChange={(value) => onTipoServicioChange(value as ServiceType)}
        >
          <SelectTrigger id="tipoServicio" className="w-full">
            <SelectValue>
              <div className="flex items-center gap-2">
                {TYPE_ICONS[tipoServicio]}
                <span>{currentOption?.label}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  {TYPE_ICONS[option.value]}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {option.description}
                    </div>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Armed guard toggle */}
      <div 
        className={cn(
          "flex items-center justify-between p-4 rounded-lg border transition-colors",
          requiereArmado 
            ? "bg-primary/5 border-primary/30" 
            : "bg-muted/30 border-border"
        )}
      >
        <div className="space-y-0.5">
          <Label htmlFor="requiereArmado" className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            Incluye Custodio Armado
          </Label>
          <p className="text-xs text-muted-foreground">
            Requiere elemento con portación de arma
          </p>
        </div>
        <Switch
          id="requiereArmado"
          checked={requiereArmado}
          onCheckedChange={onRequiereArmadoChange}
        />
      </div>
    </div>
  );
}
