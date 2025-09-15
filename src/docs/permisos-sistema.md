# Matriz de Permisos del Sistema

## Roles y Permisos Actualizados

### **Admin** y **Owner**
- ✅ Puede ver leads
- ✅ Puede editar leads  
- ✅ Puede asignar leads
- ✅ Puede gestionar usuarios
- ✅ Tiene acceso al dashboard

### **Supply Admin**
- ✅ Puede ver leads
- ✅ Puede editar leads
- ✅ **Puede asignar leads** (única diferencia con supply_lead)
- ❌ No puede gestionar usuarios
- ✅ Tiene acceso al dashboard

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

*Última actualización: 2025-01-15*