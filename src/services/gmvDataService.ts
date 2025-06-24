import { supabase } from "@/integrations/supabase/client";

const THRESHOLD = process.env.NEXT_PUBLIC_GMV_THRESHOLD || 100000;

export const fetchGmvData = async (startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('fact_sales')
      .select(`
        fecha,
        total_gmv
      `)
      .gte('fecha', startDate)
      .lte('fecha', endDate)
      .order('fecha', { ascending: true });

    if (error) {
      console.error("Error fetching GMV data:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to fetch GMV data:", error);
    throw error;
  }
};

export const processGmvData = (rawData: any[]) => {
  if (!Array.isArray(rawData)) {
    console.error("Raw data is not an array:", rawData);
    return [];
  }

  const transformedData = rawData.map(item => ({
    date: item.fecha,
    value: item.total_gmv
  }));

  const filteredData = rawData.filter(item => {
    const itemValue = typeof item.total_gmv === 'string' ? parseFloat(item.total_gmv) : item.total_gmv;
    const threshold = typeof THRESHOLD === 'string' ? parseFloat(THRESHOLD) : THRESHOLD;
    
    return !isNaN(itemValue) && !isNaN(threshold) && itemValue > threshold;
  });

  const anomalyDates = filteredData.map(item => item.fecha);

  return {
    series: [{ name: "GMV", data: transformedData }],
    anomalyDates: anomalyDates
  };
};
