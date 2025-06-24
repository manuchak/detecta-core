
import { supabase } from "@/integrations/supabase/client";

const THRESHOLD = process.env.NEXT_PUBLIC_GMV_THRESHOLD || 100000;

export const fetchGmvData = async (startDate: string, endDate: string) => {
  try {
    const { data, error } = await supabase
      .from('servicios_custodia')
      .select(`
        fecha_hora_cita,
        cobro_cliente
      `)
      .gte('fecha_hora_cita', startDate)
      .lte('fecha_hora_cita', endDate)
      .order('fecha_hora_cita', { ascending: true });

    if (error) {
      console.error("Error fetching GMV data:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch GMV data:", error);
    throw error;
  }
};

export const fetchAllGmvData = async () => {
  try {
    const { data, error } = await supabase
      .from('servicios_custodia')
      .select(`
        fecha_hora_cita,
        cobro_cliente,
        nombre_cliente
      `)
      .not('cobro_cliente', 'is', null)
      .order('fecha_hora_cita', { ascending: true });

    if (error) {
      console.error("Error fetching all GMV data:", error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Failed to fetch all GMV data:", error);
    throw error;
  }
};

export const processGmvData = (rawData: any[]) => {
  if (!Array.isArray(rawData)) {
    console.error("Raw data is not an array:", rawData);
    return [];
  }

  const transformedData = rawData.map(item => ({
    date: item.fecha_hora_cita,
    value: item.cobro_cliente
  }));

  const filteredData = rawData.filter(item => {
    const itemValue = typeof item.cobro_cliente === 'string' ? parseFloat(item.cobro_cliente) : item.cobro_cliente;
    const threshold = typeof THRESHOLD === 'string' ? parseFloat(THRESHOLD) : THRESHOLD;
    
    return !isNaN(itemValue) && !isNaN(threshold) && itemValue > threshold;
  });

  const anomalyDates = filteredData.map(item => item.fecha_hora_cita);

  return {
    series: [{ name: "GMV", data: transformedData }],
    anomalyDates: anomalyDates
  };
};
