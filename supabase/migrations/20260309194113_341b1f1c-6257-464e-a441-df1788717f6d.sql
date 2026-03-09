
-- Create the comprobantes-gastos bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('comprobantes-gastos', 'comprobantes-gastos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users upload own receipts"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'comprobantes-gastos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public read receipts"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'comprobantes-gastos');
