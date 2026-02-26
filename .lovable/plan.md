

# Rediseno UX del Dashboard LMS: Centrado en el Alumno

## Diagnostico

La pantalla actual esta construida como un dashboard analitico (metricas arriba, tabs abajo, grids de cards). Funciona, pero no responde de manera eficiente a las preguntas del user persona. Los mejores LMS del mercado (Duolingo, Coursera, Platzi, Khan Academy) comparten un patron: **hero de accion inmediata + progreso motivacional ambiental**.

## Preguntas del User Persona vs. Solucion Propuesta

| Pregunta del alumno | Estado actual | Propuesta |
|---|---|---|
| Que debo hacer AHORA? | Escondido en tab Mi Onboarding | Hero card con CTA prominente del siguiente curso |
| Cuanto me falta? | Disperso en cards | Barra de progreso global persistente + tiempo estimado restante |
| Estoy en riesgo? | Bien resuelto con badges rojos | Mantener, elevar alertas vencidas al hero |
| Cuanto he logrado? | Numeros frios (6, 3, 1) | Streak/racha + horas de aprendizaje + micro-celebraciones |
| Cuanto tiempo me tomara? | Solo duracion individual | Tiempo restante agregado por onboarding y por curso en progreso |
| Hay algo nuevo? | Catalogo con filtros (bien) | Mantener tal cual |
| Como me comparo? | No existe | Opcional: % de equipo que ya completo |

## Cambios Propuestos

### 1. Nuevo componente Hero: "Continua Aprendiendo"

Reemplazar el bloque `CategoryProgressSummary` como primera seccion visible por un hero card que responda la pregunta #1 inmediatamente:

```text
+----------------------------------------------------------+
|  [icono curso]                                           |
|  Continua donde te quedaste                              |
|  "Onboarding Custodia Vehicular"                         |
|  [==========>          ] 45%  ·  ~18 min restantes       |
|                                                          |
|  [  Continuar ahora  ->  ]                               |
+----------------------------------------------------------+
```

- Muestra el curso mas urgente: vencido > en_progreso > inscrito obligatorio
- Incluye progreso visual y tiempo estimado restante
- Un solo boton CTA que lleva directo al contenido
- Si no hay curso pendiente, muestra felicitacion o sugiere catalogo

**Archivo nuevo**: `src/components/lms/ContinueLearningHero.tsx`

**Logica**: Toma los cursos de `useLMSCursosDisponibles`, prioriza por urgencia (vencido > en_progreso con deadline > en_progreso > inscrito obligatorio), y muestra el primero.

### 2. Barra de Progreso Motivacional

Reemplazar los 3 contadores frios (Inscritos/En Progreso/Completados) por una seccion mas motivacional:

```text
+----------------------------------------------------------+
|  Tu Progreso                                             |
|  [=====████████████░░░░] 4/6 cursos  ·  12.5 hrs        |
|                                                          |
|  Racha: 3 dias  ·  Puntos: 450  ·  Siguiente badge: 50pts|
+----------------------------------------------------------+
```

- Barra de progreso global (cursos completados / total asignados)
- Horas totales de aprendizaje acumuladas
- Gamificacion ambiental: racha, puntos, proximo badge (datos ya disponibles en `useLMSGamificacion`)

**Archivo nuevo**: `src/components/lms/ProgressMotivationalBar.tsx`

### 3. Seccion "Mis Cursos" como lista compacta, no grid

Cambiar el grid de cards grandes por una lista compacta estilo Coursera/Platzi para cursos en progreso. Las cards grandes son para descubrimiento (catalogo); los cursos en progreso necesitan ser escaneables rapidamente:

```text
Mis Cursos en Progreso (3)
+----------------------------------------------------------+
| [thumb] ADN DETECTA           [=====>    ] 35%  15min    |
| [thumb] Toolkit Soluciones    [>         ]  0%  45min    |
| [thumb] Procesos Core         [>         ]  0%  30min    |
+----------------------------------------------------------+
```

- Cada fila: thumbnail mini + titulo + barra progreso + tiempo restante + CTA
- Mucho mas scannable que 3 cards de 300px de alto
- Las cards grandes se mantienen en Catalogo y Completados

**Archivo nuevo**: `src/components/lms/CompactCourseList.tsx`

### 4. Simplificar tabs

Reducir de 6 tabs a 4 (los usuarios no usan tantas tabs):

- **Mi Ruta** (merge de "Mi Onboarding" + "Mis Cursos" - son lo mismo para el alumno)
- **Catalogo** (mantener)
- **Completados** (mantener)  
- **Logros** (merge de Certificados + Logros + Badges en una sola vista)

### 5. Mover CategoryProgressSummary

El `CategoryProgressSummary` actual es util pero no es lo primero que el alumno necesita ver. Moverlo dentro del tab "Mi Ruta" como seccion colapsable debajo de la lista de cursos, no arriba de todo.

## Cambios Tecnicos

### Archivos nuevos
1. `src/components/lms/ContinueLearningHero.tsx` - Hero card con siguiente curso prioritario y CTA
2. `src/components/lms/ProgressMotivationalBar.tsx` - Barra motivacional con progreso global, horas, racha y puntos
3. `src/components/lms/CompactCourseList.tsx` - Lista compacta de cursos en progreso (fila por curso, no card)

### Archivos modificados
1. `src/pages/LMS/LMSDashboard.tsx` - Restructurar layout:
   - Arriba: `ContinueLearningHero` (siempre visible si hay curso pendiente)
   - Debajo: `ProgressMotivationalBar` (siempre visible)
   - Tabs reducidos a 4: Mi Ruta, Catalogo, Completados, Logros
   - Tab "Mi Ruta": `CompactCourseList` + `OnboardingPath` + `CategoryProgressSummary` (colapsable)
   - Tab "Logros": combina `GamificacionWidget` + `BadgesGrid` + `MisCertificados`

### Datos utilizados (sin nuevas queries)
- `useLMSCursosDisponibles()` - ya tiene progreso, estado, duracion, es_obligatorio
- `useLMSOnboardingStatus()` - ya tiene stats de onboarding
- `useLMSGamificacion()` (hook existente) - puntos, racha, badges

### Sin migraciones SQL
Todo se resuelve con datos ya disponibles en los hooks existentes.

## Resultado esperado

El alumno abre la pantalla y en menos de 3 segundos sabe:
1. Que curso continuar (hero)
2. Cuanto le falta en total (barra motivacional)
3. Si tiene algo vencido (alerta en hero)
4. Cuantos puntos/racha lleva (gamificacion ambiental)

Sin necesidad de hacer clic en ningun tab para responder sus preguntas mas urgentes.
