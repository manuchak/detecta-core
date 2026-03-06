-- Add unique constraint for upsert on contactos
ALTER TABLE pc_clientes_contactos 
ADD CONSTRAINT uq_cliente_email UNIQUE (cliente_id, email);

-- Add columns for differentiated estadias on pc_clientes directly
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_clientes' AND column_name = 'horas_cortesia_local') THEN
    ALTER TABLE pc_clientes ADD COLUMN horas_cortesia_local numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_clientes' AND column_name = 'horas_cortesia_foraneo') THEN
    ALTER TABLE pc_clientes ADD COLUMN horas_cortesia_foraneo numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_clientes' AND column_name = 'tarifa_sin_arma') THEN
    ALTER TABLE pc_clientes ADD COLUMN tarifa_sin_arma numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pc_clientes' AND column_name = 'tarifa_con_arma') THEN
    ALTER TABLE pc_clientes ADD COLUMN tarifa_con_arma numeric;
  END IF;
END $$;