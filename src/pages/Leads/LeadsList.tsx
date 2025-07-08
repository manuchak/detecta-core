import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Plus, Users, Settings } from "lucide-react";
import { useUserSkills } from "@/hooks/useUserSkills";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { LeadForm } from "@/components/leads/LeadForm";
import { ReferralManager } from "@/components/leads/ReferralManager";
import { BonusConfigManager } from "@/components/leads/BonusConfigManager";
import { Lead } from "@/hooks/useLeads";

export const LeadsList = () => {
  const { hasAnySkill } = useUserSkills();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState("leads");

  const canManageLeads = hasAnySkill(['leads_management', 'admin_full_access']);

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingLead(null);
  };

  if (!canManageLeads) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Acceso Restringido</h2>
              <p className="text-muted-foreground">
                No tienes permisos para acceder a la gestión de candidatos.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Se requieren skills: leads_management o admin_full_access
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
          <h1 className="text-2xl font-semibold tracking-tight">Gestión de Leads</h1>
          <p className="text-muted-foreground">
            Administra los candidatos y el sistema de referidos.
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Lead
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="leads">
            <Users className="h-4 w-4 mr-2" />
            Leads
          </TabsTrigger>
          <TabsTrigger value="referrals">
            <Users className="h-4 w-4 mr-2" />
            Referidos
          </TabsTrigger>
          <TabsTrigger value="bonus-config">
            <Settings className="h-4 w-4 mr-2" />
            Configuración de Bonos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="leads" className="mt-6">
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
        </TabsContent>

        <TabsContent value="referrals" className="mt-6">
          <ReferralManager />
        </TabsContent>

        <TabsContent value="bonus-config" className="mt-6">
          <BonusConfigManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LeadsList;