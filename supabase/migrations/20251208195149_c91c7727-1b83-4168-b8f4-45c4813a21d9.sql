-- Corregir factores de feriados basados en datos históricos reales 2023-2024

-- Navidad: Factor actual 0.12 → Factor real ~0.43 (menos impacto del asumido)
UPDATE calendario_feriados_mx 
SET factor_ajuste = 0.43, 
    impacto_observado_pct = 57,
    notas = 'Corregido 2025-12-08 basado en datos históricos 2023-2024. Factor anterior 0.12 sobreestimaba impacto.'
WHERE nombre ILIKE '%Navidad%' AND EXTRACT(MONTH FROM fecha) = 12;

-- Agregar Nochebuena (24 dic) como feriado explícito si no existe
INSERT INTO calendario_feriados_mx (
  fecha, nombre, factor_ajuste, impacto_observado_pct, tipo, activo, notas
) VALUES 
  ('2025-12-24', 'Nochebuena', 0.30, 70, 'religioso', true, 'Agregado 2025-12-08 basado en datos reales 2023-2024')
ON CONFLICT (fecha) DO UPDATE SET
  factor_ajuste = 0.30,
  impacto_observado_pct = 70,
  notas = 'Actualizado 2025-12-08 basado en datos reales 2023-2024';

-- Fin de Año (31 dic): Confirmar factor
INSERT INTO calendario_feriados_mx (
  fecha, nombre, factor_ajuste, impacto_observado_pct, tipo, activo, notas
) VALUES 
  ('2025-12-31', 'Fin de Año', 0.20, 80, 'nacional', true, 'Actualizado 2025-12-08 basado en datos reales 2023-2024')
ON CONFLICT (fecha) DO UPDATE SET
  factor_ajuste = 0.20,
  impacto_observado_pct = 80,
  notas = 'Actualizado 2025-12-08 basado en datos reales 2023-2024';

-- Virgen de Guadalupe: Factor actual 0.78 → Factor real ~1.0 (sin impacto negativo observado)
UPDATE calendario_feriados_mx 
SET factor_ajuste = 1.0, 
    impacto_observado_pct = 0,
    notas = 'Corregido 2025-12-08: Sin impacto negativo observado en 2023-2024, operación normal'
WHERE nombre ILIKE '%Virgen%Guadalupe%' OR nombre ILIKE '%Guadalupe%';

-- Año Nuevo 2026
INSERT INTO calendario_feriados_mx (
  fecha, nombre, factor_ajuste, impacto_observado_pct, tipo, activo, notas
) VALUES 
  ('2026-01-01', 'Año Nuevo', 0.17, 83, 'nacional', true, 'Basado en datos reales 2023-2024')
ON CONFLICT (fecha) DO UPDATE SET
  factor_ajuste = 0.17,
  impacto_observado_pct = 83,
  notas = 'Actualizado 2025-12-08 basado en datos reales 2023-2024';