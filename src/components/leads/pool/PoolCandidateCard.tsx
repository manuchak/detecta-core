import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Clock, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { AssignedLead } from "@/types/leadTypes";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PoolCandidateCardProps {
  candidate: AssignedLead;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onReactivate: () => void;
}

export const PoolCandidateCard = ({ 
  candidate, 
  selected, 
  onSelect, 
  onReactivate 
}: PoolCandidateCardProps) => {
  
  const daysInPool = candidate.fecha_entrada_pool 
    ? Math.floor((Date.now() - new Date(candidate.fecha_entrada_pool).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const isOldCandidate = daysInPool > 30;
  
  const timeInPool = candidate.fecha_entrada_pool
    ? formatDistanceToNow(new Date(candidate.fecha_entrada_pool), { 
        addSuffix: true, 
        locale: es 
      })
    : 'Fecha no disponible';

  return (
    <Card className={`transition-all hover:shadow-md ${selected ? 'ring-2 ring-primary' : ''} ${isOldCandidate ? 'border-amber-200 bg-amber-50/30' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="rounded border-input"
            />
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">{candidate.lead_nombre}</CardTitle>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOldCandidate && (
              <Badge variant="outline" className="text-amber-600 border-amber-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Candidato antiguo
              </Badge>
            )}
            <Badge variant="secondary">
              <Clock className="h-3 w-3 mr-1" />
              {daysInPool} días en pool
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Contact info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{candidate.lead_email}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{candidate.lead_telefono || 'No disponible'}</span>
          </div>
        </div>

        {/* Zone and dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{candidate.zona_nombre || 'Zona no asignada'}</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>En pool {timeInPool}</span>
          </div>
        </div>

        {/* Pool reason */}
        {candidate.motivo_pool && (
          <>
            <Separator />
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Motivo:</p>
              <p className="text-sm bg-muted p-2 rounded">{candidate.motivo_pool}</p>
            </div>
          </>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReactivate}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reactivar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};