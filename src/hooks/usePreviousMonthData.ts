import { useAuthenticatedQuery } from '@/hooks/useAuthenticatedQuery';

interface PreviousMonthData {
  month: string;
  gmv: number;
  services: number;
  loading: boolean;
}

export const usePreviousMonthData = (): PreviousMonthData => {
  // Hard-coded data for August 2025 as requested by user
  // TODO: Replace with dynamic query when needed for other months
  const augustData = {
    month: 'Agosto',
    gmv: 7.33, // $7.3M as specified by user
    services: 0, // Services count for August (can be added later if needed)
    loading: false
  };

  return augustData;
};