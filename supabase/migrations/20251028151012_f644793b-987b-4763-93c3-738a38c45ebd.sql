-- ============================================
-- SEGURIDAD: Agregar search_path usando ALTER FUNCTION
-- Método alternativo más confiable
-- ============================================

-- Aplicar search_path a todas las funciones usando ALTER FUNCTION
ALTER FUNCTION public.audit_sensitive_access(text, text, uuid) SET search_path = public;
ALTER FUNCTION public.get_cohort_retention_matrix() SET search_path = public;
ALTER FUNCTION public.migrar_armados_historicos() SET search_path = public;
ALTER FUNCTION public.refresh_armados_operativos_disponibles() SET search_path = public;
ALTER FUNCTION public.refresh_custodios_disponibles_on_change() SET search_path = public;
ALTER FUNCTION public.update_armados_operativos_timestamp() SET search_path = public;
ALTER FUNCTION public.update_armados_updated_at() SET search_path = public;
ALTER FUNCTION public.update_custodios_operativos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_custodios_vehiculos_updated_at() SET search_path = public;
ALTER FUNCTION public.update_matriz_precios_timestamp() SET search_path = public;
ALTER FUNCTION public.update_pagos_proveedores_updated_at() SET search_path = public;
ALTER FUNCTION public.update_puntos_encuentro_timestamp() SET search_path = public;
ALTER FUNCTION public.update_timestamp() SET search_path = public;