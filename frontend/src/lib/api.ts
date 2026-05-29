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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

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

type EstructurasFilter = {
  estado?: string;
  tipo_id?: number;
  unidad_id?: number;
  q?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
};

export async function getEstructuras(filter?: EstructurasFilter): Promise<Estructura[]> {
  const params: Record<string, string> = {};
  if (filter?.estado) params.estado = filter.estado;
  if (filter?.tipo_id) params.tipo_id = String(filter.tipo_id);
  if (filter?.unidad_id) params.unidad_id = String(filter.unidad_id);
  if (filter?.q) params.q = filter.q;
  if (filter?.fecha_desde) params.fecha_desde = filter.fecha_desde;
  if (filter?.fecha_hasta) params.fecha_hasta = filter.fecha_hasta;

  const { data } = await api.get<Estructura[]>("/estructuras", { params });
  return data;
}

export async function getEstructuraById(id: string): Promise<Estructura> {
  const { data } = await api.get<Estructura>(`/estructuras/${id}`);
  return data;
}

export async function getEntregasByEstructura(id: string): Promise<any[]> {
  const { data } = await api.get(`/estructuras/${id}/entregas`);
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

export async function uploadModeloTipo(id: number, file: File): Promise<TipoEstructura> {
  const formData = new FormData();
  formData.append("modelo", file);
  const { data } = await api.post<TipoEstructura>(`/tipos-estructura/${id}/modelo`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function deleteModeloTipo(id: number): Promise<TipoEstructura> {
  const { data } = await api.delete<TipoEstructura>(`/tipos-estructura/${id}/modelo`);
  return data;
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

export async function putEstructura(id: string, payload: EstructuraCreate): Promise<Estructura> {
  const { data } = await api.put<Estructura>(`/estructuras/${id}`, payload);
  return data;
}

export async function deleteEstructura(id: string): Promise<void> {
  await api.delete(`/estructuras/${id}`);
}

export async function postEntrega(estructuraId: string, payload: EntregaCreate): Promise<void> {
  await api.post(`/estructuras/${estructuraId}/entregas`, payload);
}

export async function deleteEntrega(id: string): Promise<void> {
  await api.delete(`/entregas/${id}`);
}

