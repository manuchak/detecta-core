
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { TimeframeOption, ServiceTypeOption } from "@/hooks/useDashboardData";

interface DashboardFiltersProps {
  timeframe: TimeframeOption;
  serviceTypeFilter: ServiceTypeOption;
  onTimeframeChange: (value: TimeframeOption) => void;
  onServiceTypeChange: (value: ServiceTypeOption) => void;
  onRefresh: () => void;
}

export const DashboardFilters = ({
  timeframe,
  serviceTypeFilter,
  onTimeframeChange,
  onServiceTypeChange,
  onRefresh
}: DashboardFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between gap-4">
      <div className="flex gap-2 items-center">
        <Select value={timeframe} onValueChange={onTimeframeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Hoy</SelectItem>
            <SelectItem value="week">Últimos 7 días</SelectItem>
            <SelectItem value="month">Último mes</SelectItem>
            <SelectItem value="quarter">Último trimestre</SelectItem>
            <SelectItem value="year">Último año</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex gap-2 items-center">
        <Select value={serviceTypeFilter} onValueChange={onServiceTypeChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo de servicio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los servicios</SelectItem>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="foraneo">Foráneo</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" onClick={onRefresh}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
