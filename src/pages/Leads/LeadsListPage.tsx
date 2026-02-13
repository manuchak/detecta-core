import { useState, useCallback, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Users, BarChart3, Target, UserPlus } from "lucide-react";
import { SupplyPipelineBreadcrumb } from "@/components/leads/supply/SupplyPipelineBreadcrumb";
import { useAuth } from "@/contexts/AuthContext";
import { LeadsTable } from "@/components/leads/LeadsTable";
import { EnhancedLeadForm } from "@/components/leads/EnhancedLeadForm";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { LeadQuickPreview } from "@/components/leads/LeadQuickPreview";
import { LeadsNavigationTabs } from "@/components/leads/LeadsNavigationTabs";
import { LeadsInlineFilters } from "@/components/leads/LeadsInlineFilters";
import { LeadsMetricsSummary } from "@/components/leads/LeadsMetricsSummary";
import { useLeadsCounts } from "@/hooks/useLeadsCounts";
import { Lead } from "@/types/leadTypes";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { QuickFilters, QuickFilterPreset } from "@/components/leads/QuickFilters";

// Lazy load de sección pesada - solo carga cuando se abre el drawer
const CompactZoneNeedsSection = lazy(() => 
  import("@/components/leads/CompactZoneNeedsSection").then(m => ({ default: m.CompactZoneNeedsSection }))
);

const ZoneSectionSkeleton = () => (
  <div className="p-4 space-y-3 animate-pulse">
    <div className="h-4 w-32 bg-muted rounded" />
    <div className="grid grid-cols-2 gap-3">
      <div className="h-16 bg-muted rounded" />
      <div className="h-16 bg-muted rounded" />
    </div>
  </div>
);

const LeadsListPage = () => {
  const { loading: authLoading, permissions, userRole } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [activeTab, setActiveTab] = useState<string>("uncontacted");
  const [quickPreviewLead, setQuickPreviewLead] = useState<Lead | null>(null);
  const [activeFilterPreset, setActiveFilterPreset] = useState<string | undefined>();
  const [zonesSheetOpen, setZonesSheetOpen] = useState(false);
  
  // Inline filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

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
  };

  const handleClearFilters = useCallback(() => {
    setSearchTerm("");
    setDateFilter("all");
    setSourceFilter("all");
    setActiveFilterPreset(undefined);
  }, []);

  // Mapear tab a filterByDecision
  const getDecisionFilter = (): 'all' | 'approved' | 'pending' | 'rejected' => {
    switch (activeTab) {
      case 'approved': return 'approved';
      case 'pending': return 'pending';
      case 'rejected': return 'rejected';
      case 'uncontacted': return 'pending'; // Por contactar = pendientes
      default: return 'all';
    }
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
    <div className="space-y-4 p-6">
      {/* Supply Pipeline Breadcrumb */}
      <SupplyPipelineBreadcrumb />

      {/* Header Lean */}
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Candidatos</h1>
          <Badge variant="outline" className="text-xs font-normal tabular-nums">
            {countsLoading ? '...' : `${(counts?.uncontacted || 0).toLocaleString()} por asignar`}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Métricas en Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <BarChart3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Métricas</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <LeadsMetricsSummary 
                counts={counts} 
                isLoading={countsLoading}
              />
            </PopoverContent>
          </Popover>

          {/* Objetivos por Zona en Sheet */}
          <Sheet open={zonesSheetOpen} onOpenChange={setZonesSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-1.5">
                <Target className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Metas</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[400px] sm:w-[540px]">
              <SheetHeader>
                <SheetTitle>Objetivos de Reclutamiento</SheetTitle>
              </SheetHeader>
              <div className="mt-6">
                {zonesSheetOpen && (
                  <Suspense fallback={<ZoneSectionSkeleton />}>
                    <CompactZoneNeedsSection />
                  </Suspense>
                )}
              </div>
            </SheetContent>
          </Sheet>

          {/* Filtros Avanzados en Sheet */}
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

      {/* Navigation Tabs */}
      <LeadsNavigationTabs
        counts={counts}
        isLoading={countsLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Inline Filters */}
      <LeadsInlineFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
        sourceFilter={sourceFilter}
        onSourceFilterChange={setSourceFilter}
        onClearFilters={handleClearFilters}
      />

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
        <LeadsTable 
          onEditLead={handleEditLead}
          onQuickPreview={handleQuickPreview}
          filterByDecision={getDecisionFilter()}
          externalSearchTerm={searchTerm}
          externalDateFilter={dateFilter}
          externalSourceFilter={sourceFilter}
        />
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
