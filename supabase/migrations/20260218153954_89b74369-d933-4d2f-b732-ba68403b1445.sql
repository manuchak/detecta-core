-- Fix datos: Vincular email del custodio operativo Juan Pablo Rivera
-- para que los triggers de sincronización de teléfono puedan funcionar
UPDATE custodios_operativos 
SET email = 'juanpabloriveragutierrez351@gmail.com'
WHERE id = '9902884a-3351-4260-9329-b2f058c053a1'
  AND email IS NULL;