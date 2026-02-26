import { useMemo } from 'react';
import { useBusinessTargets } from './useBusinessTargets';
import { useExecutiveMultiYearData } from './useExecutiveMultiYearData';
import { getDataCurrentDay } from '@/utils/timezoneUtils';

export interface MetricProgress {
  actual: number;
  target: number;
  percent: number;
  projection: number;
  dailyPace: number;
  status: 'on_track' | 'at_risk' | 'off_track';
}

export interface QuarterProgress {
  quarter: number;
  quarterLabel: string;
  daysElapsed: number;
  totalDays: number;
  daysRemaining: number;
  services: MetricProgress;
  gmv: MetricProgress;
  custodians: { actual: number; target: number; percent: number; status: 'on_track' | 'at_risk' | 'off_track' };
}

export interface AnnualProgress {
  year: number;
  daysElapsed: number;
  totalDays: number;
  services: MetricProgress;
  gmv: MetricProgress;
  custodians: { actual: number; target: number; percent: number; status: 'on_track' | 'at_risk' | 'off_track' };
  prevYearServices: number;
  prevYearGmv: number;
}

function getStatus(percent: number): 'on_track' | 'at_risk' | 'off_track' {
  if (percent >= 90) return 'on_track';
  if (percent >= 75) return 'at_risk';
  return 'off_track';
}

function getQuarterMonths(q: number): number[] {
  // Returns 1-indexed months for the quarter
  return [(q - 1) * 3 + 1, (q - 1) * 3 + 2, (q - 1) * 3 + 3];
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getQuarterTotalDays(year: number, quarter: number): number {
  const months = getQuarterMonths(quarter);
  return months.reduce((sum, m) => sum + getDaysInMonth(year, m), 0);
}

function getQuarterDaysElapsed(year: number, quarter: number, currentMonth: number, currentDay: number): number {
  const months = getQuarterMonths(quarter);
  let days = 0;
  for (const m of months) {
    if (m < currentMonth) {
      days += getDaysInMonth(year, m);
    } else if (m === currentMonth) {
      days += currentDay;
    }
  }
  return days;
}

function getYearDaysElapsed(year: number, currentMonth: number, currentDay: number): number {
  let days = 0;
  for (let m = 1; m < currentMonth; m++) {
    days += getDaysInMonth(year, m);
  }
  days += currentDay;
  return days;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function useQuarterlyAnnualProgress() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-indexed
  const currentDay = getDataCurrentDay();
  const currentQuarter = Math.ceil(currentMonth / 3);

  const { data: targets, isLoading: targetsLoading } = useBusinessTargets(currentYear);
  const { data: prevTargets } = useBusinessTargets(currentYear - 1);
  const { monthlyByYear, yearlyTotals, loading: multiYearLoading } = useExecutiveMultiYearData();

  const isLoading = targetsLoading || multiYearLoading;

  const quarterProgress = useMemo<QuarterProgress | null>(() => {
    if (!targets || targets.length === 0 || monthlyByYear.length === 0) return null;

    const qMonths = getQuarterMonths(currentQuarter);
    const totalDays = getQuarterTotalDays(currentYear, currentQuarter);
    const daysElapsed = getQuarterDaysElapsed(currentYear, currentQuarter, currentMonth, currentDay);
    const daysRemaining = totalDays - daysElapsed;

    // Sum targets for Q months
    let targetServices = 0, targetGmv = 0, targetCustodians = 0;
    qMonths.forEach(m => {
      const t = targets.find(bt => bt.month === m);
      if (t) {
        targetServices += t.target_services;
        targetGmv += t.target_gmv;
        targetCustodians = Math.max(targetCustodians, t.target_active_custodians || 0);
      }
    });

    // Sum actuals for Q months from monthlyByYear
    let actualServices = 0, actualGmv = 0;
    qMonths.forEach(m => {
      const md = monthlyByYear.find(d => d.year === currentYear && d.month === m);
      if (md) {
        actualServices += md.services;
        actualGmv += md.gmv;
      }
    });

    const servicesPercent = targetServices > 0 ? (actualServices / targetServices) * 100 : 0;
    const gmvPercent = targetGmv > 0 ? (actualGmv / targetGmv) * 100 : 0;
    const servicesPace = daysElapsed > 0 ? actualServices / daysElapsed : 0;
    const gmvPace = daysElapsed > 0 ? actualGmv / daysElapsed : 0;
    const servicesProjection = daysElapsed > 0 ? Math.round(servicesPace * totalDays) : 0;
    const gmvProjection = daysElapsed > 0 ? gmvPace * totalDays : 0;

    // For custodians, use the latest month's actual from quarterlyByYear or approximate
    // We'll use the max target as the Q target for custodians (it's a stock metric, not flow)
    const custodiansPercent = targetCustodians > 0 ? 0 : 0; // We don't have actual custodian data in monthlyByYear

    return {
      quarter: currentQuarter,
      quarterLabel: `T${currentQuarter} ${currentYear}`,
      daysElapsed,
      totalDays,
      daysRemaining,
      services: {
        actual: actualServices,
        target: targetServices,
        percent: Math.round(servicesPercent * 10) / 10,
        projection: servicesProjection,
        dailyPace: Math.round(servicesPace * 10) / 10,
        status: getStatus(servicesPercent / (daysElapsed / totalDays * 100) * 100),
      },
      gmv: {
        actual: actualGmv,
        target: targetGmv,
        percent: Math.round(gmvPercent * 10) / 10,
        projection: gmvProjection,
        dailyPace: gmvPace,
        status: getStatus(gmvPercent / (daysElapsed / totalDays * 100) * 100),
      },
      custodians: {
        actual: 0, // Will be enhanced when custodian data is available
        target: targetCustodians,
        percent: 0,
        status: 'on_track' as const,
      },
    };
  }, [targets, monthlyByYear, currentYear, currentMonth, currentDay, currentQuarter]);

  const annualProgress = useMemo<AnnualProgress | null>(() => {
    if (!targets || targets.length === 0 || monthlyByYear.length === 0) return null;

    const totalDays = isLeapYear(currentYear) ? 366 : 365;
    const daysElapsed = getYearDaysElapsed(currentYear, currentMonth, currentDay);

    // Sum all targets
    let targetServices = 0, targetGmv = 0, targetCustodians = 0;
    targets.forEach(t => {
      targetServices += t.target_services;
      targetGmv += t.target_gmv;
      targetCustodians = Math.max(targetCustodians, t.target_active_custodians || 0);
    });

    // Sum actuals YTD from monthlyByYear
    let actualServices = 0, actualGmv = 0;
    monthlyByYear
      .filter(d => d.year === currentYear && d.month <= currentMonth)
      .forEach(d => {
        actualServices += d.services;
        actualGmv += d.gmv;
      });

    const servicesPercent = targetServices > 0 ? (actualServices / targetServices) * 100 : 0;
    const gmvPercent = targetGmv > 0 ? (actualGmv / targetGmv) * 100 : 0;
    const servicesPace = daysElapsed > 0 ? actualServices / daysElapsed : 0;
    const gmvPace = daysElapsed > 0 ? actualGmv / daysElapsed : 0;
    const servicesProjection = daysElapsed > 0 ? Math.round(servicesPace * totalDays) : 0;
    const gmvProjection = daysElapsed > 0 ? gmvPace * totalDays : 0;

    // Previous year totals
    const prevYear = yearlyTotals.find(y => y.year === currentYear - 1);

    // Normalized comparison: use pro-rata % instead of raw %
    const timePercent = (daysElapsed / totalDays) * 100;
    const servicesNormalized = timePercent > 0 ? (servicesPercent / timePercent) * 100 : 0;
    const gmvNormalized = timePercent > 0 ? (gmvPercent / timePercent) * 100 : 0;

    return {
      year: currentYear,
      daysElapsed,
      totalDays,
      services: {
        actual: actualServices,
        target: targetServices,
        percent: Math.round(servicesPercent * 10) / 10,
        projection: servicesProjection,
        dailyPace: Math.round(servicesPace * 10) / 10,
        status: getStatus(servicesNormalized),
      },
      gmv: {
        actual: actualGmv,
        target: targetGmv,
        percent: Math.round(gmvPercent * 10) / 10,
        projection: gmvProjection,
        dailyPace: gmvPace,
        status: getStatus(gmvNormalized),
      },
      custodians: {
        actual: 0,
        target: targetCustodians,
        percent: 0,
        status: 'on_track' as const,
      },
      prevYearServices: prevYear?.services || 0,
      prevYearGmv: prevYear?.gmv || 0,
    };
  }, [targets, monthlyByYear, yearlyTotals, currentYear, currentMonth, currentDay]);

  return { quarterProgress, annualProgress, isLoading };
}
