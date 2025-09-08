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
  
  if (ratio >= 1.1) {
    // 10%+ above target = exceeding
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