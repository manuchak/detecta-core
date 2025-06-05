import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  RefreshCw, 
  Filter, 
  Calendar as CalendarIcon, 
  X, 
  ChevronDown,
  Settings2,
  Download,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TimeframeOption, ServiceTypeOption } from "@/hooks/useDashboardDataCorrected";

interface FilterState {
  timeframe: TimeframeOption;
  serviceType: ServiceTypeOption;
  customDateRange?: {
    from: Date;
    to: Date;
  };
  clientFilter?: string;
  statusFilter?: string[];
  amountRange?: {
    min: number;
    max: number;
  };
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const AdvancedFilters = ({
  filters,
  onFiltersChange,
  onRefresh,
  isLoading = false
}: AdvancedFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [clientSearch, setClientSearch] = useState(filters.clientFilter || "");
  
  const statusOptions = [
    { value: "Finalizado", label: "Finalizado", color: "bg-green-100 text-green-800" },
    { value: "En Ruta", label: "En Ruta", color: "bg-blue-100 text-blue-800" },
    { value: "Cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
    { value: "Programado", label: "Programado", color: "bg-yellow-100 text-yellow-800" },
    { value: "Pendiente", label: "Pendiente", color: "bg-gray-100 text-gray-800" }
  ];

  const timeframeOptions = [
    { value: "day", label: "Hoy" },
    { value: "week", label: "Últimos 7 días" },
    { value: "thisMonth", label: "Este mes" },
    { value: "month", label: "Último mes" },
    { value: "quarter", label: "Último trimestre" },
    { value: "thisQuarter", label: "Este trimestre" },
    { value: "year", label: "Último año" },
    { value: "custom", label: "Rango personalizado" }
  ];

  const updateFilter = (key: keyof FilterState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const toggleStatusFilter = (status: string) => {
    const currentStatuses = filters.statusFilter || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    updateFilter('statusFilter', newStatuses);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      timeframe: "thisMonth",
      serviceType: "all"
    });
    setClientSearch("");
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.serviceType !== "all") count++;
    if (filters.clientFilter) count++;
    if (filters.statusFilter?.length) count++;
    if (filters.amountRange) count++;
    if (filters.customDateRange) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="border-2 border-slate-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold text-slate-800 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Filtros de Análisis
              <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                Auditoría Forense Aplicada
              </Badge>
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} activo{activeFiltersCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Settings2 className="h-4 w-4" />
              {isExpanded ? 'Contraer' : 'Expandir'}
              <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Filtros básicos - siempre visibles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Período de tiempo */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Período</Label>
            <Select 
              value={filters.timeframe} 
              onValueChange={(value) => updateFilter('timeframe', value as TimeframeOption)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar período" />
              </SelectTrigger>
              <SelectContent>
                {timeframeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de servicio */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Tipo de Servicio</Label>
            <Select 
              value={filters.serviceType} 
              onValueChange={(value) => updateFilter('serviceType', value as ServiceTypeOption)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos los servicios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los servicios</SelectItem>
                <SelectItem value="local">Local</SelectItem>
                <SelectItem value="foraneo">Foráneo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Búsqueda de cliente */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-700">Cliente</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  updateFilter('clientFilter', e.target.value);
                }}
                className="pl-10"
              />
              {clientSearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setClientSearch("");
                    updateFilter('clientFilter', "");
                  }}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Nota sobre auditoría forense */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-sm text-green-800">
            <strong>Filtros de Auditoría Forense Aplicados:</strong> Los cálculos de GMV, clientes activos y valor promedio 
            incluyen únicamente servicios con estado "Finalizado" y cobro válido, según las mejores prácticas de auditoría.
          </p>
        </div>

        {/* Filtros avanzados - expandibles */}
        {isExpanded && (
          <>
            <Separator />
            <div className="space-y-6">
              {/* Rango de fechas personalizado */}
              {filters.timeframe === "custom" && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Rango de fechas personalizado</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.customDateRange?.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.customDateRange?.from ? (
                            format(filters.customDateRange.from, "PPP", { locale: es })
                          ) : (
                            "Fecha inicio"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateRange?.from}
                          onSelect={(date) => {
                            if (date) {
                              updateFilter('customDateRange', {
                                ...filters.customDateRange,
                                from: date
                              });
                            }
                          }}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !filters.customDateRange?.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.customDateRange?.to ? (
                            format(filters.customDateRange.to, "PPP", { locale: es })
                          ) : (
                            "Fecha fin"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={filters.customDateRange?.to}
                          onSelect={(date) => {
                            if (date) {
                              updateFilter('customDateRange', {
                                ...filters.customDateRange,
                                to: date
                              });
                            }
                          }}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {/* Estados de servicio */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Estados de Servicio</Label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((status) => {
                    const isSelected = filters.statusFilter?.includes(status.value) || false;
                    return (
                      <Button
                        key={status.value}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleStatusFilter(status.value)}
                        className={cn(
                          "transition-all",
                          isSelected && status.color
                        )}
                      >
                        {status.label}
                        {isSelected && <X className="ml-2 h-3 w-3" />}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Rango de montos */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Rango de Montos (MXN)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-slate-500">Mínimo</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.amountRange?.min || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || undefined;
                        updateFilter('amountRange', {
                          ...filters.amountRange,
                          min: value
                        });
                      }}
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-slate-500">Máximo</Label>
                    <Input
                      type="number"
                      placeholder="Sin límite"
                      value={filters.amountRange?.max || ""}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || undefined;
                        updateFilter('amountRange', {
                          ...filters.amountRange,
                          max: value
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-slate-600 hover:text-slate-800"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
