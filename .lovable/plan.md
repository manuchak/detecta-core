

# Rediseno de Ficha de Incidente para Stakeholder de Seguridad

## Problemas Detectados

### 1. Fecha incorrecta (critico)
La ficha muestra **"23 feb 2026 14:20"** (fecha de scraping) pero el contenido real tiene fechas como **"2026-02-20"** y **"2026-01-18"**. Aunque ya implementamos extraccion de fecha de metadatos, este registro entro antes del fix o los metadatos no tenian fecha. Ademas, el contenido es una **pagina indice del gobierno** (no un incidente real) -- lo que confirma que el filtro AI de calidad aun no descarto este tipo de contenido.

### 2. Contenido basura (critico)
El "Texto Original" muestra HTML sin limpiar: breadcrumbs (`[Inicio](https://...)`), controles de fuente (`Aa+Aa-`), navegacion del sitio. Esto no es util para un Head de Seguridad. El scraper esta almacenando paginas indice completas en lugar de articulos especificos.

### 3. "sin clasificar" + "baja" = fallo del pipeline AI
Esta ficha no fue clasificada ni enriquecida -- no tiene modus operandi, firma criminal, ni analisis criminologico. Un stakeholder de seguridad veria esto como ruido.

### 4. Panel de detalle insuficiente para un Head de Seguridad
El panel expandido actual solo muestra:
- Texto original (crudo)
- Keywords
- Autor
- Engagement (likes/shares/comments)

**Falta completamente** la inteligencia criminologica que ya esta en la base de datos:
- Modus operandi
- Firma criminal
- Nivel de organizacion
- Vector de ataque
- Objetivo especifico
- Indicadores de premeditacion
- Zona tipo
- Contexto ambiental
- Relevancia score

---

## Solucion

### Parte 1: Rediseno completo del panel de detalle expandido

Convertir el area expandible de una simple seccion de texto a una **ficha de inteligencia estructurada** con secciones claras:

```
+-------------------------------------------------------+
| RESUMEN AI                                             |
| "Robo de carga en autopista Mexico-Queretaro..."       |
+---------------------------+---------------------------+
| ANALISIS CRIMINOLOGICO    | CONTEXTO GEOGRAFICO       |
| Modus Operandi: ...       | Zona: carretera_abierta   |
| Firma Criminal: ...       | Municipio: ...             |
| Nivel Org: [badge color]  | Carretera: ...             |
| Vector Ataque: ...        | Contexto Ambiental: ...    |
| Objetivo: ...             | Coords: [GPS badge]        |
+---------------------------+---------------------------+
| INDICADORES PREMEDITACION | RELEVANCIA                |
| [badge] [badge] [badge]   | Score: 85/100 [progress]  |
+---------------------------+---------------------------+
| TEXTO ORIGINAL (colapsable, secundario)                |
+-------------------------------------------------------+
```

- El resumen AI va primero y prominente (es lo que lee un director)
- Los campos criminologicos se muestran en grid de 2 columnas
- El texto original pasa a ser secundario, colapsable
- Nivel de organizacion usa badge con color (rojo=crimen organizado, naranja=celula local, verde=oportunista)
- Relevancia score se muestra como barra de progreso
- Indicadores de premeditacion como badges

### Parte 2: Limpieza visual del texto original

Aplicar una funcion de sanitizacion al texto antes de mostrarlo:
- Eliminar patrones de navegacion web (`[text](url)` markdown links)
- Eliminar controles de UI (`Aa+Aa-`)
- Eliminar breadcrumbs numerados (`1. [Inicio]...`)
- Truncar a los primeros 500 caracteres con "ver mas"

### Parte 3: Indicador visual de calidad en la fila principal

Agregar a la fila de la tabla:
- Badge de relevancia score (color segun rango)
- Icono de alerta si `relevancia_score < 40` para que el usuario sepa que es contenido de baja calidad

---

## Detalle tecnico

### Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/incidentes/IncidentesTable.tsx` | Rediseno completo del `CollapsibleContent` con grid de inteligencia criminologica, funcion de limpieza de texto, badge de relevancia en fila principal |

### Cambios especificos en IncidentesTable.tsx

1. **Funcion `sanitizarTexto(texto)`**: Limpia markdown links, breadcrumbs, controles UI del texto scraped
2. **Fila principal (lineas 80-143)**: Agregar columna de relevancia score con badge coloreado
3. **Panel expandido (lineas 144-180)**: Reemplazar completamente con layout de ficha de inteligencia:
   - Seccion superior: Resumen AI destacado
   - Grid 2 columnas: Analisis Criminologico | Contexto Geografico
   - Seccion inferior: Indicadores de premeditacion + Texto original colapsable
4. **Header de tabla (lineas 64-74)**: Agregar columna "Relevancia"

