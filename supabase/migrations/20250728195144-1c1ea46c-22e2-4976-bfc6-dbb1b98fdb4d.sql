-- Actualizar el CHECK constraint incluyendo todos los valores existentes más el nuevo
-- Primero eliminamos el constraint existente
ALTER TABLE manual_call_logs DROP CONSTRAINT IF EXISTS manual_call_logs_call_outcome_check;

-- Creamos el nuevo constraint con todos los valores incluyendo existentes y el nuevo
ALTER TABLE manual_call_logs 
ADD CONSTRAINT manual_call_logs_call_outcome_check 
CHECK (call_outcome IN (
    'successful', 
    'no_answer', 
    'busy', 
    'voicemail', 
    'wrong_number', 
    'non_existent_number', 
    'call_failed', 
    'reschedule_requested',
    'out_of_service',
    'numero_no_disponible'
));