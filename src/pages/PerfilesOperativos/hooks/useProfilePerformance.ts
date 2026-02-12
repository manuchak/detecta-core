import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetrics {
  // Puntualidad real (hora_presentacion vs fecha_hora_cita)
  puntualidadATiempo: number;
  puntualidadRetrasoLeve: number;
  puntualidadRetrasoGrave: number;
  puntualidadTotal: number;
  scorePuntualidad: number;

  // Confiabilidad (cancelaciones + rechazos)
  totalAsignaciones: number;
  cancelaciones: number;
  rechazos: number;
  scoreConfiabilidad: number;

  // Checklist compliance
  serviciosConChecklist: number;
  serviciosSinChecklist: number;
  scoreChecklist: number;

  // Documentación
  docsSubidos: number;
  docsVerificados: number;
  docsVigentes: number;
  scoreDocumentacion: number;

  // Volumen
  totalEjecuciones: number;
  ejecucionesCompletadas: number;
  kmTotales: number;
  ingresosTotales: number;

  // Score Global ponderado
  scoreGlobal: number;

  // Legacy compat
  asignacionesCompletadas: number;
  asignacionesCanceladas: number;
  tasaAsignacion: number;
}

export function useProfilePerformance(
  custodioId: string | undefined,
  nombre: string | undefined,
  telefono?: string | null
) {
  // 1. Servicios planificados (asignaciones by UUID)
  const planificacionQuery = useQuery({
    queryKey: ['profile-performance-planificacion', custodioId],
    queryFn: async () => {
      if (!custodioId) return [];
      const { data, error } = await supabase
        .from('servicios_planificados')
        .select('id, estado_planeacion')
        .eq('custodio_id', custodioId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!custodioId
  });

  // 2. Servicios custodia (ejecución by nombre) - includes puntualidad data
  const ejecucionQuery = useQuery({
    queryKey: ['profile-performance-ejecucion', nombre],
    queryFn: async () => {
      if (!nombre) return [];
      const { data, error } = await supabase
        .from('servicios_custodia')
        .select('id, estado, costo_custodio, km_recorridos, km_teorico, fecha_hora_cita, hora_presentacion, id_servicio')
        .ilike('nombre_custodio', `%${nombre}%`);
      if (error) throw error;
      return data || [];
    },
    enabled: !!nombre
  });

  // 3. Rechazos (by custodio_id)
  const rechazosQuery = useQuery({
    queryKey: ['profile-performance-rechazos', custodioId],
    queryFn: async () => {
      if (!custodioId) return [];
      const { data, error } = await supabase
        .from('custodio_rechazos')
        .select('id, fecha_rechazo')
        .eq('custodio_id', custodioId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!custodioId
  });

  // 4. Checklists (by custodio_telefono)
  const checklistQuery = useQuery({
    queryKey: ['profile-performance-checklists', telefono],
    queryFn: async () => {
      if (!telefono) return [];
      const { data, error } = await supabase
        .from('checklist_servicio')
        .select('id, estado, servicio_id')
        .eq('custodio_telefono', telefono);
      if (error) throw error;
      return data || [];
    },
    enabled: !!telefono
  });

  // 5. Documentación (by telefono via RPC)
  const docsQuery = useQuery({
    queryKey: ['profile-performance-docs', telefono],
    queryFn: async () => {
      if (!telefono) return [];
      const { data, error } = await supabase
        .rpc('get_documentos_custodio_by_phone', { p_telefono: telefono });
      if (error) throw error;
      return data || [];
    },
    enabled: !!telefono
  });

  // Calculate metrics
  const planificacion = planificacionQuery.data || [];
  const ejecucion = ejecucionQuery.data || [];
  const rechazos = rechazosQuery.data || [];
  const checklists = checklistQuery.data || [];
  const docs = docsQuery.data || [];

  // --- Puntualidad real ---
  const serviciosConHora = ejecucion.filter(
    s => s.hora_presentacion && s.fecha_hora_cita
  );
  let aTiempo = 0, retrasoLeve = 0, retrasoGrave = 0;
  for (const s of serviciosConHora) {
    const cita = new Date(s.fecha_hora_cita!).getTime();
    const presentacion = new Date(s.hora_presentacion!).getTime();
    const diffMin = (presentacion - cita) / 60000;
    if (diffMin <= 0) aTiempo++;
    else if (diffMin <= 15) retrasoLeve++;
    else retrasoGrave++;
  }
  const puntualidadTotal = serviciosConHora.length;
  const scorePuntualidad = puntualidadTotal > 0
    ? Math.round((aTiempo / puntualidadTotal) * 100)
    : 0;

  // --- Confiabilidad ---
  const totalAsignaciones = planificacion.length;
  const cancelaciones = planificacion.filter(s => s.estado_planeacion === 'cancelado').length;
  const totalRechazos = rechazos.length;
  const asignacionesCompletadas = planificacion.filter(s => s.estado_planeacion === 'confirmado').length;
  const scoreConfiabilidad = totalAsignaciones > 0
    ? Math.round(((totalAsignaciones - cancelaciones - totalRechazos) / totalAsignaciones) * 100)
    : 100;

  // --- Checklist ---
  const totalEjecuciones = ejecucion.length;
  const ejecucionesCompletadas = ejecucion.filter(s =>
    s.estado === 'completado' || s.estado === 'Completado' || s.estado === 'finalizado' || s.estado === 'Finalizado'
  ).length;
  const serviciosConChecklist = checklists.length;
  const serviciosSinChecklist = Math.max(0, ejecucionesCompletadas - serviciosConChecklist);
  const scoreChecklist = ejecucionesCompletadas > 0
    ? Math.round((serviciosConChecklist / ejecucionesCompletadas) * 100)
    : 0;

  // --- Documentación ---
  const docsSubidos = docs.length;
  const docsVerificados = docs.filter((d: any) => d.verificado).length;
  const docsVigentes = docs.filter((d: any) => {
    if (!d.fecha_vigencia) return true; // no expiry = vigente
    return new Date(d.fecha_vigencia) > new Date();
  }).length;
  // Score: % verificados (if any docs exist)
  const scoreDocumentacion = docsSubidos > 0
    ? Math.round((docsVerificados / docsSubidos) * 100)
    : 0;

  // --- Volumen ---
  const kmTotales = ejecucion.reduce((sum, s) => sum + (s.km_recorridos || s.km_teorico || 0), 0);
  const ingresosTotales = ejecucion.reduce((sum, s) => sum + (s.costo_custodio || 0), 0);
  // Normalize volume: 100 services = 100%. Cap at 100.
  const scoreVolumen = Math.min(100, Math.round((ejecucionesCompletadas / 100) * 100));

  // --- Score Global ponderado ---
  const scoreGlobal = Math.round(
    scorePuntualidad * 0.30 +
    scoreConfiabilidad * 0.25 +
    scoreChecklist * 0.20 +
    scoreDocumentacion * 0.15 +
    scoreVolumen * 0.10
  );

  const tasaAsignacion = totalAsignaciones > 0
    ? Math.round((asignacionesCompletadas / totalAsignaciones) * 100)
    : 0;

  const metrics: PerformanceMetrics = {
    puntualidadATiempo: aTiempo,
    puntualidadRetrasoLeve: retrasoLeve,
    puntualidadRetrasoGrave: retrasoGrave,
    puntualidadTotal,
    scorePuntualidad,
    totalAsignaciones,
    cancelaciones,
    rechazos: totalRechazos,
    scoreConfiabilidad,
    serviciosConChecklist,
    serviciosSinChecklist,
    scoreChecklist,
    docsSubidos,
    docsVerificados,
    docsVigentes,
    scoreDocumentacion,
    totalEjecuciones,
    ejecucionesCompletadas,
    kmTotales,
    ingresosTotales,
    scoreGlobal,
    asignacionesCompletadas,
    asignacionesCanceladas: cancelaciones,
    tasaAsignacion,
  };

  return {
    metrics,
    isLoading: planificacionQuery.isLoading || ejecucionQuery.isLoading || rechazosQuery.isLoading || checklistQuery.isLoading || docsQuery.isLoading,
    isError: planificacionQuery.isError || ejecucionQuery.isError
  };
}
