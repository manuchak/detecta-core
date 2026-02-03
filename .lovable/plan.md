

# Plan: Escala Visual por Defecto al 70%

## Contexto del Problema

El usuario nota que la interfaz se ve mejor con el navegador al 70% de zoom. Esto sugiere que los elementos actuales son demasiado grandes para la densidad de información que maneja el sistema de planeación.

## Opciones de Implementación

### Opcion A: Propiedad CSS `zoom` (Recomendada)
**Ventajas:**
- Implementación simple y directa
- Mantiene proporciones exactas
- Soporte en Chrome, Safari, Edge (95%+ de usuarios)

**Código:**
```css
html {
  zoom: 0.7;
}
```

**Limitación:** Firefox no soporta `zoom`, requiere fallback.

---

### Opcion B: Transform Scale + Contenedor
**Ventajas:**
- Soporte universal en todos los navegadores
- Control preciso sobre el área escalada

**Desventajas:**
- Requiere ajustar dimensiones del contenedor
- Puede afectar scroll y elementos fixed

---

### Opcion C: Reducir Tamaño Base de Fuente
**Ventajas:**
- Afecta solo valores rem (no px)
- Granular y controlable

**Desventajas:**
- No escala todo (valores en px quedan igual)
- Puede requerir ajustes adicionales

---

## Solución Propuesta: Híbrida (A + Fallback Firefox)

Implementar `zoom: 0.7` con fallback de `transform: scale(0.7)` para Firefox.

### Cambios en `src/index.css`

```css
@layer base {
  /* Escala visual al 70% por defecto */
  html {
    zoom: 0.7;
  }
  
  /* Fallback para Firefox que no soporta zoom */
  @supports not (zoom: 0.7) {
    html {
      transform: scale(0.7);
      transform-origin: top left;
      width: 142.86%; /* 100 / 0.7 */
      min-height: 142.86vh;
    }
    
    body {
      width: 142.86%;
      overflow-x: hidden;
    }
  }
}
```

### Ajustes Adicionales Necesarios

1. **Elementos `position: fixed`** (modales, toasts, sidebar): 
   - Verificar que se rendericen correctamente
   - Posiblemente ajustar z-index o contenedores

2. **Viewport meta tag** (ya configurado en `index.html`):
   - Mantener `user-scalable=no` para evitar conflictos

3. **Elementos absolutamente posicionados**:
   - Revisar tooltips y dropdowns

---

## Alternativa: Control de Usuario

Si se prefiere dar control al usuario en lugar de forzar 70%:

### Selector de Escala en UI

```typescript
// Hook para persistir preferencia
const useUIScale = () => {
  const [scale, setScale] = useState(() => 
    localStorage.getItem('ui-scale') || '100'
  );
  
  useEffect(() => {
    document.documentElement.style.zoom = `${parseInt(scale) / 100}`;
    localStorage.setItem('ui-scale', scale);
  }, [scale]);
  
  return { scale, setScale };
};
```

Agregar selector en configuración:
- 70% - Compacto
- 85% - Reducido  
- 100% - Normal

---

## Archivos a Modificar

| Archivo | Cambio | Prioridad |
|---------|--------|-----------|
| `src/index.css` | Agregar regla `zoom: 0.7` con fallback Firefox | Alta |
| `index.html` | Verificar viewport meta (ya correcto) | Baja |

---

## Consideraciones Técnicas

1. **Performance**: Zoom CSS es más eficiente que transform scale (no requiere repaints adicionales)

2. **Accesibilidad**: Usuarios que necesiten zoom mayor aún pueden usar Ctrl+/- del navegador (se apila sobre el 70% base)

3. **Pruebas necesarias**:
   - Modales y dialogs (Radix UI)
   - Tooltips y popovers
   - Mapas (Mapbox) - verificar que no se afecte el render
   - Tablas con scroll horizontal

4. **Rollback**: Si hay problemas, simplemente se elimina la regla CSS

---

## Recomendación Final

**Implementar Opción A (zoom: 0.7)** como primer paso:
- Es la solución más simple y directa
- Cubre 95%+ de los usuarios
- Fácil de revertir si hay problemas
- Si Firefox es importante para sus usuarios, agregar el fallback

