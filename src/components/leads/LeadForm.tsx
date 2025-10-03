import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LeadEstado } from "@/types/leadTypes";
import { useLeadsStable as useLeads } from "@/hooks/useLeadsStable";
import { Lead } from "@/types/leadTypes";
import { useToast } from "@/components/ui/use-toast";
import { usePersistedForm } from "@/hooks/usePersistedForm";
import { useAuth } from "@/contexts/AuthContext";

interface LeadFormData {
  nombre: string;
  email: string;
  telefono: string;
  estado: string;
  notas: string;
}

interface LeadFormProps {
  editingLead?: Lead | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const LeadForm = ({ editingLead, onSuccess, onCancel }: LeadFormProps) => {
  const { createLead, updateLead } = useLeads();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Use persisted form for draft functionality
  const {
    formData,
    updateFormData,
    hasDraft,
    restoreDraft,
    clearDraft,
  } = usePersistedForm<LeadFormData>({
    key: 'lead_form_draft',
    initialData: {
      nombre: "",
      email: "",
      telefono: "",
      estado: "nuevo",
      notas: "",
    },
    saveOnChangeDebounceMs: 1000,
    isMeaningfulDraft: (data) => {
      return !!(data.nombre || data.email || data.telefono);
    },
  });

  useEffect(() => {
    if (editingLead) {
      updateFormData({
        nombre: editingLead.nombre || "",
        email: editingLead.email || "",
        telefono: editingLead.telefono || "",
        estado: editingLead.estado || "nuevo",
        notas: editingLead.notas || "",
      });
    }
  }, [editingLead]);

  const handleInputChange = (field: string, value: string) => {
    updateFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast({
        title: "Error",
        description: "Por favor complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const typedFormData = {
        ...formData,
        estado: formData.estado as LeadEstado
      };
      
      if (editingLead) {
        await updateLead.mutateAsync({
          leadId: editingLead.id,
          updates: typedFormData
        });
      } else {
        await createLead.mutateAsync(typedFormData);
      }
      
      // Clear draft on successful submission
      clearDraft();
      onSuccess();
    } catch (error) {
      console.error('Error saving lead:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="nombre">Nombre Completo *</Label>
          <Input
            id="nombre"
            value={formData.nombre}
            onChange={(e) => handleInputChange('nombre', e.target.value)}
            placeholder="Ingrese el nombre completo"
            required
          />
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="correo@ejemplo.com"
            required
          />
        </div>

        <div>
          <Label htmlFor="telefono">Teléfono *</Label>
          <Input
            id="telefono"
            value={formData.telefono}
            onChange={(e) => handleInputChange('telefono', e.target.value)}
            placeholder="+52 555 123 4567"
            required
          />
        </div>

        <div>
          <Label htmlFor="estado">Estado</Label>
          <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nuevo">Nuevo</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="aprobado">Aprobado</SelectItem>
              <SelectItem value="rechazado">Rechazado</SelectItem>
              <SelectItem value="pendiente">Pendiente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="notas">Notas</Label>
        <Textarea
          id="notas"
          value={formData.notas}
          onChange={(e) => handleInputChange('notas', e.target.value)}
          placeholder="Notas adicionales sobre el candidato..."
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={loading || createLead.isPending || updateLead.isPending}
        >
          {loading ? 'Guardando...' : editingLead ? 'Actualizar' : 'Crear'} Candidato
        </Button>
      </div>
    </form>
  );
};
