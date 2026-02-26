

# Hacer el LMS mas calido y mostrar nivel en la barra principal

## Problema 1: Nivel invisible en la pagina principal

La `ProgressMotivationalBar` muestra puntos como texto plano pero no incluye:
- Badge visual del nivel actual
- Barra de progreso hacia el siguiente nivel
- Cuantos puntos faltan de manera visual

## Problema 2: Pagina de Logros fria

El tab "Logros" usa cards planas con fondo gris, iconos de candado sin personalidad y cero uso de color/gradiente. No genera la sensacion de "logro desbloqueado" que los mejores LMS ofrecen.

## Cambios propuestos

### 1. Enriquecer ProgressMotivationalBar con nivel visual

**Archivo**: `src/components/lms/ProgressMotivationalBar.tsx`

Agregar debajo de la barra de progreso global:
- Un badge colorido con el nivel actual (ej: "Nivel 2" con fondo gradiente)
- Una mini barra de progreso XP mostrando avance hacia el siguiente nivel
- Texto: "80 pts para nivel 3" con la barra visual

```text
Antes:
  [barra progreso] 14% completado
  ★ 220 pts  |  🏅 0 pts para nivel 2

Despues:
  [barra progreso] 14% completado
  ┌─────────────────────────────────────────┐
  │ [★ Nivel 2]  220 pts                    │
  │ [████████████████░░░░░░] 80 pts → Nv. 3 │
  │ 🔥 Racha: 3 dias                        │
  └─────────────────────────────────────────┘
```

Cambios especificos:
- Importar `calcularNivel` y `puntosParaSiguienteNivel` (ya importa `puntosParaSiguienteNivel`)
- Calcular `progresoNivel` como porcentaje entre nivel actual y siguiente
- Agregar badge con gradiente para nivel: `bg-gradient-to-r from-yellow-500 to-amber-600 text-white`
- Agregar segunda Progress bar mas pequena (h-1.5) para XP del nivel
- Mover puntos y racha a la misma fila que el badge de nivel

### 2. Hacer la pagina de Logros mas calida y visual

**Archivo**: `src/components/lms/gamificacion/GamificacionWidget.tsx`

- Cambiar el gradiente del header a uno mas vibrante: `from-amber-500/15 via-yellow-500/10 to-orange-500/10`
- Agregar emoji/icono animado junto al nivel
- Usar colores mas calidos en las stats (no solo `bg-muted/50`)
- Badge de nivel con gradiente dorado en vez de `variant="secondary"`

**Archivo**: `src/components/lms/gamificacion/BadgesGrid.tsx`

- Badges obtenidos: fondo con gradiente calido (`from-amber-50 to-yellow-50`, dark: `from-amber-950/30 to-yellow-950/20`), borde dorado sutil, icono con color primario mas vibrante
- Badges bloqueados: mantener el estilo misterioso pero con un brillo sutil en hover (no solo opacity change)
- Agregar un anillo de progreso o efecto de "casi desbloqueado" si el usuario esta cerca de obtener un badge
- El contador "0 de 7 insignias" usar un mini progress bar en vez de solo texto

**Archivo**: `src/components/lms/certificados/MisCertificados.tsx`

- Cards de certificado con borde dorado sutil y gradiente calido de fondo
- Icono de certificado mas prominente con color dorado

### 3. Header del LMS mas acogedor

**Archivo**: `src/pages/LMS/LMSDashboard.tsx`

- Cambiar el header plano por uno con gradiente sutil: `bg-gradient-to-r from-primary/5 via-background to-amber-500/5`
- Agregar un saludo personalizado o frase motivacional rotativa
- Subtitulo mas calido: "Sigue creciendo, cada leccion cuenta" en vez de "Desarrolla tus habilidades con nuestros cursos"

## Resumen de archivos a modificar

1. `src/components/lms/ProgressMotivationalBar.tsx` - Agregar badge de nivel, barra XP visual, layout mas rico
2. `src/components/lms/gamificacion/GamificacionWidget.tsx` - Gradientes calidos, badge dorado, stats con color
3. `src/components/lms/gamificacion/BadgesGrid.tsx` - Badges con gradientes, hover effects, progress visual
4. `src/pages/LMS/LMSDashboard.tsx` - Header con gradiente y mensaje motivacional

## Sin migraciones SQL

Todo es cambio visual/UI con datos ya disponibles en los hooks existentes.
