
-- Reconciliación: Insertar clientes faltantes de servicios_custodia en pc_clientes
INSERT INTO public.pc_clientes (nombre, contacto_nombre, contacto_tel, activo)
SELECT DISTINCT sc.nombre_cliente, 'Por configurar', 'Por configurar', true
FROM servicios_custodia sc
WHERE sc.estado = 'Finalizado'
  AND sc.fecha_hora_cita >= NOW() - INTERVAL '60 days'
  AND sc.nombre_cliente IS NOT NULL
  AND sc.nombre_cliente != ''
  AND LOWER(sc.nombre_cliente) NOT IN (
    SELECT LOWER(nombre) FROM pc_clientes
  )
GROUP BY sc.nombre_cliente
HAVING COUNT(*) >= 4
ORDER BY sc.nombre_cliente;
