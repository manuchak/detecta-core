
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, TrendingUp } from 'lucide-react';

export type TimeframeOption = "day" | "week" | "month" | "quarter" | "year" | "custom" | "thisMonth" | "thisQuarter" | "lastMonth" | "lastQuarter" | "last7Days" | "last30Days" | "last90Days" | "yearToDate" | "monthToDate";
export type ServiceTypeOption = "all" | "local" | "foraneo";

interface DashboardFiltersProps {
  timeframe: TimeframeOption;
  serviceType: ServiceTypeOption;
  onTimeframeChange: (value: TimeframeOption) => void;
  onServiceTypeChange: (value: ServiceTypeOption) => void;
}

export const DashboardFilters = ({ 
  timeframe, 
  serviceType, 
  onTimeframeChange, 
  onServiceTypeChange 
}: DashboardFiltersProps) => {
  
  const timeframeOptions = [
    { value: "day" as TimeframeOption, label: "Hoy", description: "Datos de hoy" },
    { value: "week" as TimeframeOption, label: "Esta semana", description: "Últimos 7 días" },
    { value: "thisMonth" as TimeframeOption, label: "Este mes", description: "Mes en curso" },
    { value: "monthToDate" as TimeframeOption, label: "Mes hasta la fecha", description: "Desde inicio del mes hasta hoy" },
    { value: "lastMonth" as TimeframeOption, label: "Mes anterior", description: "Mes pasado completo" },
    { value: "thisQuarter" as TimeframeOption, label: "Este trimestre", description: "Trimestre actual" },
    { value: "lastQuarter" as TimeframeOption, label: "Trimestre anterior", description: "Trimestre pasado" },
    { value: "last7Days" as TimeframeOption, label: "Últimos 7 días", description: "Rolling 7 días" },
    { value: "last30Days" as TimeframeOption, label: "Últimos 30 días", description: "Rolling 30 días" },
    { value: "last90Days" as TimeframeOption, label: "Últimos 90 días", description: "Rolling 90 días" },
    { value: "yearToDate" as TimeframeOption, label: "Año a la fecha", description: "Desde enero hasta hoy" },
    { value: "year" as TimeframeOption, label: "Último año", description: "Rolling 365 días" }
  ];

  const serviceTypeOptions = [
    { value: "all" as ServiceTypeOption, label: "Todos los servicios", description: "Local y foráneo" },
    { value: "local" as ServiceTypeOption, label: "Solo locales", description: "Servicios locales únicamente" },
    { value: "foraneo" as ServiceTypeOption, label: "Solo foráneos", description: "Servicios foráneos únicamente" }
  ];

  const getCurrentLabel = (value: TimeframeOption) => {
    return timeframeOptions.find(opt => opt.value === value)?.label || "Este mes";
  };

  const getCurrentServiceLabel = (value: ServiceTypeOption) => {
    return serviceTypeOptions.find(opt => opt.value === value)?.label || "Todos los servicios";
  };

  return (
    <Card className="mb-6 bg-white border-gray-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800">
          <Filter className="h-5 w-5 text-blue-600" />
          Filtros de Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filtro de período */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Período de tiempo
            </label>
            <Select value={timeframe} onValueChange={onTimeframeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={getCurrentLabel(timeframe)} />
              </SelectTrigger>
              <SelectContent>
                <div className="py-2">
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Períodos fijos
                  </div>
                  {timeframeOptions.slice(0, 7).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                  
                  <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2">
                    Períodos dinámicos
                  </div>
                  {timeframeOptions.slice(7).map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de tipo de servicio */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Tipo de servicio
            </label>
            <Select value={serviceType} onValueChange={onServiceTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={getCurrentServiceLabel(serviceType)} />
              </SelectTrigger>
              <SelectContent>
                {serviceTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
