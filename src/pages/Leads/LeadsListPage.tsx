
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { EnhancedLeadForm } from "@/components/leads/EnhancedLeadForm";
import { CompactZoneNeedsSection } from "@/components/leads/CompactZoneNeedsSection";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { Lead } from "@/types/leadTypes";

const LeadsListPage = () => {
  const { loading: authLoading, permissions, userRole } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingLead(null);
  };

  // Mostrar loading durante la autenticación
  if (authLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Verificando permisos...</h2>
              <p className="text-muted-foreground">
                Cargando información de usuario y roles...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verificar permisos usando el sistema unificado
  if (!permissions.canViewLeads) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
              <p className="text-muted-foreground mb-2">
                No tienes permisos para acceder a la gestión de candidatos.
              </p>
              <p className="text-sm text-muted-foreground">
                Tu rol '{userRole}' no incluye permisos para ver candidatos.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Contacta al administrador si necesitas acceso.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Candidatos</h1>
          <p className="text-sm text-muted-foreground">
            Administra los candidatos y sus asignaciones.
          </p>
        </div>
        {permissions.canEditLeads && (
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Candidato
          </Button>
        )}
      </div>

      {/* Sección de Necesidades compacta y colapsable */}
      <CompactZoneNeedsSection />

      {/* Formulario o Tabla en sección colapsable */}
      {showCreateForm ? (
        <CollapsibleSection
          title={editingLead ? 'Editar Candidato' : 'Crear Nuevo Candidato'}
          defaultOpen={true}
          variant="default"
        >
          <EnhancedLeadForm
            editingLead={editingLead}
            onSuccess={handleCloseForm}
            onCancel={handleCloseForm}
          />
        </CollapsibleSection>
      ) : (
        <CollapsibleSection
          title="Lista de Candidatos"
          defaultOpen={true}
          variant="default"
        >
          <LeadsTable onEditLead={handleEditLead} />
        </CollapsibleSection>
      )}
    </div>
  );
};

export default LeadsListPage;
