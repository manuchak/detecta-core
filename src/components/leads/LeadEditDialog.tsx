
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface LeadEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onUpdate: () => void;
}

export const LeadEditDialog = ({ open, onOpenChange, lead, onUpdate }: LeadEditDialogProps) => {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    empresa: '',
    mensaje: '',
    fuente: '',
    estado: '',
    notas: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (lead && open) {
      fetchLeadDetails();
    }
  }, [lead, open]);

  const fetchLeadDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.lead_id)
        .single();

      if (error) throw error;

      setFormData({
        nombre: data.nombre || '',
        email: data.email || '',
        telefono: data.telefono || '',
        empresa: data.empresa || '',
        mensaje: data.mensaje || '',
        fuente: data.fuente || '',
        estado: data.estado || '',
        notas: data.notas || ''
      });
    } catch (error) {
      console.error('Error fetching lead details:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles del candidato.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          nombre: formData.nombre,
          email: formData.email,
          telefono: formData.telefono,
          empresa: formData.empresa,
          mensaje: formData.mensaje,
          fuente: formData.fuente,
          estado: formData.estado,
          notas: formData.notas,
          updated_at: new Date().toISOString()
        })
        .eq('id', lead.lead_id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Los datos del candidato han sido actualizados.",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Información del Candidato</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre">Nombre completo *</Label>
              <Input
                id="nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="empresa">Empresa</Label>
              <Input
                id="empresa"
                value={formData.empresa}
                onChange={(e) => setFormData(prev => ({ ...prev, empresa: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="fuente">Fuente</Label>
              <Select value={formData.fuente} onValueChange={(value) => setFormData(prev => ({ ...prev, fuente: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar fuente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">Sitio Web</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="indeed">Indeed</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="referido">Referido</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="telefono">Teléfono</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="estado">Estado</Label>
              <Select value={formData.estado} onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="entrevista">En entrevista</SelectItem>
                  <SelectItem value="documentos">Documentos</SelectItem>
                  <SelectItem value="en_proceso">En proceso</SelectItem>
                  <SelectItem value="aprobado">Aprobado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="mensaje">Mensaje</Label>
            <Textarea
              id="mensaje"
              value={formData.mensaje}
              onChange={(e) => setFormData(prev => ({ ...prev, mensaje: e.target.value }))}
              rows={3}
            />
          </div>
          
          <div>
            <Label htmlFor="notas">Notas adicionales</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              rows={4}
            />
          </div>
          
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
