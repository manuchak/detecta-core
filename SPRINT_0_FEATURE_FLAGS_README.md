# 🎚️ Sprint 0: Sistema de Feature Flags para Liberación Flexible

## ✅ Estado: IMPLEMENTADO

### 📋 Componentes Creados

#### 1. **Base de Datos**
- ✅ Tabla `workflow_validation_config` con todas las fases
- ✅ Función `debe_validar_fase(fase VARCHAR)` 
- ✅ Función RPC `liberar_custodio_a_planeacion` modificada con modo flexible
- ✅ Políticas RLS configuradas

#### 2. **Frontend**
- ✅ Componente `LiberacionWarningsDialog.tsx` para mostrar advertencias
- ✅ Hook `useCustodioLiberacion.ts` actualizado con soporte de warnings
- ✅ Modal `LiberacionChecklistModal.tsx` con flujo de warnings

---

## 🎯 Modo de Operación Actual

### **MODO FLEXIBLE (DEFAULT)**
- ✅ Supply puede liberar **SIN restricciones**
- ⚠️ Se muestran **warnings visuales** de lo que falta
- 📊 Auditoría completa en `lead_audit_log`
- 🚫 **NINGUNA fase bloquea** la liberación

### Configuración Actual de Fases

| Fase | Estado | Bloqueante |
|------|--------|------------|
| entrevista_estructurada | ❌ Desactivada | No |
| psicometria | ❌ Desactivada | No |
| toxicologia | ❌ Desactivada | No |
| referencias | ❌ Desactivada | No |
| documentacion | ❌ Desactivada | No |
| contrato | ❌ Desactivada | No |
| capacitacion | ❌ Desactivada | No |
| instalacion_tecnica | ❌ Desactivada | No |

---

## 🔧 Cómo Activar Validaciones

### Activar una fase (cuando esté lista en producción)

```sql
-- Ejemplo: Activar validación de entrevista estructurada
UPDATE workflow_validation_config 
SET 
  validacion_activa = true,
  fecha_activacion = NOW()
WHERE fase_nombre = 'entrevista_estructurada';
```

### Desactivar una fase (si hay bugs)

```sql
-- Desactivar temporalmente
UPDATE workflow_validation_config 
SET validacion_activa = false 
WHERE fase_nombre = 'documentacion';
```

### Ver estado de todas las validaciones

```sql
SELECT 
  fase_nombre,
  validacion_activa,
  es_bloqueante,
  orden_fase,
  fecha_activacion
FROM workflow_validation_config
ORDER BY orden_fase;
```

---

## 📊 Auditoría y Reportes

### Ver custodios liberados con warnings

```sql
SELECT 
  cc.nombre,
  cl.fecha_liberacion,
  lal.changes->>'warnings' as warnings,
  lal.changes->>'fases_incompletas' as fases_incompletas,
  lal.metadata->>'modo_flexible' as modo_flexible
FROM custodio_liberacion cl
JOIN candidatos_custodios cc ON cc.id = cl.candidato_id
LEFT JOIN lead_audit_log lal 
  ON lal.lead_id = cl.candidato_id::text 
  AND lal.action_type = 'liberacion_custodio'
WHERE cl.estado_liberacion = 'liberado'
  AND cl.fecha_liberacion >= NOW() - INTERVAL '30 days'
ORDER BY cl.fecha_liberacion DESC;
```

### Tasa de cumplimiento por fase

```sql
-- Ver cuántos custodios liberados tienen cada fase completa
-- (útil para medir adopción conforme se implementan las fases)
```

---

## 🚀 Roadmap de Activación

### Sprint 1 (Semanas 1-2)
- Implementar Fase 3: Entrevista estructurada
- **Activar**: `entrevista_estructurada`

### Sprint 2 (Semanas 3-4)
- Implementar Fase 4-6: Psicometría, Toxicología, Referencias
- **Activar**: `psicometria`, `toxicologia`, `referencias`

### Sprint 3 (Semanas 5-6)
- Implementar Fase 7-8: Documentación, Contrato
- **Activar**: `documentacion`, `contrato`

### Sprint 4 (Semanas 7-8)
- Implementar Fase 9-10: Capacitación, Instalación
- **Activar**: `capacitacion`, `instalacion_tecnica`
- **Cambiar a modo producción**: Modificar default de función RPC a `p_forzar_liberacion = false`

---

## 🎨 Comportamiento de UI

### Flujo Actual
1. Usuario hace clic en "Liberar a Planificación"
2. Sistema valida fases (todas desactivadas por ahora)
3. Si hay warnings → Muestra dialog con advertencias
4. Usuario puede:
   - **Cancelar**: Volver al checklist
   - **Liberar de todas formas**: Continuar con warnings

### Tipos de Warnings
- ⚠️ **Críticos (amarillo)**: Fases importantes incompletas
- ℹ️ **Informativos (azul)**: Fases opcionales pendientes

---

## 🔐 Seguridad

- ✅ RLS activado en `workflow_validation_config`
- ✅ Solo admins pueden modificar configuración
- ✅ Todos pueden leer (necesario para validaciones)
- ✅ Auditoría completa en cada liberación

---

## 📝 Ejemplo de Uso

### Liberar un custodio (siempre funciona)
```typescript
// Frontend
await liberarCustodio.mutateAsync({ 
  liberacion_id: 'uuid',
  forzar: true // Modo flexible (default)
});

// Backend (SQL)
SELECT liberar_custodio_a_planeacion(
  'liberacion-uuid',
  'user-uuid',
  true -- forzar liberación
);
```

### Resultado con warnings
```json
{
  "success": true,
  "pc_custodio_id": "uuid",
  "candidato_id": "uuid",
  "warnings": [
    "⚠️ Documentación incompleta",
    "⚠️ GPS no instalado/verificado",
    "ℹ️ Psicométricos pendientes (opcional)"
  ],
  "fases_incompletas": ["documentacion", "instalacion_gps"],
  "tiene_warnings": true,
  "mensaje": "⚠️ Custodio liberado con advertencias"
}
```

---

## 🐛 Troubleshooting

### "No se puede liberar" error
- Verificar que `p_forzar_liberacion = true` (default durante desarrollo)
- Revisar logs de Supabase Edge Functions

### Warnings no se muestran
- Verificar que `LiberacionWarningsDialog` esté importado
- Revisar estado `showWarnings` en React DevTools

### Validaciones no se aplican
- Verificar que la fase esté activa: `SELECT * FROM workflow_validation_config WHERE fase_nombre = 'xxx'`

---

## 📞 Soporte

Para cualquier duda sobre el sistema de feature flags:
1. Revisar este documento
2. Consultar código en:
   - `supabase/migrations/*_feature_flags*.sql`
   - `src/components/liberacion/LiberacionWarningsDialog.tsx`
   - `src/hooks/useCustodioLiberacion.ts`
