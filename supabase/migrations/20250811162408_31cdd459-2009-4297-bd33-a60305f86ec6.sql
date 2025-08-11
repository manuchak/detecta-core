-- Actualización masiva de estados en servicios_custodia
-- Cambiar todos los estados a 'Finalizado' excepto 'Cancelado' y 'Programado'

UPDATE servicios_custodia 
SET estado = 'Finalizado' 
WHERE estado NOT IN ('Cancelado', 'Programado') 
  AND estado IS NOT NULL;