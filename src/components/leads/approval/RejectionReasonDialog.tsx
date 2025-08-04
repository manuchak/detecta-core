import { useState } from "react";
import { AssignedLead } from "@/types/leadTypes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  Car, 
  MapPin, 
  Clock, 
  Shield, 
  DollarSign, 
  Heart, 
  FileCheck,
  X,
  Check,
  AlertTriangle,
  CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RejectionReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead | null;
  onConfirmReject: (reasons: string[], customReason: string) => void;
}

// Razones organizadas por categorías con iconos y colores
const REJECTION_CATEGORIES = {
  "Requisitos Básicos": {
    icon: Car,
    color: "bg-red-50 border-red-200 text-red-800",
    headerColor: "text-red-700",
    reasons: [
      "No cuenta con vehículo propio",
      "Vehículo no cumple requisitos técnicos",
      "No tiene licencia de conducir vigente",
      "Edad fuera del rango permitido",
      "No cuenta con documentación completa"
    ]
  },
  "Ubicación y Movilidad": {
    icon: MapPin,
    color: "bg-orange-50 border-orange-200 text-orange-800",
    headerColor: "text-orange-700",
    reasons: [
      "Ubicación fuera de zona de cobertura",
      "No puede movilizarse en horarios requeridos",
      "Zona de residencia no apropiada",
      "Limitaciones de desplazamiento",
      "Conflictos con rutas asignadas"
    ]
  },
  "Disponibilidad y Compromiso": {
    icon: Clock,
    color: "bg-amber-50 border-amber-200 text-amber-800",
    headerColor: "text-amber-700",
    reasons: [
      "Horarios de disponibilidad incompatibles",
      "No puede comprometerse tiempo completo",
      "Tiene otros empleos que interfieren",
      "Limitaciones de tiempo por estudios",
      "No acepta términos de flexibilidad horaria"
    ]
  },
  "Experiencia y Competencias": {
    icon: Shield,
    color: "bg-blue-50 border-blue-200 text-blue-800",
    headerColor: "text-blue-700",
    reasons: [
      "Falta de experiencia en seguridad",
      "No maneja tecnología requerida",
      "Habilidades de comunicación insuficientes",
      "Falta de conocimiento del área",
      "No cumple perfil psicológico"
    ]
  },
  "Aspectos Económicos": {
    icon: DollarSign,
    color: "bg-green-50 border-green-200 text-green-800",
    headerColor: "text-green-700",
    reasons: [
      "Expectativas salariales muy altas",
      "No cuenta con inversión inicial",
      "Situación financiera incompatible",
      "No acepta esquema de pagos",
      "Problemas crediticios"
    ]
  },
  "Actitud y Motivación": {
    icon: Heart,
    color: "bg-purple-50 border-purple-200 text-purple-800",
    headerColor: "text-purple-700",
    reasons: [
      "Falta de motivación aparente",
      "Actitud no profesional en entrevista",
      "No muestra compromiso con la empresa",
      "Expectativas no realistas",
      "Falta de seriedad en el proceso"
    ]
  },
  "Referencias y Antecedentes": {
    icon: FileCheck,
    color: "bg-slate-50 border-slate-200 text-slate-800",
    headerColor: "text-slate-700",
    reasons: [
      "Referencias laborales negativas",
      "Antecedentes penales",
      "Problemas en empleos anteriores",
      "Conflictos con autoridades",
      "Referencias personales inadecuadas"
    ]
  }
};

export const RejectionReasonDialog = ({
  open,
  onOpenChange,
  lead,
  onConfirmReject
}: RejectionReasonDialogProps) => {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [customReason, setCustomReason] = useState("");

  const handleReasonToggle = (reason: string) => {
    setSelectedReasons(prev =>
      prev.includes(reason)
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleConfirm = () => {
    onConfirmReject(selectedReasons, customReason);
    // Reset form
    setSelectedReasons([]);
    setCustomReason("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedReasons([]);
    setCustomReason("");
    onOpenChange(false);
  };

  const getSelectedCountForCategory = (categoryReasons: string[]) => {
    return categoryReasons.filter(reason => selectedReasons.includes(reason)).length;
  };

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-red-100 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <DialogTitle className="text-center text-xl">Confirmar Rechazo del Candidato</DialogTitle>
          <DialogDescription className="text-center">
            Selecciona las razones específicas para el rechazo de este candidato
          </DialogDescription>
        </DialogHeader>

        {/* Información del candidato */}
        <Card className="flex-shrink-0">
          <CardContent className="pt-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Nombre</div>
                <div className="font-semibold">{lead.lead_nombre}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Email</div>
                <div className="font-semibold truncate">{lead.lead_email}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Teléfono</div>
                <div className="font-semibold">{lead.lead_telefono}</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-muted-foreground">Estado</div>
                <Badge variant="outline">{lead.lead_estado}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen de selección - siempre visible */}
        {(selectedReasons.length > 0 || customReason.trim()) && (
          <Card className="flex-shrink-0 bg-red-50 border-red-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-red-600" />
                <span className="font-semibold text-red-800">
                  {selectedReasons.length} razón{selectedReasons.length !== 1 ? 'es' : ''} seleccionada{selectedReasons.length !== 1 ? 's' : ''}
                  {customReason.trim() && ' + razón personalizada'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                {selectedReasons.map((reason) => (
                  <Badge 
                    key={reason} 
                    variant="destructive" 
                    className="text-xs px-2 py-1 max-w-[200px] truncate"
                  >
                    {reason}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categorías con acordeón */}
        <div className="flex-1 overflow-hidden">
          <Accordion type="single" collapsible className="space-y-2">
            {Object.entries(REJECTION_CATEGORIES).map(([category, config]) => {
              const Icon = config.icon;
              const selectedCount = getSelectedCountForCategory(config.reasons);
              
              return (
                <AccordionItem 
                  key={category} 
                  value={category}
                  className="border rounded-lg overflow-hidden"
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                    <div className="flex items-center justify-between w-full">
                      <div className={cn("flex items-center gap-3", config.headerColor)}>
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold">{category}</span>
                      </div>
                      {selectedCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="ml-2 bg-red-100 text-red-800 border-red-300"
                        >
                          {selectedCount}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                      {config.reasons.map((reason) => {
                        const isSelected = selectedReasons.includes(reason);
                        return (
                          <button
                            key={reason}
                            onClick={() => handleReasonToggle(reason)}
                            className={cn(
                              "p-3 text-left text-sm rounded-lg border-2 transition-all duration-200",
                              "hover:shadow-sm",
                              isSelected 
                                ? cn(config.color, "shadow-sm")
                                : "border-border bg-background hover:bg-muted/50"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                                isSelected 
                                  ? "border-current bg-current" 
                                  : "border-muted-foreground/30"
                              )}>
                                {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                              </div>
                              <span className={cn(
                                "flex-1 font-medium leading-tight",
                                isSelected ? "text-current" : "text-foreground"
                              )}>
                                {reason}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>

        {/* Razón personalizada - compacta */}
        <div className="flex-shrink-0">
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardContent className="pt-4">
              <Label htmlFor="custom-reason" className="text-sm font-medium flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Razón Adicional (Opcional)
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Describe cualquier otra razón específica..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[60px] resize-none text-sm"
              />
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-3 pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="min-w-[120px]"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={selectedReasons.length === 0 && !customReason.trim()}
            className="min-w-[140px] bg-red-600 hover:bg-red-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirmar Rechazo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};