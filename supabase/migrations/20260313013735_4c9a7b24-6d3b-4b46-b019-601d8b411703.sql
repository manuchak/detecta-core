-- Data update: Set Luis Gilberto González Jasso as available
UPDATE custodios_operativos 
SET disponibilidad = 'disponible', updated_at = now() 
WHERE id = '9ffa94dd-1de2-42b0-b593-921959b0f428';