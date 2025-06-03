
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

interface Analyst {
  id: string;
  display_name: string;
  email: string;
}

interface LeadAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  currentAssignee?: string | null;
  onAssignmentUpdate: () => void;
}

export const LeadAssignmentDialog = ({
  open,
  onOpenChange,
  leadId,
  leadName,
  currentAssignee,
  onAssignmentUpdate
}: LeadAssignmentDialogProps) => {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingAnalysts, setLoadingAnalysts] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchAnalysts();
      setSelectedAnalyst(currentAssignee || "");
    }
  }, [open, currentAssignee]);

  const fetchAnalysts = async () => {
    try {
      setLoadingAnalysts(true);
      
      // Obtener usuarios con roles de analista, admin o manager
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          email,
          user_roles!inner(role)
        `)
        .in('user_roles.role', ['admin', 'manager', 'supply_admin', 'soporte']);

      if (error) throw error;

      const mappedAnalysts: Analyst[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        display_name: profile.display_name,
        email: profile.email
      }));

      setAnalysts(mappedAnalysts);
    } catch (error) {
      console.error('Error fetching analysts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los analistas disponibles.",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalysts(false);
    }
  };

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

      onAssignmentUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning lead:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el candidato.",
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Asignar Candidato
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">
              Candidato: <span className="font-medium">{leadName}</span>
            </p>
          </div>

          {loadingAnalysts ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Cargando analistas...</span>
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium">Seleccionar Analista</label>
              <Select value={selectedAnalyst} onValueChange={setSelectedAnalyst}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un analista" />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map((analyst) => (
                    <SelectItem key={analyst.id} value={analyst.id}>
                      {analyst.display_name} ({analyst.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {currentAssignee && (
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
