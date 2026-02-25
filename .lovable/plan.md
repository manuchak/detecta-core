

# Fix: Certificado muestra 100% en vez de la calificacion real

## Problema

La calificacion en el certificado esta **hardcodeada en 100%** en dos lugares del componente `CertificadoPlantillaViewer.tsx`:
- Linea 89: `calificacion: 100` (para el PDF)
- Linea 188: texto `100%` (para la vista en pantalla)

El componente nunca consulta la calificacion real del alumno desde `lms_inscripciones.calificacion_final`.

Ademas, hay un bug secundario: se consulta `nombre_completo` en la tabla `profiles`, pero esa columna no existe (error 400 visible en los network requests).

## Solucion

### Archivo: `src/components/lms/CertificadoPlantillaViewer.tsx`

1. **Agregar estado para calificacion**: `const [calificacion, setCalificacion] = useState(100);`

2. **Consultar la inscripcion** dentro del `useEffect` existente para obtener `calificacion_final`:
```tsx
if (inscripcionId) {
  const { data: inscripcion } = await supabase
    .from('lms_inscripciones')
    .select('calificacion_final, progreso_porcentaje')
    .eq('id', inscripcionId)
    .maybeSingle();
  if (inscripcion) {
    setCalificacion(inscripcion.calificacion_final ?? inscripcion.progreso_porcentaje ?? 100);
  }
}
```

3. **Usar el estado** en la vista (linea 188): reemplazar `100%` por `{calificacion}%`

4. **Usar el estado** en el PDF (linea 89): reemplazar `calificacion: 100` por `calificacion`

5. **Fix bug secundario**: Quitar `nombre_completo` del select de profiles (linea 43), dejando solo `display_name`

## Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/lms/CertificadoPlantillaViewer.tsx` | Obtener calificacion real de la inscripcion, fix query profiles |

