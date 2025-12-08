/**
 * Edge Function: calcular-precision-mensual
 * 
 * Monthly cron job to calculate forecast accuracy by comparing 
 * last month's prediction vs actual results.
 * 
 * Stores results in forecast_accuracy_history table and triggers
 * alerts if MAPE exceeds threshold.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MonthlyAccuracyResult {
  month: string;
  predicted_services: number;
  actual_services: number;
  predicted_gmv: number;
  actual_gmv: number;
  services_mape: number;
  gmv_mape: number;
  accuracy: number;
  model_used: string;
  alert_triggered: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔄 Iniciando cálculo de precisión mensual...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get last month's date range
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const monthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    console.log(`📅 Calculando precisión para: ${monthKey}`);

    // 1. Get actual services count for last month
    const { data: actualData, error: actualError } = await supabase
      .from('servicios_custodia')
      .select('id, monto_cliente_final')
      .gte('fecha_hora_cita', lastMonth.toISOString())
      .lt('fecha_hora_cita', lastMonthEnd.toISOString());

    if (actualError) {
      console.error('Error fetching actual data:', actualError);
      throw actualError;
    }

    const actualServices = actualData?.length || 0;
    const actualGMV = actualData?.reduce((sum, s) => sum + (s.monto_cliente_final || 0), 0) || 0;

    console.log(`📊 Datos reales: ${actualServices} servicios, $${actualGMV.toLocaleString()} GMV`);

    // 2. Get stored forecast for last month (if exists)
    const { data: forecastData, error: forecastError } = await supabase
      .from('forecast_accuracy_history')
      .select('*')
      .eq('month', monthKey)
      .single();

    let predictedServices = 0;
    let predictedGMV = 0;
    let modelUsed = 'ensemble';

    if (forecastData && !forecastError) {
      // Use stored prediction
      predictedServices = forecastData.predicted_services || 0;
      predictedGMV = forecastData.predicted_gmv || 0;
      modelUsed = forecastData.model_used || 'ensemble';
      console.log(`📈 Predicción almacenada encontrada: ${predictedServices} servicios`);
    } else {
      // Calculate what the prediction would have been using historical data
      // Get 12 months of data prior to last month
      const historyStart = new Date(lastMonth);
      historyStart.setMonth(historyStart.getMonth() - 12);

      const { data: historyData, error: historyError } = await supabase
        .from('servicios_custodia')
        .select('fecha_hora_cita, monto_cliente_final')
        .gte('fecha_hora_cita', historyStart.toISOString())
        .lt('fecha_hora_cita', lastMonth.toISOString());

      if (!historyError && historyData && historyData.length > 0) {
        // Simple moving average prediction
        const monthlyServices: Record<string, number> = {};
        historyData.forEach(s => {
          if (!s.fecha_hora_cita) return;
          const date = new Date(s.fecha_hora_cita);
          const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          monthlyServices[key] = (monthlyServices[key] || 0) + 1;
        });

        const values = Object.values(monthlyServices);
        if (values.length > 0) {
          predictedServices = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
          const avgGMVPerService = historyData.reduce((sum, s) => sum + (s.monto_cliente_final || 0), 0) / historyData.length;
          predictedGMV = predictedServices * avgGMVPerService;
        }
      }

      console.log(`📉 Predicción calculada retrospectivamente: ${predictedServices} servicios`);
    }

    // 3. Calculate accuracy metrics
    const servicesMAPE = actualServices > 0 
      ? Math.abs(predictedServices - actualServices) / actualServices * 100 
      : 0;
    const gmvMAPE = actualGMV > 0 
      ? Math.abs(predictedGMV - actualGMV) / actualGMV * 100 
      : 0;
    const accuracy = 100 - servicesMAPE;

    // 4. Determine if alert should be triggered
    const MAPE_THRESHOLD = 25;
    const alertTriggered = servicesMAPE > MAPE_THRESHOLD;

    console.log(`📏 MAPE Servicios: ${servicesMAPE.toFixed(2)}%`);
    console.log(`📏 MAPE GMV: ${gmvMAPE.toFixed(2)}%`);
    console.log(`🎯 Precisión: ${accuracy.toFixed(2)}%`);
    console.log(`⚠️ Alerta: ${alertTriggered ? 'SÍ' : 'NO'}`);

    // 5. Store or update results
    const result: MonthlyAccuracyResult = {
      month: monthKey,
      predicted_services: predictedServices,
      actual_services: actualServices,
      predicted_gmv: predictedGMV,
      actual_gmv: actualGMV,
      services_mape: servicesMAPE,
      gmv_mape: gmvMAPE,
      accuracy,
      model_used: modelUsed,
      alert_triggered: alertTriggered,
    };

    const { error: upsertError } = await supabase
      .from('forecast_accuracy_history')
      .upsert({
        month: monthKey,
        services_mape: servicesMAPE,
        gmv_mape: gmvMAPE,
        accuracy,
        predicted_services: predictedServices,
        actual_services: actualServices,
        predicted_gmv: predictedGMV,
        actual_gmv: actualGMV,
        model_used: modelUsed,
        alert_triggered: alertTriggered,
        calculated_at: new Date().toISOString(),
      }, {
        onConflict: 'month'
      });

    if (upsertError) {
      console.error('Error storing accuracy result:', upsertError);
      // Don't throw - continue to return result even if storage fails
    } else {
      console.log('✅ Resultado almacenado en forecast_accuracy_history');
    }

    // 6. If alert triggered, log for potential notification
    if (alertTriggered) {
      console.warn(`🚨 ALERTA: MAPE ${servicesMAPE.toFixed(1)}% excede umbral de ${MAPE_THRESHOLD}%`);
      
      // Insert alert record
      const { error: alertError } = await supabase
        .from('alertas_sistema_nacional')
        .insert({
          tipo_alerta: 'forecast_accuracy',
          categoria: 'forecast',
          titulo: `Precisión de forecast degradada - ${monthKey}`,
          descripcion: `El MAPE del mes ${monthKey} fue ${servicesMAPE.toFixed(1)}%, superando el umbral de ${MAPE_THRESHOLD}%. Se recomienda recalibrar el modelo.`,
          prioridad: servicesMAPE > 40 ? 1 : 2,
          estado: 'pendiente',
          datos_contexto: result as unknown as Record<string, unknown>,
          acciones_sugeridas: [
            'Revisar calidad de datos de entrada',
            'Ejecutar backtesting para validar modelos',
            'Considerar recalibración de parámetros',
            'Verificar factores externos (feriados, eventos)'
          ]
        });

      if (alertError) {
        console.error('Error creating alert:', alertError);
      } else {
        console.log('✅ Alerta creada en alertas_sistema_nacional');
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Precisión calculada para ${monthKey}`,
        result,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('❌ Error en cálculo de precisión:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
