
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, CheckCircle, Clock, XCircle, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { EnhancedLeadForm } from "@/components/leads/EnhancedLeadForm";
import { CompactZoneNeedsSection } from "@/components/leads/CompactZoneNeedsSection";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { MinimalSectionHeader } from "@/components/recruitment/ui/MinimalSectionHeader";
import { LeadQuickPreview } from "@/components/leads/LeadQuickPreview";
import { Lead } from "@/types/leadTypes";
import { useSimpleLeads } from "@/hooks/useSimpleLeads";

const LeadsListPage = () => {
  const { loading: authLoading, permissions, userRole } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeDecisionTab, setActiveDecisionTab] = useState<string>("all");
  const [quickPreviewLead, setQuickPreviewLead] = useState<Lead | null>(null);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });

  // Obtener todos los leads para calcular contadores
  const { leads: allLeads } = useSimpleLeads({
    filters: {},
    pagination: { page: 1, pageSize: 10000 },
    enableCache: true
  });

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setShowCreateForm(true);
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
    setEditingLead(null);
  };

  const handleQuickPreview = (lead: Lead) => {
    setQuickPreviewLead(lead);
  };

  const handleEditFromPreview = (lead: Lead) => {
    setQuickPreviewLead(null);
    setEditingLead(lead);
    setShowCreateForm(true);
  };

  // Calcular contadores de tabs
  useEffect(() => {
    if (!allLeads || allLeads.length === 0) return;

    const counts = {
      all: allLeads.length,
      approved: 0,
      pending: 0,
      rejected: 0
    };

    allLeads.forEach(lead => {
      const approval = (lead as any).approval;
      const decision = approval?.final_decision;

      if (decision === 'approved') {
        counts.approved++;
      } else if (decision === 'rejected') {
        counts.rejected++;
      } else {
        counts.pending++;
      }
    });

    setTabCounts(counts);
  }, [allLeads]);

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
    <div className="space-y-6 p-6">
      <MinimalSectionHeader
        title="Gestión de Candidatos"
        description="Administra los candidatos y sus asignaciones"
        actions={
          permissions.canEditLeads && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              Nuevo Candidato
            </Button>
          )
        }
      />

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
          <Tabs value={activeDecisionTab} onValueChange={setActiveDecisionTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Todos
                <Badge variant="secondary" className="ml-1">{tabCounts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Aprobados
                <Badge variant="secondary" className="ml-1">{tabCounts.approved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                En Proceso
                <Badge variant="secondary" className="ml-1">{tabCounts.pending}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Rechazados
                <Badge variant="secondary" className="ml-1">{tabCounts.rejected}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeDecisionTab} className="mt-0">
              <LeadsTable 
                onEditLead={handleEditLead}
                onQuickPreview={handleQuickPreview}
                filterByDecision={activeDecisionTab as 'all' | 'approved' | 'pending' | 'rejected'}
              />
            </TabsContent>
          </Tabs>
        </CollapsibleSection>
      )}

      {/* Quick Preview Modal */}
      <LeadQuickPreview
        lead={quickPreviewLead}
        onClose={() => setQuickPreviewLead(null)}
        onEdit={handleEditFromPreview}
      />
    </div>
  );
};

export default LeadsListPage;
