

# Blindaje de Persistencia del Formulario de Incidentes

## Problema Raiz

Cuando Supabase refresca el token de autenticacion (cada ~1 hora), el evento `onAuthStateChange` dispara con tipo `SIGNED_IN` o `TOKEN_REFRESHED`. El codigo actual en `AuthContext.tsx` (linea 217) **resetea el rol a null y roleLoading a true** en CADA evento de auth, incluyendo renovaciones de token:

```text
setUserRole(null);      // <-- Hace que RoleProtectedRoute muestre spinner
setRoleLoading(true);   // <-- Desmonta TODO el arbol de componentes
```

Esto causa la siguiente cadena:

```text
Token refresh
  -> AuthContext: userRole = null, roleLoading = true
  -> RoleProtectedRoute: muestra "Verificando permisos..." (spinner)
  -> MonitoringPage se DESMONTA (destruye todo el estado React)
  -> Role se resuelve en ~50ms
  -> RoleProtectedRoute: renderiza children de nuevo
  -> MonitoringPage se MONTA FRESCO (sin datos del formulario)
  -> LastRouteRestorer puede redirigir a otra pagina
```

El formulario de incidentes tiene persistencia en localStorage/sessionStorage, pero el **remontaje completo** causa que:
1. El formulario se reinicializa con valores default
2. La restauracion del draft depende de un banner manual que el usuario debe aceptar
3. La cronologia se restaura correctamente (inicializacion sincrona en useState), pero el formulario principal no

## Solucion (3 cambios)

### Cambio 1: No resetear rol en token refresh (AuthContext.tsx)

El cambio mas critico. Distinguir entre un inicio de sesion genuino vs una renovacion de token:

- Si el evento es `TOKEN_REFRESHED` o si el usuario ya es el mismo que esta autenticado, **no resetear** `userRole` ni `roleLoading`
- Solo resetear en `SIGNED_IN` cuando el usuario cambia (diferente user ID)
- Esto evita el desmontaje completo del arbol de componentes

### Cambio 2: Suprimir toast duplicado en token refresh (AuthContext.tsx)

El toast "Bienvenido - Has iniciado sesion como..." no debe aparecer durante renovaciones de token, solo en logins genuinos. Se agrega una referencia al user ID anterior para detectar si es un login real o simplemente un refresh.

### Cambio 3: Auto-restauracion silenciosa del formulario (IncidentReportForm.tsx)

Como capa adicional de seguridad (defense-in-depth), si el componente se remonta y existe un draft en storage, restaurar automaticamente sin requerir interaccion del usuario:

- Detectar si hay un draft guardado al montar
- Si lo hay, restaurar los valores del form automaticamente con `form.reset(restoredData)`
- Mostrar un toast informativo en vez de un banner que requiere clic

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/contexts/AuthContext.tsx` | No resetear userRole/roleLoading en TOKEN_REFRESHED ni cuando el user ID no cambia; suprimir toast de bienvenida en refreshes |
| `src/components/monitoring/incidents/IncidentReportForm.tsx` | Auto-restaurar form data al montar si existe draft (sin requerir interaccion del usuario) |

## Detalle Tecnico

### AuthContext.tsx - Logica de diferenciacion

```text
onAuthStateChange(event, currentSession):
  IF event === 'TOKEN_REFRESHED':
    -> Actualizar session y user (para que el token nuevo se use)
    -> NO tocar userRole ni roleLoading
    -> NO mostrar toast
  ELSE IF event === 'SIGNED_IN':
    IF currentSession.user.id === previousUserId:
      -> Es un refresh disfrazado, NO resetear rol
      -> NO mostrar toast
    ELSE:
      -> Login genuino, SI resetear y re-fetch rol
      -> SI mostrar toast
```

### IncidentReportForm.tsx - Auto-restore

```text
useEffect al montar:
  1. Revisar si useFormPersistence ya restauro datos
  2. Si los datos del form siguen en default Y hay draft en storage:
     -> form.reset(draftData)
     -> toast.info("Borrador restaurado automaticamente")
```

## Impacto

- **Elimina** el desmontaje involuntario durante token refresh (~cada hora)
- **Elimina** el toast confuso de "Bienvenido" cuando no hubo login real
- **Garantiza** que si por cualquier otra razon el formulario se remonta, los datos se restauran sin friccion
- Compatible con la arquitectura de persistencia existente (dual backup localStorage + sessionStorage)
