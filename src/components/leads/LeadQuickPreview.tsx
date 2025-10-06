import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Lead } from "@/types/leadTypes";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  FileText, 
  Building2, 
  Tag,
  Edit
} from "lucide-react";

interface LeadQuickPreviewProps {
  lead: Lead | null;
  onClose: () => void;
  onEdit: (lead: Lead) => void;
}

export function LeadQuickPreview({ lead, onClose, onEdit }: LeadQuickPreviewProps) {
  if (!lead) return null;

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string; className?: string }> = {
      'nuevo': { variant: 'default', label: 'Nuevo' },
      'en_proceso': { variant: 'secondary', label: 'En Proceso' },
      'aprobado': { variant: 'default', label: 'Aprobado', className: 'bg-green-100 text-green-800' },
      'rechazado': { variant: 'destructive', label: 'Rechazado' },
      'pendiente': { variant: 'secondary', label: 'Pendiente' }
    };
    
    const config = statusConfig[status] || { variant: 'default' as const, label: status };
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={!!lead} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <User className="h-6 w-6 text-primary" />
            {lead.nombre}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Estado */}
          <div className="flex items-center justify-between pb-4 border-b">
            <span className="text-sm text-muted-foreground">Estado actual</span>
            {getStatusBadge(lead.estado)}
          </div>

          {/* Información de contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-sm">{lead.email || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                  <p className="text-sm">{lead.telefono || 'No especificado'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Empresa</p>
                  <p className="text-sm">{lead.empresa || 'No especificado'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Tag className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fuente</p>
                  <p className="text-sm">{lead.fuente || 'No especificado'}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Fechas importantes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Fecha de creación</p>
                <p className="text-sm">{formatDate(lead.fecha_creacion)}</p>
              </div>
            </div>

            {lead.fecha_contacto && (
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Fecha de contacto</p>
                  <p className="text-sm">{formatDate(lead.fecha_contacto)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          {lead.notas && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Notas</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{lead.notas}</p>
                </div>
              </div>
            </>
          )}

          {/* Mensaje adicional */}
          {lead.mensaje && (
            <>
              <Separator />
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Mensaje</p>
                  <p className="text-sm bg-muted/50 p-3 rounded-md">{lead.mensaje}</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button 
            onClick={() => onEdit(lead)}
            className="shadow-lg hover:shadow-xl transition-all"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Completo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
