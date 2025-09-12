import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, X, Users } from "lucide-react";
import { Lead } from "@/types/leadTypes";
import { LeadAssignmentDialog } from "./LeadAssignmentDialog";
import { useAuth } from "@/contexts/AuthContext";

interface BulkActionsToolbarProps {
  selectedLeads: Lead[];
  onClearSelection: () => void;
  onBulkAssignmentComplete: () => void;
}

export const BulkActionsToolbar = ({ 
  selectedLeads, 
  onClearSelection, 
  onBulkAssignmentComplete 
}: BulkActionsToolbarProps) => {
  const [showBulkAssignmentDialog, setShowBulkAssignmentDialog] = useState(false);
  const { permissions } = useAuth();

  // Ocultar completamente para roles sin edición
  if (!permissions.canEditLeads || selectedLeads.length === 0) return null;

  const unassignedCount = selectedLeads.filter(lead => !lead.asignado_a).length;
  const assignedCount = selectedLeads.length - unassignedCount;

  const handleBulkAssignment = () => {
    setShowBulkAssignmentDialog(true);
  };

  const handleAssignmentComplete = () => {
    setShowBulkAssignmentDialog(false);
    onBulkAssignmentComplete();
    onClearSelection();
  };

  return (
    <>
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-medium text-primary">
                  {selectedLeads.length} candidato{selectedLeads.length > 1 ? 's' : ''} seleccionado{selectedLeads.length > 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                {unassignedCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unassignedCount} sin asignar
                  </Badge>
                )}
                {assignedCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {assignedCount} asignados
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {unassignedCount > 0 && (
                <Button 
                  onClick={handleBulkAssignment}
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Asignar en Lote
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearSelection}
              >
                <X className="h-4 w-4 mr-2" />
                Limpiar Selección
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showBulkAssignmentDialog && (
        <LeadAssignmentDialog
          open={showBulkAssignmentDialog}
          onOpenChange={setShowBulkAssignmentDialog}
          leadId={selectedLeads[0]?.id || ''}
          leadName={`${selectedLeads.length} candidatos seleccionados`}
          currentAssignee={null}
          onAssignmentUpdate={handleAssignmentComplete}
          isBulkMode={true}
          selectedLeadIds={selectedLeads.map(lead => lead.id)}
        />
      )}
    </>
  );
};