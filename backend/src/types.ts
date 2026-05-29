export type EstadoEstructura = "pendiente" | "en_proceso" | "terminada" | "entregada";

export type TipoEstructura = {
  id: number;
  nombre: string;
  activo: boolean;
};

export type UnidadNegocio = {
  id: number;
  nombre: string;
  ubicacion: string;
  activo: boolean;
};

export type Estructura = {
  id: string;
  folio: string;
  tipo_id: number;
  unidad_destino_id: number;
  descripcion: string;
  cantidad_fabricada: number;
  estado: EstadoEstructura;
  fecha_inicio: string;
  fecha_termino: string | null;
  responsable: string;
  costo_estimado: number | null;
  observaciones: string | null;
};

export type Entrega = {
  id: string;
  estructura_id: string;
  unidad_id: number;
  cantidad_entregada: number;
  fecha_entrega: string;
  recibido_por: string;
  evidencia_url: string | null;
  comentarios: string | null;
  created_at: string;
};
