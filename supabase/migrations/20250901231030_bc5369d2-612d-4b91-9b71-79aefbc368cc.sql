-- Agregar foreign keys faltantes para el sistema de comodatos
-- Estas relaciones son necesarias para que funcionen las consultas JOIN

-- Foreign key para productos_inventario
ALTER TABLE public.comodatos_gps 
ADD CONSTRAINT fk_comodatos_gps_producto 
FOREIGN KEY (producto_gps_id) REFERENCES public.productos_inventario(id);

-- Foreign key para pc_custodios (opcional)
ALTER TABLE public.comodatos_gps 
ADD CONSTRAINT fk_comodatos_gps_pc_custodio 
FOREIGN KEY (pc_custodio_id) REFERENCES public.pc_custodios(id);

-- Foreign key para usuario asignado
ALTER TABLE public.comodatos_gps 
ADD CONSTRAINT fk_comodatos_gps_asignado_por 
FOREIGN KEY (asignado_por) REFERENCES public.profiles(id);

-- Foreign key para usuario devuelto (opcional)
ALTER TABLE public.comodatos_gps 
ADD CONSTRAINT fk_comodatos_gps_devuelto_por 
FOREIGN KEY (devuelto_por) REFERENCES public.profiles(id);

-- Foreign key para movimientos_comodato
ALTER TABLE public.movimientos_comodato 
ADD CONSTRAINT fk_movimientos_comodato_usuario 
FOREIGN KEY (usuario_id) REFERENCES public.profiles(id);