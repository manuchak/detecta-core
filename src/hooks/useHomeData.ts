import { useMemo } from 'react';
import { ROLE_HOME_CONFIG, MODULES, getUrgencyLevel } from '@/config/roleHomeConfig';
import { useHeroData } from '@/hooks/home/useHeroData';
import { useWidgetData } from '@/hooks/home/useWidgetData';
import type { UserRole, ModuleConfig } from '@/config/roleHomeConfig';

interface UseHomeDataResult {
  hero: {
    title: string;
    description: string;
    value: number | string;
    formattedValue?: string;
    trend?: number;
    trendDirection?: 'up' | 'down' | 'neutral';
    cta: { label: string; route: string };
    icon: any;
    urgency: 'normal' | 'warning' | 'critical';
    isLoading: boolean;
  } | null;
  widgets: Array<{
    label: string;
    value: number | string;
    trend?: number;
    trendDirection?: 'up' | 'down' | 'neutral';
    isLoading: boolean;
  }>;
  contextWidgets: Array<{
    label: string;
    value: number | string;
    trend?: number;
    trendDirection?: 'up' | 'down' | 'neutral';
    isLoading: boolean;
  }>;
  modules: ModuleConfig[];
  shouldRedirect: string | null;
  isLoading: boolean;
}

export const useHomeData = (userRole: UserRole | null | undefined): UseHomeDataResult => {
  const config = userRole ? ROLE_HOME_CONFIG[userRole] : null;
  
  // Hero data
  const heroQuery = useHeroData(config?.hero?.type);
  
  // Context widget data - we need to call hooks unconditionally
  const contextTypes = config?.contextWidgets?.map(w => w.type) || [];
  const context1 = useWidgetData(contextTypes[0] || 'monthlyGMV');
  const context2 = useWidgetData(contextTypes[1] || 'activeCustodians');
  const context3 = useWidgetData(contextTypes[2] || 'monthlyServices');
  
  const contextQueries = [context1, context2, context3];

  // Legacy widget support (for backwards compatibility)
  const widgetTypes = config?.widgets?.map(w => w.type) || [];
  const widget1 = useWidgetData(widgetTypes[0] || 'todayServices');
  const widget2 = useWidgetData(widgetTypes[1] || 'todayServices');
  const widget3 = useWidgetData(widgetTypes[2] || 'todayServices');
  
  const widgetQueries = [widget1, widget2, widget3];

  return useMemo(() => {
    if (!config) {
      return {
        hero: null,
        widgets: [],
        contextWidgets: [],
        modules: [],
        shouldRedirect: null,
        isLoading: false,
      };
    }

    // Check for redirect
    if (config.redirect) {
      return {
        hero: null,
        widgets: [],
        contextWidgets: [],
        modules: [],
        shouldRedirect: config.redirect,
        isLoading: false,
      };
    }

    // Build hero
    const hero = config.hero ? {
      title: config.hero.title,
      description: config.hero.description,
      value: heroQuery.data?.formattedValue || heroQuery.data?.count || 0,
      formattedValue: heroQuery.data?.formattedValue,
      trend: heroQuery.data?.trend,
      trendDirection: heroQuery.data?.trendDirection,
      cta: config.hero.cta,
      icon: config.hero.icon,
      urgency: getUrgencyLevel(
        heroQuery.data?.count || 0, 
        config.hero.urgencyThreshold
      ),
      isLoading: heroQuery.isLoading,
    } : null;

    // Build context widgets (new pattern)
    const contextWidgets = (config.contextWidgets || []).map((w, i) => ({
      label: w.label,
      value: contextQueries[i]?.data?.value ?? 0,
      trend: contextQueries[i]?.data?.trend,
      trendDirection: contextQueries[i]?.data?.trendDirection,
      isLoading: contextQueries[i]?.isLoading ?? false,
    }));

    // Build legacy widgets (backwards compatibility)
    const widgets = (config.widgets || []).map((w, i) => ({
      label: w.label,
      value: widgetQueries[i]?.data?.value ?? 0,
      isLoading: widgetQueries[i]?.isLoading ?? false,
    }));

    // Build modules
    const modules = config.modules
      .map(id => MODULES[id])
      .filter(Boolean);

    const allLoading = heroQuery.isLoading || 
      contextQueries.some(q => q.isLoading) ||
      widgetQueries.some(q => q.isLoading);

    return {
      hero,
      widgets,
      contextWidgets,
      modules,
      shouldRedirect: null,
      isLoading: allLoading,
    };
  }, [
    config, 
    heroQuery.data, 
    heroQuery.isLoading, 
    context1.data, context2.data, context3.data,
    context1.isLoading, context2.isLoading, context3.isLoading,
    widget1.data, widget2.data, widget3.data, 
    widget1.isLoading, widget2.isLoading, widget3.isLoading
  ]);
};
