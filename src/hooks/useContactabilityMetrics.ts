import { useMemo } from 'react';
import { useAuthenticatedQuery } from './useAuthenticatedQuery';
import { supabase } from '@/integrations/supabase/client';
import { Lead, ManualCallLog } from '@/types/leadTypes';

export interface ContactabilityMetrics {
  // Basic Classification
  totalLeads: number;
  leadsWithoutContact: number;
  leadsWithIneffectiveContact: number;
  leadsWithEffectiveContact: number;
  leadsNeedingRecontact: number;

  // Advanced Rates
  realContactabilityRate: number;
  averageAttemptsBeforeSuccess: number;
  contactEfficiencyRate: number;
  averageTimeBetweenAttempts: number;

  // Attempt Distribution
  attemptDistribution: {
    noAttempts: number;
    oneAttempt: number;
    twoAttempts: number;
    threeAttempts: number;
    fourPlusAttempts: number;
  };

  // Contact Outcomes
  outcomeDistribution: {
    successful: number;
    no_answer: number;
    busy: number;
    voicemail: number;
    wrong_number: number;
    non_existent_number: number;
    call_failed: number;
    reschedule_requested: number;
    numero_no_disponible: number;
  };

  // Performance by Attempt Number
  conversionRateByAttempt: {
    attempt: number;
    successRate: number;
    totalCalls: number;
    successfulCalls: number;
  }[];

  // Time Analysis
  optimalCallTimes: {
    hour: number;
    successRate: number;
    totalAttempts: number;
  }[];

  // Follow-up Analysis
  priorityRecontacts: {
    leadId: string;
    leadName: string;
    attempts: number;
    lastAttempt: string;
    lastOutcome: string;
    priority: 'high' | 'medium' | 'low';
    recommendedNextCall: string;
  }[];
}

export const useContactabilityMetrics = (
  dateFrom: string,
  dateTo: string,
  selectedAnalysts: string[] = []
) => {
  return useAuthenticatedQuery(
    ['contactability-metrics', dateFrom, dateTo, selectedAnalysts.join(',')],
    async (): Promise<ContactabilityMetrics> => {
      // Fetch leads and call logs
      const [leadsResponse, callLogsResponse] = await Promise.all([
        supabase
          .from('leads')
          .select('*')
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo + 'T23:59:59.999Z'),
        supabase
          .from('manual_call_logs')
          .select('*')
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo + 'T23:59:59.999Z')
      ]);

      const leads = (leadsResponse.data || []) as Lead[];
      const callLogs = (callLogsResponse.data || []) as ManualCallLog[];

      // Filter leads by selected analysts if applicable
      const filteredLeads = selectedAnalysts.length > 0 
        ? leads.filter(lead => {
            // Include unassigned leads and leads assigned to selected analysts
            return !lead.asignado_a || selectedAnalysts.includes(lead.asignado_a);
          })
        : leads;

      // Group call logs by lead
      const callsByLead = callLogs.reduce((acc, call) => {
        if (!acc[call.lead_id]) acc[call.lead_id] = [];
        acc[call.lead_id].push(call);
        return acc;
      }, {} as Record<string, ManualCallLog[]>);

      // Basic Classification
      const leadsWithoutContact = filteredLeads.filter(lead => !callsByLead[lead.id]).length;
      const leadsWithCalls = filteredLeads.filter(lead => callsByLead[lead.id]).length;
      const leadsWithEffectiveContact = filteredLeads.filter(lead => {
        const calls = callsByLead[lead.id];
        return calls?.some(call => call.call_outcome === 'successful');
      }).length;
      const leadsWithIneffectiveContact = leadsWithCalls - leadsWithEffectiveContact;

      // Calculate attempts distribution
      const attemptCounts = filteredLeads.map(lead => callsByLead[lead.id]?.length || 0);
      const attemptDistribution = {
        noAttempts: attemptCounts.filter(c => c === 0).length,
        oneAttempt: attemptCounts.filter(c => c === 1).length,
        twoAttempts: attemptCounts.filter(c => c === 2).length,
        threeAttempts: attemptCounts.filter(c => c === 3).length,
        fourPlusAttempts: attemptCounts.filter(c => c >= 4).length,
      };

      // Outcome distribution
      const outcomeDistribution = callLogs.reduce((acc, call) => {
        acc[call.call_outcome] = (acc[call.call_outcome] || 0) + 1;
        return acc;
      }, {} as any);

      // Ensure all outcomes have a value
      const completeOutcomeDistribution = {
        successful: outcomeDistribution.successful || 0,
        no_answer: outcomeDistribution.no_answer || 0,
        busy: outcomeDistribution.busy || 0,
        voicemail: outcomeDistribution.voicemail || 0,
        wrong_number: outcomeDistribution.wrong_number || 0,
        non_existent_number: outcomeDistribution.non_existent_number || 0,
        call_failed: outcomeDistribution.call_failed || 0,
        reschedule_requested: outcomeDistribution.reschedule_requested || 0,
        numero_no_disponible: outcomeDistribution.numero_no_disponible || 0,
      };

      // Calculate average attempts before success
      const successfulLeads = filteredLeads.filter(lead => {
        const calls = callsByLead[lead.id];
        return calls?.some(call => call.call_outcome === 'successful');
      });

      const avgAttemptsBeforeSuccess = successfulLeads.length > 0 
        ? successfulLeads.reduce((sum, lead) => {
            const calls = callsByLead[lead.id] || [];
            const successIndex = calls.findIndex(call => call.call_outcome === 'successful');
            return sum + (successIndex >= 0 ? successIndex + 1 : calls.length);
          }, 0) / successfulLeads.length
        : 0;

      // Conversion rate by attempt number
      const conversionRateByAttempt = [1, 2, 3, 4, 5].map(attemptNum => {
        const leadsWithAttempts = filteredLeads.filter(lead => 
          (callsByLead[lead.id]?.length || 0) >= attemptNum
        );
        
        const successfulOnAttempt = leadsWithAttempts.filter(lead => {
          const calls = callsByLead[lead.id] || [];
          return calls[attemptNum - 1]?.call_outcome === 'successful';
        });

        return {
          attempt: attemptNum,
          successRate: leadsWithAttempts.length > 0 
            ? Math.round((successfulOnAttempt.length / leadsWithAttempts.length) * 100)
            : 0,
          totalCalls: leadsWithAttempts.length,
          successfulCalls: successfulOnAttempt.length
        };
      });

      // Optimal call times analysis
      const callsByHour = callLogs.reduce((acc, call) => {
        const hour = new Date(call.call_datetime).getHours();
        if (!acc[hour]) acc[hour] = { total: 0, successful: 0 };
        acc[hour].total++;
        if (call.call_outcome === 'successful') acc[hour].successful++;
        return acc;
      }, {} as Record<number, { total: number; successful: number }>);

      const optimalCallTimes = Object.entries(callsByHour).map(([hour, data]) => ({
        hour: parseInt(hour),
        successRate: data.total > 0 ? Math.round((data.successful / data.total) * 100) : 0,
        totalAttempts: data.total
      })).sort((a, b) => b.successRate - a.successRate);

      // Priority recontacts (leads with multiple failed attempts)
      const priorityRecontacts = filteredLeads
        .filter(lead => {
          const calls = callsByLead[lead.id] || [];
          const hasFailedCalls = calls.some(call => 
            ['no_answer', 'busy', 'voicemail'].includes(call.call_outcome)
          );
          const noSuccessfulCalls = !calls.some(call => call.call_outcome === 'successful');
          return hasFailedCalls && noSuccessfulCalls && calls.length > 0;
        })
        .map(lead => {
          const calls = callsByLead[lead.id] || [];
          const lastCall = calls[calls.length - 1];
          const attempts = calls.length;
          
          let priority: 'high' | 'medium' | 'low' = 'low';
          if (attempts >= 3) priority = 'high';
          else if (attempts >= 2) priority = 'medium';

          // Recommend next call time (24-48 hours after last attempt)
          const lastCallDate = new Date(lastCall.call_datetime);
          const recommendedNext = new Date(lastCallDate.getTime() + (24 * 60 * 60 * 1000));

          return {
            leadId: lead.id,
            leadName: lead.nombre,
            attempts,
            lastAttempt: lastCall.call_datetime,
            lastOutcome: lastCall.call_outcome,
            priority,
            recommendedNextCall: recommendedNext.toISOString()
          };
        })
        .sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

      // Leads needing recontact
      const leadsNeedingRecontact = priorityRecontacts.length;

      // Calculate rates
      const totalLeads = filteredLeads.length;
      const realContactabilityRate = totalLeads > 0 
        ? Math.round((leadsWithEffectiveContact / totalLeads) * 100)
        : 0;
      
      const contactEfficiencyRate = callLogs.length > 0 
        ? Math.round((completeOutcomeDistribution.successful / callLogs.length) * 100)
        : 0;

      // Calculate average time between attempts
      const avgTimeBetweenAttempts = callLogs.length > 1 
        ? callLogs.reduce((sum, call, index) => {
            if (index === 0) return sum;
            const prevCall = callLogs[index - 1];
            const timeDiff = new Date(call.call_datetime).getTime() - new Date(prevCall.call_datetime).getTime();
            return sum + (timeDiff / (1000 * 60 * 60)); // Convert to hours
          }, 0) / (callLogs.length - 1)
        : 0;

      return {
        totalLeads,
        leadsWithoutContact,
        leadsWithIneffectiveContact,
        leadsWithEffectiveContact,
        leadsNeedingRecontact,
        realContactabilityRate,
        averageAttemptsBeforeSuccess: Math.round(avgAttemptsBeforeSuccess * 10) / 10,
        contactEfficiencyRate,
        averageTimeBetweenAttempts: Math.round(avgTimeBetweenAttempts * 10) / 10,
        attemptDistribution,
        outcomeDistribution: completeOutcomeDistribution,
        conversionRateByAttempt,
        optimalCallTimes,
        priorityRecontacts
      };
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 10 * 60 * 1000 // 10 minutes
    }
  );
};