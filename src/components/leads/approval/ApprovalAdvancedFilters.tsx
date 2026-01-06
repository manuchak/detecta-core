import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X, RotateCcw } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SavedViewsSection } from "./SavedViewsSection";
import { SavedView } from "@/hooks/useFilterPersistence";

export interface ApprovalAdvancedFiltersState {
  creationDateFrom: string;
  creationDateTo: string;
  lastContactDateFrom: string;
  lastContactDateTo: string;
  scheduledCallDateFrom: string;
  scheduledCallDateTo: string;
  contactAttempts: string;
  lastContactOutcome: string;
  currentStage: string;
  finalDecision: string;
  hasSuccessfulCall: string;
  hasScheduledCall: string;
  interviewInterrupted: string;
  assignedAnalyst: string;
}

interface ApprovalAdvancedFiltersProps {
  filters: ApprovalAdvancedFiltersState;
  onFiltersChange: (filters: ApprovalAdvancedFiltersState) => void;
  onResetFilters: () => void;
  leads?: any[];
  // Saved views props
  savedViews?: SavedView[];
  onSaveView?: (name: string) => void;
  onLoadView?: (view: SavedView) => void;
  onDeleteView?: (viewId: string) => void;
  // User role for conditional rendering
  userRole?: string | null;
}

export const ApprovalAdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  onResetFilters,
  leads = [],
  savedViews = [],
  onSaveView,
  onLoadView,
  onDeleteView,
  userRole
}: ApprovalAdvancedFiltersProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof ApprovalAdvancedFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value && value !== 'all' && value !== '').length;
  };

  // Calculate counts for filters
  const getCounts = () => {
    if (!leads || leads.length === 0) return {};

    return {
      contactAttempts: {
        none: leads.filter((l: any) => !l.intentos_contacto || l.intentos_contacto === 0).length,
        one: leads.filter((l: any) => l.intentos_contacto === 1).length,
        twoToFive: leads.filter((l: any) => l.intentos_contacto >= 2 && l.intentos_contacto <= 5).length,
        moreThanFive: leads.filter((l: any) => l.intentos_contacto > 5).length
      },
      lastContactOutcome: {
        successful: leads.filter((l: any) => l.ultima_llamada_resultado === 'successful').length,
        no_answer: leads.filter((l: any) => l.ultima_llamada_resultado === 'no_answer').length,
        voicemail: leads.filter((l: any) => l.ultima_llamada_resultado === 'voicemail').length,
        busy: leads.filter((l: any) => l.ultima_llamada_resultado === 'busy').length,
        wrong_number: leads.filter((l: any) => l.ultima_llamada_resultado === 'wrong_number').length,
        call_failed: leads.filter((l: any) => l.ultima_llamada_resultado === 'call_failed').length
      },
      hasSuccessfulCall: {
        true: leads.filter((l: any) => l.tuvo_llamada_exitosa).length,
        false: leads.filter((l: any) => !l.tuvo_llamada_exitosa).length
      },
      hasScheduledCall: {
        true: leads.filter((l: any) => l.proxima_llamada_programada).length,
        false: leads.filter((l: any) => !l.proxima_llamada_programada).length
      },
      interviewInterrupted: {
        true: leads.filter((l: any) => l.entrevista_interrumpida).length,
        false: leads.filter((l: any) => !l.entrevista_interrumpida).length
      }
    };
  };

  const counts = getCounts();
  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 shrink-0">
          <Filter className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Filtros</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px] tabular-nums">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-[380px] sm:w-[440px] p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-medium">Filtros Avanzados</SheetTitle>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onResetFilters}
                className="h-7 px-2 text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Limpiar
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)]">
          <div className="px-6 py-4 space-y-6">
            {/* Saved Views Section */}
            {onSaveView && onLoadView && onDeleteView && (
              <>
                <SavedViewsSection
                  savedViews={savedViews}
                  onSaveView={onSaveView}
                  onLoadView={(view) => {
                    onLoadView(view);
                    setIsOpen(false);
                  }}
                  onDeleteView={onDeleteView}
                />
                <Separator />
              </>
            )}

            {/* Filtros por fechas */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fechas</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="creationDateFrom" className="text-xs">Creación desde</Label>
                  <Input
                    id="creationDateFrom"
                    type="date"
                    value={filters.creationDateFrom}
                    onChange={(e) => handleFilterChange('creationDateFrom', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="creationDateTo" className="text-xs">Creación hasta</Label>
                  <Input
                    id="creationDateTo"
                    type="date"
                    value={filters.creationDateTo}
                    onChange={(e) => handleFilterChange('creationDateTo', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="lastContactDateFrom" className="text-xs">Último contacto desde</Label>
                  <Input
                    id="lastContactDateFrom"
                    type="date"
                    value={filters.lastContactDateFrom}
                    onChange={(e) => handleFilterChange('lastContactDateFrom', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastContactDateTo" className="text-xs">Último contacto hasta</Label>
                  <Input
                    id="lastContactDateTo"
                    type="date"
                    value={filters.lastContactDateTo}
                    onChange={(e) => handleFilterChange('lastContactDateTo', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="scheduledCallDateFrom" className="text-xs">Cita desde</Label>
                  <Input
                    id="scheduledCallDateFrom"
                    type="date"
                    value={filters.scheduledCallDateFrom}
                    onChange={(e) => handleFilterChange('scheduledCallDateFrom', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="scheduledCallDateTo" className="text-xs">Cita hasta</Label>
                  <Input
                    id="scheduledCallDateTo"
                    type="date"
                    value={filters.scheduledCallDateTo}
                    onChange={(e) => handleFilterChange('scheduledCallDateTo', e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Filtros por contacto */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Contacto</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="contactAttempts" className="text-xs">Intentos de contacto</Label>
                  <Select value={filters.contactAttempts} onValueChange={(value) => handleFilterChange('contactAttempts', value)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Cualquier cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier cantidad</SelectItem>
                      <SelectItem value="0">
                        Sin contactar {counts.contactAttempts?.none ? `(${counts.contactAttempts.none})` : ''}
                      </SelectItem>
                      <SelectItem value="1-2">
                        1-2 intentos {counts.contactAttempts?.one ? `(${counts.contactAttempts.one})` : ''}
                      </SelectItem>
                      <SelectItem value="3-5">
                        3-5 intentos {counts.contactAttempts?.twoToFive ? `(${counts.contactAttempts.twoToFive})` : ''}
                      </SelectItem>
                      <SelectItem value="5+">
                        5+ intentos {counts.contactAttempts?.moreThanFive ? `(${counts.contactAttempts.moreThanFive})` : ''}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastContactOutcome" className="text-xs">Resultado último contacto</Label>
                  <Select value={filters.lastContactOutcome} onValueChange={(value) => handleFilterChange('lastContactOutcome', value)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Cualquier resultado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier resultado</SelectItem>
                      <SelectItem value="successful">Exitoso {counts.lastContactOutcome?.successful ? `(${counts.lastContactOutcome.successful})` : ''}</SelectItem>
                      <SelectItem value="no_answer">Sin respuesta {counts.lastContactOutcome?.no_answer ? `(${counts.lastContactOutcome.no_answer})` : ''}</SelectItem>
                      <SelectItem value="voicemail">Buzón {counts.lastContactOutcome?.voicemail ? `(${counts.lastContactOutcome.voicemail})` : ''}</SelectItem>
                      <SelectItem value="busy">Ocupado {counts.lastContactOutcome?.busy ? `(${counts.lastContactOutcome.busy})` : ''}</SelectItem>
                      <SelectItem value="wrong_number">Número equivocado {counts.lastContactOutcome?.wrong_number ? `(${counts.lastContactOutcome.wrong_number})` : ''}</SelectItem>
                      <SelectItem value="call_failed">Fallida {counts.lastContactOutcome?.call_failed ? `(${counts.lastContactOutcome.call_failed})` : ''}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="hasSuccessfulCall" className="text-xs">Llamada exitosa</Label>
                    <Select value={filters.hasSuccessfulCall} onValueChange={(value) => handleFilterChange('hasSuccessfulCall', value)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="true">Sí {counts.hasSuccessfulCall?.true ? `(${counts.hasSuccessfulCall.true})` : ''}</SelectItem>
                        <SelectItem value="false">No {counts.hasSuccessfulCall?.false ? `(${counts.hasSuccessfulCall.false})` : ''}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="hasScheduledCall" className="text-xs">Cita programada</Label>
                    <Select value={filters.hasScheduledCall} onValueChange={(value) => handleFilterChange('hasScheduledCall', value)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="true">Sí {counts.hasScheduledCall?.true ? `(${counts.hasScheduledCall.true})` : ''}</SelectItem>
                        <SelectItem value="false">No {counts.hasScheduledCall?.false ? `(${counts.hasScheduledCall.false})` : ''}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Filtros por estado */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="currentStage" className="text-xs">Etapa de aprobación</Label>
                  <Select value={filters.currentStage} onValueChange={(value) => handleFilterChange('currentStage', value)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas las etapas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las etapas</SelectItem>
                      <SelectItem value="initial_contact">Contacto inicial</SelectItem>
                      <SelectItem value="first_interview">Primera entrevista</SelectItem>
                      <SelectItem value="second_interview">Segunda entrevista</SelectItem>
                      <SelectItem value="final_review">Revisión final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="finalDecision" className="text-xs">Decisión final</Label>
                  <Select value={filters.finalDecision} onValueChange={(value) => handleFilterChange('finalDecision', value)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas las decisiones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="interviewInterrupted" className="text-xs">Entrevista interrumpida</Label>
                  <Select value={filters.interviewInterrupted} onValueChange={(value) => handleFilterChange('interviewInterrupted', value)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="true">Solo interrumpidas</SelectItem>
                      <SelectItem value="false">Sin interrumpir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Solo mostrar filtro de analista para admin/owner/supply_admin */}
                {(['admin', 'owner', 'supply_admin'].includes(userRole || '')) && (
                  <div className="space-y-1.5">
                    <Label htmlFor="assignedAnalyst" className="text-xs">Analista asignado</Label>
                    <Select value={filters.assignedAnalyst} onValueChange={(value) => handleFilterChange('assignedAnalyst', value)}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Todos los analistas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos los analistas</SelectItem>
                        <SelectItem value="unassigned">Sin asignar</SelectItem>
                        {(() => {
                          const uniqueAnalysts = new Map<string, string>();
                          leads.forEach((lead: any) => {
                            if (lead.asignado_a && lead.analista_nombre) {
                              uniqueAnalysts.set(lead.asignado_a, lead.analista_nombre);
                            }
                          });
                          return Array.from(uniqueAnalysts.entries()).map(([id, name]) => (
                            <SelectItem key={id} value={id}>{name}</SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>

        {activeFiltersCount > 0 && (
          <SheetFooter className="px-6 py-3 border-t bg-muted/30">
            <div className="flex items-center justify-between w-full text-sm">
              <span className="text-muted-foreground">
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onResetFilters();
                  setIsOpen(false);
                }}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Limpiar todos
              </Button>
            </div>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
};
