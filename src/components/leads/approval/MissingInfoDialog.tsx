
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Save } from "lucide-react";
import { AssignedLead } from "@/types/leadTypes";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { validateLeadForApproval, getValidationMessage } from "@/utils/leadValidation";

interface MissingInfoDialogProps {
  lead: AssignedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const MissingInfoDialog = ({
  lead,
  open,
  onOpenChange,
  onUpdate
}: MissingInfoDialogProps) => {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    notas: ""
  });
  const [loading, setLoading] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (lead && open) {
      // Cargar datos actuales del lead
      setFormData({
        nombre: lead.lead_nombre || "",
        email: lead.lead_email || "",
        telefono: lead.lead_telefono || "",
        empresa: "", // Este campo necesitará ser obtenido de la tabla leads
        notas: lead.notas || ""
      });

      // Validar campos faltantes
      const validation = validateLeadForApproval(lead);
      setMissingFields(validation.missingFields);
    }
  }, [lead, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Actualizar lista de campos faltantes en tiempo real
    const updatedFormData = { ...formData, [field]: value };
    const updatedLead = {
      ...lead!,
      lead_nombre: updatedFormData.nombre,
      lead_email: updatedFormData.email,
      lead_telefono: updatedFormData.telefono,
      notas: updatedFormData.notas
    };
    
    const validation = validateLeadForApproval(updatedLead);
    setMissingFields(validation.missingFields);
  };

  const handleSave = async () => {
    if (!lead) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('leads')
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          empresa: formData.empresa,
          notas: formData.notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.lead_id);

      if (error) throw error;

      toast({
        title: "Información actualizada",
        description: "La información del candidato ha sido actualizada exitosamente.",
      });

      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la información del candidato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = missingFields.length === 0;

  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Completar Información del Candidato
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                Complete los campos faltantes para proceder con la aprobación
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Estado actual */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Estado de la información</h3>
              {isFormValid ? (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completa
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {missingFields.length} campos faltantes
                </Badge>
              )}
            </div>
            
            {!isFormValid && (
              <p className="text-sm text-gray-600">
                {getValidationMessage(missingFields)}
              </p>
            )}
          </div>

          {/* Formulario */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-medium">
                Nombre completo *
                {missingFields.includes('nombre') && (
                  <span className="text-red-500 ml-1">Requerido</span>
                )}
              </Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                placeholder="Ingrese el nombre completo"
                className={missingFields.includes('nombre') ? 'border-red-300 focus:border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email *
                {missingFields.includes('email') && (
                  <span className="text-red-500 ml-1">Requerido</span>
                )}
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="correo@ejemplo.com"
                className={missingFields.includes('email') ? 'border-red-300 focus:border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-sm font-medium">
                Teléfono *
                {missingFields.includes('telefono') && (
                  <span className="text-red-500 ml-1">Requerido</span>
                )}
              </Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="+52 55 1234 5678"
                className={missingFields.includes('telefono') ? 'border-red-300 focus:border-red-500' : ''}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="empresa" className="text-sm font-medium">
                Empresa
              </Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => handleInputChange('empresa', e.target.value)}
                placeholder="Nombre de la empresa"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas" className="text-sm font-medium">
              Notas adicionales
            </Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => handleInputChange('notas', e.target.value)}
              placeholder="Agregar comentarios, observaciones o información relevante..."
              rows={4}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || !isFormValid}
            className="min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Guardar
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
