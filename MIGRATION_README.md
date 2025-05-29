
# Migración al Proyecto Detecta

## Estado de la Migración

✅ **Completado:**
- Migración de esquema de base de datos (excepto servicios_custodia y users)
- Creación de todas las tablas necesarias
- Configuración de funciones de base de datos
- Políticas RLS básicas

🔄 **Pendiente:**
- Actualizar credenciales del proyecto Detecta
- Migrar Edge Functions al nuevo proyecto
- Actualizar secrets y variables de entorno
- Pruebas de funcionalidad

## Credenciales Necesarias

Para completar la migración, necesitas proporcionar:

1. **URL del proyecto Detecta**: `https://[PROJECT-ID].supabase.co`
2. **Anon Key**: La clave publishable/anon del proyecto Detecta
3. **Project ID**: El identificador único del proyecto Detecta

## Archivos a Actualizar

Una vez que tengas las credenciales:

1. `src/integrations/supabase/client.ts` - Actualizar SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY
2. `supabase/config.toml` - Actualizar project_id

## Edge Functions por Migrar

Las siguientes Edge Functions necesitan ser recreadas en el proyecto Detecta:
- add-permission
- create-role  
- update-role
- delete-role
- create-readonly-access
- assign-role

## Próximos Pasos

1. Obtener credenciales del proyecto Detecta
2. Actualizar configuración de cliente
3. Migrar Edge Functions
4. Probar funcionalidad completa
5. Migrar datos (si es necesario)
