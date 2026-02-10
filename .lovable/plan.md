
## Fix: RPC liberar_custodio_a_planeacion_v2 no funciona - doble desincronizacion

### Problema raiz (2 bugs criticos)

**Bug 1 - Tabla incorrecta en la RPC desplegada**: La funcion `liberar_custodio_a_planeacion_v2` desplegada en produccion consulta `custodios_liberacion` (con 's'), pero la tabla real se llama `custodio_liberacion` (sin 's'). Esto causa que CADA llamada falle silenciosamente con "Registro de liberacion no encontrado".

**Bug 2 - Frontend no valida `success: false`**: La RPC usa un patron de "soft errors" donde retorna `{ success: false, error: "mensaje" }` en lugar de lanzar excepciones SQL. Sin embargo, el frontend solo verifica `if (error)` de la respuesta de Supabase (errores de red/SQL), nunca revisa `result.success`. Resultado: el toast de exito se muestra aunque la operacion fallo.

### Por que Supply ve el toast de exito

```text
1. Supply presiona "Liberar"
2. Frontend llama RPC liberar_custodio_a_planeacion_v2
3. RPC intenta SELECT FROM custodios_liberacion (no existe)
4. EXCEPTION WHEN OTHERS captura el error
5. RPC retorna { success: false, error: "..." } como JSON valido
6. Supabase client: sin error SQL, data = { success: false, ... }
7. Frontend: if (error) -> NO -> continua como exito
8. result.candidato_nombre = undefined, result.warnings = undefined
9. Toast muestra "Custodio Liberado" con datos vacios
10. Base de datos: sin cambios (custodio sigue en 'pendiente')
```

### Solucion (2 partes)

**Parte 1: Corregir la migracion SQL**

Crear nueva migracion que redefine `liberar_custodio_a_planeacion_v2` corrigiendo:
- Tabla: `custodio_liberacion` (sin 's') en lugar de `custodios_liberacion`
- Campos de retorno: alinear con lo que el frontend espera (`candidato_nombre`, `candidato_email`, `candidato_telefono`, `custodio_operativo_id`, `warnings`, `tiene_warnings`, `fases_incompletas`, `invitation_token`)
- Join con tabla `candidatos_custodios` para obtener datos del candidato (ya que `custodio_liberacion` referencia `candidato_id`)
- Mantener la generacion de invitacion y notificacion

**Parte 2: Agregar validacion de `success` en el frontend**

En `src/hooks/useCustodioLiberacion.ts`, agregar despues de la llamada RPC:

```typescript
if (!data?.success) {
  throw new Error(data?.error || 'Error desconocido en la liberacion');
}
```

Esto garantiza que errores de negocio (como tabla no encontrada, ya liberado, etc.) se propaguen correctamente al usuario en lugar de mostrarse como exito.

### Archivos a modificar

1. **Nueva migracion SQL** - Redefinir `liberar_custodio_a_planeacion_v2` con tabla correcta y campos de retorno alineados
2. **`src/hooks/useCustodioLiberacion.ts`** - Agregar validacion `if (!data?.success)` despues de la llamada RPC (linea ~218)

### Impacto

- Los 2 custodios pendientes (RIVAS y CALDERON) podran ser liberados correctamente
- Cualquier error futuro de la RPC se mostrara al usuario en lugar de fallar silenciosamente
- No afecta registros ya liberados (los anteriores usaban una version funcional de la RPC)
