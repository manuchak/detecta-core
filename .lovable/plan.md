

## Plan: Usuario Dummy de Custodio para Pruebas

### Contexto

El sistema vincula custodios a servicios mediante el **telefono** almacenado en `profiles.phone` y comparado (normalizado a 10 digitos) contra `servicios_custodia.telefono`, `checklist_servicio.custodio_telefono`, `documentos_custodio.custodio_telefono`, etc.

El email `prueba@prueba.com` no existe actualmente en el sistema.

### Telefono recomendado: `5500000001`

- No existe en `servicios_custodia` (verificado)
- Formato de 10 digitos compatible con `normalizePhone`
- Claramente ficticio (no pertenece a nadie real)
- Planeacion puede asignar servicios usando este numero en el campo `telefono` de `servicios_custodia`

### Pasos de implementacion

**Paso 1: Crear invitacion via la UI existente**
- Desde el modulo de administracion de custodios, generar una invitacion para:
  - Email: `prueba@prueba.com`
  - Nombre: `Custodio Prueba`
  - Telefono: `5500000001`

**Paso 2: Alternativa rapida via SQL (si se prefiere saltar la invitacion)**
Ejecutar directamente en Supabase para crear el usuario sin pasar por el flujo de invitacion:

1. Crear usuario en `auth.users` via el Dashboard de Supabase (Authentication > Users > Add User)
   - Email: `prueba@prueba.com`
   - Password: una contrasena de prueba segura
   - Auto-confirm: si

2. Ejecutar SQL para configurar profile y rol:
```sql
-- Insertar profile con telefono dummy
INSERT INTO public.profiles (id, email, display_name, phone)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'prueba@prueba.com'),
  'prueba@prueba.com',
  'Custodio Prueba',
  '5500000001'
);

-- Asignar rol custodio
INSERT INTO public.user_roles (user_id, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'prueba@prueba.com'),
  'custodio'
);
```

3. Para que Planeacion pueda asignarle servicios, solo necesitan usar:
   - `nombre_custodio`: "Custodio Prueba"
   - `telefono`: "5500000001"
   en la tabla `servicios_custodia` al crear o editar servicios.

### Como funciona la vinculacion

```text
profiles.phone = "5500000001"
         |
    normalizePhone()
         |
         v
servicios_custodia.telefono = "5500000001"  --> El custodio ve sus servicios
checklist_servicio.custodio_telefono        --> Ve sus checklists
documentos_custodio.custodio_telefono       --> Sube documentos
custodio_mantenimientos.custodio_telefono   --> Registra mantenimientos
```

### Recomendacion

Usar el **Paso 2** (SQL directo) es mas rapido para fines de entrenamiento. El Paso 1 (invitacion) es util si tambien quieren probar el flujo completo de onboarding.

### Archivos a modificar

Ninguno. Este plan solo requiere datos en la base de datos, no cambios de codigo.

