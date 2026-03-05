import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { normalizePhone } from '@/lib/phoneUtils';
import { compressImage } from '@/lib/imageUtils';

export interface CustodianTicket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  status: 'abierto' | 'en_progreso' | 'resuelto' | 'cerrado';
  priority: 'baja' | 'media' | 'alta' | 'urgente';
  custodio_telefono: string | null;
  servicio_id: string | null;
  categoria_custodio_id: string | null;
  subcategoria_custodio_id: string | null;
  monto_reclamado: number | null;
  evidencia_urls: string[] | null;
  fecha_sla_respuesta: string | null;
  fecha_sla_resolucion: string | null;
  primera_respuesta_at: string | null;
  calificacion_csat: number | null;
  comentario_csat: string | null;
  csat_visto_at: string | null;
  created_at: string;
  updated_at: string;
  categoria?: {
    nombre: string;
    icono: string;
    color: string;
  };
  subcategoria?: {
    nombre: string;
  };
  respuestas_count?: number;
}

export interface TicketRespuesta {
  id: string;
  ticket_id: string;
  autor_id: string;
  autor_tipo: 'custodio' | 'agente' | 'sistema';
  autor_nombre: string | null;
  mensaje: string;
  adjuntos_urls: string[] | null;
  es_resolucion: boolean;
  es_interno: boolean;
  created_at: string;
}

export interface ResponseRating {
  id: string;
  respuesta_id: string;
  helpful: boolean | null;
}

export interface CreateTicketData {
  subject: string;
  description: string;
  categoria_custodio_id: string;
  subcategoria_custodio_id?: string;
  servicio_id?: string;
  monto_reclamado?: number;
  priority?: 'baja' | 'media' | 'alta' | 'urgente';
}

export interface CustodianTicketStats {
  total: number;
  abiertos: number;
  en_progreso: number;
  resueltos: number;
  cerrados: number;
  sla_vencidos: number;
  resueltos_sin_calificar: number;
}

export const useCustodianTicketsEnhanced = (custodianPhone?: string) => {
  const [tickets, setTickets] = useState<CustodianTicket[]>([]);
  const [stats, setStats] = useState<CustodianTicketStats>({
    total: 0,
    abiertos: 0,
    en_progreso: 0,
    resueltos: 0,
    cerrados: 0,
    sla_vencidos: 0,
    resueltos_sin_calificar: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadTickets = useCallback(async () => {
    if (!custodianPhone) {
      setLoading(false);
      setTickets([]);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          categoria:ticket_categorias_custodio(nombre, icono, color),
          subcategoria:ticket_subcategorias_custodio(nombre)
        `)
        .eq('custodio_telefono', custodianPhone)
        .eq('tipo_ticket', 'custodio')
        .order('created_at', { ascending: false });

      if (error) {
        // Handle RLS permission errors gracefully
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('RLS permission issue for tickets, user may not have phone linked:', error);
          setTickets([]);
          setStats({
            total: 0,
            abiertos: 0,
            en_progreso: 0,
            resueltos: 0,
            cerrados: 0,
            sla_vencidos: 0,
            resueltos_sin_calificar: 0
          });
          return;
        }
        throw error;
      }

      const formattedTickets: CustodianTicket[] = (data || []).map(ticket => ({
        ...ticket,
        categoria: ticket.categoria,
        subcategoria: ticket.subcategoria
      }));

      setTickets(formattedTickets);

      // Calculate stats
      const now = new Date();
      const newStats: CustodianTicketStats = {
        total: formattedTickets.length,
        abiertos: formattedTickets.filter(t => t.status === 'abierto').length,
        en_progreso: formattedTickets.filter(t => t.status === 'en_progreso').length,
        resueltos: formattedTickets.filter(t => t.status === 'resuelto').length,
        cerrados: formattedTickets.filter(t => t.status === 'cerrado').length,
        sla_vencidos: formattedTickets.filter(t => 
          t.fecha_sla_resolucion && 
          new Date(t.fecha_sla_resolucion) < now &&
          !['resuelto', 'cerrado'].includes(t.status)
        ).length,
        resueltos_sin_calificar: formattedTickets.filter(t => 
          t.status === 'resuelto' && t.calificacion_csat === null
        ).length
      };
      setStats(newStats);

    } catch (error) {
      console.error('Error loading custodian tickets:', error);
      // Set empty state instead of leaving stale data
      setTickets([]);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los tickets. Por favor, intenta de nuevo.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [custodianPhone, toast]);

  const createTicket = async (ticketData: CreateTicketData, evidencias?: File[], onUploadProgress?: (current: number, total: number) => void) => {
    if (!custodianPhone) {
      toast({
        title: 'Error',
        description: 'No se pudo identificar al custodio',
        variant: 'destructive'
      });
      return null;
    }

    try {
      // Generate ticket number
      const ticketNumber = `CUS-${Date.now().toString(36).toUpperCase()}`;
      
      // Upload evidencias if any
      let evidenciaUrls: string[] = [];
      if (evidencias && evidencias.length > 0) {
        for (let i = 0; i < evidencias.length; i++) {
          const file = evidencias[i];
          
          // Report progress via callback
          onUploadProgress?.(i + 1, evidencias.length);
          
          // Compress image files using Canvas API (standard: 1920x1080, 0.7 quality, ~400KB)
          let fileToUpload: File | Blob = file;
          if (file.type.startsWith('image/') && file.type !== 'image/gif') {
            try {
              fileToUpload = await compressImage(file);
            } catch (compressErr) {
              console.warn('Compression failed, using original:', compressErr);
            }
          }
          
          // Sanitizar nombre de archivo para evitar problemas con caracteres especiales
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${ticketNumber}/${Date.now()}-${sanitizedName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ticket-evidencias')
            .upload(fileName, fileToUpload, {
              contentType: file.type || 'image/jpeg'
            });
          
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast({
              title: 'Advertencia',
              description: `No se pudo subir: ${file.name}`,
              variant: 'destructive'
            });
            continue;
          }
          
          // Upload succeeded — generate public URL directly
          const { data: urlData } = supabase.storage
            .from('ticket-evidencias')
            .getPublicUrl(uploadData.path);
          
          evidenciaUrls.push(urlData.publicUrl);
        }
      }

      // Auto-resolve custodio_id by normalized phone
      let custodioId: string | null = null;
      const normalized = normalizePhone(custodianPhone);
      if (normalized) {
        const { data: custodioData } = await supabase
          .from('custodios_operativos')
          .select('id')
          .or(`telefono.eq.${normalized},telefono.eq.${custodianPhone}`)
          .maybeSingle();
        custodioId = custodioData?.id || null;
      }

      // Resolve customer_name from authenticated user's profile
      let customerName: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', user.id)
            .maybeSingle();
          customerName = profileData?.display_name || user.email?.split('@')[0] || null;
        }
      } catch (e) {
        console.warn('Could not resolve customer name:', e);
      }

      // Default assignee: Daniela Castañeda (coordinador_operaciones / planeación)
      const DEFAULT_TICKET_ASSIGNEE = 'df3b4dfc-c80c-45d0-8290-5d40341ab2ca';

      const { data, error } = await supabase
        .from('tickets')
        .insert({
          ticket_number: ticketNumber,
          subject: ticketData.subject,
          description: ticketData.description,
          status: 'abierto',
          priority: ticketData.priority || 'media',
          tipo_ticket: 'custodio',
          custodio_telefono: custodianPhone,
          custodio_id: custodioId,
          customer_name: customerName,
          assigned_to: DEFAULT_TICKET_ASSIGNEE,
          categoria_custodio_id: ticketData.categoria_custodio_id,
          subcategoria_custodio_id: ticketData.subcategoria_custodio_id,
          servicio_id: ticketData.servicio_id,
          monto_reclamado: ticketData.monto_reclamado,
          evidencia_urls: evidenciaUrls.length > 0 ? evidenciaUrls : null
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Ticket creado',
        description: `Tu ticket ${ticketNumber} ha sido creado exitosamente`
      });

      // Reload tickets and return data BEFORE attempting WhatsApp notification
      await loadTickets();

      // WhatsApp notification disabled — template 'ticket_creado' not configured in Meta Business Manager

      return data;

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el ticket',
        variant: 'destructive'
      });
      return null;
    }
  };

  const getTicketResponses = async (ticketId: string): Promise<TicketRespuesta[]> => {
    try {
      const { data, error } = await supabase
        .from('ticket_respuestas')
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('es_interno', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading ticket responses:', error);
      return [];
    }
  };

  const addResponse = async (ticketId: string, mensaje: string, adjuntos?: File[]) => {
    try {
      // Upload adjuntos if any
      let adjuntosUrls: string[] = [];
      if (adjuntos && adjuntos.length > 0) {
        for (const file of adjuntos) {
          // Sanitizar nombre de archivo
          const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const fileName = `${ticketId}/${Date.now()}-${sanitizedName}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ticket-evidencias')
            .upload(fileName, file, {
              contentType: file.type || 'image/jpeg'
            });
          
          if (uploadError) {
            console.error('Error uploading file:', uploadError);
            toast({
              title: 'Advertencia',
              description: `No se pudo subir: ${file.name}`,
              variant: 'destructive'
            });
            continue;
          }
          
          // Upload succeeded — generate public URL directly
          const { data: urlData } = supabase.storage
            .from('ticket-evidencias')
            .getPublicUrl(uploadData.path);
          
          adjuntosUrls.push(urlData.publicUrl);
        }
      }

      const { data: userData } = await supabase.auth.getUser();
      
      // Resolve custodian name from custodios_operativos by phone
      let custodioNombre = 'Custodio';
      if (custodianPhone) {
        const normalized = normalizePhone(custodianPhone);
        const { data: custodioData } = await supabase
          .from('custodios_operativos')
          .select('nombre')
          .or(`telefono.eq.${normalized},telefono.eq.${custodianPhone}`)
          .maybeSingle();
        if (custodioData?.nombre) {
          custodioNombre = custodioData.nombre;
        }
      }
      
      const { error } = await supabase
        .from('ticket_respuestas')
        .insert({
          ticket_id: ticketId,
          autor_id: userData.user?.id || '00000000-0000-0000-0000-000000000000',
          autor_tipo: 'custodio',
          autor_nombre: custodioNombre,
          mensaje,
          adjuntos_urls: adjuntosUrls.length > 0 ? adjuntosUrls : null,
          es_resolucion: false,
          es_interno: false
        });

      if (error) throw error;

      toast({
        title: 'Respuesta enviada',
        description: 'Tu mensaje ha sido enviado'
      });

      return true;
    } catch (error) {
      console.error('Error adding response:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la respuesta',
        variant: 'destructive'
      });
      return false;
    }
  };

  const getTicketById = (ticketId: string) => {
    return tickets.find(t => t.id === ticketId);
  };

  const getOpenTickets = () => {
    return tickets.filter(t => ['abierto', 'en_progreso'].includes(t.status));
  };

  // CSAT Functions
  const getRecentlyResolvedTickets = (hoursAgo: number = 48): CustodianTicket[] => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursAgo);
    
    return tickets.filter(t => 
      t.status === 'resuelto' &&
      t.calificacion_csat === null &&
      new Date(t.updated_at) >= cutoffDate
    );
  };

  const getUnratedResolvedTickets = (): CustodianTicket[] => {
    return tickets.filter(t => 
      t.status === 'resuelto' && 
      t.calificacion_csat === null
    );
  };

  const markTicketAsSeen = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ csat_visto_at: new Date().toISOString() })
        .eq('id', ticketId);
      
      if (error) throw error;
      await loadTickets();
    } catch (error) {
      console.error('Error marking ticket as seen:', error);
    }
  };

  const submitCSATRating = async (
    ticketId: string, 
    rating: number, 
    resolved: boolean, 
    comment?: string
  ) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          calificacion_csat: rating,
          comentario_csat: comment || (resolved ? null : 'Problema no resuelto completamente'),
          csat_visto_at: new Date().toISOString()
        })
        .eq('id', ticketId);
      
      if (error) throw error;
      
      toast({
        title: '¡Gracias!',
        description: 'Tu calificación ha sido registrada'
      });
      
      await loadTickets();
    } catch (error) {
      console.error('Error submitting CSAT:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar la calificación',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const rateResponse = async (respuestaId: string, ticketId: string, helpful: boolean) => {
    if (!custodianPhone) return;
    
    try {
      const { error } = await supabase
        .from('ticket_respuesta_ratings')
        .upsert({
          respuesta_id: respuestaId,
          ticket_id: ticketId,
          custodio_telefono: custodianPhone,
          helpful
        }, {
          onConflict: 'respuesta_id,custodio_telefono'
        });
      
      if (error) throw error;
    } catch (error) {
      console.error('Error rating response:', error);
      toast({
        title: 'Error',
        description: 'No se pudo guardar tu calificación',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const getResponseRatings = async (ticketId: string): Promise<Map<string, boolean>> => {
    if (!custodianPhone) return new Map();
    
    try {
      const { data, error } = await supabase
        .from('ticket_respuesta_ratings')
        .select('respuesta_id, helpful')
        .eq('ticket_id', ticketId)
        .eq('custodio_telefono', custodianPhone);
      
      if (error) throw error;
      
      const ratingsMap = new Map<string, boolean>();
      (data || []).forEach(r => {
        if (r.helpful !== null) {
          ratingsMap.set(r.respuesta_id, r.helpful);
        }
      });
      return ratingsMap;
    } catch (error) {
      console.error('Error loading response ratings:', error);
      return new Map();
    }
  };

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  return {
    tickets,
    stats,
    loading,
    createTicket,
    getTicketResponses,
    addResponse,
    getTicketById,
    getOpenTickets,
    refetch: loadTickets,
    // CSAT functions
    getRecentlyResolvedTickets,
    getUnratedResolvedTickets,
    markTicketAsSeen,
    submitCSATRating,
    rateResponse,
    getResponseRatings
  };
};
