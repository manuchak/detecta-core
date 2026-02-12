

## Mejoras de UI/UX para Custodios con Dificultad Tecnologica

### Problemas identificados en el flujo actual

**Registro (`CustodianSignup.tsx`)**
1. Los campos de contrasena usan `type="password"` sin opcion de mostrar/ocultar - los mayores cometen errores de escritura sin poder verificar
2. El placeholder `"••••••••"` no comunica nada util
3. El texto "Minimo 6 caracteres" es muy pequeno (`text-xs`) y facil de ignorar
4. No hay indicador visual de fortaleza de contrasena mientras escriben
5. Los mensajes de error de validacion son pequenos y tecnicos
6. El formulario tiene 4 campos + boton, lo cual puede sentirse abrumador

**Login (`Login.tsx`)**
1. El boton de mostrar contrasena es muy pequeno (7x7 px) - dificil de tocar en movil
2. El link "Olvidaste tu contrasena?" es gris claro (`text-muted-foreground`) y pequeno - casi invisible
3. No hay indicacion clara de que hacer cuando la contrasena es incorrecta vs cuenta no existe
4. El mensaje "Por favor completa todos los campos" es generico

**Ambos flujos**
1. Los inputs tienen tamano estandar - demasiado pequenos para dedos de personas mayores
2. No hay confirmacion visual clara de lo que estan escribiendo
3. Los textos de ayuda son muy pequenos

### Cambios propuestos

**1. Login.tsx - Hacerlo mas accesible**

- Aumentar tamano de inputs: agregar clase `h-12 text-base` para targets tactiles mas grandes
- Boton mostrar contrasena mas grande: cambiar de `h-7 w-7` a `h-10 w-10` con icono mas grande
- Link "Olvidaste tu contrasena?" mas visible: cambiar a `text-base text-primary font-medium` con mas padding
- Agregar texto de ayuda debajo del campo email: "Usa el email con el que te registraste"
- Boton de login mas grande: agregar `h-12 text-base font-semibold`
- Mensajes de error mas descriptivos y grandes con iconos

**2. CustodianSignup.tsx - Simplificar y agrandar**

- Agregar boton mostrar/ocultar contrasena (igual que Login) en ambos campos de password
- Aumentar tamano de todos los inputs: `h-12 text-base`
- Cambiar placeholder de contrasena de `"••••••••"` a `"Escribe tu contraseña"`
- Hacer el texto de ayuda "Minimo 6 caracteres" mas grande: `text-sm` con icono informativo
- Agregar indicador visual simple de contrasena: checkmark verde cuando cumple minimo 6 caracteres
- Boton de registro mas grande: `h-12 text-base font-semibold`
- Agregar un mensaje de bienvenida mas calido arriba del formulario
- Titulo del CardDescription mas claro: "Llena estos datos para crear tu cuenta. Si necesitas ayuda, contacta a tu coordinador."

**3. ResendConfirmationForm.tsx - Mas claro**

- Aumentar tamano de texto explicativo
- Agregar instrucciones mas claras en lenguaje coloquial
- Boton mas grande y visible

### Detalles tecnicos

**Archivos a modificar:**

| Archivo | Cambios |
|---|---|
| `src/pages/Auth/Login.tsx` | Inputs h-12, boton eye mas grande, link forgot-password mas visible, boton submit h-12, textos de ayuda |
| `src/pages/Auth/CustodianSignup.tsx` | Toggle password visibility en ambos campos, inputs h-12, placeholders descriptivos, indicador de requisito cumplido, boton h-12, copy mas calido |
| `src/components/auth/ResendConfirmationForm.tsx` | Textos mas grandes, instrucciones en lenguaje coloquial |

**Principios de diseno aplicados:**
- Targets tactiles minimo 48px (h-12 = 48px)
- Texto base minimo 16px (`text-base`) para evitar zoom en iOS
- Contraste alto en elementos interactivos
- Lenguaje coloquial y directo, sin jerga tecnica
- Feedback visual inmediato (checkmarks, colores)
- Opcion de ver contrasena en todos los campos de password

