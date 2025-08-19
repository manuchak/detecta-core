import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RotateCcw, 
  X, 
  CheckCircle2 
} from "lucide-react";

interface BulkActionsPanelProps {
  selectedCount: number;
  onReactivateAll: () => void;
  onDeselectAll: () => void;
}

export const BulkActionsPanel = ({ 
  selectedCount, 
  onReactivateAll, 
  onDeselectAll 
}: BulkActionsPanelProps) => {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {selectedCount} candidato{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Acciones disponibles para los candidatos seleccionados:
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={onReactivateAll}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reactivar todos
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDeselectAll}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Deseleccionar
            </Button>
          </div>
        </div>
        
        <div className="mt-3 text-xs text-muted-foreground">
          <p>
            💡 <strong>Tip:</strong> Al reactivar candidatos, pasarán del estado "aprobado_en_espera" 
            a "aprobado" y podrán continuar con el proceso normal de onboarding.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};