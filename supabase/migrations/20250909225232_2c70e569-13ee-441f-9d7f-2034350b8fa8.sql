-- Create a unique constraint on cliente_nombre and destino_texto combination
-- This will allow the ON CONFLICT clause to work properly
ALTER TABLE public.matriz_precios_rutas 
ADD CONSTRAINT matriz_precios_rutas_cliente_destino_unique 
UNIQUE (cliente_nombre, destino_texto);