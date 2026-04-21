import axios from "axios";
import type { DashboardResumen, EntregaCreate, Estructura, UnidadNegocio } from "../types";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1"
});

export async function getDashboardResumen(): Promise<DashboardResumen> {
  const { data } = await api.get<DashboardResumen>("/dashboard/resumen");
  return data;
}

export async function getDashboardPorTipo(): Promise<{ tipo: string; total_fabricada: number }[]> {
  const { data } = await api.get<{ tipo: string; total_fabricada: number }[]>("/dashboard/por-tipo");
  return data;
}

export async function getDashboardPorUnidad(): Promise<{ unidad: string; total_entregada: number }[]> {
  const { data } = await api.get<{ unidad: string; total_entregada: number }[]>("/dashboard/por-unidad");
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

export async function postEntrega(estructuraId: string, payload: EntregaCreate): Promise<void> {
  await api.post(`/estructuras/${estructuraId}/entregas`, payload);
}

