

# Fix: Licencia de conducir opcional para armados en liberación

## Problema
En `LiberacionChecklistModal.tsx`, el campo `documentacion_licencia` es un **RED gate** (bloqueante) para ambos tipos de operativo. Para armados, este campo se reetiqueta como "Portación de arma" pero sigue siendo obligatorio. El usuario necesita que la licencia de conducir no sea requisito para armados, ya que no tienen obligación de manejar.

## Cambios en un solo archivo

**`src/components/liberacion/LiberacionChecklistModal.tsx`** — 3 puntos de edición:

### 1. Gate system (líneas 431-435)
Mover `documentacion_licencia` de RED a YELLOW cuando `tipo_operativo === 'armado'`:

```typescript
// Antes: RED para ambos
if (!liberacion.documentacion_licencia) {
  red.push(liberacion.tipo_operativo === 'armado' ? 'Portación de arma faltante' : 'Licencia de conducir faltante');
}

// Después: RED solo para custodios, YELLOW para armados
if (!liberacion.documentacion_licencia) {
  if (liberacion.tipo_operativo === 'armado') {
    yellow.push('Portación de arma no registrada (opcional)');
  } else {
    red.push('Licencia de conducir faltante');
  }
}
```

### 2. Badge de documentación (líneas 741-750)
Ajustar la condición del badge destructive/success para no exigir licencia a armados:

```typescript
// Antes: ambos campos obligatorios para badge
{(!liberacion.documentacion_ine || !liberacion.documentacion_licencia) && ...}

// Después: licencia solo obligatoria para custodios
{(!liberacion.documentacion_ine || (liberacion.tipo_operativo !== 'armado' && !liberacion.documentacion_licencia)) && ...}
```

Mismo ajuste para el badge de "OK":
```typescript
{liberacion.documentacion_ine && (liberacion.tipo_operativo === 'armado' || liberacion.documentacion_licencia) && progress.documentacion === 100 && ...}
```

### Impacto
- Custodios: sin cambios, licencia sigue siendo obligatoria
- Armados: "Portación de arma" pasa a ser advertencia amarilla, no bloquea la liberación

