-- Bulk fix: sync profiles.phone from custodios_operativos for 6 desynchronized custodians
UPDATE profiles SET phone = '7291689750', updated_at = now() WHERE LOWER(email) = 'albertosalas8008@gmail.com';
UPDATE profiles SET phone = '5544492696', updated_at = now() WHERE LOWER(email) = 'deivi_1017@hotmail.com';
UPDATE profiles SET phone = '9994473378', updated_at = now() WHERE LOWER(email) = 'dkmejia0338@gmail.com';
UPDATE profiles SET phone = '4772735777', updated_at = now() WHERE LOWER(email) = 'farole_ave@hotmail.com';
UPDATE profiles SET phone = '5584695612', updated_at = now() WHERE LOWER(email) = 'joelr1888@gmail.com';
UPDATE profiles SET phone = '5532341683', updated_at = now() WHERE LOWER(email) = 'lopez.angel2813@gmail.com';