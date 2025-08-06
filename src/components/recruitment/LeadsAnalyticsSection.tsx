
import React from 'react';
import { useLeadsAnalytics } from '@/hooks/useLeadsAnalytics';
import { DailyLeadsChart } from '@/components/leads/DailyLeadsChart';
import { AnalystPerformanceTable } from '@/components/leads/AnalystPerformanceTable';

interface LeadsAnalyticsSectionProps {
  dateFrom?: string;
  dateTo?: string;
}

export const LeadsAnalyticsSection = ({ dateFrom, dateTo }: LeadsAnalyticsSectionProps) => {
  const { 
    dailyData, 
    analystPerformance, 
    loading 
  } = useLeadsAnalytics(dateFrom, dateTo);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <DailyLeadsChart 
        data={dailyData} 
        loading={loading} 
      />
      <AnalystPerformanceTable 
        data={analystPerformance} 
        loading={loading} 
      />
    </div>
  );
};
