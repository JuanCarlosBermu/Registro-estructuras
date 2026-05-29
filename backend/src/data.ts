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

export const estructuras: Estructura[] = [];

export const entregas: Entrega[] = [];

let folioSeq = 1;

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
