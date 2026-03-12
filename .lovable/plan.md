

# Bug Analysis: Disparidad de Estado — Luis Gilberto González Jasso

## Root Cause Identificado

Hay un **mismatch de valores entre el trigger y los datos reales** que causa una desincronización silenciosa.

### La cadena de fallo:

1. **Datos en BD**: La tabla `custodio_indisponibilidades` usa `estado = 'activo'` (masculino)
2. **Trigger `sync_custodio_disponibilidad`**: Verifica `NEW.estado = 'activa'` (femenino)
3. **RPC `get_custodios_activos_disponibles`**: Filtra con `ci.estado = 'activo'` (masculino) ✅

```text
┌─────────────────────────────┐
│  custodio_indisponibilidades │
│  estado = 'activo'    ← dato real
└────────┬────────────────────┘
         │
    ┌────▼─────────────────────────────┐
    │ Trigger: IF estado = 'activa'    │ ← NUNCA MATCHEA
    │ → NO actualiza disponibilidad    │
    └──────────────────────────────────┘
         │
    ┌────▼─────────────────────────────┐
    │ custodios_operativos             │
    │ disponibilidad = 'disponible'    │ ← INCORRECTO, debería ser
    │                                  │   'temporalmente_indisponible'
    └────────┬─────────────────────────┘
             │
        ┌────▼───────────────────────────────┐
        │ RPC: NOT EXISTS (estado='activo')  │ ✅ Filtra correctamente
        │ → Custodio NO aparece en planning  │
        └────────────────────────────────────┘
             │
        ┌────▼───────────────────────────────┐
        │ UI Perfiles Operativos             │
        │ Lee co.disponibilidad directamente │
        │ → Muestra "disponible"  ← ENGAÑOSO │
        └────────────────────────────────────┘
```

### Resultado:
- **Planeación** no ve al custodio (RPC correcto, filtra por indisponibilidades)
- **Perfiles Operativos** muestra "disponible" (lee `co.disponibilidad` que nunca fue actualizado por el trigger roto)
- **El equipo se confunde**: el perfil dice disponible pero no aparece en asignación

## Plan de Corrección

### 1. Corregir el trigger `sync_custodio_disponibilidad`
Cambiar `'activa'` → `'activo'` para que matchee con los datos reales. Aplicar la misma corrección en la rama de resolución que verifica `estado = 'activa'`.

### 2. Migración de datos: sincronizar registros desincronizados
UPDATE de todos los custodios con indisponibilidades activas cuya `disponibilidad` no refleje `temporalmente_indisponible`.

### 3. Agregar validación defensiva en el frontend
En `useOperativeProfiles.ts` (o donde se renderiza el badge de disponibilidad), cruzar `co.disponibilidad` con la existencia de indisponibilidades activas para mostrar el estado real, independientemente de si el trigger falló.

### Archivos a modificar

| Archivo/Recurso | Cambio |
|---|---|
| Nueva migración SQL | Fix trigger: `'activa'` → `'activo'`; UPDATE masivo de custodios desincronizados |
| `src/pages/PerfilesOperativos/` (componente de badge) | Validación defensiva: si hay indisponibilidades activas, mostrar "indisponible" sin importar `co.disponibilidad` |

### Impacto
- Corrige el caso de Luis Gilberto inmediatamente
- Previene que **todos** los registros futuros de indisponibilidad fallen silenciosamente
- El badge de Perfiles Operativos nunca más mostrará información contradictoria

