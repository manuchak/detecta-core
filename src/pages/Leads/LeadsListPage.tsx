
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadForm } from "@/components/leads/LeadForm";
import { Lead } from "@/hooks/useLeads";

export const LeadsListPage = () => {
  const { userRole, loading: authLoading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);

  // Usar los mismos permisos que en Home.tsx para consistencia
  const canManageLeads = ['admin', 'owner', 'supply_admin', 'ejecutivo_ventas'].includes(userRole || '');

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

  if (!canManageLeads) {
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
                Se requieren roles: admin, owner, supply_admin o ejecutivo_ventas
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Tu rol actual: {userRole || 'No asignado'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Candidatos</h1>
          <p className="text-muted-foreground">
            Administra los candidatos y sus asignaciones.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Candidato
        </Button>
      </div>

      {showCreateForm ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingLead ? 'Editar Candidato' : 'Crear Nuevo Candidato'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LeadForm
              editingLead={editingLead}
              onSuccess={handleCloseForm}
              onCancel={handleCloseForm}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Lista de Candidatos</CardTitle>
          </CardHeader>
          <CardContent>
            <LeadsTable onEditLead={handleEditLead} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeadsListPage;
