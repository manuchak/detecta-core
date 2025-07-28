-- Agregar nueva tipificación de contacto: "Numero no disponible"
-- Esto se aplica a la tabla manual_call_logs donde se registran los resultados de las llamadas

-- No necesitamos modificar la estructura de la tabla ya que call_outcome es un campo de texto
-- Solo agregamos un comentario para documentar los valores válidos

COMMENT ON COLUMN manual_call_logs.call_outcome IS 'Resultado de la llamada. Valores válidos: successful, no_answer, busy, voicemail, wrong_number, non_existent_number, call_failed, reschedule_requested, numero_no_disponible';