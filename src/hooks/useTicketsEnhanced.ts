// @ts-nocheck
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateTicketSLA, SLAInfo } from './useTicketSLA';

export interface TicketEnhanced {
  id: string;
  ticket_number: string;
  customer_phone: string | null;
  customer_name: string | null;
  subject: string;
  description: string | null;
  status: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  category: string | null;
  source: 'whatsapp' | 'web' | 'email' | 'telefono';
  assigned_to: string | null;
  whatsapp_chat_id: string | null;
  created_at: string;
  updated_at: string;
  
  // SLA fields
  fecha_sla_respuesta: string | null;
  fecha_sla_resolucion: string | null;
  primera_respuesta_at: string | null;
  resuelto_at: string | null;
  
  // Custodian fields
  custodio_id: string | null;
  custodio_telefono: string | null;
  servicio_id: string | null;
  categoria_custodio_id: string | null;
  subcategoria_custodio_id: string | null;
  tipo_ticket: string | null;
  monto_reclamado: number | null;
  evidencia_urls: string[] | null;
  
  // CSAT
  calificacion_csat: number | null;
  comentario_csat: string | null;
  
  // Joined data
  assigned_user?: {
    id: string;
    display_name: string;
    email: string;
  };
  categoria_custodio?: {
    id: string;
    nombre: string;
    icono: string;
    color: string;
    departamento_responsable: string;
    sla_horas_respuesta: number;
    sla_horas_resolucion: number;
  };
  custodio?: {
    id: string;
    nombre: string;
    telefono: string;
    email: string | null;
    zona_base: string | null;
    fecha_alta: string | null;
  };
  
  // Calculated SLA
  sla: SLAInfo;
}

export interface TicketStatsEnhanced {
  total: number;
  abiertos: number;
  en_proceso: number;
  resueltos_mes: number;
  sla_vencidos: number;
  sla_proximos: number;
  cumplimiento_sla: number;
}

export const useTicketsEnhanced = () => {
  const [tickets, setTickets] = useState<TicketEnhanced[]>([]);
  const [stats, setStats] = useState<TicketStatsEnhanced>({
    total: 0,
    abiertos: 0,
    en_proceso: 0,
    resueltos_mes: 0,
    sla_vencidos: 0,
    sla_proximos: 0,
    cumplimiento_sla: 100
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tickets with related data
      const { data, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          categoria_custodio:ticket_categorias_custodio(
            id, nombre, icono, color, departamento_responsable,
            sla_horas_respuesta, sla_horas_resolucion
          )
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      // Get unique assigned user IDs
      const assignedUserIds = [...new Set(
        (data || [])
          .map(ticket => ticket.assigned_to)
          .filter(Boolean)
      )] as string[];

      // Get unique custodio IDs
      const custodioIds = [...new Set(
        (data || [])
          .map(ticket => ticket.custodio_id)
          .filter(Boolean)
      )] as string[];

      // Fetch user profiles
      const profiles: Record<string, { id: string; display_name: string; email: string }> = {};
      if (assignedUserIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .in('id', assignedUserIds);

        profilesData?.forEach(profile => {
          profiles[profile.id] = {
            id: profile.id,
            display_name: profile.display_name || '',
            email: profile.email || ''
          };
        });
      }

      // Fetch custodio data
      const custodios: Record<string, any> = {};
      if (custodioIds.length > 0) {
        const { data: custodiosData } = await supabase
          .from('custodios_operativos')
          .select('id, nombre, telefono, email, zona_base, fecha_alta')
          .in('id', custodioIds);

        custodiosData?.forEach(custodio => {
          custodios[custodio.id] = custodio;
        });
      }

      // Combine tickets with related data and calculate SLA
      const ticketsWithSLA: TicketEnhanced[] = (data || []).map(ticket => {
        const sla = calculateTicketSLA({
          id: ticket.id,
          status: ticket.status,
          created_at: ticket.created_at,
          fecha_sla_respuesta: ticket.fecha_sla_respuesta,
          fecha_sla_resolucion: ticket.fecha_sla_resolucion,
          primera_respuesta_at: ticket.primera_respuesta_at,
          resuelto_at: ticket.resuelto_at
        });

        return {
          id: ticket.id,
          ticket_number: ticket.ticket_number || '',
          customer_phone: ticket.customer_phone,
          customer_name: ticket.customer_name,
          subject: ticket.subject || '',
          description: ticket.description,
          status: ticket.status as TicketEnhanced['status'],
          priority: ticket.priority as TicketEnhanced['priority'],
          category: ticket.category,
          source: ticket.source as TicketEnhanced['source'],
          assigned_to: ticket.assigned_to,
          whatsapp_chat_id: ticket.whatsapp_chat_id,
          created_at: ticket.created_at || '',
          updated_at: ticket.updated_at || '',
          
          fecha_sla_respuesta: ticket.fecha_sla_respuesta,
          fecha_sla_resolucion: ticket.fecha_sla_resolucion,
          primera_respuesta_at: ticket.primera_respuesta_at,
          resuelto_at: ticket.resuelto_at,
          
          custodio_id: ticket.custodio_id,
          custodio_telefono: ticket.custodio_telefono,
          servicio_id: ticket.servicio_id,
          categoria_custodio_id: ticket.categoria_custodio_id,
          subcategoria_custodio_id: ticket.subcategoria_custodio_id,
          tipo_ticket: ticket.tipo_ticket,
          monto_reclamado: ticket.monto_reclamado,
          evidencia_urls: ticket.evidencia_urls,
          
          calificacion_csat: ticket.calificacion_csat,
          comentario_csat: ticket.comentario_csat,
          
          assigned_user: ticket.assigned_to ? profiles[ticket.assigned_to] : undefined,
          categoria_custodio: ticket.categoria_custodio,
          custodio: ticket.custodio_id ? custodios[ticket.custodio_id] : undefined,
          
          sla
        };
      });

      setTickets(ticketsWithSLA);
      
      // Calculate stats
      const activeTickets = ticketsWithSLA.filter(t => !['resuelto', 'cerrado'].includes(t.status));
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const resolvedThisMonth = ticketsWithSLA.filter(t => 
        ['resuelto', 'cerrado'].includes(t.status) && 
        t.sla.estadoResolucion !== 'sin_sla'
      );
      const cumplidos = resolvedThisMonth.filter(t => t.sla.estadoResolucion === 'cumplido').length;
      
      const stats: TicketStatsEnhanced = {
        total: data?.length || 0,
        abiertos: data?.filter(t => t.status === 'abierto').length || 0,
        en_proceso: data?.filter(t => t.status === 'en_progreso').length || 0,
        resueltos_mes: data?.filter(t => 
          t.status === 'resuelto' && 
          new Date(t.updated_at) >= startOfMonth
        ).length || 0,
        sla_vencidos: activeTickets.filter(t => t.sla.estadoGeneral === 'vencido').length,
        sla_proximos: activeTickets.filter(t => t.sla.estadoGeneral === 'proximo_vencer').length,
        cumplimiento_sla: resolvedThisMonth.length > 0 
          ? Math.round((cumplidos / resolvedThisMonth.length) * 100) 
          : 100
      };
      
      setStats(stats);

    } catch (err) {
      console.error('Error loading tickets:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast.error('Error al cargar los tickets');
    } finally {
      setLoading(false);
    }
  };

  // Sort tickets by urgency (vencidos first, then próximos, then by time remaining)
  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      // First sort by status - active tickets first
      const aActive = !['resuelto', 'cerrado'].includes(a.status);
      const bActive = !['resuelto', 'cerrado'].includes(b.status);
      if (aActive !== bActive) return aActive ? -1 : 1;
      
      // Then by urgency score
      return b.sla.urgencyScore - a.sla.urgencyScore;
    });
  }, [tickets]);

  const updateTicketStatus = async (ticketId: string, newStatus: TicketEnhanced['status']) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resuelto') {
        updateData.resuelto_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Estado del ticket actualizado');
      await loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Error al actualizar el estado del ticket');
    }
  };

  const assignTicket = async (ticketId: string, userId: string | null) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Ticket asignado correctamente');
      await loadTickets();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast.error('Error al asignar el ticket');
    }
  };

  const recordFirstResponse = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          primera_respuesta_at: new Date().toISOString(),
          status: 'en_progreso',
          updated_at: new Date().toISOString()
        })
        .eq('id', ticketId)
        .is('primera_respuesta_at', null);

      if (error) throw error;
      await loadTickets();
    } catch (error) {
      console.error('Error recording first response:', error);
    }
  };

  const getTicketById = (ticketId: string) => {
    return tickets.find(t => t.id === ticketId);
  };

  // Direct database fetch for a single ticket (avoids React state race conditions)
  const fetchTicketById = async (ticketId: string): Promise<TicketEnhanced | null> => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          categoria_custodio:ticket_categorias_custodio(
            id, nombre, icono, color, departamento_responsable,
            sla_horas_respuesta, sla_horas_resolucion
          )
        `)
        .eq('id', ticketId)
        .maybeSingle();

      if (error || !data) return null;

      // Fetch assigned user profile
      let assignedUser: { id: string; display_name: string; email: string } | undefined;
      if (data.assigned_to) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, display_name, email')
          .eq('id', data.assigned_to)
          .maybeSingle();
        
        if (profileData) {
          assignedUser = {
            id: profileData.id,
            display_name: profileData.display_name || '',
            email: profileData.email || ''
          };
        }
      }

      // Fetch custodio data
      let custodio: any;
      if (data.custodio_id) {
        const { data: custodioData } = await supabase
          .from('custodios_operativos')
          .select('id, nombre, telefono, email, zona_base, fecha_alta')
          .eq('id', data.custodio_id)
          .maybeSingle();
        
        if (custodioData) {
          custodio = custodioData;
        }
      }

      // Calculate SLA
      const sla = calculateTicketSLA({
        id: data.id,
        status: data.status,
        created_at: data.created_at,
        fecha_sla_respuesta: data.fecha_sla_respuesta,
        fecha_sla_resolucion: data.fecha_sla_resolucion,
        primera_respuesta_at: data.primera_respuesta_at,
        resuelto_at: data.resuelto_at
      });

      return {
        id: data.id,
        ticket_number: data.ticket_number || '',
        customer_phone: data.customer_phone,
        customer_name: data.customer_name,
        subject: data.subject || '',
        description: data.description,
        status: data.status as TicketEnhanced['status'],
        priority: data.priority as TicketEnhanced['priority'],
        category: data.category,
        source: data.source as TicketEnhanced['source'],
        assigned_to: data.assigned_to,
        whatsapp_chat_id: data.whatsapp_chat_id,
        created_at: data.created_at || '',
        updated_at: data.updated_at || '',
        
        fecha_sla_respuesta: data.fecha_sla_respuesta,
        fecha_sla_resolucion: data.fecha_sla_resolucion,
        primera_respuesta_at: data.primera_respuesta_at,
        resuelto_at: data.resuelto_at,
        
        custodio_id: data.custodio_id,
        custodio_telefono: data.custodio_telefono,
        servicio_id: data.servicio_id,
        categoria_custodio_id: data.categoria_custodio_id,
        subcategoria_custodio_id: data.subcategoria_custodio_id,
        tipo_ticket: data.tipo_ticket,
        monto_reclamado: data.monto_reclamado,
        evidencia_urls: data.evidencia_urls,
        
        calificacion_csat: data.calificacion_csat,
        comentario_csat: data.comentario_csat,
        
        assigned_user: assignedUser,
        categoria_custodio: data.categoria_custodio,
        custodio,
        
        sla
      };
    } catch (error) {
      console.error('Error fetching ticket by ID:', error);
      return null;
    }
  };

  useEffect(() => {
    loadTickets();
    
    // Set up realtime subscription for ticket updates
    const channel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        () => {
          loadTickets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    tickets: sortedTickets,
    stats,
    loading,
    error,
    loadTickets,
    updateTicketStatus,
    assignTicket,
    recordFirstResponse,
    getTicketById,
    fetchTicketById
  };
};
