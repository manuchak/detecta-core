
# Rediseño Completo del Módulo de Reportes LMS para Head de Capacitación y Onboarding

## Vision Ejecutiva

Este plan transforma el módulo de Reportes LMS actual en un **Centro de Inteligencia de Capacitación** que permite a un Head de Capacitación y Onboarding responder las preguntas clave que guían su gestión diaria:

1. **¿Cuántos empleados están capacitándose?** (Adopción)
2. **¿Están avanzando a tiempo?** (Progreso y Alertas)
3. **¿Están aprendiendo?** (Rendimiento en Evaluaciones)
4. **¿El sistema de incentivos funciona?** (Gamificación)
5. **¿Qué onboardings requieren atención inmediata?** (Alertas Críticas)

---

## Arquitectura de Información: Pirámide Invertida

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                     HERO CARD: "Health Score LMS"                       │
│  Semáforo visual instantáneo: Verde (>80%), Amarillo (50-80%), Rojo    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
     ┌──────────────────────────────┼──────────────────────────────────┐
     ▼                              ▼                                  ▼
┌─────────────┐            ┌─────────────────┐              ┌──────────────────┐
│   ALERTAS   │            │   KPIs HERO     │              │   ACCIONES       │
│  CRÍTICAS   │            │   (4 Cards)     │              │   RÁPIDAS        │
│  Onboarding │            │                 │              │   Exportar/      │
│  Vencidos   │            │                 │              │   Inscribir      │
└─────────────┘            └─────────────────┘              └──────────────────┘
                                    │
     ┌─────────────┬────────────────┼─────────────┬─────────────────────┐
     ▼             ▼                ▼             ▼                     ▼
┌──────────┐ ┌──────────┐    ┌──────────┐  ┌──────────────┐    ┌───────────────┐
│ ADOPCIÓN │ │ PROGRESO │    │RENDIMIENTO│ │ GAMIFICACIÓN │    │  ONBOARDING   │
│ Tab      │ │ Tab      │    │ Tab       │ │ Tab          │    │  Tab (NUEVO)  │
└──────────┘ └──────────┘    └──────────┘  └──────────────┘    └───────────────┘
```

---

## Fase 1: Corrección Crítica de RLS

### Problema Detectado
El rol `capacitacion_admin` no tiene acceso a las tablas necesarias para métricas:

**Tablas afectadas:**
- `lms_inscripciones` - No incluye `capacitacion_admin` en política SELECT
- `lms_gamificacion_perfil` - Solo permite `usuario_id = auth.uid()`
- `profiles` - Acceso limitado puede fallar para conteo de usuarios

### Solución: Actualizar Políticas RLS

```sql
-- Política para lms_inscripciones (modificar existente)
CREATE POLICY "lms_inscripciones_select_reports" ON lms_inscripciones
FOR SELECT USING (
  usuario_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'capacitacion_admin', 'coordinador_operaciones', 'bi')
    AND ur.is_active = true
  )
);

-- Política para lms_gamificacion_perfil (agregar nueva)
CREATE POLICY "lms_gamificacion_perfil_select_admin" ON lms_gamificacion_perfil
FOR SELECT USING (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'capacitacion_admin')
    AND ur.is_active = true
  )
);

-- Similar para lms_progreso, lms_badges_usuario
```

---

## Fase 2: Nuevo Componente Hero Principal

### Archivo: `src/components/lms/reportes/LMSReportesHero.tsx`

Componente de cabecera que muestra:
- **Health Score LMS**: Indicador compuesto (0-100) basado en adopción + progreso + rendimiento
- **Semáforo visual**: Badge grande con color según health score
- **Contexto temporal**: Periodo seleccionado
- **Botones de acción**: Exportar PDF, Inscripción Masiva

```tsx
interface LMSHealthScore {
  score: number;              // 0-100
  status: 'excellent' | 'good' | 'warning' | 'critical';
  components: {
    adopcion: number;         // peso 30%
    progreso: number;         // peso 30%
    rendimiento: number;      // peso 25%
    engagement: number;       // peso 15%
  };
  trend: number;              // +/- vs periodo anterior
}
```

---

## Fase 3: Panel de Alertas Críticas

### Archivo: `src/components/lms/reportes/LMSAlertasCriticas.tsx`

Banner colapsable que muestra situaciones que requieren atención inmediata:

| Alerta | Trigger | Acción |
|--------|---------|--------|
| Onboarding Vencido | Curso obligatorio sin completar + fecha límite pasada | Link a lista de usuarios |
| Progreso Estancado | >7 días sin actividad en curso activo | Notificación al usuario |
| Quiz Problemático | Tasa aprobación <40% en quiz | Revisar contenido |
| Abandono Masivo | >20% abandonos en un curso | Investigar causa |

---

## Fase 4: Nueva Tab "Onboarding" (NUEVO)

### Vista Específica para Gestión de Onboarding

El Head de Capacitación necesita una vista dedicada para nuevos ingresos:

**Archivo: `src/components/lms/reportes/LMSOnboardingDashboard.tsx`**

**Métricas específicas:**
1. **Nuevos Ingresos Activos**: Usuarios en cursos categoría 'onboarding'
2. **Tasa de Completación Onboarding**: % que completa dentro del plazo
3. **Tiempo Promedio de Onboarding**: Días desde inscripción hasta completación
4. **Próximos a Vencer**: Lista de onboardings con <3 días restantes

**Visualización:**
- Timeline de progreso por cohorte (usuarios que iniciaron misma semana)
- Tabla de usuarios en onboarding con estado semáforo
- Gráfico de embudo: Inscrito → En Progreso → Completado

### Archivo: `src/hooks/lms/useLMSOnboardingMetrics.ts`

```typescript
interface LMSOnboardingMetrics {
  usuariosEnOnboarding: number;
  completadosEstaSemana: number;
  tasaCompletacionPlazo: number;  // dentro del plazo asignado
  tiempoPromedioCompletacionDias: number;
  
  usuariosPorEstado: {
    alDia: OnboardingUsuario[];      // progreso >= esperado por días
    atrasados: OnboardingUsuario[];  // progreso < esperado
    enRiesgo: OnboardingUsuario[];   // <3 días y <70% progreso
    vencidos: OnboardingUsuario[];   // pasaron fecha límite
  };
  
  cohortes: CohortMetrics[];         // agrupados por semana de inicio
}

interface OnboardingUsuario {
  usuarioId: string;
  nombre: string;
  email: string;
  cursoId: string;
  cursoTitulo: string;
  fechaInscripcion: string;
  fechaLimite: string;
  progreso: number;
  diasRestantes: number;
  ultimaActividad: string | null;
}
```

---

## Fase 5: Mejoras al Dashboard de Adopción

### Métricas Nuevas

1. **Tasa de Adopción por Rol**: ¿Qué roles tienen menor participación?
2. **Cursos Sin Inscripciones**: Identificar contenido "muerto"
3. **Velocidad de Inscripción**: Días promedio entre publicación y primera inscripción

### Gráfico Nuevo: Funnel de Estados

```text
Inscrito (100) ──▶ En Progreso (75) ──▶ Completado (45)
                         │
                         ▼
                    Abandonado (10) / Vencido (5)
```

---

## Fase 6: Mejoras al Dashboard de Progreso

### Métricas Nuevas

1. **Usuarios Inactivos**: Sin actividad en últimos 7 días
2. **Contenido Bloqueante**: Contenidos donde >50% usuarios se atascan
3. **Velocidad de Avance**: Contenidos completados/día promedio

### Visualización Nueva: Heatmap de Actividad

Matriz días de la semana × horas que muestra cuándo estudian los usuarios.
Útil para programar recordatorios o live sessions.

---

## Fase 7: Mejoras al Dashboard de Rendimiento

### Métricas Nuevas

1. **Preguntas Problemáticas**: Preguntas con tasa de error >60%
2. **Mejora por Reintento**: ¿El segundo intento mejora resultados?
3. **Correlación Contenido-Quiz**: ¿Ver más tiempo el contenido mejora el quiz?

### Tabla Expandida: Detalle por Pregunta

Para cada quiz, poder expandir y ver rendimiento por pregunta individual.

---

## Fase 8: Mejoras al Dashboard de Gamificación

### Métricas Nuevas

1. **Engagement Score**: Puntos ganados / Puntos posibles
2. **Efectividad de Badges**: ¿Obtener badge aumenta actividad?
3. **Rachas Rotas**: Usuarios que perdieron racha esta semana

### Visualización Nueva: Leaderboard Interactivo

- Filtrable por departamento/rol
- Mostrar movimiento de posición (subió/bajó)
- Highlight especial para nuevos en top 10

---

## Fase 9: Exportación y Acciones

### Botón "Exportar Reporte PDF"

Genera documento con:
- Resumen ejecutivo (Health Score + KPIs)
- Gráficos principales
- Lista de alertas activas
- Recomendaciones automáticas

### Botón "Notificar Usuarios Atrasados"

Acción masiva para enviar recordatorio a usuarios:
- En riesgo de vencer
- Sin actividad >7 días
- Pendientes de quiz

---

## Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `src/components/lms/reportes/LMSReportesHero.tsx` | Header con Health Score y acciones |
| `src/components/lms/reportes/LMSAlertasCriticas.tsx` | Banner de alertas colapsable |
| `src/components/lms/reportes/LMSOnboardingDashboard.tsx` | Nueva tab de Onboarding |
| `src/hooks/lms/useLMSOnboardingMetrics.ts` | Hook para métricas de onboarding |
| `src/hooks/lms/useLMSHealthScore.ts` | Hook para score compuesto |
| `src/types/lms-onboarding-reports.ts` | Tipos para onboarding |

## Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/LMS/LMSReportes.tsx` | Agregar Hero, Alertas, nueva tab Onboarding |
| `src/hooks/lms/useLMSAdopcionMetrics.ts` | Agregar métricas por rol, cursos sin inscripciones |
| `src/hooks/lms/useLMSProgresoMetrics.ts` | Agregar usuarios inactivos, contenido bloqueante |
| `src/hooks/lms/useLMSRendimientoMetrics.ts` | Agregar análisis por pregunta |
| `src/hooks/lms/useLMSGamificacionMetrics.ts` | Agregar engagement score |
| `src/components/lms/reportes/LMSAdopcionDashboard.tsx` | Nuevos gráficos y métricas |
| `src/components/lms/reportes/LMSProgresoDashboard.tsx` | Heatmap y usuarios inactivos |
| `src/components/lms/reportes/LMSRendimientoDashboard.tsx` | Detalle por pregunta |
| `src/components/lms/reportes/LMSGamificacionDashboard.tsx` | Leaderboard mejorado |

## Migraciones SQL Necesarias

```sql
-- 1. Actualizar política lms_inscripciones para capacitacion_admin
DROP POLICY IF EXISTS "lms_inscripciones_select" ON lms_inscripciones;
CREATE POLICY "lms_inscripciones_select" ON lms_inscripciones
FOR SELECT USING (
  usuario_id = auth.uid() 
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'capacitacion_admin', 'coordinador_operaciones', 'bi')
    AND ur.is_active = true
  )
);

-- 2. Agregar política para gamificación
CREATE POLICY "lms_gamificacion_perfil_admin_select" ON lms_gamificacion_perfil
FOR SELECT USING (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'capacitacion_admin')
    AND ur.is_active = true
  )
);

-- 3. Agregar política para progreso
DROP POLICY IF EXISTS "Users read own progress" ON lms_progreso;
CREATE POLICY "lms_progreso_select" ON lms_progreso
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM lms_inscripciones i 
    WHERE i.id = lms_progreso.inscripcion_id 
    AND i.usuario_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'capacitacion_admin')
    AND ur.is_active = true
  )
);

-- 4. Agregar política para badges de usuario
DROP POLICY IF EXISTS "Users read own badges" ON lms_badges_usuario;
CREATE POLICY "lms_badges_usuario_select" ON lms_badges_usuario
FOR SELECT USING (
  usuario_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'owner', 'supply_admin', 'capacitacion_admin')
    AND ur.is_active = true
  )
);
```

---

## Priorización de Implementación

| Prioridad | Tarea | Esfuerzo |
|-----------|-------|----------|
| **P0** | Corregir políticas RLS | Bajo |
| **P0** | LMSReportesHero con Health Score | Medio |
| **P1** | LMSAlertasCriticas | Medio |
| **P1** | LMSOnboardingDashboard | Alto |
| **P2** | Mejoras Adopción (funnel, por rol) | Medio |
| **P2** | Mejoras Progreso (heatmap, inactivos) | Medio |
| **P3** | Mejoras Rendimiento (por pregunta) | Medio |
| **P3** | Mejoras Gamificación (engagement) | Bajo |
| **P4** | Exportación PDF | Alto |
| **P4** | Notificaciones masivas | Alto |

---

## Beneficios Esperados

| Antes | Después |
|-------|---------|
| Error al cargar métricas (RLS) | Acceso completo para capacitacion_admin |
| 4 tabs sin jerarquía clara | Hero + Alertas + 5 tabs organizadas |
| Sin vista de onboarding | Dashboard dedicado con alertas de vencimiento |
| Sin Health Score | Indicador único de salud del LMS |
| Sin acciones rápidas | Exportar, Notificar, Inscribir desde reportes |
| Sin identificación de problemas | Alertas automáticas de contenido/usuarios problemáticos |

