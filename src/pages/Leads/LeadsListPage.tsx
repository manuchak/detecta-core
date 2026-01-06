import { useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { EnhancedLeadForm } from "@/components/leads/EnhancedLeadForm";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { LeadQuickPreview } from "@/components/leads/LeadQuickPreview";
import { SupplyQuickActionBar } from "@/components/leads/SupplyQuickActionBar";
import { SupplySmartTabs } from "@/components/leads/SupplySmartTabs";
import { useLeadsCounts } from "@/hooks/useLeadsCounts";
import { Lead } from "@/types/leadTypes";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { QuickFilters, QuickFilterPreset } from "@/components/leads/QuickFilters";

// Lazy load de sección pesada - solo carga cuando se expande
const CompactZoneNeedsSection = lazy(() => 
  import("@/components/leads/CompactZoneNeedsSection").then(m => ({ default: m.CompactZoneNeedsSection }))
);

const ZoneSectionSkeleton = () => (
  <div className="p-4 bg-muted/30 rounded-lg border border-border/50 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="h-4 w-32 bg-muted rounded" />
      <div className="h-4 w-24 bg-muted rounded" />
      <div className="h-4 w-20 bg-muted rounded" />
    </div>
  </div>
);

const LeadsListPage = () => {
  const { loading: authLoading, permissions, userRole } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeDecisionTab, setActiveDecisionTab] = useState<string>("all");
  const [quickFilter, setQuickFilter] = useState<string>("all");
  const [quickPreviewLead, setQuickPreviewLead] = useState<Lead | null>(null);
  const [zoneExpanded, setZoneExpanded] = useState(false);
  const [activeFilterPreset, setActiveFilterPreset] = useState<string | undefined>();

  // Hook eficiente para contadores - usa RPC con COUNT en SQL
  const { data: counts, isLoading: countsLoading } = useLeadsCounts();

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

  const handleApplyFilter = (preset: QuickFilterPreset) => {
    setActiveFilterPreset(preset.id);
    // Apply filter logic here if needed
  };

  // Mapear quickFilter a filterByDecision
  const getDecisionFilter = (): 'all' | 'approved' | 'pending' | 'rejected' => {
    if (quickFilter === 'uncontacted') return 'pending';
    if (activeDecisionTab !== 'all') return activeDecisionTab as 'all' | 'approved' | 'pending' | 'rejected';
    return quickFilter as 'all' | 'approved' | 'pending' | 'rejected';
  };

  // Mostrar loading durante la autenticación
  if (authLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
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

  // Verificar permisos
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
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header Lean - Estilo Approvals */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="apple-text-title">Candidatos</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">
              <Users className="h-3 w-3 mr-1" />
              {countsLoading ? '...' : (counts?.total || 0).toLocaleString()}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Filtros en Sheet lateral */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Filtros</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[340px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle>Filtros Avanzados</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                <QuickFilters 
                  onApplyFilter={handleApplyFilter}
                  activePreset={activeFilterPreset}
                />
              </div>
            </SheetContent>
          </Sheet>
          
          {permissions.canEditLeads && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              size="sm"
              className="h-8 gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nuevo</span>
            </Button>
          )}
        </div>
      </header>

      {/* Quick Action Pills - Minimalistas */}
      <SupplyQuickActionBar
        counts={counts}
        isLoading={countsLoading}
        activeFilter={quickFilter}
        onFilterChange={(filter) => {
          setQuickFilter(filter);
          if (filter !== 'all') setActiveDecisionTab('all');
        }}
      />

      {/* Sección de Necesidades - Lazy loaded */}
      <CollapsibleSection
        title="Objetivos de Reclutamiento"
        subtitle="Metas por zona"
        variant="compact"
        defaultOpen={false}
        onOpenChange={setZoneExpanded}
      >
        {zoneExpanded && (
          <Suspense fallback={<ZoneSectionSkeleton />}>
            <CompactZoneNeedsSection />
          </Suspense>
        )}
      </CollapsibleSection>

      {/* Formulario o Tabla */}
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
        <div className="space-y-4">
          {/* Smart Tabs - Compactas */}
          <SupplySmartTabs
            counts={counts}
            isLoading={countsLoading}
            activeTab={activeDecisionTab}
            onTabChange={(tab) => {
              setActiveDecisionTab(tab);
              setQuickFilter('all');
            }}
          />

          {/* Tabla de Leads */}
          <LeadsTable 
            onEditLead={handleEditLead}
            onQuickPreview={handleQuickPreview}
            filterByDecision={getDecisionFilter()}
          />
        </div>
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