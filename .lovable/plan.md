

## Evaluacion: Paulo Marquez - Servicio no visible

### Estado actual del custodio

| Campo | Valor |
|---|---|
| Nombre | Paulo Antonio Marquez Garduno |
| Email | paulo171210@gmail.com |
| Phone (profiles) | `720 449 6776` (con espacios) |
| Phone (servicios) | `7204496776` (sin espacios) |
| Rol | custodio |
| Servicios historicos | 10+ en servicios_custodia |
| Servicio HOY | METSMSS-16 (MENDOZA SHOOTING SPORTS, 21:00 UTC, planificado) |

### Diagnostico

**Problema 1 (ya corregido):** La politica RLS de `servicios_custodia` fue corregida en el commit anterior. Paulo deberia ver sus stats (Servicios, Km, Ingresos) al refrescar el navegador.

**Problema 2 (ya funciona):** `useNextService` consulta `servicios_planificados` que tiene SELECT abierto para cualquier usuario autenticado. El servicio METSMSS-16 deberia aparecer. Si no aparece, es probable que la captura se tomo antes del despliegue.

**Problema 3 (NUEVO - por corregir):** La tabla `checklist_servicio` tiene una politica para custodios que compara sin normalizar:

```
custodio_telefono = (SELECT phone FROM profiles WHERE id = auth.uid())
```

Esto compara `7204496776` contra `720 449 6776` -- nunca coincide. Los custodios **no pueden ver ni crear sus checklists previos al servicio**.

### Cambio necesario

**SQL (RLS):** Actualizar la politica `Custodios gestionan checklist propio` en `checklist_servicio` para normalizar el telefono del perfil:

```sql
DROP POLICY "Custodios gestionan checklist propio" ON checklist_servicio;

CREATE POLICY "Custodios gestionan checklist propio"
ON checklist_servicio FOR ALL
USING (
  custodio_telefono = replace(replace(
    (SELECT phone FROM profiles WHERE id = auth.uid()),
    ' ', ''), '-', '')
);
```

### Resultado

- Paulo vera su servicio METSMSS-16 de hoy (ya funciona via servicios_planificados)
- Stats historicas (Servicios, Km, Ingresos) se poblaran correctamente (fix anterior)
- Checklists previos funcionaran para todos los custodios (fix nuevo)
- Ningun cambio en archivos TypeScript -- solo migracion SQL

