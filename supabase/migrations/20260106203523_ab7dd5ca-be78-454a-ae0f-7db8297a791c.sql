-- Confirmar email de Guadalupe Ruedas para permitir login inmediato
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email = 'guadalupe.ruedas@detectasecurity.io'
  AND email_confirmed_at IS NULL;