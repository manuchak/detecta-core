# Matriz de Permisos del Sistema

## Roles y Permisos Actualizados

### **Admin** y **Owner**
- ✅ Puede ver leads
- ✅ Puede editar leads  
- ✅ Puede asignar leads
- ✅ Puede gestionar usuarios
- ✅ Tiene acceso al dashboard
- ✅ Puede ver custodios en Planeación
- ✅ Puede crear asignaciones

### **Supply Admin**
- ✅ Puede ver leads
- ✅ Puede editar leads
- ✅ **Puede asignar leads** (única diferencia con supply_lead)
- ❌ No puede gestionar usuarios
- ✅ Tiene acceso al dashboard
- ✅ Puede ver custodios en Planeación (supervisión)
- ❌ No puede crear asignaciones

### **Supply Lead**
- ✅ Puede ver leads
- ✅ Puede editar leads
- ❌ **NO puede asignar leads** (solo supply_admin puede)
- ❌ No puede gestionar usuarios
- ✅ Tiene acceso al dashboard

### **Ejecutivo de Ventas**
- ✅ Puede ver leads
- ✅ Puede editar leads
- ❌ No puede asignar leads
- ❌ No puede gestionar usuarios
- ❌ **NO tiene acceso al dashboard** (solo acceso a leads)

### **Supply**
- ✅ Puede ver leads
- ❌ No puede editar leads
- ❌ No puede asignar leads
- ❌ No puede gestionar usuarios
- ❌ No tiene acceso al dashboard

---

## Matriz Unificada de Acceso a Planeación y Custodios

> **HOMOLOGADO** (Enero 2025): Los roles con acceso a Planeación ahora son consistentes entre `puede_acceder_planeacion()` y `get_custodios_activos_disponibles()`.

| Rol | Ver Custodios | Ver Planeación | Crear Asignaciones |
|-----|---------------|----------------|--------------------|
| `admin` | ✅ | ✅ | ✅ |
| `owner` | ✅ | ✅ | ✅ |
| `planificador` | ✅ | ✅ | ✅ |
| `coordinador_operaciones` | ✅ | ✅ | ❌ (solo vista) |
| `supply_admin` | ✅ | ✅ | ❌ (solo vista) |
| `c4` | ✅ | ✅ | ❌ (solo vista) |
| `monitoreo` | ✅ | ✅ | ❌ (solo vista) |

### Funciones RPC Homologadas
- `puede_acceder_planeacion()` - Verifica acceso a módulo de planeación
- `get_custodios_activos_disponibles()` - Retorna custodios activos para asignación

Ambas funciones ahora validan `is_active = true` para evitar roles desactivados.

---

## Workflow de Candidatos

### **Gestión de Candidatos**
1. **Creación**: `admin`, `owner`, `supply_admin`, `supply_lead`, `ejecutivo_ventas`
2. **Edición**: `admin`, `owner`, `supply_admin`, `supply_lead`, `ejecutivo_ventas`  
3. **Asignación**: **SOLO** `admin`, `owner`, `supply_admin`
4. **Visualización**: `admin`, `owner`, `supply_admin`, `supply_lead`, `ejecutivo_ventas`

### **Proceso de Aprobación**
1. **Acceso a aprobaciones**: `admin`, `owner`, `coordinador_operaciones`, `supply_admin`, `supply_lead`, `ejecutivo_ventas`
2. **Toma de decisiones**: `admin`, `owner`, `supply_admin`, `supply_lead`

---

## Rutas y Acceso

### **Dashboard Principal**
- **Acceso**: `admin`, `owner`, `supply_admin`, `coordinador_operaciones`, `jefe_seguridad`, `bi`
- **Sin acceso**: `ejecutivo_ventas`, `supply`, `custodio`

### **Módulo de Leads**
- **Ruta principal (`/leads`)**: Todos los usuarios autenticados
- **Aprobaciones (`/leads/approvals`)**: `admin`, `owner`, `coordinador_operaciones`, `supply_admin`, `supply_lead`, `ejecutivo_ventas`

### **Redirección Inteligente**
- `ejecutivo_ventas` → Redirige a `/leads` por defecto
- `supply_lead` → Redirige a `/leads` por defecto  
- `supply_admin` → Acceso completo al dashboard

---

## Funciones RPC Actualizadas

### **`get_users_with_roles_secure()`**
- **Incluye**: `admin`, `owner`, `supply_admin`, `supply_lead`, `ejecutivo_ventas`
- **Excluye**: `supply`, `custodio`, `monitoring`, etc.
- **Ordenamiento**: Jerárquico por importancia del rol

### **Funciones de Asignación**
- **`useLeadAssignment`**: Solo muestra usuarios que pueden asignar (`admin`, `owner`, `supply_admin`)
- **Validación**: Previene que roles sin permisos aparezcan en listas de asignación

---

## Validaciones de Seguridad

### **RLS Policies**
- ✅ Todas las políticas están sincronizadas con permisos de hooks
- ✅ `supply_lead` puede editar leads según RLS
- ✅ `ejecutivo_ventas` excluido de funciones de dashboard

### **Hooks de Autenticación**
- ✅ `useStableAuth.ts` - Actualizado
- ✅ `useUnifiedAuth.ts` - Actualizado  
- ✅ `AuthContext.tsx` - Ya estaba correcto

---

## Próximos Pasos

1. **Testing de permisos por rol**
2. **Validación de funciones RPC**
3. **Implementación de redirección inteligente**
4. **Audit trail completo**
5. **Documentación de workflows**

---

## Checklist de Pruebas: Flujo Liberación → Planeación

### Pre-requisitos
- [ ] Usuario con rol `supply_admin` o superior
- [ ] Candidato custodio con todos los pasos completados
- [ ] Usuario con rol `planificador` para validar

### Pasos de Prueba

| # | Paso | Rol Requerido | Verificación |
|---|------|---------------|--------------|
| 1 | Login al sistema | `supply_admin` | Acceso a módulo Supply ✅ |
| 2 | Navegar a Liberación de Custodios | `supply_admin` | Ver lista de pendientes |
| 3 | Seleccionar custodio de prueba | - | Ver detalles del candidato |
| 4 | Click "Liberar a Planeación" | `supply_admin` | Modal de confirmación |
| 5 | Confirmar liberación | - | Toast de éxito + datos de invitación |
| 6 | Verificar en BD: `pc_custodios` | - | Custodio aparece con `fuente = 'liberacion_supply'` |
| 7 | Verificar en BD: `custodios_operativos` | - | Custodio aparece activo |
| 8 | Login como planificador | `planificador` | Acceso a módulo Planeación ✅ |
| 9 | Ir a crear nuevo servicio | - | Flujo de creación |
| 10 | Llegar a paso de asignación | - | Buscar custodio |
| 11 | Buscar custodio liberado | - | Custodio aparece en lista ✅ |
| 12 | Verificar datos | - | Nombre, zona, disponibilidad correctos |

### Consultas SQL de Verificación

```sql
-- Verificar custodio en pc_custodios
SELECT * FROM pc_custodios 
WHERE nombre ILIKE '%NOMBRE_CUSTODIO%';

-- Verificar custodio en custodios_operativos
SELECT * FROM custodios_operativos 
WHERE nombre ILIKE '%NOMBRE_CUSTODIO%';

-- Verificar función RPC (simular Planeación)
SELECT * FROM get_custodios_activos_disponibles()
WHERE nombre ILIKE '%NOMBRE_CUSTODIO%';

-- Ver logs de auditoría recientes
SELECT 
  u.email,
  al.accion,
  al.timestamp,
  al.payload
FROM pc_audit_log al
LEFT JOIN auth.users u ON u.id = al.usuario_id
WHERE al.entidad = 'custodios_operativos'
ORDER BY al.timestamp DESC
LIMIT 20;
```

---

*Última actualización: 2025-01-15*