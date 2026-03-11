

# Fix: Alfonso Avalos no aparece en Evaluaciones

## Causa raíz

La página de Evaluaciones consulta `candidatos_custodios`, no `leads`. El lead "ALFONSO AVALOS BARAJAS" (id: `848baf03-4aec-45c1-8352-21c0ff0f7f3d`) tiene estado `aprobado` pero **no fue insertado en `candidatos_custodios`**.

## Corrección

**Migración SQL** — Insertar el registro faltante en `candidatos_custodios` a partir de los datos del lead aprobado:

```sql
INSERT INTO candidatos_custodios (nombre, email, telefono, estado_proceso)
SELECT nombre, email, telefono, 'en_evaluacion'
FROM leads
WHERE id = '848baf03-4aec-45c1-8352-21c0ff0f7f3d'
AND NOT EXISTS (
  SELECT 1 FROM candidatos_custodios WHERE email = 'Zonazulez@gmail.com'
);
```

Esto es una corrección puntual para este candidato. Si hay más leads aprobados sin registro en `candidatos_custodios`, se puede ejecutar una consulta más amplia para detectarlos.

### Archivos impactados

| Recurso | Cambio |
|---|---|
| Migración SQL | INSERT en `candidatos_custodios` para Alfonso Avalos |

