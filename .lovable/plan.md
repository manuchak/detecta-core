

# Crear ARCHITECTURE.md y .cursorrules para Detecta Core

## Objetivo

Generar dos archivos de referencia en la raiz del proyecto que permitan a cualquier LLM de programacion (Cursor, Copilot, Windsurf, etc.) entender rapidamente la estructura, convenciones y restricciones del codebase sin necesidad de indexacion AST ni embeddings.

## Archivos a crear

### 1. `ARCHITECTURE.md`

Documento exhaustivo (~3000 palabras) cubriendo:

- **Stack**: React 18 + Vite + TypeScript + Tailwind + shadcn/ui + Supabase
- **Estructura de carpetas**: Mapa de `src/` con descripcion de cada directorio (components, hooks, contexts, services, types, constants, layouts, pages, integrations)
- **Modulos del negocio**: Monitoreo, Planeacion, Supply/Leads, CRM, Customer Success, LMS, Facturacion, Seguridad, Instalaciones, Tickets, Reportes, StarMap
- **Arquitectura de datos**: Supabase como backend, RPC functions para queries complejas, Edge Functions para logica servidor, patron `useAuthenticatedQuery` con TanStack Query
- **Hooks canonicos**: Tabla de los hooks criticos y su fuente de datos (ej. `usePerformanceHistorico` → `servicios_planificados` + `servicios_custodia`, `useServiciosTurnoLive` → realtime subscriptions)
- **Sistema de autenticacion**: `AuthContext` → `get_current_user_role_secure()` RPC, roles en tabla separada `user_roles`, permisos UI-only vs RLS server-side
- **Control de acceso**: `constants/accessControl.ts` como fuente unica, `RoleProtectedRoute`, `RoleBlockedRoute`, portales de campo (custodio, armado, instalador)
- **Patrones UI**: Mobile-first con `useIsMobile()`, patron pill/card compacto para movil, `AppShell` + `UnifiedLayout` + `DashboardLayout`
- **Edge Functions**: Lista de las ~50 funciones con descripcion breve por categoria (operaciones, supply, seguridad, integraciones, IA)
- **Convenciones de nombrado**: Hooks `use[Entidad]`, pages en PascalCase por modulo, componentes agrupados por dominio

### 2. `.cursorrules`

Archivo de reglas para Cursor AI (~80 lineas) con:

- Stack y restricciones (no Next.js, no backend directo, solo Supabase)
- Reglas de seguridad: roles en tabla separada, nunca localStorage para auth, RLS obligatorio
- Patrones de codigo: hooks con TanStack Query, shadcn/ui para componentes, Tailwind para estilos
- Convenciones movil: siempre verificar `useIsMobile()`, padding compacto, pills en vez de cards grandes
- Imports: alias `@/` obligatorio, roles desde `constants/accessControl.ts`
- Supabase: usar `supabase` client de `@/integrations/supabase/client`, RPC para queries complejas
- Edge Functions: TypeScript, Deno runtime, patron request/response estandar
- Archivos clave a consultar antes de modificar modulos especificos

## Archivos a crear
- `ARCHITECTURE.md` (raiz del proyecto)
- `.cursorrules` (raiz del proyecto)

