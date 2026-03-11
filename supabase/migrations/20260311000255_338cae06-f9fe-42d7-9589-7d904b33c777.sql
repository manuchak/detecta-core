-- Release all currently stuck active pauses
UPDATE bitacora_pausas_monitorista
SET estado = 'finalizada', fin_real = now()
WHERE estado = 'activa';