
-- Parte 1A: Nuevas columnas en candidatos_custodios
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS numero_licencia TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS licencia_expedida_por TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS marca_vehiculo TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS modelo_vehiculo TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS numero_serie TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS clave_vehicular TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS verificacion_vehicular TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS numero_motor TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS placas_vehiculo TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS color_vehiculo TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS tarjeta_circulacion TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS numero_factura TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS fecha_factura TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS factura_emitida_a TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS numero_poliza TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS aseguradora TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS fecha_poliza TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS poliza_emitida_a TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS tipo_poliza TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS banco TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS numero_cuenta TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS clabe TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS beneficiario TEXT;
ALTER TABLE candidatos_custodios ADD COLUMN IF NOT EXISTS nombre_propietario_vehiculo TEXT;

-- Parte 1B: Nueva columna en contratos_candidato
ALTER TABLE contratos_candidato ADD COLUMN IF NOT EXISTS es_documento_fisico BOOLEAN DEFAULT false;

-- Parte 1C: Storage bucket para contratos escaneados
INSERT INTO storage.buckets (id, name, public)
VALUES ('contratos-escaneados', 'contratos-escaneados', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for contratos-escaneados bucket
CREATE POLICY "Authenticated users can upload contratos escaneados"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contratos-escaneados');

CREATE POLICY "Authenticated users can read contratos escaneados"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'contratos-escaneados');

CREATE POLICY "Authenticated users can delete contratos escaneados"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contratos-escaneados');
