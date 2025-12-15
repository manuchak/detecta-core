import { useMemo } from 'react';
import { differenceInMinutes, isPast, addMinutes } from 'date-fns';

export type SLAStatus = 'en_tiempo' | 'proximo_vencer' | 'vencido' | 'cumplido' | 'sin_sla';

export interface SLAInfo {
  // Response SLA
  tiempoRestanteRespuesta: number | null; // minutes remaining
  porcentajeConsumidoRespuesta: number;
  estadoRespuesta: SLAStatus;
  
  // Resolution SLA
  tiempoRestanteResolucion: number | null; // minutes remaining
  porcentajeConsumidoResolucion: number;
  estadoResolucion: SLAStatus;
  
  // Combined status (worst of both)
  estadoGeneral: SLAStatus;
  
  // For sorting
  urgencyScore: number; // Higher = more urgent
}

export interface TicketWithSLA {
  id: string;
  status: string;
  created_at: string;
  fecha_sla_respuesta: string | null;
  fecha_sla_resolucion: string | null;
  primera_respuesta_at: string | null;
  resuelto_at: string | null;
}

const calculateSLAStatus = (
  deadline: Date | null,
  completedAt: Date | null,
  createdAt: Date,
  status: string
): { status: SLAStatus; remaining: number | null; percentage: number } => {
  // If no SLA configured
  if (!deadline) {
    return { status: 'sin_sla', remaining: null, percentage: 0 };
  }
  
  // If already completed
  if (completedAt) {
    const wasOnTime = completedAt <= deadline;
    return { 
      status: wasOnTime ? 'cumplido' : 'vencido', 
      remaining: null, 
      percentage: 100 
    };
  }
  
  // If ticket is closed/resolved, consider it completed
  if (['resuelto', 'cerrado'].includes(status)) {
    return { status: 'cumplido', remaining: null, percentage: 100 };
  }
  
  const now = new Date();
  const remaining = differenceInMinutes(deadline, now);
  const total = differenceInMinutes(deadline, createdAt);
  const elapsed = total - remaining;
  const percentage = total > 0 ? Math.min(100, (elapsed / total) * 100) : 100;
  
  // Determine status
  if (isPast(deadline)) {
    return { status: 'vencido', remaining, percentage: 100 };
  }
  
  // Less than 25% time remaining = próximo a vencer
  if (percentage >= 75) {
    return { status: 'proximo_vencer', remaining, percentage };
  }
  
  return { status: 'en_tiempo', remaining, percentage };
};

const getUrgencyScore = (status: SLAStatus, remaining: number | null): number => {
  // Higher score = more urgent
  switch (status) {
    case 'vencido':
      return 1000 + Math.abs(remaining || 0); // Vencidos first, ordered by how late
    case 'proximo_vencer':
      return 500 + (remaining ? 500 - remaining : 0); // Next, ordered by time left
    case 'en_tiempo':
      return 100 + (remaining ? 100 - Math.min(remaining / 10, 100) : 0);
    case 'cumplido':
      return 0;
    case 'sin_sla':
      return 50;
    default:
      return 0;
  }
};

export const calculateTicketSLA = (ticket: TicketWithSLA): SLAInfo => {
  const createdAt = new Date(ticket.created_at);
  
  const respuestaResult = calculateSLAStatus(
    ticket.fecha_sla_respuesta ? new Date(ticket.fecha_sla_respuesta) : null,
    ticket.primera_respuesta_at ? new Date(ticket.primera_respuesta_at) : null,
    createdAt,
    ticket.status
  );
  
  const resolucionResult = calculateSLAStatus(
    ticket.fecha_sla_resolucion ? new Date(ticket.fecha_sla_resolucion) : null,
    ticket.resuelto_at ? new Date(ticket.resuelto_at) : null,
    createdAt,
    ticket.status
  );
  
  // Determine general status (worst of both)
  const statusPriority: Record<SLAStatus, number> = {
    'vencido': 4,
    'proximo_vencer': 3,
    'en_tiempo': 2,
    'sin_sla': 1,
    'cumplido': 0
  };
  
  const estadoGeneral = statusPriority[respuestaResult.status] >= statusPriority[resolucionResult.status]
    ? respuestaResult.status
    : resolucionResult.status;
  
  // Calculate urgency score based on worst status
  const urgencyScore = Math.max(
    getUrgencyScore(respuestaResult.status, respuestaResult.remaining),
    getUrgencyScore(resolucionResult.status, resolucionResult.remaining)
  );
  
  return {
    tiempoRestanteRespuesta: respuestaResult.remaining,
    porcentajeConsumidoRespuesta: respuestaResult.percentage,
    estadoRespuesta: respuestaResult.status,
    
    tiempoRestanteResolucion: resolucionResult.remaining,
    porcentajeConsumidoResolucion: resolucionResult.percentage,
    estadoResolucion: resolucionResult.status,
    
    estadoGeneral,
    urgencyScore
  };
};

export const useTicketSLA = (ticket: TicketWithSLA | null) => {
  return useMemo(() => {
    if (!ticket) return null;
    return calculateTicketSLA(ticket);
  }, [
    ticket?.id,
    ticket?.status,
    ticket?.fecha_sla_respuesta,
    ticket?.fecha_sla_resolucion,
    ticket?.primera_respuesta_at,
    ticket?.resuelto_at
  ]);
};

// Format remaining time for display
export const formatRemainingTime = (minutes: number | null): string => {
  if (minutes === null) return '-';
  
  const absMinutes = Math.abs(minutes);
  const isOverdue = minutes < 0;
  
  if (absMinutes < 60) {
    return `${isOverdue ? '-' : ''}${absMinutes}m`;
  }
  
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  
  if (hours < 24) {
    return `${isOverdue ? '-' : ''}${hours}h ${mins}m`;
  }
  
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${isOverdue ? '-' : ''}${days}d ${remainingHours}h`;
};
