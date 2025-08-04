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

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmar Rechazo del Candidato</DialogTitle>
          <DialogDescription>
            Selecciona las razones por las cuales se rechaza al candidato. Esta información
            será útil para mejorar el proceso de reclutamiento.
          </DialogDescription>
        </DialogHeader>

        {/* Información del candidato */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Información del Candidato</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Nombre:</span> {lead.lead_nombre}
              </div>
              <div>
                <span className="font-medium">Email:</span> {lead.lead_email}
              </div>
              <div>
                <span className="font-medium">Teléfono:</span> {lead.lead_telefono}
              </div>
              <div>
                <span className="font-medium">Estado:</span> {lead.lead_estado}
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* Razones de rechazo */}
        <div className="space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Razones de Rechazo</h3>
            <p className="text-muted-foreground">
              Selecciona todas las razones que apliquen para este candidato
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(REJECTION_CATEGORIES).map(([category, config]) => {
              const Icon = config.icon;
              return (
                <Card key={category} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                  <CardHeader className="pb-3">
                    <CardTitle className={cn("text-base flex items-center gap-2", config.headerColor)}>
                      <Icon className="w-5 h-5" />
                      {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {config.reasons.map((reason) => {
                      const isSelected = selectedReasons.includes(reason);
                      return (
                        <button
                          key={reason}
                          onClick={() => handleReasonToggle(reason)}
                          className={cn(
                            "w-full p-3 text-left text-sm rounded-lg border-2 transition-all duration-200",
                            "hover:shadow-sm",
                            isSelected 
                              ? cn(config.color, "shadow-sm scale-[1.02]")
                              : "border-border bg-background hover:bg-muted/50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              isSelected 
                                ? "border-current bg-current" 
                                : "border-muted-foreground/30"
                            )}>
                              {isSelected && <Check className="w-3 h-3 text-white" />}
                            </div>
                            <span className={cn(
                              "flex-1 font-medium",
                              isSelected ? "text-current" : "text-foreground"
                            )}>
                              {reason}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Razón personalizada */}
          <Card className="border-2 border-dashed border-muted-foreground/20">
            <CardContent className="pt-6">
              <Label htmlFor="custom-reason" className="text-base font-semibold flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" />
                Razón Adicional (Opcional)
              </Label>
              <Textarea
                id="custom-reason"
                placeholder="Describe cualquier otra razón específica para el rechazo que no esté listada arriba..."
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                className="min-h-[100px] resize-none"
              />
            </CardContent>
          </Card>

          {/* Resumen de selección */}
          {(selectedReasons.length > 0 || customReason.trim()) && (
            <Card className="bg-muted/30 border-muted">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <Label className="text-base font-semibold">Resumen de Rechazo</Label>
                </div>
                
                {selectedReasons.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">Razones seleccionadas:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedReasons.map((reason) => (
                        <Badge 
                          key={reason} 
                          variant="secondary" 
                          className="text-xs px-3 py-1 bg-red-100 text-red-800 hover:bg-red-200"
                        >
                          {reason}
                          <button
                            onClick={() => handleReasonToggle(reason)}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {customReason.trim() && (
                  <div className="mt-3 p-3 bg-background rounded-md border">
                    <p className="text-sm text-muted-foreground mb-1">Razón adicional:</p>
                    <p className="text-sm">{customReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
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