

## Plan: Permitir a Coordinador de Operaciones asignar personal externo

### Problema

En el modal "Asignar Personal" (`ExternalArmedVerificationModal.tsx`), la verificacion de permisos solo permite los roles `planificador`, `admin`, `owner` y `supply_admin`. El rol `coordinador_operaciones` queda bloqueado con el mensaje "No tienes permisos para asignar personal".

### Causa raiz

Linea 44 del archivo:
```
const canModify = isPlanificador() || isAdmin();
```

`isAdmin()` solo incluye `admin`, `owner`, `supply_admin`. No incluye `coordinador_operaciones`.

### Solucion

Modificar la validacion en `src/components/planeacion/ExternalArmedVerificationModal.tsx` para incluir `coordinador_operaciones`:

**Linea 44** - Cambiar de:
```typescript
const canModify = isPlanificador() || isAdmin();
```
A:
```typescript
const canModify = isPlanificador() || isAdmin() || hasRole('coordinador_operaciones');
```

**Linea 58** - Actualizar el mensaje de error:
```typescript
toast.error('No tienes permisos para asignar personal. Se requiere rol de Planificador, Coordinador de Operaciones o Administrador.');
```

**Linea 166** - Actualizar el texto de la alerta visual:
```
No tienes permisos para asignar personal. Se requiere rol de Planificador, Coordinador de Operaciones o Administrador.
```

### Archivos a modificar

- `src/components/planeacion/ExternalArmedVerificationModal.tsx` (3 cambios puntuales)

### Notas

- `hasRole` ya esta disponible desde el hook `useUserRole` (linea 37), solo falta desestructurarlo.
- No se requieren cambios en RLS ni en la base de datos, ya que la restriccion es puramente frontend.

