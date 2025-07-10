import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Ticket {
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
  assigned_user?: {
    display_name: string;
    email: string;
  };
}

export interface TicketStats {
  total: number;
  abiertos: number;
  en_proceso: number;
  resueltos_mes: number;
}

export const useTickets = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({
    total: 0,
    abiertos: 0,
    en_proceso: 0,
    resueltos_mes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          *,
          assigned_user:profiles!tickets_assigned_to_fkey(display_name, email)
        `)
        .order('created_at', { ascending: false });

      if (ticketsError) throw ticketsError;

      setTickets((data || []) as Ticket[]);
      
      // Calcular estadísticas
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const stats: TicketStats = {
        total: data?.length || 0,
        abiertos: data?.filter(t => t.status === 'abierto').length || 0,
        en_proceso: data?.filter(t => t.status === 'en_progreso').length || 0,
        resueltos_mes: data?.filter(t => 
          t.status === 'resuelto' && 
          new Date(t.updated_at) >= startOfMonth
        ).length || 0
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

  const updateTicketStatus = async (ticketId: string, newStatus: Ticket['status']) => {
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      if (newStatus === 'resuelto') {
        updateData.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateData)
        .eq('id', ticketId);

      if (error) throw error;

      toast.success('Estado del ticket actualizado');
      await loadTickets(); // Recargar tickets
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

  const createTicket = async (ticketData: Omit<Ticket, 'id' | 'ticket_number' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Ticket creado exitosamente');
      await loadTickets();
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error('Error al crear el ticket');
      throw error;
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  return {
    tickets,
    stats,
    loading,
    error,
    loadTickets,
    updateTicketStatus,
    assignTicket,
    createTicket
  };
};