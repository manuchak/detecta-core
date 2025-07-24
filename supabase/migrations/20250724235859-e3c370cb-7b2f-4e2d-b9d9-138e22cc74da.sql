-- Actualizar el constraint de call_outcome para incluir 'out_of_service'
-- Primero eliminar el constraint existente
ALTER TABLE manual_call_logs DROP CONSTRAINT IF EXISTS manual_call_logs_call_outcome_check;

-- Crear el nuevo constraint con el valor adicional
ALTER TABLE manual_call_logs ADD CONSTRAINT manual_call_logs_call_outcome_check 
CHECK (call_outcome IN (
  'successful',
  'reschedule_requested', 
  'no_answer',
  'busy',
  'voicemail',
  'wrong_number',
  'non_existent_number',
  'out_of_service',
  'call_failed'
));