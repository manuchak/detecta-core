-- Corrección SIERCP: Hacer columnas nullable para permitir evaluaciones de sistema
ALTER TABLE evaluaciones_psicometricas 
  ALTER COLUMN evaluador_id DROP NOT NULL,
  ALTER COLUMN candidato_id DROP NOT NULL;

-- Agregar política RLS para permitir INSERT anónimo desde evaluaciones SIERCP
CREATE POLICY "anon_insert_siercp_evaluation" ON evaluaciones_psicometricas
FOR INSERT TO anon
WITH CHECK (
  -- Solo permitir si existe una invitación válida y activa
  EXISTS (
    SELECT 1 FROM siercp_invitations si
    WHERE si.candidato_custodio_id = candidato_id
    AND si.status IN ('started', 'opened')
    AND si.expires_at > now()
  )
  OR candidato_id IS NULL -- Permitir también evaluaciones de calibración sin candidato
);