
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS relevancia_score INTEGER;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS modus_operandi TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS firma_criminal TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS nivel_organizacion TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS vector_ataque TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS objetivo_especifico TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS indicadores_premeditacion TEXT[];
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS zona_tipo TEXT;
ALTER TABLE incidentes_rrss ADD COLUMN IF NOT EXISTS contexto_ambiental TEXT;
