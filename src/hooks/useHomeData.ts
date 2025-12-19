import { useMemo } from 'react';
import { ROLE_HOME_CONFIG, MODULES, getUrgencyLevel } from '@/config/roleHomeConfig';
import { useHeroData } from '@/hooks/home/useHeroData';
import { useWidgetData } from '@/hooks/home/useWidgetData';
import type { UserRole, WidgetConfig, ModuleConfig } from '@/config/roleHomeConfig';

interface UseHomeDataResult {
  hero: {
    title: string;
    description: string;
    value: number;
    cta: { label: string; route: string };
    icon: any;
    urgency: 'normal' | 'warning' | 'critical';
    isLoading: boolean;
  } | null;
  widgets: Array<{
    label: string;
    value: number | string;
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
  
  // Widget data - we need to call hooks unconditionally
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
        modules: [],
        shouldRedirect: config.redirect,
        isLoading: false,
      };
    }

    // Build hero
    const hero = config.hero ? {
      title: config.hero.title,
      description: config.hero.description,
      value: heroQuery.data?.count || 0,
      cta: config.hero.cta,
      icon: config.hero.icon,
      urgency: getUrgencyLevel(
        heroQuery.data?.count || 0, 
        config.hero.urgencyThreshold
      ),
      isLoading: heroQuery.isLoading,
    } : null;

    // Build widgets
    const widgets = (config.widgets || []).map((w, i) => ({
      label: w.label,
      value: widgetQueries[i]?.data?.value ?? 0,
      isLoading: widgetQueries[i]?.isLoading ?? false,
    }));

    // Build modules
    const modules = config.modules
      .map(id => MODULES[id])
      .filter(Boolean);

    return {
      hero,
      widgets,
      modules,
      shouldRedirect: null,
      isLoading: heroQuery.isLoading || widgetQueries.some(q => q.isLoading),
    };
  }, [config, heroQuery.data, heroQuery.isLoading, widget1.data, widget2.data, widget3.data, widget1.isLoading, widget2.isLoading, widget3.isLoading]);
};
