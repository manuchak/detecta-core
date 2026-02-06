# Plan: Mejorar Manejo de Almacenamiento en Onboarding de Documentos

## ✅ IMPLEMENTADO - 2026-02-06

---

## Problema Identificado

El componente `DocumentUploadStep.tsx` usado en el onboarding de custodios tenía tres deficiencias críticas:

| Problema | Impacto |
|----------|---------|
| Sin compresión de imágenes | Fotos de 2-8MB saturaban memoria del dispositivo |
| Sin manejo de errores de quota | FileReader fallaba silenciosamente en dispositivos con poco espacio |
| Sin guía al usuario | El custodio no sabía qué hacer cuando ocurría el error |

---

## Solución Implementada

### Archivos Modificados

| Archivo | Cambios |
|---------|---------|
| `src/components/custodian/onboarding/DocumentUploadStep.tsx` | Compresión de imágenes, detección de quota, UI de error específica |
| `src/components/custodian/CameraUploader.tsx` | Mismas mejoras para consistencia en todo el portal |

### Cambios Técnicos

1. **Compresión de Imágenes**
   - Usa `compressImage()` de `@/lib/imageUtils`
   - Comprime a 1920x1080 @ 0.7 calidad
   - Reduce ~80% (2MB → 400KB)

2. **Detección de Espacio Disponible**
   - `navigator.storage.estimate()` antes de capturar
   - Umbral de 10MB mínimo requerido

3. **Manejo de Errores de Quota**
   - Detecta `QuotaExceededError` y código 22
   - UI específica con instrucciones para liberar espacio

4. **Optimización de Memoria**
   - Usa `URL.createObjectURL()` en lugar de `FileReader.readAsDataURL()`
   - Limpia URLs de objeto al desmontar componente

---

## Resultado

| Métrica | Antes | Después |
|---------|-------|---------|
| Tamaño de imagen | 2-8MB sin procesar | ~300KB comprimida |
| Error de espacio | "Error desconocido" | Mensaje con pasos claros |
| Recuperación | Usuario confundido | Botón "Reintentar" visible |
| Prevención | Ninguna | Detecta espacio bajo antes |
