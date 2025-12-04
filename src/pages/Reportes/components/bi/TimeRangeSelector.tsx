import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Calendar, TrendingUp } from 'lucide-react';
import { TimeRange, ComparisonPeriod } from '../../hooks/useProveedoresExternosBIMetrics';

interface TimeRangeSelectorProps {
  filter: {
    range: TimeRange;
    year: number;
    month?: number;
    quarter?: number;
    comparison: ComparisonPeriod;
  };
  onFilterChange: (filter: any) => void;
  availableYears: number[];
  availableMonths: { value: number; label: string }[];
  availableQuarters: { value: number; label: string }[];
}

export function TimeRangeSelector({
  filter,
  onFilterChange,
  availableYears,
  availableMonths,
  availableQuarters
}: TimeRangeSelectorProps) {
  return (
    <Card className="p-4 bg-background/80 backdrop-blur-sm border-border/50">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Período:</span>
        </div>
        
        <Select
          value={filter.range}
          onValueChange={(value: TimeRange) => onFilterChange({ ...filter, range: value })}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">Mes</SelectItem>
            <SelectItem value="quarter">Trimestre</SelectItem>
            <SelectItem value="year">Año</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filter.year.toString()}
          onValueChange={(value) => onFilterChange({ ...filter, year: parseInt(value) })}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filter.range === 'month' && (
          <Select
            value={filter.month?.toString() || '1'}
            onValueChange={(value) => onFilterChange({ ...filter, month: parseInt(value) })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(month => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {filter.range === 'quarter' && (
          <Select
            value={filter.quarter?.toString() || '1'}
            onValueChange={(value) => onFilterChange({ ...filter, quarter: parseInt(value) })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableQuarters.map(q => (
                <SelectItem key={q.value} value={q.value.toString()}>
                  {q.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="h-6 w-px bg-border mx-2" />

        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Comparar:</span>
        </div>

        <Select
          value={filter.comparison}
          onValueChange={(value: ComparisonPeriod) => onFilterChange({ ...filter, comparison: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="previous">Período anterior</SelectItem>
            <SelectItem value="same_last_year">Mismo período año anterior</SelectItem>
            <SelectItem value="none">Sin comparación</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}
