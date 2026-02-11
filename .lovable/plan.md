

## Fix: Auto-restore del wizard al volver de otra pestana/sitio

### Causa raiz

El wizard tiene su propio estado independiente (`step`, `modulos`, `form`) que siempre inicia en valores vacios. La persistencia guarda correctamente los datos, pero el wizard nunca los lee al montar. El unico camino de restauracion es hacer clic en el banner, pero el usuario ya ve el paso 1 vacio y asume que perdio todo.

```text
FLUJO ACTUAL (roto):
1. User en Step 2 con modulos y datos
2. Navega a Synthesia (copia prompt)
3. Regresa → componente se re-monta
4. useState(1), useState([]), defaultFormValues → ve Step 1 vacio
5. Banner de restauracion aparece arriba (pero user ya entro en panico)
6. Si hace clic "Restaurar" → funciona, pero UX es terrible
```

### Solucion

Cambiar la inicializacion del wizard para que lea del draft guardado ANTES de renderizar. Asi, cuando el usuario regresa, ve exactamente donde estaba.

```text
FLUJO CORREGIDO:
1. User en Step 2 con modulos y datos
2. Navega a Synthesia
3. Regresa → componente se re-monta
4. useFormPersistence carga draft → step=2, modulos=[...], form=filled
5. Usuario ve Step 2 exactamente como lo dejo
6. No necesita interaccion manual para restaurar
```

### Cambios en LMSCursoWizard.tsx

**1. Leer el draft en la inicializacion del estado**

En lugar de `useState(1)` y `useState([])`, inicializar desde localStorage directamente (lectura sincrona) para evitar el flash de "step 1 vacio":

```typescript
// Lectura sincrona del draft al montar (antes del primer render)
function getInitialDraftData(): WizardDraftData | null {
  try {
    const stored = localStorage.getItem('lms_curso_wizard');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed.version !== 2) return null;
    // Check TTL
    const savedAt = new Date(parsed.savedAt).getTime();
    if (Date.now() - savedAt > 24 * 60 * 60 * 1000) return null;
    return parsed.data as WizardDraftData;
  } catch { return null; }
}

// Dentro del componente:
const initialDraft = useRef(getInitialDraftData());

const [step, setStep] = useState(initialDraft.current?.step || 1);
const [modulos, setModulos] = useState<ModuleOutline[]>(initialDraft.current?.modulos || []);

const form = useForm<CursoSchemaType>({
  resolver: zodResolver(cursoSchema),
  defaultValues: initialDraft.current?.formValues || defaultFormValues,
});
```

**2. Tambien sincronizar cuando `acceptRestore` se ejecuta desde el banner**

La funcion `handleRestoreDraft` ya existe y funciona correctamente para el caso del banner. No necesita cambios.

**3. Auto-restore silencioso cuando URL tiene draft param que coincide**

Modificar el `handleRestoreDraft` para que tambien se ejecute automaticamente cuando `useFormPersistence` detecta un draft con URL match (sin mostrar banner). Para esto, agregar un `useEffect` que observe cuando `draftData` cambia con datos validos y el wizard aun esta en estado inicial:

```typescript
// Auto-sync cuando persistence carga datos (URL match case)
const hasAutoRestored = useRef(false);
useEffect(() => {
  if (hasAutoRestored.current) return;
  if (draftData.formValues?.titulo && draftData.step > 1) {
    form.reset(draftData.formValues);
    setStep(draftData.step);
    setModulos(draftData.modulos || []);
    hasAutoRestored.current = true;
  }
}, [draftData]);
```

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/lms/admin/LMSCursoWizard.tsx` | Inicializacion sincrona desde localStorage + auto-sync desde persistence data |

### Resultado esperado

- El usuario crea un curso, va al paso 2, copia un prompt de video
- Navega a Synthesia en otra pestana o en la misma
- Al regresar al wizard, ve EXACTAMENTE el paso 2 con todos sus datos
- No necesita hacer clic en ningun banner ni tomar ninguna accion
- El indicador "Guardado hace X" confirma que sus datos estan seguros

### Riesgo

Bajo. Solo cambia la inicializacion del estado del wizard. La logica de persistencia subyacente no se modifica.
