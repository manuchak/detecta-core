-- Actualizar el CHECK constraint para incluir la nueva tipificación "numero_no_disponible"
-- Primero eliminamos el constraint existente
ALTER TABLE manual_call_logs DROP CONSTRAINT IF EXISTS manual_call_logs_call_outcome_check;

-- Creamos el nuevo constraint con todos los valores incluyendo el nuevo
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
    'numero_no_disponible'
));