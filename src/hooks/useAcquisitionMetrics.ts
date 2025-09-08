import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AcquisitionMetrics {
  totalLeads: number;
  totalCandidates: number;
  totalExpenses: number;
  cpaReal: number;
  conversionRate: number;
  leadsByMonth: Array<{
    month: string;
    leads: number;
    conversions: number;
  }>;
  expensesByChannel: Array<{
    channel: string;
    amount: number;
    percentage: number;
  }>;
  conversionFunnel: {
    leads: number;
    contacted: number;
    interviews: number;
    approved: number;
    active: number;
  };
  roiByChannel: Array<{
    channel: string;
    investment: number;
    revenue: number;
    roi: number;
  }>;
}

export const useAcquisitionMetrics = () => {
  return useQuery({
    queryKey: ['acquisition-metrics'],
    queryFn: async (): Promise<AcquisitionMetrics> => {
      // Fetch leads data
      const { data: leads, error: leadsError } = await supabase
        .from('leads')
        .select('*');

      if (leadsError) throw leadsError;

      // Fetch candidates data
      const { data: candidates, error: candidatesError } = await supabase
        .from('candidatos_custodios')
        .select('*');

      if (candidatesError) throw candidatesError;

      // Fetch expenses data
      const { data: expenses, error: expensesError } = await supabase
        .from('gastos_externos')
        .select('*')
        .eq('estado', 'aprobado')
        .gte('fecha_gasto', '2025-01-01');

      if (expensesError) throw expensesError;

      // Fetch new custodians by month (correct definition: first service date)
      // Calculate date range for last 6 months
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const { data: newCustodiansByMonth, error: custodiansError } = await supabase
        .rpc('get_custodios_nuevos_por_mes', {
          fecha_inicio: startDate.toISOString().split('T')[0],
          fecha_fin: endDate.toISOString().split('T')[0]
        });

      if (custodiansError) throw custodiansError;

      // Calculate basic metrics
      const totalLeads = leads?.length || 0;
      const totalCandidates = candidates?.length || 0;
      const totalExpenses = expenses?.reduce((sum, exp) => sum + (exp.monto || 0), 0) || 0;
      
      // Calculate CPA (Cost Per Acquisition)
      const cpaReal = totalCandidates > 0 ? totalExpenses / totalCandidates : 0;
      
      // Calculate conversion rate
      const conversionRate = totalLeads > 0 ? (totalCandidates / totalLeads) * 100 : 0;

      // Leads by month for last 6 months
      const leadsByMonth = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toLocaleString('es-MX', { month: 'short' });
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const monthLeads = leads?.filter(lead => {
          const leadDate = new Date(lead.created_at);
          return leadDate.getMonth() + 1 === month && leadDate.getFullYear() === year;
        }).length || 0;

        // Use correct definition: custodians who completed their first service in this month
        const yearMonth = `${year}-${month.toString().padStart(2, '0')}`;
        const monthConversions = newCustodiansByMonth?.find(custodian => 
          custodian.mes === yearMonth
        )?.custodios_nuevos || 0;

        leadsByMonth.push({
          month: monthStr,
          leads: monthLeads,
          conversions: monthConversions
        });
      }

      // Expenses by channel
      const channelExpenses = {};
      expenses?.forEach(expense => {
        const channel = expense.concepto || 'Otros';
        if (!channelExpenses[channel]) {
          channelExpenses[channel] = 0;
        }
        channelExpenses[channel] += expense.monto || 0;
      });

      const expensesByChannel = Object.entries(channelExpenses).map(([channel, amount]: [string, any]) => ({
        channel,
        amount,
        percentage: totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0
      }));

      // Calculate total active custodians (those who have completed at least one service)
      const totalActiveCustodians = newCustodiansByMonth?.reduce((sum, month) => 
        sum + (month.custodios_nuevos || 0), 0) || 0;

      // Conversion funnel (simulated data based on typical conversion rates)
      const conversionFunnel = {
        leads: totalLeads,
        contacted: Math.round(totalLeads * 0.8), // 80% contacted
        interviews: Math.round(totalLeads * 0.4), // 40% interviewed
        approved: Math.round(totalLeads * 0.25), // 25% approved
        active: totalActiveCustodians // Real active custodians (with completed services)
      };

      // ROI by channel (simplified calculation)
      const averageRevenuePer = 135000; // Average LTV per custodian
      const roiByChannel = expensesByChannel.map(channel => {
        const channelCandidates = Math.round(totalCandidates * (channel.percentage / 100));
        const revenue = channelCandidates * averageRevenuePer;
        const roi = channel.amount > 0 ? ((revenue - channel.amount) / channel.amount) * 100 : 0;

        return {
          channel: channel.channel,
          investment: channel.amount,
          revenue,
          roi: Math.round(roi * 10) / 10
        };
      });

      return {
        totalLeads,
        totalCandidates,
        totalExpenses,
        cpaReal: Math.round(cpaReal),
        conversionRate: Math.round(conversionRate * 10) / 10,
        leadsByMonth,
        expensesByChannel,
        conversionFunnel,
        roiByChannel
      };
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: 15 * 60 * 1000, // 15 minutes
  });
};