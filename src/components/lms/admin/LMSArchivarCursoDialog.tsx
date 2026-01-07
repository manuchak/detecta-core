import { useState } from "react";
import { Archive, AlertCircle, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const ARCHIVE_REASONS = [
  { value: "error", label: "Curso creado por error" },
  { value: "obsolete", label: "Contenido obsoleto" },
  { value: "replaced", label: "Reemplazado por nueva versión" },
  { value: "suspended", label: "Temporalmente suspendido" },
  { value: "other", label: "Otro" },
];

interface LMSArchivarCursoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cursoTitulo: string;
  inscripcionesCount: number;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function LMSArchivarCursoDialog({
  open,
  onOpenChange,
  cursoTitulo,
  inscripcionesCount,
  onConfirm,
  isLoading,
}: LMSArchivarCursoDialogProps) {
  const [selectedReason, setSelectedReason] = useState("error");
  const [customReason, setCustomReason] = useState("");

  const handleConfirm = () => {
    const reason = selectedReason === "other" 
      ? customReason 
      : ARCHIVE_REASONS.find(r => r.value === selectedReason)?.label || selectedReason;
    onConfirm(reason);
  };

  const handleClose = () => {
    setSelectedReason("error");
    setCustomReason("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-600" />
            Archivar curso
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium text-foreground">{cursoTitulo}</span> dejará de aparecer 
            en el catálogo pero los usuarios conservarán su progreso y certificados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">¿Por qué archivas este curso?</Label>
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              {ARCHIVE_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} />
                  <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                    {reason.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {selectedReason === "other" && (
            <Textarea
              placeholder="Especifica la razón del archivado..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-[80px]"
            />
          )}

          {inscripcionesCount > 0 && (
            <Alert>
              <Users className="w-4 h-4" />
              <AlertDescription>
                <span className="font-medium">{inscripcionesCount} usuarios</span> tienen 
                inscripciones en este curso. Sus datos serán preservados.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={isLoading || (selectedReason === "other" && !customReason.trim())}
            className="bg-amber-600 hover:bg-amber-700"
          >
            {isLoading ? "Archivando..." : "Archivar Curso"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
