-- Agregar días festivos faltantes diciembre 2025
INSERT INTO calendario_feriados_mx (fecha, nombre, tipo, factor_ajuste, impacto_observado_pct, notas, activo)
VALUES 
  -- Día de la Virgen de Guadalupe
  ('2025-12-12', 'Día de la Virgen de Guadalupe', 'religioso', 0.78, 22.00, 'Feriado religioso importante en México', true),
  
  -- Nochebuena  
  ('2025-12-24', 'Nochebuena', 'nacional', 0.30, 70.00, 'Día previo a Navidad - operación muy reducida', true),
  
  -- Fin de Año
  ('2025-12-31', 'Fin de Año', 'nacional', 0.25, 75.00, 'Último día del año - operación mínima', true)
ON CONFLICT (fecha) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  tipo = EXCLUDED.tipo,
  factor_ajuste = EXCLUDED.factor_ajuste,
  impacto_observado_pct = EXCLUDED.impacto_observado_pct,
  notas = EXCLUDED.notas,
  activo = EXCLUDED.activo;