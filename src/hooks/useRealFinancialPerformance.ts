// @ts-nocheck
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useROIMarketingDetails } from './useROIMarketingDetails';

interface ChannelData {
  name: string;
  amount: number;
  percentage: number;
  roi: number;
  custodios: number;
}

interface RealFinancialMetrics {
  totalInvestment: number;
  averageROI: number;
  budgetEfficiency: number;
  mostProfitableChannel: string;
  channelDistribution: ChannelData[];
  roiByChannel: ChannelData[];
  loading: boolean;
}

export function useRealFinancialPerformance(): RealFinancialMetrics {
  const [metrics, setMetrics] = useState<RealFinancialMetrics>({
    totalInvestment: 0,
    averageROI: 0,
    budgetEfficiency: 0,
    mostProfitableChannel: 'Digital',
    channelDistribution: [],
    roiByChannel: [],
    loading: true
  });

  const { metrics: roiMetrics, loading: roiLoading } = useROIMarketingDetails();

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        // Fetch marketing expenses from gastos_externos
        const { data: gastos, error: gastosError } = await supabase
          .from('gastos_externos')
          .select('*')
          .eq('estado', 'aprobado')
          .neq('concepto', 'STAFF')
          .gte('fecha_gasto', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

        if (gastosError) throw gastosError;

        // Calculate total marketing investment
        const totalInvestment = gastos?.reduce((sum, gasto) => sum + (gasto.monto || 0), 0) || 0;

        // Group expenses by channel
        const channelExpenses = gastos?.reduce((acc, gasto) => {
          const channel = gasto.canal_reclutamiento || 'Otros';
          if (!acc[channel]) {
            acc[channel] = { amount: 0, custodios: gasto.custodios_reales || 0 };
          }
          acc[channel].amount += gasto.monto || 0;
          acc[channel].custodios += gasto.custodios_reales || 0;
          return acc;
        }, {} as Record<string, { amount: number; custodios: number }>) || {};

        // Calculate distribution percentages
        const channelDistribution: ChannelData[] = Object.entries(channelExpenses).map(([name, data]) => ({
          name,
          amount: data.amount,
          percentage: totalInvestment > 0 ? Math.round((data.amount / totalInvestment) * 100) : 0,
          roi: 0, // Will be calculated below
          custodios: data.custodios
        }));

        // Calculate ROI by channel - use estimated values based on channel performance
        const roiByChannel: ChannelData[] = channelDistribution.map(channel => {
          // Estimate ROI based on custodios acquired vs investment
          const estimatedROI = channel.custodios > 0 && channel.amount > 0 
            ? Math.min((channel.custodios * 15000) / channel.amount * 100, 200) // Assume 15k average value per custodio
            : 0;
          
          return {
            ...channel,
            roi: Math.round(estimatedROI * 10) / 10 // One decimal place
          };
        });

        // Find most profitable channel
        const mostProfitableChannel = roiByChannel.reduce((best, current) => 
          current.roi > best.roi ? current : best, 
          roiByChannel[0] || { name: 'Digital', roi: 0 }
        ).name;

        // Calculate budget efficiency using the real ROI total
        const budgetEfficiency = roiMetrics?.roiTotal || 0;

        setMetrics({
          totalInvestment,
          averageROI: roiMetrics?.roiTotal || 0,
          budgetEfficiency: Math.min(budgetEfficiency, 100), // Cap at 100%
          mostProfitableChannel,
          channelDistribution: channelDistribution.sort((a, b) => b.amount - a.amount),
          roiByChannel: roiByChannel.sort((a, b) => b.roi - a.roi),
          loading: false
        });

      } catch (error) {
        console.error('Error fetching real financial data:', error);
        setMetrics(prev => ({ ...prev, loading: false }));
      }
    };

    if (!roiLoading) {
      fetchRealData();
    }
  }, [roiLoading, roiMetrics]);

  return metrics;
}