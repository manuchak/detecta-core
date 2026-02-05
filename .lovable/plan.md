
# Plan: Agregar Coordinador de Operaciones a Invitaciones de Custodios

## Diagnóstico

El módulo de invitaciones de custodios (`/admin/custodian-invitations`) actualmente permite acceso solo a:
- `admin`
- `owner`
- `supply_admin`
- `supply_lead`
- `supply`

El rol `coordinador_operaciones` necesita ser agregado para que pueda invitar custodios.

---

## Cambios Requeridos

### 1. `src/App.tsx` (Línea 405)

**Antes:**
```typescript
<RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'supply']}>
```

**Después:**
```typescript
<RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones']}>
```

### 2. `src/config/navigationConfig.ts` (Línea 193)

**Antes:**
```typescript
roles: ['admin', 'owner', 'supply_admin', 'supply_lead', 'supply'],
```

**Después:**
```typescript
roles: ['admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones'],
```

---

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/App.tsx` | Agregar rol a RoleProtectedRoute |
| `src/config/navigationConfig.ts` | Agregar rol a visibility del sidebar |

---

## Testing

- [ ] Iniciar sesión como `coordinador_operaciones`
- [ ] Verificar que el menú "Invitaciones" aparece en el sidebar
- [ ] Confirmar acceso a `/admin/custodian-invitations`
- [ ] Probar generación de invitación individual
- [ ] Verificar que el link se genera correctamente
