
# Agregar Edición Inline en Perfiles Operativos

## ✅ COMPLETADO (2026-02-03)

Se implementó edición inline para custodios en `/perfiles-operativos`:

### Funcionalidades Agregadas

1. **Editar Zona Base** - Selector inline para cambiar zona directamente desde la tabla
2. **Editar Preferencia de Servicio** - Selector para local/foráneo/indistinto
3. **Dar de Baja** - Menú de acciones con modal que requiere motivo y guarda historial

### Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `useOperativeProfiles.ts` | Agregado `preferencia_tipo_servicio` al interface y query |
| `CustodiosDataTable.tsx` | Selectores inline, dropdown de acciones, integración con CambioEstatusModal |
| `index.tsx` | Conectado `refetch` al componente |

### Características UX

- Spinners durante actualización de campos
- Toast de confirmación tras cada acción
- Modal de baja con validación de motivo requerido
- Custodios inactivos desaparecen de la lista (filtro por defecto = activos)
