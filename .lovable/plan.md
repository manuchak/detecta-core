
# Plan v11: Fix Definitivo - Prevenir Desmontaje por Loading Transitorio

## Análisis de la Causa Raíz (10 versiones de aprendizaje)

### La Secuencia Completa del Bug

```text
1. Usuario toca "Tomar foto"
2. Cámara nativa se abre, app va a background
3. Usuario captura foto y acepta
4. App regresa a foreground
         │
         ▼
5. Supabase Auth detecta que la app volvió
   (evento TOKEN_REFRESHED o VISIBILITY_CHANGE)
         │
         ▼
6. useStableAuth.onAuthStateChange() se dispara
         │
         ▼
7. updateAuthState(session) → setUser(newSession.user)
   (nueva referencia de objeto, aunque sea el mismo usuario)
         │
         ▼
8. useCustodianProfile.useEffect() detecta cambio en 'user'
         │
         ▼
9. fetchProfile() se ejecuta
         │
         ▼
10. setLoading(true) ← PROBLEMA CLAVE
         │
         ▼
11. CustodianOnboarding ve profileLoading = true
         │
         ▼
12. Renderiza SPINNER en lugar del wizard
         │
         ▼
13. ★★★ DocumentUploadStep SE DESMONTA ★★★
    (TODO el estado local se pierde: preview, file, etc.)
         │
         ▼
14. fetchProfile() completa → setLoading(false)
         │
         ▼
15. CustodianOnboarding renderiza wizard de nuevo
         │
         ▼
16. DocumentUploadStep se MONTA desde cero
    (preview = null, file = null)
         │
         ▼
17. Usuario ve "Tomar foto" en lugar de su imagen
```

### Por qué cada versión anterior falló

| Versión | Lo que arreglamos | Por qué no funcionó |
|---------|-------------------|---------------------|
| v1-v6 | Compresión de imagen | Síntoma incorrecto |
| v7 | Input dinámico | Arregló captura, no rendering |
| v8 | Diagnósticos img | Reveló que img no se renderiza |
| v9 | Base64 en lugar de blob | Formato correcto, pero componente se desmonta |
| v10 | refetchOnWindowFocus: false | Solo arregló useCustodianDocuments, pero el problema está en useCustodianProfile |

### La Evidencia Clave

En `useCustodianProfile.ts` línea 23-29:
```typescript
useEffect(() => {
  if (user && !authLoading) {
    fetchProfile();  // ← Se re-ejecuta cuando 'user' cambia de referencia
  }
}, [user, authLoading]);
```

Y en `fetchProfile()` línea 31-33:
```typescript
const fetchProfile = async () => {
  try {
    setLoading(true);  // ← Causa el spinner que desmonta DocumentUploadStep
```

## Solución v11

### Cambio 1: No mostrar loading si ya tenemos perfil

En `useCustodianProfile.ts`, modificar `fetchProfile` para evitar el parpadeo de loading:

```typescript
const fetchProfile = async (silent = false) => {
  try {
    // v11: Solo mostrar loading si no hay perfil cargado
    // Esto evita desmontar componentes hijos cuando la app regresa de background
    if (!silent && !profile) {
      setLoading(true);
    }
    
    // ... resto del código igual
```

### Cambio 2: Usar fetch silencioso en re-ejecuciones

En el useEffect, usar fetch silencioso si ya tenemos perfil:

```typescript
useEffect(() => {
  if (user && !authLoading) {
    // v11: Si ya tenemos perfil, hacer refresh silencioso
    // para no desmontar componentes hijos
    fetchProfile(!!profile);
  } else if (!authLoading) {
    setLoading(false);
  }
}, [user, authLoading]);
```

### Cambio 3: Actualizar badge de versión

En `DocumentUploadStep.tsx`:
```typescript
const VERSION = 'v11';
```

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useCustodianProfile.ts` | Agregar parámetro `silent` a fetchProfile para evitar loading cuando ya hay perfil |
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Actualizar VERSION a v11 |

## Por qué esta solución es definitiva

1. **Ataca la causa raíz**: El problema no es la captura de imagen, sino el desmontaje del componente
2. **No rompe nada existente**: El loading inicial sigue funcionando normalmente
3. **Patrón establecido**: Similar a `refetchOnWindowFocus: false` pero para hooks manuales
4. **Sin efectos secundarios**: Solo evita el parpadeo de UI, no cambia la lógica de datos

## Flujo Esperado v11

```text
Usuario toca "Tomar foto"
         │
         ▼
Cámara nativa se abre
         │
         ▼
Usuario captura foto
         │
         ▼
App regresa a foreground
         │
         ├─────────────────────────────────────────┐
         │                                         │
         ▼                                         ▼
input.onchange dispara              Supabase Auth event dispara
processFile() ejecuta                       │
fileToBase64() convierte                    ▼
setPreview(dataUrl)                 useStableAuth actualiza
Toast "Foto lista"                          │
         │                                  ▼
         │                          useCustodianProfile detecta
         │                                  │
         │                                  ▼
         │                          fetchProfile(silent=true)
         │                          ↓
         │                          setLoading(true) ← IGNORADO (profile existe)
         │                                  │
         ▼                                  ▼
   DocumentUploadStep              CustodianOnboarding NO
   MANTIENE su estado              muestra spinner
   (preview = dataUrl)                      │
         │                                  │
         ▼                                  │
   img.onLoad dispara                       │
   Toast "✓ Imagen visible"                 │
         │                                  │
         ▼                                  │
   ★★★ ÉXITO ★★★                           │
   Usuario ve su foto                       │
         │                                  │
         └──────────────────────────────────┘
```

## Verificación

1. Actualizar app y confirmar badge **"v11"**
2. Tomar foto
3. Al regresar de la cámara:
   - NO debe aparecer spinner de carga
   - La secuencia de toasts debe completarse
   - La imagen DEBE ser visible
4. Verificar que "Guardar documento" funciona normalmente

## Notas Técnicas

### Por qué useRef no funcionaría aquí

Usar `useRef` para guardar el preview evitaría perder el valor, pero el componente aún se desmontaría y remontaría, causando parpadeo de UI y potenciales problemas con otros estados.

### Por qué levantar el estado al padre no es ideal

Mover `preview` al padre (CustodianOnboarding) funcionaría, pero:
1. Complicaría innecesariamente el código
2. El componente DocumentUploadStep perdería su encapsulamiento
3. No resuelve el problema de fondo (el desmontaje innecesario)

### Impacto en otros flujos

Este fix beneficia a TODOS los flujos del portal custodio que usan `useCustodianProfile`, no solo el onboarding de documentos. Cualquier componente que dependa de este hook ya no sufrirá desmontajes innecesarios al regresar de apps nativas.
