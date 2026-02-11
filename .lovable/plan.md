
## Dashboard de Adopcion Digital de Custodios

### Contexto del problema

De los **107 custodios activos** en `custodios_operativos`:
- **96** no tienen cuenta registrada en el sistema (no han usado su link de registro)
- **11** tienen cuenta registrada (profile vinculado por telefono)
- **3** tienen el rol `custodio` asignado (pueden hacer checklist y tickets)
- **8** tienen cuenta pero NO tienen el rol `custodio` (no pueden acceder al portal)

Esto significa que solo el **2.8%** de la base operativa puede usar checklists y soporte. El dashboard propuesto dara visibilidad completa de este gap.

### Que se va a construir

Una nueva tab **"Adopcion Digital"** dentro de `/monitoring` que muestre:

1. **Tarjetas de metricas** con los 4 estados:
   - Total activos en base operativa
   - Con cuenta registrada (tienen profile)
   - Con rol custodio activo (pueden operar digitalmente)
   - Sin cuenta (no se han registrado)

2. **Tabla de custodios** con columnas:
   - Nombre, Telefono, Estado operativo
   - Cuenta registrada (si/no)
   - Rol custodio (si/no)
   - Ultimo checklist realizado (fecha o "Nunca")
   - Ultimo ticket de soporte (fecha o "Nunca")
   - Acciones: Enviar recordatorio por WhatsApp

3. **Filtros**: Por estado de adopcion (todos, sin cuenta, sin rol, activos digitalmente)

### Desafio tecnico: formato de telefonos

Los telefonos en `custodios_operativos` usan formato limpio (`5561593355`) mientras que `profiles` usa formato con espacios (`55 6159 3355`). La consulta necesita normalizar telefonos para hacer el match correctamente, eliminando espacios, guiones y prefijo `+52`.

### Detalles tecnicos

**Nuevos archivos:**
- `src/components/monitoring/adoption/AdoptionDashboard.tsx` - Tarjetas de metricas
- `src/components/monitoring/adoption/AdoptionTable.tsx` - Tabla con filtros
- `src/hooks/useAdopcionDigital.ts` - Hook que consulta y cruza datos

**Archivos a modificar:**
- `src/pages/Monitoring/MonitoringPage.tsx` - Agregar tab "Adopcion Digital"

**Nueva migracion SQL:**
- Crear una vista o RPC `get_custodian_adoption_status` que haga el cruce de datos con normalizacion de telefonos server-side, evitando traer toda la data al cliente.

**Consulta SQL del RPC:**
```sql
SELECT 
  co.id, co.nombre, co.telefono, co.estado,
  p.id IS NOT NULL as tiene_cuenta,
  p.display_name, p.email,
  ur.role IS NOT NULL as tiene_rol_custodio,
  (SELECT MAX(created_at) FROM checklists_vehiculo cv WHERE cv.custodio_id = co.id) as ultimo_checklist,
  (SELECT MAX(created_at) FROM tickets t WHERE t.custodian_phone = co.telefono) as ultimo_ticket
FROM custodios_operativos co
LEFT JOIN profiles p ON normalize_phone(p.phone) = normalize_phone(co.telefono)
LEFT JOIN user_roles ur ON ur.user_id = p.id AND ur.role = 'custodio'
WHERE co.estado IN ('activo', 'suspendido')
ORDER BY co.nombre
```

**Estructura de la tab:**
- Reutiliza los patrones existentes de `ShiftSummaryCards` para metricas
- Tabla con el mismo estilo que `ChecklistServicesTable`
- Badge visual verde/amarillo/rojo segun nivel de adopcion
