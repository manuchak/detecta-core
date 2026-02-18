
# Fix: Supply no puede verificar documentos de custodios

## Problema

La politica RLS "Staff actualiza documentos" en la tabla `documentos_custodio` solo permite UPDATE a los roles: `admin, owner, planeacion, monitoreo, coordinador`. Los roles de supply (`supply`, `supply_lead`, `supply_admin`) no estan incluidos, por lo que al hacer clic en "Verificar" reciben el error "Error al actualizar el documento".

Adicionalmente, la politica "Staff ve todos los documentos" (SELECT) tampoco incluye los roles de supply, lo que podria causar problemas de visibilidad.

## Solucion

### Cambio 1: Migracion SQL - Actualizar ambas politicas RLS

Ejecutar una migracion que modifique las dos politicas para incluir los roles de supply:

```sql
-- Actualizar politica de UPDATE
DROP POLICY IF EXISTS "Staff actualiza documentos" ON public.documentos_custodio;
CREATE POLICY "Staff actualiza documentos" 
ON public.documentos_custodio FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY[
      'admin', 'owner', 'planeacion', 'monitoreo', 'coordinador',
      'supply', 'supply_lead', 'supply_admin'
    ])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role = ANY (ARRAY[
      'admin', 'owner', 'planeacion', 'monitoreo', 'coordinador',
      'supply', 'supply_lead', 'supply_admin'
    ])
  )
);

-- Actualizar politica de SELECT
DROP POLICY IF EXISTS "Staff ve todos los documentos" ON public.documentos_custodio;
CREATE POLICY "Staff ve todos los documentos"
ON public.documentos_custodio FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN (
      'admin', 'owner', 'planeacion', 'monitoreo', 'coordinador',
      'supply', 'supply_lead', 'supply_admin'
    )
  )
);
```

### Sin cambios de codigo

El hook `useVerifyDocument.ts` esta correcto. El problema es exclusivamente de permisos en la base de datos.
