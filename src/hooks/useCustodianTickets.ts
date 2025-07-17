import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CustodianTicket {
  id: string;
  title: string;
  description: string;
  status: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  priority: 'baja' | 'media' | 'alta' | 'critica';
  category: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  created_by: string;
  resolution_notes?: string;
  service_id?: string;
  phone_number?: string;
}

export interface CustodianTicketStats {
  total: number;
  abiertos: number;
  en_progreso: number;
  resueltos: number;
  cerrados: number;
}

export const useCustodianTickets = (custodianPhone?: string) => {
  const [tickets, setTickets] = useState<CustodianTicket[]>([]);
  const [stats, setStats] = useState<CustodianTicketStats>({
    total: 0,
    abiertos: 0,
    en_progreso: 0,
    resueltos: 0,
    cerrados: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (custodianPhone) {
      loadCustodianTickets();
    }
  }, [custodianPhone]);

  const loadCustodianTickets = async () => {
    try {
      setLoading(true);

      // Query tickets related to the custodian by phone number
      const { data: ticketsData, error } = await supabase
        .from('tickets')
        .select(`
          id,
          subject,
          description,
          status,
          priority,
          category,
          created_at,
          updated_at,
          assigned_to,
          created_by,
          resolution_notes,
          customer_phone
        `)
        .or(`customer_phone.eq.${custodianPhone},assigned_to.eq.${custodianPhone}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedTickets: CustodianTicket[] = (ticketsData || []).map(ticket => ({
        id: ticket.id,
        title: ticket.subject || 'Sin título',
        description: ticket.description || '',
        status: ticket.status as CustodianTicket['status'],
        priority: ticket.priority as CustodianTicket['priority'],
        category: ticket.category || 'General',
        created_at: ticket.created_at,
        updated_at: ticket.updated_at,
        assigned_to: ticket.assigned_to,
        created_by: ticket.created_by,
        resolution_notes: ticket.resolution_notes,
        phone_number: ticket.customer_phone
      }));

      setTickets(formattedTickets);

      // Calculate stats
      const ticketStats: CustodianTicketStats = {
        total: formattedTickets.length,
        abiertos: formattedTickets.filter(t => t.status === 'abierto').length,
        en_progreso: formattedTickets.filter(t => t.status === 'en_progreso').length,
        resueltos: formattedTickets.filter(t => t.status === 'resuelto').length,
        cerrados: formattedTickets.filter(t => t.status === 'cerrado').length
      };

      setStats(ticketStats);

    } catch (error) {
      console.error('Error loading custodian tickets:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets del custodio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createTicket = async (ticketData: Partial<CustodianTicket>) => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([{
          subject: ticketData.title,
          description: ticketData.description,
          status: 'abierto',
          priority: ticketData.priority || 'media',
          category: ticketData.category || 'General',
          customer_phone: custodianPhone,
          created_by: custodianPhone // Using phone as identifier for now
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Ticket creado",
        description: "Tu ticket ha sido creado exitosamente",
      });

      await loadCustodianTickets(); // Reload tickets
      return data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el ticket",
        variant: "destructive"
      });
      return null;
    }
  };

  const getOpenTickets = () => {
    return tickets.filter(ticket => ['abierto', 'en_progreso'].includes(ticket.status));
  };

  const getRecentTickets = (limit: number = 5) => {
    return tickets.slice(0, limit);
  };

  return {
    tickets,
    stats,
    loading,
    createTicket,
    getOpenTickets,
    getRecentTickets,
    refetch: loadCustodianTickets
  };
};