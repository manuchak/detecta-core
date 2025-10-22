-- Actualizar versión v1.2.0 a released
UPDATE public.system_versions
SET 
  status = 'released',
  release_date = '2025-10-22'
WHERE version_number = '1.2.0';

-- Crear versión v1.3.0 "Import Wizard Enhancement"
INSERT INTO public.system_versions (
  version_number,
  version_name,
  version_type,
  status,
  release_date,
  description,
  release_notes
) VALUES (
  '1.3.0',
  'Import Wizard Enhancement',
  'minor',
  'testing',
  '2025-10-30',
  'Mejoras críticas al wizard de importación masiva de servicios de custodia, incluyendo corrección de bug de validación RPC, manejo inteligente de errores, y mejoras de UX.',
  '# Release Notes - v1.3.0 "Import Wizard Enhancement"

## 🎯 Resumen Ejecutivo
Esta versión resuelve problemas críticos en el proceso de importación masiva de servicios, mejorando significativamente la confiabilidad y experiencia de usuario al actualizar grandes volúmenes de datos (>2,500 registros).

## ✨ Destacados Principales
- ✅ Corregido error PGRST203 que bloqueaba importaciones masivas
- ✅ Implementado manejo inteligente de errores en modo Actualizar
- ✅ Mejorada claridad de mensajes de error y validación
- ✅ Agregado sistema de trazas para debugging

## 🔧 Cambios Técnicos Detallados
Ver sección de System Changes para información completa de cada cambio.

## 📋 Requisitos de Testing
- Importación masiva (>2,500 registros) en modo UPDATE
- Validación de errores de conexión/timeout
- Verificación de mensajes de error en UI
- Pruebas con diferentes tipos de archivos Excel

## 🚀 Instrucciones de Despliegue
1. Verificar que RPC validate_multiple_service_ids esté actualizado
2. Realizar backup de base de datos
3. Desplegar cambios de frontend
4. Ejecutar suite de pruebas de regresión
5. Monitorear logs durante primeras 24 horas

## 📞 Contacto de Soporte
Para reportar issues relacionados con esta versión, contactar al equipo de desarrollo.'
);

-- Obtener el ID de la versión recién creada
DO $$
DECLARE
  v_version_id UUID;
BEGIN
  SELECT id INTO v_version_id FROM public.system_versions WHERE version_number = '1.3.0';

  -- CHANGE #1: Desambiguación de RPC para Validación Masiva
  INSERT INTO public.system_changes (
    version_id,
    change_type,
    module,
    title,
    description,
    impact_level,
    technical_details,
    affected_components,
    rollback_plan,
    testing_notes
  ) VALUES (
    v_version_id,
    'bugfix',
    'Mantenimiento - Wizard Importación',
    'Corregido error PGRST203 en validación de IDs de servicio',
    'Resuelto conflicto de ambigüedad en llamada a validate_multiple_service_ids mediante parámetro explícito p_is_test: false',
    'high',
    E'Archivo: src/hooks/useServiceIdValidation.ts (línea 140-144)\n\nError Original: PGRST203 "Could not choose the best candidate function"\n\nCausa Raíz: Dos funciones RPC con firmas similares en Supabase\n\nSolución: Agregado parámetro p_is_test: false para forzar selección de función correcta\n\nManejo de Error: En modo UPDATE permite continuar con warning',
    ARRAY['useServiceIdValidation.ts', 'ImportWizardEnhanced.tsx', 'RPC validate_multiple_service_ids'],
    'Revertir a validación por lotes más pequeños (<500 IDs). Modificar useServiceIdValidation.ts línea 140 para usar batchSize: 500',
    E'✅ Validar con 2,928 IDs en modo UPDATE\n✅ Verificar que no bloquea operaciones válidas\n✅ Confirmar que modo CREATE sigue bloqueando errores\n✅ Probar con archivos >3,000 registros'
  );

  -- CHANGE #2: Manejo Inteligente de Errores en Modo UPDATE
  INSERT INTO public.system_changes (
    version_id,
    change_type,
    module,
    title,
    description,
    impact_level,
    technical_details,
    affected_components,
    rollback_plan,
    testing_notes
  ) VALUES (
    v_version_id,
    'enhancement',
    'Mantenimiento - Wizard Importación',
    'Mejorado manejo de errores no bloqueantes en modo Actualizar',
    'Implementado sistema de clasificación de errores que permite continuar operaciones de actualización ante errores de validación recuperables',
    'medium',
    E'Archivo: src/hooks/useServiceIdValidation.ts (línea 172-186)\n\nErrores Manejados:\n* PGRST203 (ambigüedad de función)\n* 57014 (timeout de query)\n* 42501 (permisos insuficientes)\n\nComportamiento:\n* CREATE mode: Bloquea operación\n* UPDATE mode: Continúa con warning\n* Toast notifications para informar al usuario',
    ARRAY['useServiceIdValidation.ts', 'ImportWizardEnhanced.tsx'],
    'Revertir a comportamiento anterior (bloquear todo). Remover condicional de modo UPDATE en handleError',
    E'✅ Simular timeout con query lenta\n✅ Verificar permisos insuficientes\n✅ Confirmar toasts informativos\n✅ Validar que CREATE mode sigue bloqueando'
  );

  -- CHANGE #3: Corrección de Títulos de Error en UI
  INSERT INTO public.system_changes (
    version_id,
    change_type,
    module,
    title,
    description,
    impact_level,
    technical_details,
    affected_components,
    rollback_plan,
    testing_notes
  ) VALUES (
    v_version_id,
    'bugfix',
    'Mantenimiento - Wizard Importación',
    'Corregido etiquetado incorrecto de errores de validación',
    'El wizard mostraba "Servicios finalizados detectados" cuando el error real era ambigüedad de RPC. Ahora muestra título genérico con detalles específicos',
    'low',
    E'Archivo: ImportWizardEnhanced.tsx (línea 301-314)\n\nProblema: Lógica de título por defecto incorrecta\n\nSolución: Detectar tipo de error antes de asignar título\n\nNuevos títulos:\n* "Error durante la validación" (genérico)\n* Incluye detección de "Error de conexión" y "ambigüedad"',
    ARRAY['ImportWizardEnhanced.tsx'],
    'Revertir a títulos anteriores en ErrorDisplay component',
    E'✅ Forzar diferentes tipos de error\n✅ Verificar que título coincide con error real\n✅ Validar UX con usuarios finales'
  );

  -- CHANGE #4: Aclaración de Validación Preliminar
  INSERT INTO public.system_changes (
    version_id,
    change_type,
    module,
    title,
    description,
    impact_level,
    technical_details,
    affected_components,
    rollback_plan,
    testing_notes
  ) VALUES (
    v_version_id,
    'enhancement',
    'Mantenimiento - Wizard Importación',
    'Mejorada comunicación de validación rápida vs completa',
    'Actualizado texto explicativo para evitar confusión entre validación de muestra (20 registros) y validación completa (todos los IDs)',
    'low',
    E'Archivo: ValidationStep.tsx (línea 29-31)\n\nNuevo texto: "Validación rápida preliminar (muestra de 20 registros). Puede diferir de la validación completa."\n\nImpacto: Solo UX, sin cambios de lógica',
    ARRAY['ValidationStep.tsx'],
    'Revertir texto anterior en componente',
    E'✅ Validar claridad del mensaje con usuarios no técnicos\n✅ Confirmar que no genera confusión'
  );

  -- CHANGE #5: Corrección de Dependencias en useCallback
  INSERT INTO public.system_changes (
    version_id,
    change_type,
    module,
    title,
    description,
    impact_level,
    technical_details,
    affected_components,
    rollback_plan,
    testing_notes
  ) VALUES (
    v_version_id,
    'bugfix',
    'Mantenimiento - Wizard Importación',
    'Corregido bug de modo de importación no actualizado',
    'El hook handleStartImport no incluía importMode en sus dependencias, causando que siempre usara el modo inicial (auto) en lugar del seleccionado por el usuario',
    'critical',
    E'Archivo: ImportWizardEnhanced.tsx (línea 394)\n\nProblema: Closure capturaba valor inicial de importMode\n\nSolución: Agregadas dependencias faltantes:\n* importMode\n* isUpdateOnlyMode\n* isVisible\n* resetTabTracking\n* validateMultipleIds\n* onComplete\n\nAgregada salvaguarda de forzado de modo UPDATE',
    ARRAY['ImportWizardEnhanced.tsx'],
    'Revertir a lista de dependencias anterior: [state.parsedData, state.mapping]',
    E'✅ Cambiar modo de CREATE a UPDATE y verificar que se respeta\n✅ Validar logs de consola muestran modo correcto\n✅ Confirmar toast muestra modo seleccionado\n✅ Probar con múltiples cambios de modo'
  );

  -- CHANGE #6: Logging y Debugging Mejorado
  INSERT INTO public.system_changes (
    version_id,
    change_type,
    module,
    title,
    description,
    impact_level,
    technical_details,
    affected_components,
    rollback_plan,
    testing_notes
  ) VALUES (
    v_version_id,
    'enhancement',
    'Mantenimiento - Wizard Importación',
    'Agregado sistema de trazas para debugging de importaciones',
    'Implementado logging consistente con emojis y toast notifications para rastrear el flujo de importación',
    'low',
    E'Archivo: ImportWizardEnhanced.tsx (múltiples líneas)\n\nLogs agregados:\n* 🔍 "Validating service IDs..." con detalles de modo\n* 🎯 "Import mode selected: update"\n* Toast.info con modo y cantidad de IDs\n\nFormato consistente para facilitar búsqueda en consola',
    ARRAY['ImportWizardEnhanced.tsx', 'useServiceIdValidation.ts'],
    'Remover console.logs (mantener toasts para UX)',
    E'✅ Ejecutar importación completa y revisar logs\n✅ Verificar que no hay logs duplicados\n✅ Confirmar que toasts no son intrusivos'
  );
END $$;