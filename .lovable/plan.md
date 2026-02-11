

## Persistencia del Guion de Video Generado por IA

### Problema

`VideoScriptGenerator` almacena el guion generado en `useState` local. Al navegar a HeyGen y regresar, el componente se remonta, el estado se pierde, y el usuario debe regenerar el guion gastando creditos de IA innecesariamente.

### Solucion

Guardar el guion generado dentro del campo JSON `contenido.contenido` del video en la base de datos, junto con la URL del video. Cuando el componente se monte, cargar el guion desde los datos existentes.

### Cambios

| Archivo | Cambio |
|---------|--------|
| `VideoScriptGenerator.tsx` | Agregar prop `initialData` para cargar guion existente y callback `onGenerated` para notificar al padre cuando se genera un guion |
| `ContenidoExpandedEditor.tsx` | Pasar el guion existente desde `contenido.contenido` al `VideoScriptGenerator` e incluir el guion en `buildContenidoData()` para que se persista al guardar |

### Detalle Tecnico

**VideoScriptGenerator.tsx**:
- Nueva prop `initialData` con la estructura `{ script, prompt_externo, notas_produccion, duracion_estimada_min }`
- Nueva prop `onGenerated(data)` callback que se invoca cuando la IA genera un guion
- En `useEffect` inicial, si `initialData` existe, poblar el estado local sin llamar a la IA
- En `handleGenerate`, ademas de setear el estado local, llamar `onGenerated(data)` para que el padre lo capture

**ContenidoExpandedEditor.tsx**:
- Nuevo estado `videoScript` inicializado desde `contenido.contenido.guion_generado`
- Pasar `initialData={videoScript}` y `onGenerated={(data) => setVideoScript(data)}` al `VideoScriptGenerator`
- En `buildContenidoData()` para tipo `video`, incluir `guion_generado: videoScript` en el JSON

**Estructura del JSON guardado en BD**:
```text
contenido.contenido = {
  url: "https://youtube.com/...",
  guion_generado: {
    script: { introduccion, puntos_clave, ejemplos, cierre },
    prompt_externo: "...",
    notas_produccion: "...",
    duracion_estimada_min: 7
  }
}
```

### Flujo Resultante

1. Usuario abre editor de video y genera guion con IA
2. El guion se guarda en estado local Y se marca como parte de los datos del contenido
3. Usuario hace clic en "Guardar" -- el guion se persiste en BD dentro del JSON del video
4. Usuario copia el prompt, va a HeyGen, regresa
5. El editor se remonta, carga `contenido.contenido.guion_generado`, y el `VideoScriptGenerator` muestra el guion sin necesidad de regenerar
6. El boton "Regenerar" sigue disponible si el usuario quiere un nuevo guion

