

# Two Changes: Map Zoom Fix + Filters for Operaciones/Insights

## 1. PDF Map — Fit to Route Bounds

**Problem:** The Mapbox Static API call uses `auto` center with `padding=60`, but for short routes the result shows half a continent because the default zoom is too wide.

**Fix in `ServiceDetailPDF.tsx` → `generateStaticMapBase64`:**
- Calculate the bounding box from event coordinates (min/max lat/lng)
- Add extra padding to the bbox (0.02° ~2km buffer)
- Use Mapbox Static API's `[minLng,minLat,maxLng,maxLat]` bbox syntax instead of `auto`
- This forces the map to zoom tightly to the actual route points

```text
Current:  .../static/{markers},{path}/auto/1000x720@2x?padding=60
Fixed:    .../static/{markers},{path}/[bbox]/1000x720@2x?padding=80
```

**File:** `src/components/monitoring/tiempos/ServiceDetailPDF.tsx` (lines ~520-524)

---

## 2. Filters for Tiempos Ops + Histórico Insights

**Tiempos Ops tab** (`ServiceTimesTable.tsx`) currently has: date range + text input for client. Need to add:
- **Custodio filter** (text input, same pattern as client)
- **Folio filter** (text input)
- Update the hook `useServiceTimesReport.ts` to accept `custodio` and `folio` filter params and apply them to the query

**Histórico Insights tab** (`ServiciosConsulta.tsx`) already has: search (covers folio, client, custodio), client dropdown, estado, local/foráneo. The search bar already searches by folio, cliente, custodio, and ruta — so it effectively covers all three requested filters. However, for easier use, I'll add:
- **Custodio dropdown** filter (extracted from unique custodio names in the data)
- The existing search already handles folio lookup

### Files to edit:
1. `src/components/monitoring/tiempos/ServiceDetailPDF.tsx` — bbox calculation for map
2. `src/components/monitoring/tiempos/ServiceTimesTable.tsx` — add custodio + folio filter inputs
3. `src/hooks/useServiceTimesReport.ts` — add custodio/folio query params
4. `src/pages/Facturacion/components/ServiciosConsulta.tsx` — add custodio dropdown filter

