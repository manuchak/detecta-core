
# Plan: Voice of the Customer (VoC) con Nube de Palabras

## Que se va a construir

Un panel de inteligencia VoC integrado en la pestana Panorama que usa IA (Lovable AI Gateway con Gemini 3 Flash) para analizar textos de quejas, touchpoints, CSAT y NPS, y presentar 6 widgets ejecutivos:

1. **Resumen Ejecutivo IA** - Parrafo narrativo de como perciben los clientes a la empresa
2. **Temperatura del Sentimiento** - Gauge semicircular SVG (0-100) con zonas frio/tibio/calido
3. **Temas Detectados** - Burbujas interactivas por tema, tamano = frecuencia, color = sentimiento
4. **Nube de Palabras** - Visualizacion de las palabras mas frecuentes en resumenes de touchpoints, descripciones de quejas y comentarios CSAT/NPS, con tamano proporcional a frecuencia y color por sentimiento
5. **Verbatims Recientes** - Citas textuales de clientes con badge de fuente y sentimiento
6. **Recomendaciones de Accion** - 3-5 acciones priorizadas generadas por IA

## Arquitectura

```text
Frontend (CSVoiceOfCustomer)
    |
    v
Hook (useCSVoC) --invoke--> Edge Function (cs-voc-analysis)
                                  |
                                  |- Query: cs_quejas.descripcion, causa_raiz
                                  |- Query: cs_touchpoints.resumen
                                  |- Query: cs_csat_surveys.comentario
                                  |- Query: cs_nps_campaigns.comentario
                                  |
                                  v
                             Lovable AI Gateway (gemini-3-flash-preview)
                                  |
                                  v
                             Tool calling -> JSON estructurado
                             (sentiment, themes, word_cloud, verbatims, recommendations)
```

## Archivos a crear

| Archivo | Descripcion |
|---------|-------------|
| `supabase/functions/cs-voc-analysis/index.ts` | Edge function que recopila textos de 4 tablas, envia a Lovable AI con tool calling, retorna analisis estructurado incluyendo nube de palabras |
| `src/hooks/useCSVoC.ts` | Hook React Query que invoca la edge function con staleTime de 30 min y boton de regenerar |
| `src/pages/CustomerSuccess/components/CSVoiceOfCustomer.tsx` | Componente principal con los 6 widgets (resumen, gauge, temas, nube de palabras, verbatims, recomendaciones) |

## Archivo a modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/CustomerSuccess/components/CSPanorama.tsx` | Agregar CSVoiceOfCustomer debajo del grid de Funnel + Alertas |
| `supabase/config.toml` | Agregar entrada para `cs-voc-analysis` con `verify_jwt = false` |

## Detalle de la Nube de Palabras

La nube de palabras se genera en el backend como parte del analisis de IA. El modelo recibe los textos y extrae las 20-30 palabras mas relevantes (excluyendo stopwords en espanol) con su frecuencia y sentimiento asociado. El frontend renderiza cada palabra con:

- **Tamano de fuente** proporcional a la frecuencia (rango de 12px a 48px)
- **Color** segun sentimiento: verde (positivo), rojo (negativo), gris (neutro)
- **Layout** tipo nube con posicionamiento CSS (flexbox wrap con rotaciones aleatorias sutiles)
- **Interactividad**: Hover muestra tooltip con frecuencia y contexto de ejemplo

```text
+------------------------------------------+
|           Nube de Palabras               |
|                                          |
|     retraso    GPS        protocolo      |
|        custodia    puntualidad           |
|   servicio   atencion     ruta           |
|      vehiculo    consigna   horario      |
|          respuesta    guardia            |
+------------------------------------------+
```

## Detalle del Tool Calling (AI)

El prompt usa tool calling para obtener JSON estructurado sin ambiguedad:

```text
Tool: analyze_customer_voice
Parameters:
  sentiment_score: number (0-100)
  executive_summary: string
  themes: array of {name, count, sentiment, keywords}
  word_cloud: array of {word, frequency, sentiment}  <-- NUEVO
  verbatims: array of {text, source, sentiment, cliente}
  recommendations: array of {action, priority, context}
```

## Layout Responsivo

```text
Desktop (lg+):
+---------------------------+-------------+
| Resumen Ejecutivo IA      | Temperatura |
+---------------------------+-------------+
| Temas (Bubbles)    | Nube de Palabras   |
+------------------------------------------+
| Verbatims Recientes  | Recomendaciones   |
+------------------------------------------+

Mobile: Stack vertical
```

## Estado Vacio

Si hay menos de 2 registros con texto en todas las fuentes combinadas, se muestra un card elegante invitando a registrar quejas, encuestas o touchpoints para activar el analisis VoC.

## Secuencia de implementacion

1. Crear edge function `cs-voc-analysis` + entrada en config.toml
2. Crear hook `useCSVoC.ts`
3. Crear componente `CSVoiceOfCustomer.tsx` con los 6 widgets
4. Integrar en `CSPanorama.tsx`
