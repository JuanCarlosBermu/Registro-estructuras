import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { randomUUID } from "crypto";
import {
  entregas,
  estructuras,
  nextFolio,
  syncEstado,
  tiposEstructura,
  totalEntregado,
  unidadesNegocio
} from "./data";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api/v1/tipos-estructura", (_req: Request, res: Response) => {
  res.json(tiposEstructura);
});

app.get("/api/v1/unidades-negocio", (_req: Request, res: Response) => {
  res.json(unidadesNegocio);
});

app.get("/api/v1/estructuras", (req: Request, res: Response) => {
  const estadoFilter = typeof req.query.estado === "string" ? req.query.estado : undefined;
  const tipoIdFilter = typeof req.query.tipo_id === "string" ? Number(req.query.tipo_id) : undefined;

  const rows = estructuras
    .filter((row) => (estadoFilter ? row.estado === estadoFilter : true))
    .filter((row) => (tipoIdFilter ? row.tipo_id === tipoIdFilter : true))
    .map((row) => {
      const tipo = tiposEstructura.find((item) => item.id === row.tipo_id);
      const unidadDestino = unidadesNegocio.find((item) => item.id === row.unidad_destino_id);
      const entregado = totalEntregado(row.id);
      return {
        ...row,
        tipo_nombre: tipo?.nombre ?? "N/A",
        unidad_destino_nombre: unidadDestino?.nombre ?? "N/A",
        cantidad_entregada_total: entregado,
        saldo_pendiente: Math.max(row.cantidad_fabricada - entregado, 0)
      };
    });

  res.json(rows);
});

app.post("/api/v1/estructuras", (req: Request, res: Response) => {
  const {
    tipo_id,
    descripcion,
    cantidad_fabricada,
    fecha_inicio,
    fecha_termino,
    responsable,
    unidad_destino_id,
    costo_estimado,
    observaciones
  } = req.body as Record<string, unknown>;

  if (
    typeof tipo_id !== "number" ||
    typeof descripcion !== "string" ||
    typeof cantidad_fabricada !== "number" ||
    typeof fecha_inicio !== "string" ||
    typeof responsable !== "string" ||
    typeof unidad_destino_id !== "number"
  ) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Campos obligatorios invalidos"
    });
  }

  const tipo = tiposEstructura.find((item) => item.id === tipo_id);
  if (!tipo) {
    return res.status(404).json({ error: "TIPO_NOT_FOUND", message: "Tipo no existe" });
  }

  const unidadDestino = unidadesNegocio.find((item) => item.id === unidad_destino_id);
  if (!unidadDestino) {
    return res.status(404).json({ error: "UNIDAD_NOT_FOUND", message: "Unidad destino no existe" });
  }

  const row = {
    id: randomUUID(),
    folio: nextFolio(),
    tipo_id,
    descripcion,
    cantidad_fabricada,
    estado: "pendiente" as const,
    fecha_inicio,
    fecha_termino: typeof fecha_termino === "string" ? fecha_termino : null,
    responsable,
    unidad_destino_id,
    costo_estimado: typeof costo_estimado === "number" ? costo_estimado : null,
    observaciones: typeof observaciones === "string" ? observaciones : null
  };

  estructuras.push(row);
  return res.status(201).json(row);
});

app.get("/api/v1/estructuras/:id/entregas", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const rows = entregas
    .filter((row) => row.estructura_id === id)
    .map((row) => ({
      ...row,
      unidad_nombre: unidadesNegocio.find((item) => item.id === row.unidad_id)?.nombre ?? "N/A"
    }))
    .sort((a, b) => b.fecha_entrega.localeCompare(a.fecha_entrega));

  return res.json(rows);
});

app.post("/api/v1/estructuras/:id/entregas", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const estructura = estructuras.find((item) => item.id === id);
  if (!estructura) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Estructura no existe" });
  }

  const { unidad_id, cantidad_entregada, fecha_entrega, recibido_por, evidencia_url, comentarios } = req.body as Record<
    string,
    unknown
  >;

  if (
    typeof unidad_id !== "number" ||
    typeof cantidad_entregada !== "number" ||
    typeof fecha_entrega !== "string" ||
    typeof recibido_por !== "string"
  ) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Campos obligatorios invalidos"
    });
  }

  const unidad = unidadesNegocio.find((item) => item.id === unidad_id);
  if (!unidad) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Unidad no existe" });
  }

  const totalActual = totalEntregado(id);
  if (totalActual + cantidad_entregada > estructura.cantidad_fabricada) {
    return res.status(422).json({
      error: "OVER_DELIVERY",
      message: "La entrega excede la cantidad fabricada",
      details: {
        fabricada: estructura.cantidad_fabricada,
        entregada_actual: totalActual,
        nuevo_intento: cantidad_entregada
      }
    });
  }

  const entrega = {
    id: randomUUID(),
    estructura_id: id,
    unidad_id,
    cantidad_entregada,
    fecha_entrega,
    recibido_por,
    evidencia_url: typeof evidencia_url === "string" ? evidencia_url : null,
    comentarios: typeof comentarios === "string" ? comentarios : null,
    created_at: new Date().toISOString()
  };

  entregas.push(entrega);
  syncEstado(id);
  return res.status(201).json(entrega);
});

app.get("/api/v1/entregas", (req: Request, res: Response) => {
  const unidadIdFilter = typeof req.query.unidad_id === "string" ? Number(req.query.unidad_id) : undefined;
  const folioFilter = typeof req.query.folio === "string" ? req.query.folio.toLowerCase() : undefined;

  const rows = entregas
    .filter((row) => (unidadIdFilter ? row.unidad_id === unidadIdFilter : true))
    .filter((row) => {
      if (!folioFilter) {
        return true;
      }
      const estructura = estructuras.find((item) => item.id === row.estructura_id);
      return (estructura?.folio.toLowerCase() ?? "").includes(folioFilter);
    })
    .map((row) => {
      const estructura = estructuras.find((item) => item.id === row.estructura_id);
      const unidad = unidadesNegocio.find((item) => item.id === row.unidad_id);
      return {
        ...row,
        folio: estructura?.folio ?? "N/A",
        unidad_nombre: unidad?.nombre ?? "N/A"
      };
    });

  return res.json(rows);
});

app.get("/api/v1/dashboard/resumen", (_req: Request, res: Response) => {
  const totalFabricadas = estructuras.reduce((sum, row) => sum + row.cantidad_fabricada, 0);
  const totalEntregadas = entregas.reduce((sum, row) => sum + row.cantidad_entregada, 0);
  const pendientes = Math.max(totalFabricadas - totalEntregadas, 0);
  const cumplimiento = totalFabricadas === 0 ? 0 : Number(((totalEntregadas / totalFabricadas) * 100).toFixed(2));

  res.json({
    total_fabricadas: totalFabricadas,
    total_entregadas: totalEntregadas,
    pendientes,
    cumplimiento_pct: cumplimiento
  });
});

app.get("/api/v1/dashboard/por-tipo", (_req: Request, res: Response) => {
  const rows = tiposEstructura.map((tipo) => {
    const total = estructuras
      .filter((row) => row.tipo_id === tipo.id)
      .reduce((sum, row) => sum + row.cantidad_fabricada, 0);
    return { tipo: tipo.nombre, total_fabricada: total };
  });

  res.json(rows);
});

app.get("/api/v1/dashboard/por-unidad", (_req: Request, res: Response) => {
  const rows = unidadesNegocio.map((unidad) => {
    const total = entregas
      .filter((row) => row.unidad_id === unidad.id)
      .reduce((sum, row) => sum + row.cantidad_entregada, 0);
    return { unidad: unidad.nombre, total_entregada: total };
  });

  res.json(rows);
});

function escapeCsv(value: unknown): string {
  const stringValue = String(value ?? "");
  if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

app.get("/api/v1/reportes/entregas.csv", (_req: Request, res: Response) => {
  const headers = [
    "folio",
    "tipo_estructura",
    "unidad_negocio",
    "cantidad_entregada",
    "fecha_entrega",
    "recibido_por",
    "comentarios"
  ];

  const rows = entregas.map((row) => {
    const estructura = estructuras.find((item) => item.id === row.estructura_id);
    const tipo = tiposEstructura.find((item) => item.id === estructura?.tipo_id);
    const unidad = unidadesNegocio.find((item) => item.id === row.unidad_id);
    return [
      escapeCsv(estructura?.folio ?? "N/A"),
      escapeCsv(tipo?.nombre ?? "N/A"),
      escapeCsv(unidad?.nombre ?? "N/A"),
      escapeCsv(row.cantidad_entregada),
      escapeCsv(row.fecha_entrega),
      escapeCsv(row.recibido_por),
      escapeCsv(row.comentarios ?? "")
    ].join(",");
  });

  const csvContent = `${headers.join(",")}\n${rows.join("\n")}`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"reporte_entregas.csv\"");
  res.send(csvContent);
});

export default app;
