import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useInstaladorData = () => {
  const [instaladores, setInstaladores] = useState<any[]>([]);
  const [datosFiscales, setDatosFiscales] = useState<any[]>([]);
  const [evidencias, setEvidencias] = useState<any[]>([]);
  const [pagos, setPagos] = useState<any[]>([]);
  const [auditorias, setAuditorias] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener todos los instaladores
  const fetchInstaladores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('instaladores')
        .select('*')
        .order('nombre_completo');

      if (error) throw error;
      setInstaladores(data || []);
    } catch (error) {
      console.error('Error fetching instaladores:', error);
      toast.error('Error al cargar instaladores');
    } finally {
      setLoading(false);
    }
  };

  // Crear nuevo instalador
  const createInstalador = async (data: any) => {
    try {
      const { data: newInstalador, error } = await supabase
        .from('instaladores')
        .insert([{
          ...data,
          // Asegurar valores por defecto para nuevos campos
          zonas_trabajo: data.zonas_trabajo || [],
          herramientas_disponibles: data.herramientas_disponibles || [],
          capacidad_vehiculos: data.capacidad_vehiculos || [],
          horario_atencion: data.horario_atencion || {
            lunes: true, martes: true, miercoles: true, jueves: true, 
            viernes: true, sabado: false, domingo: false
          },
          experiencia_especifica: data.experiencia_especifica || {},
          tiene_taller: data.tiene_taller || false,
          activo: true,
          estado_afiliacion: 'pendiente',
          calificacion_promedio: 0,
          servicios_completados: 0,
          fecha_afiliacion: new Date().toISOString(),
          documentacion_completa: false,
          certificaciones: [],
          vehiculo_propio: data.vehiculo_propio || false
        }])
        .select()
        .single();

      if (error) throw error;
      
      setInstaladores(prev => [...prev, newInstalador]);
      toast.success('Instalador creado exitosamente');
      return newInstalador;
    } catch (error) {
      console.error('Error creating instalador:', error);
      toast.error('Error al crear instalador');
      throw error;
    }
  };

  // Actualizar instalador
  const updateInstalador = async (id: string, data: any) => {
    try {
      const { data: updatedInstalador, error } = await supabase
        .from('instaladores')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setInstaladores(prev => 
        prev.map(instalador => 
          instalador.id === id ? updatedInstalador : instalador
        )
      );
      toast.success('Instalador actualizado exitosamente');
      return updatedInstalador;
    } catch (error) {
      console.error('Error updating instalador:', error);
      toast.error('Error al actualizar instalador');
      throw error;
    }
  };

  // Obtener datos fiscales de un instalador
  const fetchDatosFiscales = async (instaladorId: string) => {
    try {
      const { data, error } = await supabase
        .from('instaladores_datos_fiscales')
        .select('*')
        .eq('instalador_id', instaladorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching datos fiscales:', error);
      toast.error('Error al cargar datos fiscales');
      return null;
    }
  };

  // Guardar datos fiscales
  const saveDatosFiscales = async (data: any) => {
    try {
      const { data: savedData, error } = await supabase
        .from('instaladores_datos_fiscales')
        .upsert(data)
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Datos fiscales guardados exitosamente');
      return savedData;
    } catch (error) {
      console.error('Error saving datos fiscales:', error);
      toast.error('Error al guardar datos fiscales');
      throw error;
    }
  };

  // Obtener evidencias de instalación
  const fetchEvidencias = async (programacionId: string) => {
    try {
      const { data, error } = await supabase
        .from('evidencias_instalacion')
        .select('*')
        .eq('programacion_id', programacionId)
        .order('timestamp_captura', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching evidencias:', error);
      toast.error('Error al cargar evidencias');
      return [];
    }
  };

  // Subir evidencia
  const uploadEvidencia = async (data: any) => {
    try {
      const { data: evidencia, error } = await supabase
        .from('evidencias_instalacion')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      setEvidencias(prev => [...prev, evidencia]);
      toast.success('Evidencia subida exitosamente');
      return evidencia;
    } catch (error) {
      console.error('Error uploading evidencia:', error);
      toast.error('Error al subir evidencia');
      throw error;
    }
  };

  // Obtener pagos de un instalador
  const fetchPagos = async (instaladorId: string) => {
    try {
      const { data, error } = await supabase
        .from('pagos_instaladores')
        .select('*')
        .eq('instalador_id', instaladorId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pagos:', error);
      toast.error('Error al cargar pagos');
      return [];
    }
  };

  // Crear pago
  const createPago = async (data: any) => {
    try {
      const { data: pago, error } = await supabase
        .from('pagos_instaladores')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      setPagos(prev => [...prev, pago]);
      toast.success('Pago registrado exitosamente');
      return pago;
    } catch (error) {
      console.error('Error creating pago:', error);
      toast.error('Error al registrar pago');
      throw error;
    }
  };

  // Aprobar pago
  const aprobarPago = async (pagoId: string, observaciones?: string) => {
    try {
      const { data: pago, error } = await supabase
        .from('pagos_instaladores')
        .update({
          estado_pago: 'aprobado',
          fecha_aprobacion: new Date().toISOString(),
          observaciones
        })
        .eq('id', pagoId)
        .select()
        .single();

      if (error) throw error;
      
      setPagos(prev => 
        prev.map(p => p.id === pagoId ? pago : p)
      );
      toast.success('Pago aprobado exitosamente');
      return pago;
    } catch (error) {
      console.error('Error approving pago:', error);
      toast.error('Error al aprobar pago');
      throw error;
    }
  };

  // Crear auditoría
  const createAuditoria = async (data: any) => {
    try {
      const { data: auditoria, error } = await supabase
        .from('auditoria_instalaciones')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      
      setAuditorias(prev => [...prev, auditoria]);
      toast.success('Auditoría creada exitosamente');
      return auditoria;
    } catch (error) {
      console.error('Error creating auditoria:', error);
      toast.error('Error al crear auditoría');
      throw error;
    }
  };

  // Actualizar auditoría
  const updateAuditoria = async (auditoriaId: string, data: any) => {
    try {
      const { data: auditoria, error } = await supabase
        .from('auditoria_instalaciones')
        .update(data)
        .eq('id', auditoriaId)
        .select()
        .single();

      if (error) throw error;
      
      setAuditorias(prev => 
        prev.map(a => a.id === auditoriaId ? auditoria : a)
      );
      toast.success('Auditoría actualizada exitosamente');
      return auditoria;
    } catch (error) {
      console.error('Error updating auditoria:', error);
      toast.error('Error al actualizar auditoría');
      throw error;
    }
  };

  useEffect(() => {
    fetchInstaladores();
  }, []);

  return {
    instaladores,
    datosFiscales,
    evidencias,
    pagos,
    auditorias,
    loading,
    // Instaladores
    fetchInstaladores,
    createInstalador,
    updateInstalador,
    // Datos fiscales
    fetchDatosFiscales,
    saveDatosFiscales,
    // Evidencias
    fetchEvidencias,
    uploadEvidencia,
    // Pagos
    fetchPagos,
    createPago,
    aprobarPago,
    // Auditorías
    createAuditoria,
    updateAuditoria
  };
};