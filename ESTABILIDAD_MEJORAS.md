# 🛡️ Mejoras de Estabilidad del Sistema - Implementadas

## Fecha: 2025-01-10

---

## ✅ Cambios Implementados

### 🔧 1. Mantenimiento de Base de Datos - VACUUM

**Problema**: Tablas con alto bloat (filas muertas acumuladas)
- `leads`: 571 filas muertas (9.81%)
- `user_roles`: 37 filas muertas (60.66%) ⚠️ CRÍTICO

**Solución Implementada**:
⚠️ **NOTA IMPORTANTE**: VACUUM no puede ejecutarse dentro de migraciones de Supabase (requiere estar fuera de transacción).

**Estado**: ⏳ Pendiente de ejecución manual o autovacuum automático

**Comando a ejecutar manualmente** (en Supabase SQL Editor):
```sql
-- Ejecutar estas queries una por una (no en bloque):
VACUUM ANALYZE public.leads;
VACUUM ANALYZE public.user_roles;
VACUUM ANALYZE public.servicios_custodia;
```

**Alternativa**: El autovacuum optimizado (implementado abajo) ejecutará VACUUM automáticamente cuando:
- `leads`: 25 + (5% × 5251) ≈ 287 filas muertas
- `user_roles`: 10 + (5% × 24) ≈ 11 filas muertas

**Estimado**: Autovacuum se ejecutará automáticamente en las próximas 2-4 horas para `user_roles` (ya excede threshold)

---

### ⚙️ 2. Configuración Autovacuum Optimizada

**Problema**: Configuración por defecto demasiado pasiva (20% de filas muertas antes de VACUUM)

**Solución Implementada**:
```sql
-- Tabla leads: VACUUM cuando solo 5% sean filas muertas
ALTER TABLE public.leads SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 25
);

-- Tabla user_roles: Threshold bajo (tabla pequeña)
ALTER TABLE public.user_roles SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 10
);
```

**Beneficios**:
- ✅ Mantenimiento automático más frecuente
- ✅ Menor acumulación de bloat
- ✅ Performance consistente en queries

---

### 🚦 3. Sistema de Rate Limiting para Edge Functions

**Problema**: Sin protección contra abuso de edge functions

**Solución Implementada**:

#### Nueva Tabla: `edge_function_rate_limits`
```sql
CREATE TABLE public.edge_function_rate_limits (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  function_name TEXT NOT NULL,
  action_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);
```

#### Nueva Función RPC: `check_rate_limit()`
```typescript
// Ejemplo de uso en Edge Function:
const rateLimit = await supabase.rpc('check_rate_limit', {
  p_function_name: 'create-readonly-access',
  p_action_type: 'create_service',
  p_limit_count: 5,      // Máximo 5 acciones
  p_window_hours: 24     // En ventana de 24h
});

if (!rateLimit.data.allowed) {
  return new Response(JSON.stringify({
    error: rateLimit.data.reason
  }), { status: 429 });
}
```

**Características**:
- ✅ Límites configurables por función y acción
- ✅ Ventanas de tiempo personalizables
- ✅ Limpieza automática (retiene solo 7 días)
- ✅ RLS habilitado (solo admins ven logs)

---

### 🔍 4. UUIDs Determinísticos (Ya Corregido Previamente)

**Status**: ✅ Ya implementado en migración anterior

La vista `armados_disponibles_extendido` usa `uuid_generate_v5()`:
```sql
uuid_generate_v5(uuid_ns_dns(), 'lead-' || l.id)
```

**Beneficio**: Mismo lead = mismo UUID en cada query (estabilidad en queries repetidas)

---

## 📊 Métricas de Éxito

### Antes de las Mejoras:
| Tabla | Filas Muertas | Bloat % | Último VACUUM |
|-------|---------------|---------|---------------|
| leads | 447 | 7.84% | Nunca (manual) |
| user_roles | 37 | 60.66% | Nunca |

### Después de las Mejoras (Estado Actual):
| Tabla | Filas Muertas | Bloat % | Último VACUUM | Status |
|-------|---------------|---------|---------------|---------|
| leads | 571 | 9.81% | ⏳ Pendiente | Autovacuum configurado |
| user_roles | 37 | 60.66% | ⏳ Pendiente | Autovacuum próximo (2-4h) |

**Resultado Esperado después de VACUUM**:
| Tabla | Filas Muertas | Bloat % |
|-------|---------------|---------|
| leads | <50 | <1% |
| user_roles | 0 | 0% |

---

## 🎯 Próximos Pasos (Prioridad Media)

### 1. Habilitar Protección contra Contraseñas Filtradas
**Acción Manual Requerida**:
1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Project Settings → Authentication → Settings
3. Activar "Leaked Password Protection"
4. Referencia: [Documentación](https://docs.lovable.dev/features/security#leaked-password-protection-disabled)

### 2. Reducir Tiempo de Expiración de OTP
**Recomendación**: Cambiar de 1 hora a 10 minutos
**Acción Manual Requerida**:
1. Supabase Dashboard → Authentication → Settings
2. "OTP Expiration Time" → 600 segundos (10 min)

### 3. Implementar Rate Limiting en Edge Functions Existentes
**Funciones a Actualizar**:
```bash
# Buscar edge functions en el proyecto:
supabase/functions/
  ├── create-readonly-access/    # ⚠️ Prioridad ALTA
  ├── dialfire-webhook/          # ⚠️ Prioridad ALTA
  ├── ai-recruitment-analysis/   # Prioridad MEDIA
  └── analyze-interview/         # Prioridad MEDIA
```

**Template de implementación**:
```typescript
// Al inicio de cada edge function crítica:
const rateLimitCheck = await supabase.rpc('check_rate_limit', {
  p_function_name: 'nombre-de-funcion',
  p_action_type: 'accion_especifica',
  p_limit_count: 5,
  p_window_hours: 24
});

if (!rateLimitCheck.data?.allowed) {
  return new Response(JSON.stringify({
    success: false,
    error: rateLimitCheck.data?.reason || 'Rate limit exceeded'
  }), { 
    status: 429,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ... resto de la lógica de la función
```

---

## 🛠️ Comandos de Verificación

### Verificar estado de VACUUM:
```sql
SELECT 
  relname,
  n_dead_tup,
  last_vacuum,
  last_autovacuum
FROM pg_stat_user_tables
WHERE relname IN ('leads', 'user_roles')
ORDER BY n_dead_tup DESC;
```

### Verificar configuración de autovacuum:
```sql
SELECT 
  relname,
  reloptions
FROM pg_class
WHERE relname IN ('leads', 'user_roles');
```

### Verificar rate limits activos:
```sql
SELECT 
  function_name,
  action_type,
  COUNT(*) as total_requests,
  COUNT(DISTINCT user_id) as unique_users
FROM edge_function_rate_limits
WHERE timestamp >= now() - interval '24 hours'
GROUP BY function_name, action_type
ORDER BY total_requests DESC;
```

---

## 📈 Monitoreo Continuo

### Alertas Recomendadas:
1. **Bloat > 10%** en tablas críticas → Ejecutar VACUUM manual
2. **Rate limit hits > 100/día** → Revisar posible abuso
3. **Postgres logs con errores RPC** → Investigar incompatibilidad de tipos

### Revisiones Programadas:
- **Semanal**: Revisar bloat de tablas principales
- **Mensual**: Auditar logs de rate limiting
- **Trimestral**: Review completo de SECURITY DEFINER functions

---

## ✅ Checklist de Validación

- [ ] **Pendiente**: VACUUM en `leads` (manual o autovacuum en 2-4h)
- [ ] **Pendiente**: VACUUM en `user_roles` (autovacuum próximo)
- [x] ✅ Autovacuum configurado (leads + user_roles)
- [x] ✅ Tabla `edge_function_rate_limits` creada
- [x] ✅ Función RPC `check_rate_limit()` creada
- [x] ✅ Función RPC `cleanup_old_rate_limits()` creada
- [x] ✅ RLS habilitado en tabla de rate limits
- [x] ✅ Políticas RLS creadas (admin view + user insert)
- [x] ✅ Índices optimizados creados
- [x] ✅ UUIDs determinísticos verificados (ya corregidos)
- [ ] **Pendiente**: Habilitar Leaked Password Protection (acción manual)
- [ ] **Pendiente**: Reducir OTP expiry a 10 min (acción manual)
- [ ] **Pendiente**: Implementar rate limiting en edge functions existentes

---

## 🎓 Referencias

- [Supabase Performance Tuning](https://supabase.com/docs/guides/platform/performance)
- [PostgreSQL VACUUM Best Practices](https://www.postgresql.org/docs/current/routine-vacuuming.html)
- [Rate Limiting Patterns](https://docs.lovable.dev/features/security#rate-limiting)
- [Supabase Going to Production](https://supabase.com/docs/guides/platform/going-into-prod)

---

---

## 🚀 Acción Inmediata Recomendada

**Ejecutar VACUUM manualmente** para limpieza inmediata (opcional, autovacuum lo hará automáticamente):

1. Ir a Supabase Dashboard → SQL Editor
2. Ejecutar una por una:
```sql
VACUUM ANALYZE public.leads;
```
```sql
VACUUM ANALYZE public.user_roles;
```

**Tiempo estimado**: 2-5 segundos por query

---

**Implementado por**: AI Assistant Lovable  
**Fecha**: 2025-01-10  
**Versión**: 1.1  
**Status**: ✅ Infraestructura completa (VACUUM pendiente de ejecución)
