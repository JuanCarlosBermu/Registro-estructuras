import { eq, sql } from "drizzle-orm";
import { db } from "./db/index";
import { entregas, estructuras } from "./db/schema";

export async function nextFolio(): Promise<string> {
  const result = await db
    .select({ folio: estructuras.folio })
    .from(estructuras)
    .orderBy(sql`${estructuras.folio} DESC`)
    .limit(1);

  if (result.length === 0) {
    return "EST-2026-0001";
  }

  const lastFolio = result[0].folio;
  const match = lastFolio.match(/EST-(\d{4})-(\d+)/);
  if (!match) {
    return "EST-2026-0001";
  }

  const year = match[1];
  const seq = parseInt(match[2], 10) + 1;
  return `EST-${year}-${String(seq).padStart(4, "0")}`;
}

export async function totalEntregado(estructuraId: string): Promise<number> {
  const result = await db
    .select({ total: sql<number>`COALESCE(SUM(${entregas.cantidadEntregada}), 0)` })
    .from(entregas)
    .where(eq(entregas.estructuraId, estructuraId));

  return Number(result[0]?.total ?? 0);
}

export async function syncEstado(estructuraId: string): Promise<void> {
  const estructura = await db.query.estructuras.findFirst({
    where: eq(estructuras.id, estructuraId),
  });

  if (!estructura) {
    return;
  }

  const total = await totalEntregado(estructuraId);
  let nuevoEstado = estructura.estado;

  if (total >= estructura.cantidadFabricada) {
    nuevoEstado = "entregada";
  } else if (estructura.estado === "entregada") {
    nuevoEstado = "terminada";
  } else if (estructura.estado === "pendiente") {
    nuevoEstado = "en_proceso";
  }

  if (nuevoEstado !== estructura.estado) {
    await db
      .update(estructuras)
      .set({ estado: nuevoEstado })
      .where(eq(estructuras.id, estructuraId));
  }
}
