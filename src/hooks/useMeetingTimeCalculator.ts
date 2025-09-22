import { useMemo } from 'react';

interface MeetingTimeCalculatorProps {
  appointmentTime?: string;
  appointmentDate?: string;
  preparationMinutes?: number;
}

export function useMeetingTimeCalculator({
  appointmentTime,
  appointmentDate,
  preparationMinutes = 90 // Default 1.5 hours
}: MeetingTimeCalculatorProps) {
  
  const calculateMeetingTime = useMemo(() => {
    if (!appointmentTime || !appointmentDate) {
      return null;
    }

    try {
      // Parse appointment date and time
      const appointmentDateTime = new Date(`${appointmentDate}T${appointmentTime}`);
      
      if (isNaN(appointmentDateTime.getTime())) {
        return null;
      }

      // Subtract preparation time
      const meetingDateTime = new Date(appointmentDateTime.getTime() - (preparationMinutes * 60 * 1000));
      
      // Format as HH:MM
      const hours = meetingDateTime.getHours().toString().padStart(2, '0');
      const minutes = meetingDateTime.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Error calculating meeting time:', error);
      return null;
    }
  }, [appointmentTime, appointmentDate, preparationMinutes]);

  const formatDisplayTime = (time24: string) => {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getTimeRecommendation = (appointmentTime: string, meetingTime: string) => {
    if (!appointmentTime || !meetingTime) return '';
    
    const apptHours = parseInt(appointmentTime.split(':')[0]);
    const meetHours = parseInt(meetingTime.split(':')[0]);
    
    if (meetHours < 6) {
      return 'Encuentro muy temprano - considera ajustar el horario';
    }
    
    if (meetHours > 22) {
      return 'Encuentro muy tarde - considera la seguridad nocturna';
    }
    
    const timeDiff = Math.abs((apptHours * 60 + parseInt(appointmentTime.split(':')[1])) - 
                              (meetHours * 60 + parseInt(meetingTime.split(':')[1])));
    
    if (timeDiff < 60) {
      return 'Tiempo de preparación puede ser insuficiente';
    }
    
    if (timeDiff > 180) {
      return 'Tiempo de espera prolongado - optimiza la coordinación';
    }
    
    return 'Horario recomendado para encuentro';
  };

  return {
    calculatedMeetingTime: calculateMeetingTime,
    formatDisplayTime,
    getTimeRecommendation
  };
}