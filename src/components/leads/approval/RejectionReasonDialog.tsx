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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface RejectionReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: AssignedLead | null;
  onConfirmReject: (reasons: string[], customReason: string) => void;
}

// Razones organizadas por categorías
const REJECTION_REASONS = {
  "Requisitos Básicos": [
    "No cuenta con vehículo propio",
    "Vehículo no cumple requisitos técnicos",
    "No tiene licencia de conducir vigente",
    "Edad fuera del rango permitido",
    "No cuenta con documentación completa"
  ],
  "Ubicación y Movilidad": [
    "Ubicación fuera de zona de cobertura",
    "No puede movilizarse en horarios requeridos",
    "Zona de residencia no apropiada",
    "Limitaciones de desplazamiento",
    "Conflictos con rutas asignadas"
  ],
  "Disponibilidad y Compromiso": [
    "Horarios de disponibilidad incompatibles",
    "No puede comprometerse tiempo completo",
    "Tiene otros empleos que interfieren",
    "Limitaciones de tiempo por estudios",
    "No acepta términos de flexibilidad horaria"
  ],
  "Experiencia y Competencias": [
    "Falta de experiencia en seguridad",
    "No maneja tecnología requerida",
    "Habilidades de comunicación insuficientes",
    "Falta de conocimiento del área",
    "No cumple perfil psicológico"
  ],
  "Aspectos Económicos": [
    "Expectativas salariales muy altas",
    "No cuenta con inversión inicial",
    "Situación financiera incompatible",
    "No acepta esquema de pagos",
    "Problemas crediticios"
  ],
  "Actitud y Motivación": [
    "Falta de motivación aparente",
    "Actitud no profesional en entrevista",
    "No muestra compromiso con la empresa",
    "Expectativas no realistas",
    "Falta de seriedad en el proceso"
  ],
  "Referencias y Antecedentes": [
    "Referencias laborales negativas",
    "Antecedentes penales",
    "Problemas en empleos anteriores",
    "Conflictos con autoridades",
    "Referencias personales inadecuadas"
  ]
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
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Razones de Rechazo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Selecciona todas las razones que apliquen para este rechazo:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(REJECTION_REASONS).map(([category, reasons]) => (
              <Card key={category} className="h-fit">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{category}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {reasons.map((reason) => (
                    <div key={reason} className="flex items-start space-x-2">
                      <Checkbox
                        id={reason}
                        checked={selectedReasons.includes(reason)}
                        onCheckedChange={() => handleReasonToggle(reason)}
                      />
                      <Label
                        htmlFor={reason}
                        className="text-sm leading-5 cursor-pointer"
                      >
                        {reason}
                      </Label>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Razón personalizada */}
          <div className="space-y-3">
            <Label htmlFor="custom-reason" className="text-base font-medium">
              Razón Adicional (Opcional)
            </Label>
            <Textarea
              id="custom-reason"
              placeholder="Describe cualquier otra razón específica para el rechazo..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Resumen de selección */}
          {selectedReasons.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Razones Seleccionadas:</Label>
              <div className="flex flex-wrap gap-2">
                {selectedReasons.map((reason) => (
                  <Badge key={reason} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={selectedReasons.length === 0 && !customReason.trim()}
          >
            Confirmar Rechazo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};