

## Mejoras de Persistencia para el Wizard de Creacion de Cursos LMS

### Contexto del problema

La Training Manager construye cursos consultando materiales en otras pestanas del navegador (documentos, videos, plataformas de contenido). Cuando navega fuera del wizard --ya sea por navegacion interna de la app (SPA) o por cerrar/refrescar la pestana-- puede perder trabajo parcial.

### Que ya funciona bien

La infraestructura actual (`useFormPersistence` nivel `robust`) ya cubre:
- Guardado automatico con debounce de 800ms
- Backup dual en localStorage + sessionStorage
- Flush inmediato al ocultar la pestana (`visibilitychange`)
- Flush al cerrar pestana (`pagehide`)
- Advertencia al cerrar navegador (`beforeunload`)
- Deteccion de borradores huerfanos con prompt de restauracion
- Reconciliacion al volver a la pestana (compara progreso)

### Gaps identificados

**Gap 1: Navegacion SPA sin proteccion**
Cuando el usuario navega a otra ruta dentro de la app (ej: clic en sidebar, boton "atras"), el componente se desmonta. Si el debounce de 800ms no ha terminado, se pierde el ultimo cambio. Ademas, no hay confirmacion antes de salir -- el usuario simplemente pierde la pagina.

**Gap 2: Flush en unmount no existe**
El cleanup del `useEffect` solo limpia el timeout, pero nunca ejecuta el save pendiente. Si hay datos no guardados al desmontar, se pierden.

**Gap 3: El indicador de guardado no es visible al usuario**
Aunque `lastSaved` y `hasUnsavedChanges` estan disponibles, el wizard no muestra ningun indicador visual de que el trabajo se esta guardando automaticamente. Esto genera ansiedad en una Training Manager que esta consultando otras herramientas.

### Solucion propuesta

#### 1. Flush al desmontar el componente (useFormPersistence.ts)

Agregar un save sincrono en el cleanup del hook para que cualquier dato pendiente se guarde al desmontar:

```typescript
// En la seccion CLEANUP (linea 672-678)
useEffect(() => {
  return () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      // Flush pending save synchronously before unmount
      if (hasUnsavedChangesRef.current) {
        saveToStorageRef.current(dataRef.current);
      }
    }
  };
}, []);
```

Esto requiere agregar `hasUnsavedChangesRef` y `saveToStorageRef` como refs estables (mismo patron que ya usamos en el wizard con `updateDataRef`).

#### 2. Guardia de navegacion SPA (LMSCursoWizard.tsx)

Usar `useBlocker` de react-router-dom v6 para interceptar navegacion interna y mostrar un dialogo de confirmacion:

```typescript
import { useBlocker } from 'react-router-dom';

// Dentro del wizard:
const blocker = useBlocker(
  ({ currentLocation, nextLocation }) =>
    persistence.hasUnsavedChanges &&
    currentLocation.pathname !== nextLocation.pathname
);

// Renderizar dialogo de confirmacion cuando blocker.state === 'blocked'
```

Esto mostraria un AlertDialog preguntando "Tienes cambios sin guardar. Quieres guardar el borrador antes de salir?" con opciones:
- **Guardar y salir**: flush + navegar
- **Salir sin guardar**: descartar + navegar
- **Cancelar**: quedarse en el wizard

#### 3. Indicador visual de auto-guardado (LMSCursoWizard.tsx)

Agregar el componente `SavingIndicator` (que ya existe en el proyecto) en el header del wizard, mostrando:
- Spinner "Guardando..." cuando hay cambios pendientes
- Check verde "Guardado hace X minutos" tras guardar

Esto le da confianza a la Training Manager de que puede salir a consultar otros materiales sin perder nada.

#### 4. Reducir debounce para el wizard (LMSCursoWizard.tsx)

Cambiar el debounce de 800ms (default) a 400ms especificamente para el wizard de cursos. La creacion de cursos involucra campos de texto largos donde 800ms puede significar perder la ultima oracion escrita:

```typescript
useFormPersistence<WizardDraftData>({
  key: 'lms_curso_wizard',
  debounceMs: 400, // Mas agresivo para workflow consultivo
  // ...rest
});
```

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useFormPersistence.ts` | Agregar flush-on-unmount con refs estables |
| `src/components/lms/admin/LMSCursoWizard.tsx` | Agregar `useBlocker`, `SavingIndicator`, y reducir debounce |

### Resultado esperado

La Training Manager puede:
1. Escribir en el wizard y cambiar a otra pestana -- se guarda en menos de 400ms
2. Navegar a otra seccion de la app -- ve un dialogo de confirmacion primero
3. Cerrar el navegador accidentalmente -- al volver, ve el prompt de restauracion
4. Ver en todo momento el estado "Guardado hace X" para sentirse segura de consultar otras herramientas

### Riesgo

Bajo. Los cambios son aditivos y no modifican la logica de persistencia existente. El `useBlocker` es API estable de react-router-dom v6.
