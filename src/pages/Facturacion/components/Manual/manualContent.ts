import { 
  LayoutDashboard, FileText, Receipt, Wallet, Users, 
  AlertTriangle, DollarSign, Building2, HelpCircle 
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface ManualArticle {
  id: string;
  question: string;
  answer: string;
  steps?: string[];
  tip?: string;
  keywords: string[];
}

export interface ManualSection {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
  articles: ManualArticle[];
}

export const manualSections: ManualSection[] = [
  {
    id: 'dashboard',
    title: 'Dashboard — Panel Principal',
    icon: LayoutDashboard,
    description: 'Vista general con métricas financieras clave, gráficas de ingresos y concentración por cliente.',
    articles: [
      {
        id: 'dash-1',
        question: '¿Qué muestra el Dashboard?',
        answer: 'El dashboard presenta los KPIs principales del módulo: total de servicios facturados, ingresos totales, ticket promedio, y concentración de ingresos por cliente. Todo se actualiza automáticamente según el rango de fechas seleccionado.',
        keywords: ['kpi', 'metricas', 'resumen', 'panel']
      },
      {
        id: 'dash-2',
        question: '¿Cómo usar los filtros de fecha?',
        answer: 'En la barra superior encontrarás selectores de fecha inicio y fin, además de botones rápidos para períodos predefinidos.',
        steps: [
          'Usa los campos de fecha para seleccionar un rango personalizado.',
          'Presiona los botones rápidos: 7d, 30d, 3m, 6m, 1a para períodos predefinidos.',
          'El botón "Mes" selecciona automáticamente el mes calendario actual.',
          'Presiona el botón de actualizar (↻) para refrescar los datos.'
        ],
        tip: 'El filtro de fechas aplica a todas las tabs del módulo simultáneamente.',
        keywords: ['filtro', 'fecha', 'periodo', 'rango', 'mes']
      },
      {
        id: 'dash-3',
        question: '¿Qué significan los KPIs?',
        answer: 'Servicios: cantidad total en el período. Ingresos: suma de cotizaciones. Ticket Promedio: ingreso promedio por servicio. Top 5: porcentaje de ingresos concentrado en los 5 clientes principales.',
        keywords: ['kpi', 'indicador', 'ingreso', 'ticket', 'top']
      },
      {
        id: 'dash-4',
        question: '¿Cómo interpretar las gráficas?',
        answer: 'La gráfica de barras muestra ingresos por cliente ordenados de mayor a menor. La gráfica de pastel muestra la concentración del Top 5 de clientes vs. el resto, útil para evaluar diversificación de cartera.',
        keywords: ['grafica', 'barra', 'pastel', 'concentracion', 'cliente']
      }
    ]
  },
  {
    id: 'servicios',
    title: 'Servicios — Consulta Operativa',
    icon: FileText,
    description: 'Búsqueda y consulta detallada de todos los servicios de custodia con información operativa y financiera.',
    articles: [
      {
        id: 'serv-1',
        question: '¿Cómo buscar un servicio?',
        answer: 'Puedes buscar servicios por folio, nombre de cliente, ruta origen/destino o custodio asignado.',
        steps: [
          'Ve a la tab "Servicios".',
          'Usa la barra de búsqueda para escribir el folio, cliente o ruta.',
          'Los resultados se filtran en tiempo real conforme escribes.',
          'Haz clic en cualquier fila para ver el detalle completo del servicio.'
        ],
        keywords: ['buscar', 'folio', 'servicio', 'consulta', 'ruta']
      },
      {
        id: 'serv-2',
        question: '¿Qué datos muestra cada servicio?',
        answer: 'Cada servicio muestra: folio, cliente, ruta (origen → destino), fecha, custodio, estatus operativo, kilómetros, cotización y si ya fue facturado.',
        keywords: ['datos', 'detalle', 'folio', 'estatus', 'kilometros']
      },
      {
        id: 'serv-3',
        question: '¿Cómo registrar detenciones en un servicio?',
        answer: 'Las detenciones documentan paradas operativas (carga, descarga, pernocta) que pueden generar cobros adicionales al cliente.',
        steps: [
          'Abre el detalle del servicio haciendo clic en la fila.',
          'Ve a la sección "Detenciones y Estadías".',
          'Haz clic en "Agregar Detención".',
          'Selecciona el tipo (carga, descarga, pernocta, espera, otro).',
          'Ingresa hora de inicio y fin — la duración se calcula automáticamente.',
          'Marca si es cobrable al cliente y/o pagable al custodio.',
          'Guarda. El sistema calculará automáticamente las horas excedentes vs. cortesía.'
        ],
        tip: 'Las horas de cortesía se configuran por cliente en la tab "Clientes". Solo las horas que excedan la cortesía generarán cobro.',
        keywords: ['detencion', 'parada', 'carga', 'descarga', 'pernocta', 'estadia']
      },
      {
        id: 'serv-4',
        question: '¿Cómo subir evidencias de gastos?',
        answer: 'Las evidencias son comprobantes de gastos operativos (casetas, hotel, alimentos) que se adjuntan al servicio.',
        steps: [
          'Abre el detalle del servicio.',
          'Ve a la sección "Evidencias de Gastos".',
          'Haz clic en "Agregar Evidencia".',
          'Selecciona el tipo de gasto y sube la imagen o PDF del comprobante.',
          'Ingresa el monto y una descripción.',
          'El equipo de finanzas puede marcar la evidencia como "Verificada".'
        ],
        keywords: ['evidencia', 'gasto', 'comprobante', 'caseta', 'hotel', 'recibo']
      }
    ]
  },
  {
    id: 'facturas',
    title: 'Facturas — Generación y Consulta',
    icon: Receipt,
    description: 'Generación de facturas por lote, consulta de facturas emitidas y seguimiento de servicios pendientes de facturar.',
    articles: [
      {
        id: 'fact-1',
        question: '¿Cómo generar una factura?',
        answer: 'El sistema permite generar facturas agrupando servicios completados por cliente.',
        steps: [
          'Ve a la tab "Facturas" y selecciona la sub-tab "Por Facturar".',
          'Identifica los servicios pendientes — están agrupados por cliente.',
          'Selecciona los servicios que deseas incluir en la factura.',
          'Haz clic en "Generar Factura".',
          'El modal auto-llena los datos fiscales del cliente (RFC, email, régimen).',
          'Selecciona el tipo de factura (Ingreso, Egreso, Traslado).',
          'Ingresa la Orden de Compra (OC) si aplica.',
          'Confirma para crear la pre-factura.'
        ],
        tip: 'La factura generada aparecerá en "Facturas Emitidas" y alimentará automáticamente las Cuentas por Cobrar.',
        keywords: ['generar', 'factura', 'crear', 'batch', 'lote', 'prefactura']
      },
      {
        id: 'fact-2',
        question: '¿Qué es "Días sin Facturar"?',
        answer: 'Es una métrica que calcula cuántos días han pasado desde que un servicio se completó sin que se haya emitido su factura. Los servicios se marcan con alertas de color: ámbar después de 15 días y rojo después de 30 días para prevenir fugas de ingreso.',
        keywords: ['dias', 'facturar', 'alerta', 'retraso', 'demora', 'pendiente']
      },
      {
        id: 'fact-3',
        question: '¿Cuál es la diferencia entre factura Inmediata y de Corte?',
        answer: 'La factura "Inmediata" se genera servicio por servicio al momento de completarse. La factura de "Corte" agrupa múltiples servicios en una sola factura al final de un período (semanal, quincenal o mensual). El tipo se configura por cliente en la tab "Clientes".',
        keywords: ['inmediata', 'corte', 'tipo', 'facturacion', 'periodo']
      },
      {
        id: 'fact-4',
        question: '¿Dónde ingreso la Orden de Compra (OC)?',
        answer: 'La OC se ingresa al momento de generar la factura en el modal de generación. Es un campo opcional pero importante para clientes corporativos que requieren trazabilidad entre la OC y la factura.',
        keywords: ['orden', 'compra', 'oc', 'trazabilidad', 'corporativo']
      },
      {
        id: 'fact-5',
        question: '¿Cómo ver el detalle de una factura emitida?',
        answer: 'En la sub-tab "Facturas Emitidas" puedes ver todas las facturas generadas con su estatus, monto total y fecha de emisión. Haz clic en cualquier factura para ver el desglose de partidas (servicios incluidos).',
        keywords: ['detalle', 'factura', 'emitida', 'partida', 'desglose']
      }
    ]
  },
  {
    id: 'cxc',
    title: 'Cuentas por Cobrar (CxC)',
    icon: Wallet,
    description: 'Seguimiento de cobranza con aging report, registro de pagos y alertas de vencimiento.',
    articles: [
      {
        id: 'cxc-1',
        question: '¿Qué es el Aging Report?',
        answer: 'El aging report (reporte de antigüedad) clasifica las facturas pendientes de cobro por rangos de días: 0-30 días (corriente), 31-60 días (vencida), 61-90 días (crítica) y 90+ días (muy atrasada). Permite identificar rápidamente qué clientes tienen pagos atrasados.',
        keywords: ['aging', 'antiguedad', 'reporte', 'vencimiento', 'cobranza']
      },
      {
        id: 'cxc-2',
        question: '¿Cómo leer los rangos del aging?',
        answer: 'Verde (0-30 días): Factura reciente, dentro de términos normales. Amarillo (31-60 días): Requiere seguimiento activo. Naranja (61-90 días): Escalación necesaria. Rojo (90+ días): Cuenta con riesgo de incobrabilidad, requiere acción inmediata.',
        keywords: ['rango', 'color', 'verde', 'rojo', 'dias', 'vencido']
      },
      {
        id: 'cxc-3',
        question: '¿Cómo registrar un pago?',
        answer: 'Al registrar un pago, la factura se marca como cobrada y se retira del aging report.',
        steps: [
          'Localiza la factura pendiente en el aging report.',
          'Haz clic en "Registrar Pago".',
          'Ingresa el monto recibido, fecha de pago y referencia bancaria.',
          'Confirma el pago. La factura se actualizará a estatus "Pagada".'
        ],
        keywords: ['pago', 'registrar', 'cobro', 'recibido', 'referencia']
      }
    ]
  },
  {
    id: 'clientes',
    title: 'Clientes — Gestión Financiera',
    icon: Users,
    description: 'Administración de datos fiscales, parámetros financieros y configuración comercial por cliente.',
    articles: [
      {
        id: 'cli-1',
        question: '¿Cómo editar los datos fiscales de un cliente?',
        answer: 'Los datos fiscales incluyen RFC, razón social, régimen fiscal, uso de CFDI y correo de facturación.',
        steps: [
          'Ve a la tab "Clientes".',
          'Busca al cliente por nombre o RFC.',
          'Haz clic en "Editar" en la fila del cliente.',
          'Modifica los campos fiscales necesarios.',
          'Guarda los cambios.'
        ],
        tip: 'Estos datos se auto-llenan al generar facturas, así que mantenlos actualizados.',
        keywords: ['fiscal', 'rfc', 'regimen', 'cfdi', 'razon social', 'editar']
      },
      {
        id: 'cli-2',
        question: '¿Cómo configurar los parámetros financieros?',
        answer: 'Cada cliente tiene parámetros que afectan la facturación: horas de cortesía, tarifa de pernocta, tipo de facturación y días máximos para facturar.',
        steps: [
          'Abre la ficha del cliente.',
          'Ve a la sección de parámetros financieros.',
          'Configura las "Horas de Cortesía" — tiempo de espera sin cargo adicional.',
          'Define la tarifa y política de pernocta.',
          'Selecciona el tipo de facturación: Inmediata o de Corte.',
          'Establece los días máximos permitidos para facturar después de completar un servicio.'
        ],
        tip: 'Las horas de cortesía se usan automáticamente al calcular estadías. Si un servicio tiene 5 horas de detención y el cliente tiene 3 horas de cortesía, solo se cobran 2 horas.',
        keywords: ['cortesia', 'pernocta', 'tipo facturacion', 'dias max', 'parametro']
      },
      {
        id: 'cli-3',
        question: '¿Cómo exportar la lista de clientes a Excel?',
        answer: 'Haz clic en el botón "Exportar" en la parte superior de la tabla de clientes. Se descargará un archivo .xlsx con toda la información visible incluyendo datos fiscales y parámetros financieros.',
        keywords: ['exportar', 'excel', 'descargar', 'xlsx', 'lista']
      }
    ]
  },
  {
    id: 'incidencias',
    title: 'Incidencias de Facturación',
    icon: AlertTriangle,
    description: 'Seguimiento de discrepancias, notas de crédito y rechazos de factura por parte de clientes.',
    articles: [
      {
        id: 'inc-1',
        question: '¿Qué tipos de incidencias existen?',
        answer: 'Discrepancia de monto: diferencia entre lo cotizado y lo facturado. Rechazo de cliente: el cliente no acepta la factura. Nota de crédito: ajuste a favor del cliente. Error administrativo: datos incorrectos en la factura. Otro: cualquier situación no clasificada.',
        keywords: ['tipo', 'incidencia', 'discrepancia', 'rechazo', 'nota credito']
      },
      {
        id: 'inc-2',
        question: '¿Cómo crear una incidencia?',
        answer: 'Las incidencias documentan problemas detectados en el proceso de facturación para su seguimiento y resolución.',
        steps: [
          'Ve a la tab "Incidencias".',
          'Haz clic en "Nueva Incidencia".',
          'Selecciona el servicio o factura relacionada.',
          'Elige el tipo de incidencia.',
          'Ingresa el monto original y el monto ajustado (si aplica).',
          'Describe la situación en el campo de observaciones.',
          'Guarda. La incidencia se creará con estatus "Abierta".'
        ],
        keywords: ['crear', 'nueva', 'incidencia', 'reportar', 'problema']
      },
      {
        id: 'inc-3',
        question: '¿Cuál es el flujo de estados de una incidencia?',
        answer: 'Abierta: recién creada, pendiente de revisión. En Revisión: el equipo de finanzas está analizando. Resuelta: se tomó acción correctiva. Cerrada: el caso está completamente finalizado. Este flujo asegura trazabilidad de cada problema detectado.',
        keywords: ['estado', 'flujo', 'abierta', 'revision', 'resuelta', 'cerrada']
      }
    ]
  },
  {
    id: 'gastos-extra',
    title: 'Gastos Extraordinarios',
    icon: DollarSign,
    description: 'Gestión de gastos no previstos como casetas adicionales, hoteles, alimentos y reparaciones.',
    articles: [
      {
        id: 'gex-1',
        question: '¿Qué tipos de gastos extraordinarios se manejan?',
        answer: 'Caseta extra: peajes no incluidos en la cotización original. Hotel: hospedaje por pernocta. Alimentos: viáticos del custodio. Reparación: gastos por falla mecánica. Combustible extra: recarga fuera de ruta. Otro: gastos no clasificados.',
        keywords: ['tipo', 'gasto', 'caseta', 'hotel', 'alimentos', 'reparacion']
      },
      {
        id: 'gex-2',
        question: '¿Cómo funciona el flujo de aprobación?',
        answer: 'Los gastos extraordinarios siguen un flujo de aprobación para control financiero.',
        steps: [
          'El coordinador o custodio registra el gasto con su comprobante.',
          'El gasto se crea con estatus "Pendiente".',
          'El supervisor revisa y puede "Aprobar" o "Rechazar".',
          'Si se aprueba, se marca si es cobrable al cliente y/o pagable al custodio.',
          'Una vez procesado, se marca como "Reembolsado".'
        ],
        tip: 'Siempre sube el comprobante (foto o PDF) para agilizar la aprobación.',
        keywords: ['aprobacion', 'pendiente', 'aprobado', 'rechazado', 'reembolso']
      },
      {
        id: 'gex-3',
        question: '¿Qué significan los flags "Cobrable al cliente" y "Pagable al custodio"?',
        answer: '"Cobrable al cliente" indica que el gasto se incluirá en la próxima factura del cliente. "Pagable al custodio" indica que se debe reembolsar al custodio que realizó el gasto. Ambos flags son independientes: un gasto puede ser cobrable al cliente pero no pagable al custodio si la empresa lo absorbió.',
        keywords: ['cobrable', 'pagable', 'cliente', 'custodio', 'flag', 'reembolso']
      }
    ]
  },
  {
    id: 'cxp',
    title: 'CxP Proveedores Armados',
    icon: Building2,
    description: 'Cuentas por pagar a proveedores de armados: generación de estados de cuenta, aprobación y pago.',
    articles: [
      {
        id: 'cxp-1',
        question: '¿Cómo generar un estado de cuenta para un proveedor?',
        answer: 'El sistema consolida automáticamente los servicios completados por un proveedor en un período para generar su estado de cuenta.',
        steps: [
          'Ve a la tab "CxP Proveedores".',
          'Haz clic en "Nuevo Estado de Cuenta".',
          'Selecciona el proveedor de armados.',
          'Define el período (fecha inicio y fin).',
          'El sistema buscará automáticamente todos los servicios completados.',
          'Revisa el total calculado y confirma para generar el borrador.'
        ],
        keywords: ['estado cuenta', 'proveedor', 'generar', 'periodo', 'consolidar']
      },
      {
        id: 'cxp-2',
        question: '¿Qué calcula automáticamente el sistema?',
        answer: 'El sistema suma las tarifas acordadas de cada asignación completada dentro del período seleccionado. Muestra el total de servicios, el monto total y el desglose por servicio individual.',
        keywords: ['calculo', 'tarifa', 'automatico', 'total', 'desglose']
      },
      {
        id: 'cxp-3',
        question: '¿Cuál es el flujo de estados de un CxP?',
        answer: 'Borrador: recién generado, pendiente de revisión interna. En Revisión: el equipo de finanzas está validando montos. Aprobado: listo para procesarse el pago. Pagado: el proveedor ya recibió su pago. Cancelado: el estado de cuenta se anuló.',
        keywords: ['estado', 'borrador', 'revision', 'aprobado', 'pagado', 'cancelado']
      }
    ]
  },
  {
    id: 'faq',
    title: 'Preguntas Frecuentes',
    icon: HelpCircle,
    description: 'Conceptos clave, definiciones y respuestas a dudas comunes sobre el módulo de facturación.',
    articles: [
      {
        id: 'faq-1',
        question: '¿Qué son las horas de cortesía?',
        answer: 'Son horas de espera incluidas sin costo adicional para el cliente. Se configuran por cliente en la tab "Clientes". Por ejemplo, si un cliente tiene 3 horas de cortesía y un servicio tuvo 5 horas de detención, solo se cobran 2 horas como estadía.',
        keywords: ['cortesia', 'horas', 'espera', 'incluidas', 'gratis']
      },
      {
        id: 'faq-2',
        question: '¿Cómo se calcula la pernocta?',
        answer: 'La pernocta se activa cuando el custodio debe pasar la noche fuera de su base. La tarifa se configura por cliente e incluye el costo del hospedaje. Se registra como una detención de tipo "pernocta" en el detalle del servicio.',
        keywords: ['pernocta', 'noche', 'hospedaje', 'tarifa', 'custodio']
      },
      {
        id: 'faq-3',
        question: '¿Qué hacer si un servicio no aparece en "Por Facturar"?',
        answer: 'Verifica que: (1) El servicio tenga estatus "completado" o "finalizado". (2) El rango de fechas incluya la fecha del servicio. (3) El servicio no haya sido ya facturado — búscalo en "Facturas Emitidas". (4) Si todo parece correcto, usa el botón de actualizar (↻).',
        keywords: ['no aparece', 'facturar', 'pendiente', 'faltante', 'servicio']
      },
      {
        id: 'faq-4',
        question: '¿Cómo se calcula el IVA?',
        answer: 'El IVA se calcula al 16% sobre el subtotal de la factura. El sistema aplica automáticamente la tasa vigente al generar la pre-factura. El desglose aparece en el detalle de la factura emitida.',
        keywords: ['iva', 'impuesto', '16', 'calculo', 'tasa']
      },
      {
        id: 'faq-5',
        question: '¿Qué roles tienen acceso al módulo de Facturación?',
        answer: 'El módulo está disponible para los roles: "facturación" (acceso completo a generar y gestionar facturas), "finanzas" (acceso completo incluyendo CxC y CxP), "coordinador" (consulta de servicios y detenciones), y "admin" (acceso total). Los permisos se gestionan desde el módulo de Sistema.',
        keywords: ['rol', 'permiso', 'acceso', 'facturacion', 'finanzas', 'admin']
      },
      {
        id: 'faq-6',
        question: '¿Qué es una estadía?',
        answer: 'Una estadía es el tiempo de espera cobrable que resulta cuando las detenciones de un servicio superan las horas de cortesía del cliente. Se calcula automáticamente y puede generar un cargo adicional en la factura.',
        keywords: ['estadia', 'espera', 'cobrable', 'tiempo', 'excedente']
      }
    ]
  }
];
