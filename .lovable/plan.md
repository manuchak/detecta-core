

# Correcciones Criticas del PDF de Incidentes - Evaluacion de Diseno

## Problemas Detectados

### 1. BUG CRITICO: Timestamps corruptos en Cronologia
El caracter `●` (Unicode bullet) no es soportado por la fuente Helvetica base de jsPDF. Esto causa que el timestamp se renderice como:
```
%Ï 1 6 / 0 2  1 4 : 3 2 [Notificación]
```
En lugar de:
```
● 16/02 14:32 [Notificacion]
```
El caracter corrupto arrastra el encoding de toda la linea, generando espaciado excesivo entre cada digito. Este es el defecto visual mas grave del documento.

**Solucion**: Reemplazar el caracter Unicode `●` por un circulo dibujado con `pdf.circle()` (fill) y renderizar el timestamp como texto separado despues del circulo. Esto elimina el problema de encoding de raiz.

### 2. Pagina 2 casi vacia (desperdicio de espacio)
La cronologia corta al final de pagina 1 y pasa a pagina 2 con solo una entrada + la seccion "Controles y Atribucion" dejando ~70% de la pagina en blanco. Esto se ve poco profesional.

**Solucion**: Ajustar el `checkPage()` para ser menos agresivo en saltos de pagina: reducir el margen de seguridad de 20mm a 15mm en la parte inferior, y permitir que secciones cortas como "Controles" se apilen mejor.

### 3. Evidencia fotografica muestra screenshots de la app
Las imagenes adjuntas a las entradas de cronologia son screenshots del dashboard de la aplicacion, no fotos reales de evidencia. Esto es un problema de datos (las imagenes subidas son capturas de pantalla), no del PDF en si. Sin embargo, el thumbnail de 40x30mm es demasiado pequeno para evaluar evidencia.

**Solucion**: Aumentar el tamano del thumbnail a 60x45mm y agregar un borde sutil para separarlo del texto. Tambien ajustar la relacion de aspecto calculandola dinamicamente segun la imagen real.

### 4. Tipografia y jerarquia visual mejorable
- Los labels de campos ("Tipo:", "Severidad:") son demasiado sutiles en gris
- No hay separacion visual clara entre subsecciones dentro de Datos Generales
- El titulo "Reporte de Incidente Operativo" es redundante con el header

**Solucion**: Eliminar el titulo redundante debajo del header. Mejorar el contraste de labels. Agregar lineas separadoras sutiles entre grupos de campos.

### 5. Resumen Ejecutivo: circulo de severidad desalineado
El circulo de color de severidad (`pdf.circle`) esta posicionado con offset fijo (`bx + boxW/2 - 10`) lo cual lo desalinea del texto en diferentes anchos de columna.

**Solucion**: Posicionar el circulo justo antes del texto de severidad usando el ancho medido del texto como referencia.

## Archivos a modificar

### `src/components/monitoring/incidents/IncidentPDFExporter.ts`

Cambios especificos:

1. **Lineas ~314**: Reemplazar `pdf.text('● ${ts}', ...)` por:
   - `pdf.setFillColor(...CORPORATE_RED)`
   - `pdf.circle(marginLeft + 5, y - 1.2, 1.5, 'F')` (circulo rojo solido)
   - `pdf.text(ts, marginLeft + 9, y)` (timestamp sin el bullet Unicode)

2. **Linea ~87**: Cambiar `pageHeight - 20` a `pageHeight - 15` para mejor aprovechamiento de pagina

3. **Lineas ~177-187**: Eliminar el bloque del titulo redundante "Reporte de Incidente Operativo" y su fecha (ya estan en header + resumen ejecutivo)

4. **Lineas ~354**: Cambiar dimensiones de imagen de `40, 30` a `60, 45` y agregar borde con `pdf.setDrawColor(200,200,200); pdf.rect()`

5. **Lineas ~163-166**: Corregir posicionamiento del circulo de severidad para que quede alineado con el texto

6. **Agregar acentos como texto plano**: Cambiar "Notificación" por "Notificacion" y otros textos con acentos que jsPDF no renderiza bien con Helvetica base, o mejor aun, dejar los labels del array `TIPOS_ENTRADA_CRONOLOGIA` tal como estan pero sanitizar acentos con una funcion `removeAccents()` antes de pasarlos a `pdf.text()`

### Funcion auxiliar nueva: `sanitizeForPDF(text: string): string`
Reemplazar caracteres con acentos por sus equivalentes sin acento para evitar problemas de renderizado con la fuente Helvetica base de jsPDF. Ejemplo: `á→a, é→e, í→i, ó→o, ú→u, ñ→n`.

Nota: Los acentos en la version actual se muestran porque jsPDF maneja *algunos* diacriticos en Helvetica, pero no es consistente. La solucion robusta es sanitizar todos los textos.

## Resultado esperado

- Timestamps limpios: circulo rojo + "16/02 14:32 [Notificacion]"
- Mejor aprovechamiento de pagina (menos espacio desperdiciado)
- Imagenes de evidencia mas grandes y con borde
- Sin titulo redundante
- Severidad con indicador de color bien alineado
