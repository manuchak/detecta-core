
# Plan: Mejorar Navegación al Perfil Forense ✅ COMPLETADO

## Problema
- El nombre del custodio en la tabla no es clicable
- El usuario espera navegar al perfil al hacer clic en el nombre
- Actualmente solo el ícono de ojo (Eye) navega al perfil

## Solución Implementada

### 1. CustodiosDataTable.tsx ✅
- Nombre ahora es un botón clicable
- Navega a `/perfiles-operativos/custodio/{id}`

### 2. ArmadosDataTable.tsx ✅
- Nombre ahora es un botón clicable
- Navega a `/perfiles-operativos/armado/{id}`

### 3. BajasDataTable.tsx ✅
- Agregado `useNavigate` hook
- Nombre ahora navega al perfil según tipo (`custodio` o `armado`)

## Resultado
- Al hacer clic en cualquier nombre de la tabla, se navega al perfil forense completo
- En el perfil forense están disponibles:
  - Botón "Editar datos" en la tarjeta de contacto
  - Sección "Convertir a Armado" (solo para custodios)
- El ícono de ojo (Eye) permanece como alternativa visual
