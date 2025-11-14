import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Filter, X, RotateCcw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
}

export const ApprovalAdvancedFilters = ({ 
  filters, 
  onFiltersChange, 
  onResetFilters 
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

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4" />
                <CardTitle className="text-sm font-medium">Filtros Avanzados</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount} activo{activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onResetFilters();
                    }}
                    className="h-6 px-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            {/* Filtros por fechas */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Fechas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="creationDateFrom">Creación desde</Label>
                  <Input
                    id="creationDateFrom"
                    type="date"
                    value={filters.creationDateFrom}
                    onChange={(e) => handleFilterChange('creationDateFrom', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creationDateTo">Creación hasta</Label>
                  <Input
                    id="creationDateTo"
                    type="date"
                    value={filters.creationDateTo}
                    onChange={(e) => handleFilterChange('creationDateTo', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastContactDateFrom">Último contacto desde</Label>
                  <Input
                    id="lastContactDateFrom"
                    type="date"
                    value={filters.lastContactDateFrom}
                    onChange={(e) => handleFilterChange('lastContactDateFrom', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastContactDateTo">Último contacto hasta</Label>
                  <Input
                    id="lastContactDateTo"
                    type="date"
                    value={filters.lastContactDateTo}
                    onChange={(e) => handleFilterChange('lastContactDateTo', e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scheduledCallDateFrom">Cita programada desde</Label>
                  <Input
                    id="scheduledCallDateFrom"
                    type="date"
                    value={filters.scheduledCallDateFrom}
                    onChange={(e) => handleFilterChange('scheduledCallDateFrom', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="scheduledCallDateTo">Cita programada hasta</Label>
                  <Input
                    id="scheduledCallDateTo"
                    type="date"
                    value={filters.scheduledCallDateTo}
                    onChange={(e) => handleFilterChange('scheduledCallDateTo', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Filtros por contacto */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Contacto y Llamadas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactAttempts">Intentos de contacto</Label>
                  <Select value={filters.contactAttempts} onValueChange={(value) => handleFilterChange('contactAttempts', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquier cantidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier cantidad</SelectItem>
                      <SelectItem value="0">Sin contactar (0)</SelectItem>
                      <SelectItem value="1-2">1-2 intentos</SelectItem>
                      <SelectItem value="3-5">3-5 intentos</SelectItem>
                      <SelectItem value="5+">5+ intentos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastContactOutcome">Resultado último contacto</Label>
                  <Select value={filters.lastContactOutcome} onValueChange={(value) => handleFilterChange('lastContactOutcome', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Cualquier resultado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Cualquier resultado</SelectItem>
                      <SelectItem value="successful">Exitoso</SelectItem>
                      <SelectItem value="no_answer">Sin respuesta</SelectItem>
                      <SelectItem value="voicemail">Buzón de voz</SelectItem>
                      <SelectItem value="busy">Línea ocupada</SelectItem>
                      <SelectItem value="wrong_number">Número equivocado</SelectItem>
                      <SelectItem value="call_failed">Llamada fallida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasSuccessfulCall">Llamada exitosa</Label>
                  <Select value={filters.hasSuccessfulCall} onValueChange={(value) => handleFilterChange('hasSuccessfulCall', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="true">Solo con llamada exitosa</SelectItem>
                      <SelectItem value="false">Sin llamada exitosa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hasScheduledCall">Cita programada</Label>
                  <Select value={filters.hasScheduledCall} onValueChange={(value) => handleFilterChange('hasScheduledCall', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="true">Solo con cita programada</SelectItem>
                      <SelectItem value="false">Sin cita programada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Filtros por estado */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Estado y Aprobación</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentStage">Etapa de aprobación</Label>
                  <Select value={filters.currentStage} onValueChange={(value) => handleFilterChange('currentStage', value)}>
                    <SelectTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="finalDecision">Decisión final</Label>
                  <Select value={filters.finalDecision} onValueChange={(value) => handleFilterChange('finalDecision', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas las decisiones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las decisiones</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interviewInterrupted">Entrevista interrumpida</Label>
                  <Select value={filters.interviewInterrupted} onValueChange={(value) => handleFilterChange('interviewInterrupted', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="true">Solo interrumpidas</SelectItem>
                      <SelectItem value="false">Sin interrumpir</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignedAnalyst">Analista asignado</Label>
                  <Select value={filters.assignedAnalyst} onValueChange={(value) => handleFilterChange('assignedAnalyst', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los analistas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los analistas</SelectItem>
                      <SelectItem value="unassigned">Sin asignar</SelectItem>
                      {/* Aquí se pueden agregar analistas específicos dinámicamente */}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {activeFiltersCount > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} aplicado{activeFiltersCount > 1 ? 's' : ''}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onResetFilters}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpiar todos
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};