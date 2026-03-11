

# Causa Raíz: Falta política RLS de DELETE en `documentos_candidato`

## Diagnóstico

La tabla `documentos_candidato` tiene 3 políticas RLS:

| Política | Operación |
|---|---|
| Staff puede ver documentos candidato | SELECT |
| Staff puede crear documentos candidato | INSERT |
| Staff puede actualizar documentos candidato | UPDATE |

**No existe política para DELETE.** PostgreSQL con RLS habilitado bloquea silenciosamente cualquier operación sin política explícita. El frontend ejecuta `.delete().eq('id', documentoId)` que retorna 0 filas afectadas sin error explícito, por lo que el usuario no ve feedback de error pero el documento no se elimina.

## Corrección

**Una migración SQL** que agregue la política DELETE:

```sql
CREATE POLICY "Staff puede eliminar documentos candidato"
ON public.documentos_candidato
FOR DELETE TO authenticated
USING (has_supply_role());
```

Esto sigue el mismo patrón de permisos que las políticas UPDATE e INSERT existentes (usa `has_supply_role()`). No requiere cambios en frontend — el hook `useDeleteDocumento` ya está correctamente implementado.

