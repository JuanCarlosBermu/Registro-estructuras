export type DashboardResumen = {
  total_fabricadas: number;
  total_entregadas: number;
  pendientes: number;
  cumplimiento_pct: number;
};

export type Estructura = {
  id: string;
  folio: string;
  tipo_id: number;
  tipo_nombre?: string;
  unidad_destino_id: number;
  unidad_destino_nombre?: string;
  descripcion: string;
  cantidad_fabricada: number;
  estado: "pendiente" | "en_proceso" | "terminada" | "entregada";
  fecha_inicio: string;
  fecha_termino: string | null;
  responsable: string;
  cantidad_entregada_total?: number;
  saldo_pendiente?: number;
};

export type UnidadNegocio = {
  id: number;
  nombre: string;
  ubicacion: string;
  activo: boolean;
};

export type EntregaCreate = {
  unidad_id: number;
  cantidad_entregada: number;
  fecha_entrega: string;
  recibido_por: string;
  evidencia_url?: string | null;
  comentarios?: string | null;
};

export type TipoEstructura = {
  id: number;
  nombre: string;
  activo: boolean;
};

export type EstructuraCreate = {
  tipo_id: number;
  unidad_destino_id: number;
  descripcion: string;
  cantidad_fabricada: number;
  fecha_inicio: string;
  fecha_termino?: string | null;
  responsable: string;
  costo_estimado?: number | null;
  observaciones?: string | null;
};
