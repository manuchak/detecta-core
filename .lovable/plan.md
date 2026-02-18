
# Fix: Visibilidad de servicios cuando custodio_operativo no tiene email

## Diagnostico

El custodio JUAN PABLO RIVERA GUTIERREZ no ve su servicio asignado porque:

1. Su registro en `custodios_operativos` tiene `email = NULL`
2. Los triggers de sincronizacion de telefono dependen del email como clave de enlace entre `profiles` y `custodios_operativos`
3. Sin email, la sincronizacion nunca ocurre
4. El servicio tiene `custodio_telefono = 5537045855` (del operativo), pero el custodio hace login con `profile.phone = 55 4545 3426` (numero diferente)
5. `useNextService` busca con el telefono del perfil → no encuentra nada

| Tabla | Telefono | Email |
|---|---|---|
| `profiles` | `55 4545 3426` (norm: `5545453426`) | `juanpabloriveragutierrez351@gmail.com` |
| `custodios_operativos` | `5537045855` | `NULL` |
| `servicios_planificados.custodio_telefono` | `5537045855` | -- |

## Solucion

### Parte 1: Fix de datos inmediato (manual)

Actualizar el email del custodio operativo para que el trigger pueda vincularlo. Esto se puede hacer desde el modulo de Perfiles Operativos o directamente:

```sql
UPDATE custodios_operativos 
SET email = 'juanpabloriveragutierrez351@gmail.com'
WHERE id = '9902884a-3351-4260-9329-b2f058c053a1';
```

Despues de esto, el trigger `trg_sync_operativo_phone_to_profile` sincronizara el telefono al perfil, O el trigger `trg_sync_profile_phone` propagara al operativo. Ambos sentidos convergen.

### Parte 2: Mejora estructural en `useNextService`

Agregar un fallback en el hook para que, cuando no encuentre servicios con el telefono del perfil, intente buscar mediante el custodio_id (UUID) vinculado al perfil. Esto cubre los casos donde la sincronizacion no ha ocurrido.

**Cambio en `useNextService.ts`:**

1. Recibir un parametro adicional opcional `custodioId` (ya disponible en el contexto del dashboard mobile)
2. Si la busqueda por telefono no devuelve resultados Y se tiene custodioId, hacer una segunda query buscando por `custodio_id` en `servicios_planificados`
3. Esto actua como red de seguridad sin depender exclusivamente del telefono

**Cambio en `MobileDashboardLayout.tsx`:**

1. Obtener el `custodio_id` del perfil del custodio (ya se tiene el telefono, se puede buscar en `custodios_operativos`)
2. Pasar ese ID a `useNextService` como fallback

### Parte 3: Auditoria de datos incompletos

Identificar y reportar cuantos custodios operativos activos no tienen email vinculado, para corregirlos proactivamente.

Actualmente solo 1 custodio (ALARCON PADILLA) tiene discrepancia de telefono por formato, y Juan Pablo Rivera no tiene email. Pero conviene crear una consulta de auditoria que el equipo pueda ejecutar periodicamente.

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/hooks/useNextService.ts` | Agregar fallback por custodio_id cuando busqueda por telefono falla |
| `src/components/custodian/MobileDashboardLayout.tsx` | Obtener y pasar custodio_id al hook |

## Consideraciones

- El fix de datos (Parte 1) resuelve el caso inmediato de Juan Pablo Rivera
- La mejora de codigo (Parte 2) previene que esto vuelva a ocurrir con otros custodios que tengan datos incompletos
- No se cambia ningun trigger ni logica de sincronizacion existente -- solo se agrega una capa de resiliencia
