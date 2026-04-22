import axios from "axios";
import type {
  DashboardResumen,
  EntregaCreate,
  Estructura,
  EstructuraCreate,
  TipoEstructura,
  UnidadNegocio
} from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"
});

type DashboardRange = {
  fecha_desde?: string;
  fecha_hasta?: string;
};

function toParams(range?: DashboardRange): Record<string, string> | undefined {
  if (!range?.fecha_desde && !range?.fecha_hasta) {
    return undefined;
  }

  const params: Record<string, string> = {};
  if (range.fecha_desde) {
    params.fecha_desde = range.fecha_desde;
  }
  if (range.fecha_hasta) {
    params.fecha_hasta = range.fecha_hasta;
  }
  return params;
}

export async function getDashboardResumen(range?: DashboardRange): Promise<DashboardResumen> {
  const { data } = await api.get<DashboardResumen>("/dashboard/resumen", {
    params: toParams(range)
  });
  return data;
}

export async function getDashboardPorTipo(range?: DashboardRange): Promise<{ tipo: string; total_fabricada: number }[]> {
  const { data } = await api.get<{ tipo: string; total_fabricada: number }[]>("/dashboard/por-tipo", {
    params: toParams(range)
  });
  return data;
}

export async function getDashboardPorUnidad(range?: DashboardRange): Promise<{ unidad: string; total_entregada: number }[]> {
  const { data } = await api.get<{ unidad: string; total_entregada: number }[]>("/dashboard/por-unidad", {
    params: toParams(range)
  });
  return data;
}

export async function getEstructuras(): Promise<Estructura[]> {
  const { data } = await api.get<Estructura[]>("/estructuras");
  return data;
}

export async function getUnidades(): Promise<UnidadNegocio[]> {
  const { data } = await api.get<UnidadNegocio[]>("/unidades-negocio");
  return data;
}

export async function getTiposEstructura(): Promise<TipoEstructura[]> {
  const { data } = await api.get<TipoEstructura[]>("/tipos-estructura");
  return data;
}

export async function postTipoEstructura(nombre: string): Promise<TipoEstructura> {
  const { data } = await api.post<TipoEstructura>("/tipos-estructura", { nombre });
  return data;
}

export async function deleteTipoEstructura(id: number): Promise<void> {
  await api.delete(`/tipos-estructura/${id}`);
}

export async function postUnidadNegocio(payload: { nombre: string; ubicacion?: string }): Promise<UnidadNegocio> {
  const { data } = await api.post<UnidadNegocio>("/unidades-negocio", payload);
  return data;
}

export async function deleteUnidadNegocio(id: number): Promise<void> {
  await api.delete(`/unidades-negocio/${id}`);
}

export async function postEstructura(payload: EstructuraCreate): Promise<Estructura> {
  const { data } = await api.post<Estructura>("/estructuras", payload);
  return data;
}

export async function postEntrega(estructuraId: string, payload: EntregaCreate): Promise<void> {
  await api.post(`/estructuras/${estructuraId}/entregas`, payload);
}

