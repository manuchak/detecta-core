
export interface Proveedor {
  id: string;
  nombre: string;
  razon_social?: string;
  rfc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto_principal?: string;
  telefono_contacto?: string;
  email_contacto?: string;
  condiciones_pago?: string;
  descuento_por_volumen?: number;
  calificacion?: number;
  activo?: boolean;
  notas?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CategoriaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  codigo?: string;
  parent_id?: string;
  activo?: boolean;
  created_at?: string;
}

export interface ProductoInventario {
  id: string;
  codigo_producto: string;
  nombre: string;
  descripcion?: string;
  categoria_id?: string;
  marca?: string;
  modelo?: string;
  especificaciones?: any;
  unidad_medida?: string;
  precio_compra_promedio?: number;
  precio_venta_sugerido?: number;
  stock_minimo?: number;
  stock_maximo?: number;
  ubicacion_almacen?: string;
  es_serializado?: boolean;
  requiere_configuracion?: boolean;
  garantia_meses?: number;
  activo?: boolean;
  foto_url?: string;
  marca_gps_id?: string;
  modelo_gps_id?: string;
  created_at?: string;
  updated_at?: string;
  categoria?: CategoriaProducto;
  stock?: StockProducto;
}

export interface StockProducto {
  id: string;
  producto_id: string;
  cantidad_disponible: number;
  cantidad_reservada: number;
  cantidad_transito: number;
  valor_inventario: number;
  ultima_actualizacion: string;
  producto?: ProductoInventario;
}

export interface OrdenCompra {
  id: string;
  numero_orden: string;
  proveedor_id: string;
  fecha_orden: string;
  fecha_entrega_esperada?: string;
  fecha_entrega_real?: string;
  estado: 'borrador' | 'enviada' | 'confirmada' | 'parcial' | 'recibida' | 'cancelada';
  subtotal: number;
  impuestos: number;
  total: number;
  moneda?: string;
  terminos_pago?: string;
  notas?: string;
  creado_por?: string;
  aprobado_por?: string;
  fecha_aprobacion?: string;
  created_at?: string;
  updated_at?: string;
  proveedor?: Proveedor;
  detalles?: DetalleOrdenCompra[];
}

export interface DetalleOrdenCompra {
  id: string;
  orden_id: string;
  producto_id: string;
  cantidad_solicitada: number;
  cantidad_recibida: number;
  precio_unitario: number;
  descuento_porcentaje?: number;
  subtotal: number;
  notas?: string;
  created_at?: string;
  producto?: ProductoInventario;
}

export interface MovimientoInventario {
  id: string;
  producto_id: string;
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'reserva' | 'liberacion';
  cantidad: number;
  cantidad_anterior: number;
  cantidad_nueva: number;
  costo_unitario?: number;
  valor_total?: number;
  referencia_tipo?: string;
  referencia_id?: string;
  motivo?: string;
  usuario_id?: string;
  fecha_movimiento: string;
  notas?: string;
  producto?: ProductoInventario;
}

export interface ProductoSerie {
  id: string;
  producto_id: string;
  numero_serie: string;
  imei?: string;
  mac_address?: string;
  estado: 'disponible' | 'reservado' | 'asignado' | 'instalado' | 'defectuoso' | 'reparacion';
  fecha_ingreso: string;
  fecha_vencimiento?: string;
  ubicacion_fisica?: string;
  orden_compra_id?: string;
  servicio_asignado?: string;
  instalacion_asignada?: string;
  costo_adquisicion?: number;
  notas?: string;
  created_at?: string;
  updated_at?: string;
  producto?: ProductoInventario;
}

export interface RecepcionMercancia {
  id: string;
  orden_compra_id?: string;
  numero_recepcion: string;
  fecha_recepcion: string;
  recibido_por?: string;
  estado: 'pendiente' | 'parcial' | 'completa' | 'con_diferencias';
  notas_recepcion?: string;
  created_at?: string;
  orden_compra?: OrdenCompra;
  detalles?: DetalleRecepcion[];
}

export interface DetalleRecepcion {
  id: string;
  recepcion_id: string;
  producto_id: string;
  cantidad_esperada: number;
  cantidad_recibida: number;
  diferencia: number;
  estado_producto: 'bueno' | 'dañado' | 'defectuoso';
  notas?: string;
  producto?: ProductoInventario;
}

export interface MarcaGPS {
  id: string;
  nombre: string;
  pais_origen?: string;
  sitio_web?: string;
  soporte_wialon?: boolean;
  activo?: boolean;
  created_at?: string;
}

export interface ModeloGPS {
  id: string;
  marca_id: string;
  nombre: string;
  tipo_dispositivo?: string; // 'tracker', 'obd', 'beacon', 'smartphone'
  protocolo_comunicacion?: string[];
  conectividad?: string[]; // '2G', '3G', '4G', 'WiFi', 'Bluetooth'
  gps_precision?: string;
  bateria_interna?: boolean;
  alimentacion_externa?: string; // '12V', '24V', '9-75V'
  entradas_digitales?: number;
  salidas_digitales?: number;
  entradas_analogicas?: number;
  sensores_soportados?: string[];
  temperatura_operacion?: string;
  certificaciones?: string[];
  dimensiones?: string;
  peso_gramos?: number;
  resistencia_agua?: string; // 'IP65', 'IP67', etc
  precio_referencia_usd?: number;
  disponible_mexico?: boolean;
  observaciones?: string;
  especificaciones_json?: any;
  activo?: boolean;
  created_at?: string;
  marca?: MarcaGPS;
}
