-- One-time fix for Felix Emmanuel Reyes Salas phone desync
UPDATE profiles
SET phone = '5530473702',
    updated_at = now()
WHERE id = 'f3ad13b5-ed08-4f8a-9458-98fb129811b0';