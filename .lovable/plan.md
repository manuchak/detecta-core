

## Fix: Error al verificar documentos desde Perfil Operativo

### Causa raiz

La tabla `documentos_custodio` tiene dos politicas RLS:

1. **"Custodios gestionan documentos propios"** - permite ALL pero solo para el custodio dueno del documento
2. **"Staff ve todos los documentos"** - permite solo **SELECT** para roles admin/owner/planeacion/monitoreo/coordinador

Cuando un admin hace clic en "Verificar", el UPDATE es bloqueado por RLS porque no existe una politica que permita UPDATE para staff. Supabase devuelve 0 filas afectadas, y el `.single()` falla con error PGRST116.

### Solucion

Agregar una politica RLS de UPDATE para staff en `documentos_custodio`. Esto permite que los roles administrativos puedan marcar documentos como verificados.

### Cambios

| Donde | Que |
|---|---|
| Base de datos (SQL) | Crear politica RLS: `"Staff actualiza documentos"` que permita UPDATE para roles admin, owner, planeacion, monitoreo, coordinador |

SQL a ejecutar:

```sql
CREATE POLICY "Staff actualiza documentos" 
ON public.documentos_custodio
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'planeacion', 'monitoreo', 'coordinador'])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY['admin', 'owner', 'planeacion', 'monitoreo', 'coordinador'])
  )
);
```

No se requieren cambios en codigo frontend. El hook `useVerifyDocument.ts` esta correcto, solo necesita que la BD permita el UPDATE.

