
import { useState } from "react";
import { TimeframeOption, ServiceTypeOption } from "@/hooks/useDashboardDataCorrected";
import { AdvancedFilters } from "./AdvancedFilters";

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

interface DashboardFiltersProps {
  timeframe: TimeframeOption;
  serviceTypeFilter: ServiceTypeOption;
  onTimeframeChange: (value: TimeframeOption) => void;
  onServiceTypeChange: (value: ServiceTypeOption) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const DashboardFilters = ({
  timeframe,
  serviceTypeFilter,
  onTimeframeChange,
  onServiceTypeChange,
  onRefresh,
  isLoading = false
}: DashboardFiltersProps) => {
  const [filters, setFilters] = useState<FilterState>({
    timeframe,
    serviceType: serviceTypeFilter
  });

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    
    // Actualizar los filtros padre cuando cambien
    if (newFilters.timeframe !== timeframe) {
      onTimeframeChange(newFilters.timeframe);
    }
    if (newFilters.serviceType !== serviceTypeFilter) {
      onServiceTypeChange(newFilters.serviceType);
    }
  };

  return (
    <AdvancedFilters
      filters={filters}
      onFiltersChange={handleFiltersChange}
      onRefresh={onRefresh}
      isLoading={isLoading}
    />
  );
};
