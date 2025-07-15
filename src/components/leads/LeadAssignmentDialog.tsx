
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2, UserCheck } from "lucide-react";
import { useLeadAssignment } from "@/hooks/useLeadAssignment";

interface LeadAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  currentAssignee?: string | null;
  onAssignmentUpdate: () => void;
  isBulkMode?: boolean;
  selectedLeadIds?: string[];
}

export const LeadAssignmentDialog = ({
  open,
  onOpenChange,
  leadId,
  leadName,
  currentAssignee,
  onAssignmentUpdate,
  isBulkMode = false,
  selectedLeadIds = []
}: LeadAssignmentDialogProps) => {
  const { analysts, loading: loadingAnalysts, fetchAnalysts } = useLeadAssignment();
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAnalysts();
      setSelectedAnalyst(currentAssignee || "");
    }
  }, [open, currentAssignee, fetchAnalysts]);

  const handleAssign = async () => {
    if (!selectedAnalyst) {
      toast({
        title: "Selección requerida",
        description: "Por favor selecciona un analista para asignar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isBulkMode && selectedLeadIds.length > 0) {
        // Asignación masiva
        const { error } = await supabase
          .from('leads')
          .update({ 
            asignado_a: selectedAnalyst,
            updated_at: new Date().toISOString()
          })
          .in('id', selectedLeadIds);

        if (error) throw error;

        toast({
          title: "Candidatos asignados",
          description: `${selectedLeadIds.length} candidatos han sido asignados exitosamente.`,
        });
      } else {
        // Asignación individual
        const { error } = await supabase
          .from('leads')
          .update({ 
            asignado_a: selectedAnalyst,
            updated_at: new Date().toISOString()
          })
          .eq('id', leadId);

        if (error) throw error;

        toast({
          title: "Candidato asignado",
          description: `El candidato ha sido asignado exitosamente.`,
        });
      }

      // Cerrar el diálogo inmediatamente para evitar loops de UI
      onOpenChange(false);
      // Después actualizar los datos
      onAssignmentUpdate();
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: "Error",
        description: isBulkMode 
          ? "No se pudieron asignar los candidatos." 
          : "No se pudo asignar el candidato.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          asignado_a: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Asignación removida",
        description: `La asignación del candidato ha sido removida.`,
      });

      onAssignmentUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error unassigning lead:', error);
      toast({
        title: "Error",
        description: "No se pudo remover la asignación.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Asignar Analista
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Candidato:</span> {leadName}
            </p>
          </div>

          {loadingAnalysts ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm">Cargando analistas...</span>
            </div>
          ) : analysts.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-muted-foreground">
                No hay analistas disponibles
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Analista</label>
              <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un analista" />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map((analyst) => (
                    <SelectItem key={analyst.id} value={analyst.id}>
                      <div className="flex flex-col">
                        <span>{analyst.display_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {analyst.email} • {analyst.role}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {currentAssignee && !isBulkMode && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleUnassign}
              disabled={loading || loadingAnalysts}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remover Asignación
            </Button>
          )}
          <Button 
            type="button" 
            onClick={handleAssign}
            disabled={loading || loadingAnalysts || !selectedAnalyst}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Asignar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
