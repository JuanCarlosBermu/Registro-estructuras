import { randomUUID } from "crypto";
import { Entrega, Estructura, EstadoEstructura, TipoEstructura, UnidadNegocio } from "./types";

export const tiposEstructura: TipoEstructura[] = [
  { id: 1, nombre: "Mesa de trabajo", activo: true },
  { id: 2, nombre: "Carrito", activo: true },
  { id: 3, nombre: "Rack", activo: true },
  { id: 4, nombre: "Soporte", activo: true },
  { id: 5, nombre: "Conveyor", activo: true },
  { id: 6, nombre: "Pizarron", activo: true },
  { id: 7, nombre: "Otro", activo: true }
];

export const unidadesNegocio: UnidadNegocio[] = [
  { id: 1, nombre: "Produccion", ubicacion: "Planta Norte", activo: true },
  { id: 2, nombre: "Ensamble", ubicacion: "Planta Norte", activo: true },
  { id: 3, nombre: "Calidad", ubicacion: "Planta Norte", activo: true },
  { id: 4, nombre: "Mantenimiento", ubicacion: "Planta Norte", activo: true },
  { id: 5, nombre: "Logistica", ubicacion: "CEDIS", activo: true },
  { id: 6, nombre: "Almacen", ubicacion: "CEDIS", activo: true }
];

export const estructuras: Estructura[] = [
  {
    id: randomUUID(),
    folio: "EST-2026-0001",
    tipo_id: 1,
    descripcion: "Mesa inox 1.5m",
    cantidad_fabricada: 10,
    estado: "terminada",
    fecha_inicio: "2026-04-01",
    fecha_termino: "2026-04-03",
    responsable: "Juan Perez",
    costo_estimado: 12500,
    observaciones: "Lote para area de ensamble"
  },
  {
    id: randomUUID(),
    folio: "EST-2026-0002",
    tipo_id: 5,
    descripcion: "Conveyor de rodillos 4m",
    cantidad_fabricada: 2,
    estado: "en_proceso",
    fecha_inicio: "2026-04-05",
    fecha_termino: null,
    responsable: "Luis Gomez",
    costo_estimado: 24000,
    observaciones: "Pendiente pintura"
  },
  {
    id: randomUUID(),
    folio: "EST-2026-0003",
    tipo_id: 3,
    descripcion: "Rack de carga media",
    cantidad_fabricada: 8,
    estado: "pendiente",
    fecha_inicio: "2026-04-08",
    fecha_termino: null,
    responsable: "Ana Ruiz",
    costo_estimado: 15000,
    observaciones: null
  }
];

export const entregas: Entrega[] = [
  {
    id: randomUUID(),
    estructura_id: estructuras[0].id,
    unidad_id: 2,
    cantidad_entregada: 6,
    fecha_entrega: "2026-04-04",
    recibido_por: "Carlos Diaz",
    evidencia_url: null,
    comentarios: "Entrega parcial",
    created_at: new Date().toISOString()
  },
  {
    id: randomUUID(),
    estructura_id: estructuras[0].id,
    unidad_id: 1,
    cantidad_entregada: 4,
    fecha_entrega: "2026-04-06",
    recibido_por: "Maria Lopez",
    evidencia_url: null,
    comentarios: "Entrega total",
    created_at: new Date().toISOString()
  }
];

let folioSeq = 4;

export function nextFolio(): string {
  const padded = String(folioSeq).padStart(4, "0");
  folioSeq += 1;
  return `EST-2026-${padded}`;
}

export function totalEntregado(estructuraId: string): number {
  return entregas
    .filter((item) => item.estructura_id === estructuraId)
    .reduce((sum, item) => sum + item.cantidad_entregada, 0);
}

export function syncEstado(estructuraId: string): void {
  const estructura = estructuras.find((item) => item.id === estructuraId);
  if (!estructura) {
    return;
  }

  const total = totalEntregado(estructuraId);
  if (total >= estructura.cantidad_fabricada) {
    estructura.estado = "entregada";
  } else if (estructura.estado === "entregada") {
    estructura.estado = "terminada";
  } else if (estructura.estado === "pendiente") {
    estructura.estado = "en_proceso";
  }
}

export function estadoRank(estado: EstadoEstructura): number {
  switch (estado) {
    case "pendiente":
      return 0;
    case "en_proceso":
      return 1;
    case "terminada":
      return 2;
    case "entregada":
      return 3;
    default:
      return 0;
  }
}
