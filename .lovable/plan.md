

## Diagnóstico: Oscar Patiño - Servicio no visible

### Causa raíz: Teléfono del profile no coincide con custodios_operativos

| Fuente | Teléfono |
|--------|----------|
| Profile (auth / login) | `4462888724` (de "446 288 8724") |
| Custodios operativos (activo) | `4421862382` |
| Servicio planificado (hoy 07:00) | `4421862382` |
| Documentos subidos | `4462888724` |

El hook `useNextService` busca servicios con el teléfono del profile (`4462888724`), pero el servicio fue asignado usando el teléfono de `custodios_operativos` (`4421862382`). Son numeros completamente diferentes, no es un tema de formato.

### Nota adicional

Oscar tiene un registro **duplicado** en `custodios_operativos`:
- `53bc9ce0...` con estado `inactivo` (OSCAR LEONARDO PATIÑO TERRAZAS)
- `94075138...` con estado `activo` (OSCAR LEONARDO PATINO TERRAZAS)

Ambos usan el telefono `4421862382`.

### Correccion requerida (datos - SQL manual)

Actualizar el telefono en `custodios_operativos` para que coincida con el profile de auth, y re-sincronizar el servicio:

```sql
-- Ejecutar en Cloud View > Run SQL (Live)

-- 1. Actualizar custodio activo con telefono correcto
UPDATE custodios_operativos 
SET telefono = '4462888724'
WHERE id = '94075138-694c-4900-9dae-87cfba8be05a';

-- 2. Actualizar el servicio de hoy para que use el telefono correcto
UPDATE servicios_planificados 
SET custodio_telefono = '4462888724'
WHERE id = '4d137bbe-1fb5-48d6-b80b-b96f59a02281';
```

Despues de ejecutar esto, Oscar deberia ver su servicio inmediatamente al refrescar la app.

### Problema sistémico recurrente

Este es el **segundo caso** (despues de Hector) donde el telefono del profile no coincide con el de custodios_operativos. Para prevenir futuros casos, se recomienda crear una validacion automatica o un trigger que sincronice ambas tablas al momento del signup/login del custodio.

