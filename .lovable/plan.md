

# Fix: Race Condition de Autorizacion + setState durante render

## Problema 1: "Acceso Restringido" falso en /leads/approvals

La causa raiz es una race condition en AuthContext.tsx:

```text
1. Auth state change -> setUserRole(null) 
2. setLoading(false) (ya se ejecuto antes)
3. RoleProtectedRoute renderiza: loading=false, userRole=null -> "Acceso Restringido"
4. setTimeout -> fetchUserRole() -> setUserRole('admin') -> corrige, pero ya flasheo error
```

### Solucion

Agregar un estado `roleLoading` separado que cubra el fetch del rol. `RoleProtectedRoute` debe considerar ambos flags (`loading || roleLoading`) antes de evaluar permisos.

### Cambios en `src/contexts/AuthContext.tsx`

- Agregar estado `roleLoading` (boolean, default true)
- Cuando auth state cambia y hay usuario: `setRoleLoading(true)` antes de resetear el rol
- Cuando `fetchUserRole` termina (exito o error): `setRoleLoading(false)`
- Exponer `roleLoading` en el contexto (o combinarlo con `loading` existente)
- En el initial `getSession`: no hacer `setLoading(false)` hasta que el rol tambien se haya cargado

### Cambios en `src/components/RoleProtectedRoute.tsx`

- Leer `roleLoading` del contexto (o simplemente que `loading` cubra ambos)
- Mientras el rol este cargando, mostrar el spinner en lugar de "Acceso Restringido"

## Problema 2: setState durante render en LeadsList

En `src/components/leads/approval/LeadsList.tsx` linea 194, `onFilteredLeadsChange(filtered)` se invoca dentro de `useMemo`, causando el warning "Cannot update a component while rendering".

### Solucion

Mover la llamada a `onFilteredLeadsChange` a un `useEffect` que dependa de `filteredAndSortedLeads`.

### Cambios en `src/components/leads/approval/LeadsList.tsx`

- Quitar `onFilteredLeadsChange` del `useMemo`
- Agregar `useEffect` separado:
  ```
  useEffect(() => {
    onFilteredLeadsChange?.(filteredAndSortedLeads);
  }, [filteredAndSortedLeads]);
  ```

## Resumen de archivos

| Archivo | Cambio |
|---------|--------|
| `src/contexts/AuthContext.tsx` | Agregar `roleLoading` para eliminar race condition entre loading y fetch de rol |
| `src/components/RoleProtectedRoute.tsx` | Respetar `roleLoading` antes de evaluar permisos |
| `src/components/leads/approval/LeadsList.tsx` | Mover `onFilteredLeadsChange` de `useMemo` a `useEffect` |

## Lo que NO se toca

- Logica de permisos y roles (hasRole, hasPermission)
- Flujo de SIERCP, liberacion, evaluaciones
- RLS policies ni funciones RPC
- Ningun otro componente

