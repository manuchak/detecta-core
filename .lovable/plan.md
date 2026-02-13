

## Fix: Dashboard de Checklists muestra cero por error en politica RLS

### Causa raiz

La politica RLS de SELECT en la tabla `checklist_servicio` verifica estos roles:

```sql
role = ANY (ARRAY['admin', 'owner', 'planeacion', 'monitoreo', 'coordinador'])
```

Pero los roles reales almacenados en `user_roles` son:

| RLS espera | Rol real en BD |
|---|---|
| `monitoreo` | `monitoring` |
| `planeacion` | `planificador` |
| `coordinador` | `coordinador_operaciones` |

Resultado: Solo `admin` y `owner` pueden ver checklists. Todos los usuarios de monitoreo, planeacion y coordinacion reciben 0 resultados porque RLS filtra silenciosamente.

### Solucion

Actualizar la politica RLS "Staff ve todos los checklists" para usar los nombres de roles correctos:

```sql
DROP POLICY "Staff ve todos los checklists" ON checklist_servicio;

CREATE POLICY "Staff ve todos los checklists"
  ON checklist_servicio FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = ANY (ARRAY[
        'admin',
        'owner',
        'monitoring',
        'planificador',
        'coordinador_operaciones',
        'ejecutivo_ventas'
      ])
    )
  );
```

Cambios:
- `monitoreo` corregido a `monitoring`
- `planeacion` corregido a `planificador`
- `coordinador` corregido a `coordinador_operaciones`
- Se agrega `ejecutivo_ventas` para que ventas tambien pueda consultar checklists de sus clientes

### Impacto

- Correccion inmediata: los 8 usuarios de monitoring, 4 planificadores y 2 coordinadores podran ver los checklists
- No requiere cambios en el frontend - el hook `useChecklistMonitoreo` ya hace las consultas correctas, solo que RLS las bloqueaba
- Los 9 checklists con estado "completo" que existen en la BD apareceran en el dashboard

