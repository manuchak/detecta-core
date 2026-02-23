

# Insertar 52 servicios faltantes del 19 de febrero

## Resumen

Del Excel con 57 registros, ya existen 5 en la BDD:
- ALIKRHI-5, ALIKRHI-6, IFCOICM-199, ROEZSAG-1, TEOVTEL-776

Se insertaran los 52 restantes en `servicios_custodia` usando el insert tool (no migracion, es data).

## Servicios a insertar

Los 52 IDs faltantes incluyen:
EMEDEME-250, EMEDEME-249, AIESATI-49, AIESATI-48, TEOVTEL-777, SADSSSM-38, SADSSSM-39, MUESMAA-16, MUESMAA-17, ASCAAST-1429, EI&PESL-5, FAEAFCA-230, EI&PESL-4, GTNSDPL-36, GTNSDPL-37, IMOSIEP-77, IMOSIEP-76, FAEAFCA-229, LOERLLO-304, LOERLLO-305, LOERLLO-300, LOERLLO-302, LOERLLO-301, LOERLLO-303, ENCOEME-488, LOERLLO-296, LOERLLO-298, SIGESOR-2, LOERLLO-299, ASCAAST-1428, LOERLLO-297, ASCAAST-1427, SIINSRH-744, ASCAAST-1426, ASCAAST-1421, ASCAAST-1425, ASCAAST-1424, ASCAAST-1420, ASCAAST-1423, ASCAAST-1422, YOCOYTM-276, SIINSRH-742, SIINSRH-743, MOTSMRS-536, IFCOICM-198, PROSPIQ-12, PROSPIQ-11, MOTSMRS-537, MOTSMRS-535, MOTSMRS-534, FAEAFCA-228, LUCOLLM-99

## Mapeo de columnas Excel -> DB

| Excel | DB Column |
|-------|-----------|
| Fecha y hora de cita | fecha_hora_cita |
| ID del servicio | id_servicio |
| Estado | estado |
| Nombre del cliente | nombre_cliente |
| Folio del cliente | folio_cliente |
| Comentarios adicional | comentarios_adicionales |
| Local/foraneo | local_foraneo |
| Tipo de servicio | tipo_servicio |
| Ruta | ruta |
| Origen | origen |
| Destino | destino |
| Km teorico | km_teorico |
| Gadget solicitado | gadget_solicitado |
| Gadget | gadget |
| Tipo de gadget | tipo_gadget |
| Convoy | cantidad_transportes |
| Nombre del operador transporte | nombre_operador_transporte |
| Telefono del operador | telefono_operador |
| Placa de la carga | placa_carga |
| Tipo de unidad | tipo_unidad |
| Tipo de carga | tipo_carga |
| Nombre Operador adicional | nombre_operador_adicional |
| Telefono Operador Adicional | telefono_operador_adicional |
| Placa Carga (adicional) | placa_carga_adicional |
| Tipo unidad (adicional) | tipo_unidad_adicional |
| Tipo carga (Adicional) | tipo_carga_adicional |
| Fecha y hora de asignacion | fecha_hora_asignacion |
| ID Custodio | id_custodio |
| Nombre de custodio | nombre_custodio |
| Telefono | telefono |
| Contacto de emergencia | contacto_emergencia |
| Telefono de emergencia | telefono_emergencia |
| Auto | auto |
| Placa | placa |
| Armado | armado |
| Nombre Armado | nombre_armado |
| Telefono Armado | telefono_armado |
| Proveedor | proveedor |
| Hora en punto origen | hora_presentacion |
| Presentacion | presentacion |
| Hora de inicio de custodia | hora_inicio_custodia |
| Hora en punto destino | hora_arribo |
| Hora fin de servicio | hora_finalizacion |
| Duracion del servicio | duracion_servicio |
| ID cotizacion | id_cotizacion |
| Tiempo estimado | tiempo_estimado |
| Km recorridos | km_recorridos |
| km Extras | km_extras |
| Costo de custodio | costo_custodio |
| Casetas | casetas |
| Cobro al cliente | cobro_cliente |
| Updated time | updated_time |
| Creado Via | creado_via |
| Creado por | creado_por |

## Proceso

1. Ejecutar INSERTs en lotes de ~10 servicios usando el insert tool
2. Manejar valores NaN como NULL para campos numericos
3. Convertir "TRUE"/"FALSE" a texto para el campo armado
4. Verificar conteo final con query de validacion

## GMV esperado

Los 52 servicios representan aproximadamente $398,806 MXN en cobro al cliente.

## Impacto

- Sin cambios de esquema (solo datos)
- Sin cambios de codigo
- Los dashboards y reportes reflejaran automaticamente los nuevos registros

