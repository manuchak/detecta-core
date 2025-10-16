export type PaceStatus = 'exceeding' | 'on_track' | 'behind';

export interface StatusConfig {
  status: PaceStatus;
  color: 'success' | 'warning' | 'destructive';
  icon: 'check' | 'alert' | 'x';
}

/**
 * Determines pace status based on current vs required values
 * @param current - Current value (e.g., 30.0 services/day)
 * @param required - Required value (e.g., 29.5 services/day)
 * @returns Status configuration with color and icon
 */
export const getPaceStatus = (current: number, required: number): StatusConfig => {
  if (!required || required === 0) {
    return { status: 'behind', color: 'destructive', icon: 'x' };
  }
  
  const ratio = current / required;
  
  if (ratio >= 1.0) {
    // At target or above = exceeding (success)
    return { status: 'exceeding', color: 'success', icon: 'check' };
  } else if (ratio >= 0.95) {
    // Within 5% of target = on track
    return { status: 'on_track', color: 'warning', icon: 'alert' };
  } else {
    // Below 95% of target = behind
    return { status: 'behind', color: 'destructive', icon: 'x' };
  }
};

/**
 * Gets appropriate text color class for status
 */
export const getStatusTextColor = (status: PaceStatus): string => {
  switch (status) {
    case 'exceeding':
      return 'text-success';
    case 'on_track':
      return 'text-warning';
    case 'behind':
      return 'text-destructive';
  }
};

/**
 * Gets appropriate background color class for status
 */
export const getStatusBgColor = (status: PaceStatus): string => {
  switch (status) {
    case 'exceeding':
      return 'bg-success/10 border-success/20';
    case 'on_track':
      return 'bg-warning/10 border-warning/20';
    case 'behind':
      return 'bg-destructive/10 border-destructive/20';
  }
};

export interface ContextualPaceConfig {
  level: 'excellent' | 'good' | 'warning' | 'critical';
  color: 'success' | 'warning' | 'destructive';
  icon: 'check' | 'alert' | 'x';
  message: string;
  details: {
    currentPace: number;
    requiredPaceForTarget: number;
    requiredPaceForPrevMonth: number;
    momGrowthPercent: number;
  };
}

/**
 * Determines contextual pace status considering both target and MoM growth
 * @param currentPace - Current daily pace (e.g., 42.63 services/day)
 * @param requiredPaceForTarget - Required pace to reach optimistic target
 * @param requiredPaceForPrevMonth - Required pace to surpass previous month
 * @param momGrowthPercent - Month-over-month growth percentage
 * @param status - Month closure status ('Supera' | 'Igual' | 'Por debajo')
 * @returns Contextual status configuration with message and color
 */
export const getContextualPaceStatus = (
  currentPace: number,
  requiredPaceForTarget: number,
  requiredPaceForPrevMonth: number,
  momGrowthPercent: number,
  status: 'Supera' | 'Igual' | 'Por debajo'
): ContextualPaceConfig => {
  const beatingPrevMonth = currentPace >= requiredPaceForPrevMonth;
  const onTargetForProjection = currentPace >= requiredPaceForTarget;

  // Excellent: Beating previous month with strong growth (>15%)
  if (status === 'Supera' && momGrowthPercent > 15) {
    return {
      level: 'excellent',
      color: 'success',
      icon: 'check',
      message: 'Ritmo excelente - Superando expectativas',
      details: {
        currentPace,
        requiredPaceForTarget,
        requiredPaceForPrevMonth,
        momGrowthPercent
      }
    };
  }

  // Good: Beating previous month but below optimistic target
  if (beatingPrevMonth && !onTargetForProjection) {
    return {
      level: 'good',
      color: 'success',
      icon: 'check',
      message: 'Ritmo sólido - Por encima de mes anterior',
      details: {
        currentPace,
        requiredPaceForTarget,
        requiredPaceForPrevMonth,
        momGrowthPercent
      }
    };
  }

  // Excellent: Meeting both targets
  if (beatingPrevMonth && onTargetForProjection) {
    return {
      level: 'excellent',
      color: 'success',
      icon: 'check',
      message: 'Ritmo excelente - En meta optimista',
      details: {
        currentPace,
        requiredPaceForTarget,
        requiredPaceForPrevMonth,
        momGrowthPercent
      }
    };
  }

  // Warning: Not beating previous month pace but growing overall
  if (!beatingPrevMonth && momGrowthPercent > 0) {
    return {
      level: 'warning',
      color: 'warning',
      icon: 'alert',
      message: 'Ritmo moderado - Acelerar captación',
      details: {
        currentPace,
        requiredPaceForTarget,
        requiredPaceForPrevMonth,
        momGrowthPercent
      }
    };
  }

  // Critical: Below previous month and declining
  return {
    level: 'critical',
    color: 'destructive',
    icon: 'x',
    message: 'Ritmo insuficiente - Acción inmediata requerida',
    details: {
      currentPace,
      requiredPaceForTarget,
      requiredPaceForPrevMonth,
      momGrowthPercent
    }
  };
};