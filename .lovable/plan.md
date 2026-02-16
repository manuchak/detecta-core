
# Custodio Prueba no aparece en asignacion

## Diagnostico

El custodio "Usuario Prueba" (tel: 5500000001) tiene los siguientes datos en `custodios_operativos`:

- **estado**: `inactivo`
- **disponibilidad**: `inactivo_temporal`
- **motivo**: "Dado de baja por inactividad (+90 dias)"
- **tipo_inactivacion**: `permanente`
- **fecha_inactivacion**: 2026-02-03
- **ultimo_servicio**: 2025-06-09

El sistema de asignacion (RPC `get_custodios_activos_disponibles`) solo muestra custodios con `estado = 'activo'` y `disponibilidad IN ('disponible', 'parcial')`. Esto es correcto por diseno: un custodio inactivo no debe aparecer para asignacion.

## Solucion: Reactivar el custodio prueba

Se necesita ejecutar un UPDATE en la base de datos para reactivar al custodio de prueba:

```sql
UPDATE custodios_operativos
SET 
  estado = 'activo',
  disponibilidad = 'disponible',
  motivo_inactivacion = NULL,
  tipo_inactivacion = NULL,
  fecha_inactivacion = NULL,
  fecha_reactivacion_programada = NULL,
  updated_at = now()
WHERE telefono = '5500000001';
```

### Donde ejecutarlo

El equipo de Daniela (o un admin) puede ejecutar esto directamente en el SQL Editor de Supabase, o bien se puede hacer desde el modulo de "Perfiles Operativos" si existe la opcion de reactivar custodios inactivos.

## Prevencion futura (opcional)

Para evitar que el custodio de prueba se inactive automaticamente cada 90 dias, hay dos opciones:

1. **Excluirlo del proceso de baja automatica**: Agregar una condicion al trigger/cron que desactiva custodios por inactividad para que excluya el telefono `5500000001` (cuenta de prueba documentada).

2. **Asignar servicios periodicamente**: Usar la cuenta de prueba al menos una vez cada 90 dias para mantenerla activa.

La opcion 1 es mas robusta y evita trabajo manual recurrente. Se modificaria la funcion que ejecuta las bajas automaticas para excluir el telefono de prueba.

## Detalle Tecnico

### Archivo a modificar (opcion 1 - exclusion)

Se necesita identificar la funcion SQL o cron job que ejecuta las bajas por inactividad y agregar un filtro:

```sql
WHERE telefono != '5500000001'  -- Excluir cuenta de prueba
```

### Migracion SQL

1. Reactivar el custodio (UPDATE inmediato)
2. Opcionalmente, modificar el proceso de baja automatica para excluir la cuenta de prueba
