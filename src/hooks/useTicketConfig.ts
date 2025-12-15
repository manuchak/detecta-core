import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TicketCategoria, TicketSubcategoria } from './useTicketCategories';

export interface EscalationRule {
  id: string;
  nombre: string;
  descripcion: string | null;
  condicion: 'sla_response_vencido' | 'sla_resolution_vencido' | 'sin_respuesta_24h' | 'csat_bajo' | 'ticket_reopen';
  accion: 'notificar' | 'reasignar' | 'escalar_supervisor' | 'escalar_gerente';
  destinatario_rol: string | null;
  notificar_email: boolean;
  notificar_app: boolean;
  prioridad_minima: number;
  categoria_id: string | null;
  activo: boolean;
  orden: number;
  created_at: string;
  updated_at: string;
}

export interface ResponseTemplate {
  id: string;
  nombre: string;
  contenido: string;
  categoria_id: string | null;
  subcategoria_id: string | null;
  variables_disponibles: string[];
  activo: boolean;
  uso_count: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessHour {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fin: string;
  es_dia_laboral: boolean;
}

export interface Holiday {
  id: string;
  fecha: string;
  nombre: string;
  tipo: string;
  activo: boolean;
  factor_ajuste: number;
}

export const useTicketConfig = () => {
  const [categorias, setCategorias] = useState<TicketCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<TicketSubcategoria[]>([]);
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([]);
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [businessHours, setBusinessHours] = useState<BusinessHour[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadAllConfig = useCallback(async () => {
    try {
      setLoading(true);
      
      const [categoriasRes, subcategoriasRes, rulesRes, templatesRes, hoursRes, holidaysRes] = await Promise.all([
        supabase.from('ticket_categorias_custodio').select('*').order('orden'),
        supabase.from('ticket_subcategorias_custodio').select('*').order('orden'),
        supabase.from('ticket_escalation_rules').select('*').order('orden'),
        supabase.from('ticket_response_templates').select('*').order('nombre'),
        supabase.from('ticket_business_hours').select('*').order('dia_semana'),
        supabase.from('calendario_feriados_mx').select('*').order('fecha')
      ]);

      if (categoriasRes.error) throw categoriasRes.error;
      if (subcategoriasRes.error) throw subcategoriasRes.error;
      if (rulesRes.error) throw rulesRes.error;
      if (templatesRes.error) throw templatesRes.error;
      if (hoursRes.error) throw hoursRes.error;
      if (holidaysRes.error) throw holidaysRes.error;

      setCategorias(categoriasRes.data || []);
      setSubcategorias(subcategoriasRes.data || []);
      setEscalationRules(rulesRes.data || []);
      setTemplates(templatesRes.data || []);
      setBusinessHours(hoursRes.data || []);
      setHolidays(holidaysRes.data || []);
    } catch (error) {
      console.error('Error loading ticket config:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la configuración',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Category CRUD
  const updateCategoria = async (id: string, updates: Partial<TicketCategoria>) => {
    try {
      const { error } = await supabase
        .from('ticket_categorias_custodio')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setCategorias(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
      toast({ title: 'Categoría actualizada' });
      return true;
    } catch (error) {
      console.error('Error updating categoria:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
      return false;
    }
  };

  const createCategoria = async (categoria: Omit<TicketCategoria, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('ticket_categorias_custodio')
        .insert(categoria)
        .select()
        .single();
      
      if (error) throw error;
      
      setCategorias(prev => [...prev, data]);
      toast({ title: 'Categoría creada' });
      return data;
    } catch (error) {
      console.error('Error creating categoria:', error);
      toast({ title: 'Error', description: 'No se pudo crear', variant: 'destructive' });
      return null;
    }
  };

  // Escalation Rules CRUD
  const updateEscalationRule = async (id: string, updates: Partial<EscalationRule>) => {
    try {
      const { error } = await supabase
        .from('ticket_escalation_rules')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setEscalationRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast({ title: 'Regla actualizada' });
      return true;
    } catch (error) {
      console.error('Error updating rule:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
      return false;
    }
  };

  const createEscalationRule = async (rule: Omit<EscalationRule, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('ticket_escalation_rules')
        .insert(rule)
        .select()
        .single();
      
      if (error) throw error;
      
      setEscalationRules(prev => [...prev, data]);
      toast({ title: 'Regla creada' });
      return data;
    } catch (error) {
      console.error('Error creating rule:', error);
      toast({ title: 'Error', description: 'No se pudo crear', variant: 'destructive' });
      return null;
    }
  };

  const deleteEscalationRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ticket_escalation_rules')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setEscalationRules(prev => prev.filter(r => r.id !== id));
      toast({ title: 'Regla eliminada' });
      return true;
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
      return false;
    }
  };

  // Templates CRUD
  const updateTemplate = async (id: string, updates: Partial<ResponseTemplate>) => {
    try {
      const { error } = await supabase
        .from('ticket_response_templates')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast({ title: 'Template actualizado' });
      return true;
    } catch (error) {
      console.error('Error updating template:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
      return false;
    }
  };

  const createTemplate = async (template: Omit<ResponseTemplate, 'id' | 'created_at' | 'updated_at' | 'uso_count'>) => {
    try {
      const { data, error } = await supabase
        .from('ticket_response_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      
      setTemplates(prev => [...prev, data]);
      toast({ title: 'Template creado' });
      return data;
    } catch (error) {
      console.error('Error creating template:', error);
      toast({ title: 'Error', description: 'No se pudo crear', variant: 'destructive' });
      return null;
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('ticket_response_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Template eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
      return false;
    }
  };

  // Business Hours CRUD
  const updateBusinessHour = async (id: string, updates: Partial<BusinessHour>) => {
    try {
      const { error } = await supabase
        .from('ticket_business_hours')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setBusinessHours(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
      toast({ title: 'Horario actualizado' });
      return true;
    } catch (error) {
      console.error('Error updating business hour:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
      return false;
    }
  };

  // Holidays CRUD
  const updateHoliday = async (id: string, updates: Partial<Holiday>) => {
    try {
      const { error } = await supabase
        .from('calendario_feriados_mx')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
      
      setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
      toast({ title: 'Feriado actualizado' });
      return true;
    } catch (error) {
      console.error('Error updating holiday:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar', variant: 'destructive' });
      return false;
    }
  };

  const createHoliday = async (holiday: Omit<Holiday, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('calendario_feriados_mx')
        .insert(holiday)
        .select()
        .single();
      
      if (error) throw error;
      
      setHolidays(prev => [...prev, data]);
      toast({ title: 'Feriado creado' });
      return data;
    } catch (error) {
      console.error('Error creating holiday:', error);
      toast({ title: 'Error', description: 'No se pudo crear', variant: 'destructive' });
      return null;
    }
  };

  const deleteHoliday = async (id: string) => {
    try {
      const { error } = await supabase
        .from('calendario_feriados_mx')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setHolidays(prev => prev.filter(h => h.id !== id));
      toast({ title: 'Feriado eliminado' });
      return true;
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({ title: 'Error', description: 'No se pudo eliminar', variant: 'destructive' });
      return false;
    }
  };

  useEffect(() => {
    loadAllConfig();
  }, [loadAllConfig]);

  return {
    categorias,
    subcategorias,
    escalationRules,
    templates,
    businessHours,
    holidays,
    loading,
    refetch: loadAllConfig,
    // Category operations
    updateCategoria,
    createCategoria,
    // Escalation operations
    updateEscalationRule,
    createEscalationRule,
    deleteEscalationRule,
    // Template operations
    updateTemplate,
    createTemplate,
    deleteTemplate,
    // Business hours operations
    updateBusinessHour,
    // Holiday operations
    updateHoliday,
    createHoliday,
    deleteHoliday
  };
};
