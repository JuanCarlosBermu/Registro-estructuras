import cors from "cors";
import express, { Request, Response, NextFunction } from "express";
import helmet from "helmet";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db/index";
import { entregas, estructuras, tiposEstructura, unidadesNegocio, usuarios } from "./db/schema";
import { nextFolio, syncEstado, totalEntregado } from "./data";
import { authenticate, authorize, AuthRequest, UserRole } from "./middleware/auth";
import { uploadFile as s3Upload, deleteFile as s3Delete, urlToKey, useS3 } from "./lib/s3";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "model/gltf-binary" || file.originalname.endsWith(".glb")) {
      cb(null, true);
    } else {
      cb(new Error("Solo se permiten archivos .glb"));
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

function mapTipo(t: typeof tiposEstructura.$inferSelect) {
  return { id: t.id, nombre: t.nombre, activo: t.activo, modelo_url: t.modeloUrl };
}

function mapUnidad(u: typeof unidadesNegocio.$inferSelect) {
  return { id: u.id, nombre: u.nombre, ubicacion: u.ubicacion, activo: u.activo };
}

function mapEstructura(e: typeof estructuras.$inferSelect) {
  return {
    id: e.id,
    folio: e.folio,
    tipo_id: e.tipoId,
    unidad_destino_id: e.unidadDestinoId,
    descripcion: e.descripcion,
    cantidad_fabricada: e.cantidadFabricada,
    estado: e.estado,
    fecha_inicio: e.fechaInicio,
    fecha_termino: e.fechaTermino,
    responsable: e.responsable,
    costo_estimado: e.costoEstimado ? Number(e.costoEstimado) : null,
    observaciones: e.observaciones,
    linea_produccion: e.lineaProduccion,
    estacion: e.estacion,
    created_at: e.createdAt
  };
}

function mapEntrega(e: typeof entregas.$inferSelect) {
  return {
    id: e.id,
    estructura_id: e.estructuraId,
    unidad_id: e.unidadId,
    cantidad_entregada: e.cantidadEntregada,
    fecha_entrega: e.fechaEntrega,
    recibido_por: e.recibidoPor,
    evidencia_url: e.evidenciaUrl,
    comentarios: e.comentarios,
    created_at: e.createdAt
  };
}

app.get("/health", async (_req: Request, res: Response) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ ok: true, db: "connected" });
  } catch {
    res.status(503).json({ ok: false, db: "disconnected" });
  }
});

app.post("/api/v1/auth/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email y password requeridos" });
  }

  const user = await db.query.usuarios.findFirst({
    where: and(eq(usuarios.email, email), eq(usuarios.activo, true))
  });

  if (!user) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Credenciales invalidas" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Credenciales invalidas" });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol as UserRole },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return res.json({
    token,
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol }
  });
});

app.post("/api/v1/auth/register", async (req: Request, res: Response) => {
  const { email, password, nombre, rol } = req.body as Record<string, unknown>;

  if (typeof email !== "string" || typeof password !== "string" || typeof nombre !== "string") {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Email, password y nombre requeridos" });
  }

  const existing = await db.query.usuarios.findFirst({
    where: eq(usuarios.email, email)
  });

  if (existing) {
    return res.status(409).json({ error: "DUPLICATE", message: "El email ya esta registrado" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const validRol = typeof rol === "string" && ["admin", "operador", "visor"].includes(rol) ? rol : "operador";

  const [user] = await db
    .insert(usuarios)
    .values({
      email,
      password: hashedPassword,
      nombre,
      rol: validRol,
      activo: true
    })
    .returning();

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol as UserRole },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return res.status(201).json({
    token,
    user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol }
  });
});

app.get("/api/v1/auth/me", authenticate, (req: AuthRequest, res: Response) => {
  return res.json({ user: req.user });
});

app.use("/api/v1", (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith("/auth")) {
    return next();
  }
  authenticate(req as AuthRequest, res, next);
});

app.get("/api/v1/tipos-estructura", async (_req: Request, res: Response) => {
  try {
    const rows = await db.select().from(tiposEstructura);
    res.json(rows.map(mapTipo));
  } catch (error) {
    console.error("Error fetching tipos:", error);
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/v1/tipos-estructura", async (req: Request, res: Response) => {
  const { nombre } = req.body as Record<string, unknown>;
  if (typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Nombre es obligatorio"
    });
  }

  const cleanName = nombre.trim();
  const duplicate = await db.query.tiposEstructura.findFirst({
    where: eq(tiposEstructura.nombre, cleanName)
  });

  if (duplicate) {
    return res.status(409).json({
      error: "DUPLICATE",
      message: "El tipo de estructura ya existe"
    });
  }

  const [row] = await db
    .insert(tiposEstructura)
    .values({ nombre: cleanName, activo: true })
    .returning();

  return res.status(201).json(mapTipo(row));
});

app.post("/api/v1/tipos-estructura/:id/modelo", upload.single("modelo"), async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Id invalido" });
  }

  if (!req.file) {
    return res.status(400).json({ error: "NO_FILE", message: "No se recibio archivo" });
  }

  const existing = await db.query.tiposEstructura.findFirst({
    where: eq(tiposEstructura.id, id)
  });

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Tipo no existe" });
  }

  let modeloUrl: string;

  if (useS3()) {
    const key = `modelos/${Date.now()}-${req.file.originalname}`;
    modeloUrl = await s3Upload(key, req.file.buffer, req.file.mimetype);
  } else {
    const uploadsDir = path.join(__dirname, "../uploads/modelos");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = Date.now() + "-" + Math.round(Math.random() * 1e9) + "-" + req.file.originalname;
    fs.writeFileSync(path.join(uploadsDir, filename), req.file.buffer);
    modeloUrl = `/uploads/modelos/${filename}`;
  }

  const [updated] = await db
    .update(tiposEstructura)
    .set({ modeloUrl })
    .where(eq(tiposEstructura.id, id))
    .returning();

  return res.json(mapTipo(updated));
});

app.delete("/api/v1/tipos-estructura/:id/modelo", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "VALIDATION_ERROR", message: "Id invalido" });
  }

  const existing = await db.query.tiposEstructura.findFirst({
    where: eq(tiposEstructura.id, id)
  });

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Tipo no existe" });
  }

  if (existing.modeloUrl) {
    if (useS3()) {
      const key = urlToKey(existing.modeloUrl);
      if (key) await s3Delete(key);
    }
  }

  const [updated] = await db
    .update(tiposEstructura)
    .set({ modeloUrl: null })
    .where(eq(tiposEstructura.id, id))
    .returning();

  return res.json(mapTipo(updated));
});

app.delete("/api/v1/tipos-estructura/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Id invalido"
    });
  }

  const existing = await db.query.tiposEstructura.findFirst({
    where: eq(tiposEstructura.id, id)
  });

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Tipo no existe" });
  }

  const inUse = await db.query.estructuras.findFirst({
    where: eq(estructuras.tipoId, id)
  });

  if (inUse) {
    return res.status(409).json({
      error: "TYPE_IN_USE",
      message: "No se puede quitar un tipo ya asignado a estructuras"
    });
  }

  const [removed] = await db
    .delete(tiposEstructura)
    .where(eq(tiposEstructura.id, id))
    .returning();

  return res.json(mapTipo(removed));
});

app.get("/api/v1/unidades-negocio", async (_req: Request, res: Response) => {
  const rows = await db.select().from(unidadesNegocio);
  res.json(rows.map(mapUnidad));
});

app.post("/api/v1/unidades-negocio", async (req: Request, res: Response) => {
  const { nombre, ubicacion } = req.body as Record<string, unknown>;
  if (typeof nombre !== "string" || !nombre.trim()) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Nombre es obligatorio"
    });
  }

  const cleanName = nombre.trim();
  const duplicate = await db.query.unidadesNegocio.findFirst({
    where: eq(unidadesNegocio.nombre, cleanName)
  });

  if (duplicate) {
    return res.status(409).json({
      error: "DUPLICATE",
      message: "La unidad de negocio ya existe"
    });
  }

  const [row] = await db
    .insert(unidadesNegocio)
    .values({
      nombre: cleanName,
      ubicacion: typeof ubicacion === "string" ? ubicacion.trim() : "",
      activo: true
    })
    .returning();

  return res.status(201).json(mapUnidad(row));
});

app.delete("/api/v1/unidades-negocio/:id", async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "VALIDATION_ERROR",
      message: "Id invalido"
    });
  }

  const existing = await db.query.unidadesNegocio.findFirst({
    where: eq(unidadesNegocio.id, id)
  });

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Unidad no existe" });
  }

  const inUseInEstructuras = await db.query.estructuras.findFirst({
    where: eq(estructuras.unidadDestinoId, id)
  });

  const inUseInEntregas = await db.query.entregas.findFirst({
    where: eq(entregas.unidadId, id)
  });

  if (inUseInEstructuras || inUseInEntregas) {
    return res.status(409).json({
      error: "UNIT_IN_USE",
      message: "No se puede quitar una unidad que ya tiene movimientos"
    });
  }

  const [removed] = await db
    .delete(unidadesNegocio)
    .where(eq(unidadesNegocio.id, id))
    .returning();

  return res.json(mapUnidad(removed));
});

app.get("/api/v1/estructuras", async (req: Request, res: Response) => {
  const estadoFilter = typeof req.query.estado === "string" ? req.query.estado : undefined;
  const tipoIdFilter = typeof req.query.tipo_id === "string" ? Number(req.query.tipo_id) : undefined;
  const unidadIdFilter = typeof req.query.unidad_id === "string" ? Number(req.query.unidad_id) : undefined;
  const searchFilter = typeof req.query.q === "string" ? req.query.q.toLowerCase().trim() : undefined;
  const fechaDesdeFilter = typeof req.query.fecha_desde === "string" ? req.query.fecha_desde : undefined;
  const fechaHastaFilter = typeof req.query.fecha_hasta === "string" ? req.query.fecha_hasta : undefined;

  const allEstructuras = await db.select().from(estructuras);
  const allTipos = await db.select().from(tiposEstructura);
  const allUnidades = await db.select().from(unidadesNegocio);

  const filtered = allEstructuras
    .filter((row) => (estadoFilter ? row.estado === estadoFilter : true))
    .filter((row) => (tipoIdFilter ? row.tipoId === tipoIdFilter : true))
    .filter((row) => (unidadIdFilter ? row.unidadDestinoId === unidadIdFilter : true))
    .filter((row) => (fechaDesdeFilter ? row.fechaInicio >= fechaDesdeFilter : true))
    .filter((row) => (fechaHastaFilter ? row.fechaInicio <= fechaHastaFilter : true))
    .filter((row) => {
      if (!searchFilter) return true;
      return (
        row.folio.toLowerCase().includes(searchFilter) ||
        row.descripcion.toLowerCase().includes(searchFilter) ||
        row.responsable.toLowerCase().includes(searchFilter)
      );
    });

  const rows = await Promise.all(
    filtered.map(async (row) => {
      const tipo = allTipos.find((item) => item.id === row.tipoId);
      const unidadDestino = allUnidades.find((item) => item.id === row.unidadDestinoId);
      const entregado = await totalEntregado(row.id);
      return {
        ...mapEstructura(row),
        tipo_nombre: tipo?.nombre ?? "N/A",
        tipo_modelo_url: tipo?.modeloUrl ?? null,
        unidad_destino_nombre: unidadDestino?.nombre ?? "N/A",
        cantidad_entregada_total: entregado,
        saldo_pendiente: Math.max(row.cantidadFabricada - entregado, 0)
      };
    })
  );

  res.json(rows);
});

app.get("/api/v1/estructuras/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const row = await db.query.estructuras.findFirst({
    where: eq(estructuras.id, id)
  });

  if (!row) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Estructura no existe" });
  }

  const tipo = await db.query.tiposEstructura.findFirst({
    where: eq(tiposEstructura.id, row.tipoId)
  });
  const unidadDestino = await db.query.unidadesNegocio.findFirst({
    where: eq(unidadesNegocio.id, row.unidadDestinoId)
  });
  const entregado = await totalEntregado(row.id);

  return res.json({
    ...mapEstructura(row),
    tipo_nombre: tipo?.nombre ?? "N/A",
    tipo_modelo_url: tipo?.modeloUrl ?? null,
    unidad_destino_nombre: unidadDestino?.nombre ?? "N/A",
    cantidad_entregada_total: entregado,
    saldo_pendiente: Math.max(row.cantidadFabricada - entregado, 0)
  });
});

app.post("/api/v1/estructuras", async (req: Request, res: Response) => {
  const {
    tipo_id,
    descripcion,
    cantidad_fabricada,
    fecha_inicio,
    fecha_termino,
    responsable,
    unidad_destino_id,
    costo_estimado,
    observaciones,
    linea_produccion,
    estacion
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

  const tipo = await db.query.tiposEstructura.findFirst({
    where: and(eq(tiposEstructura.id, tipo_id), eq(tiposEstructura.activo, true))
  });

  if (!tipo) {
    return res.status(404).json({ error: "TIPO_NOT_FOUND", message: "Tipo no existe" });
  }

  const unidadDestino = await db.query.unidadesNegocio.findFirst({
    where: and(eq(unidadesNegocio.id, unidad_destino_id), eq(unidadesNegocio.activo, true))
  });

  if (!unidadDestino) {
    return res.status(404).json({ error: "UNIDAD_NOT_FOUND", message: "Unidad destino no existe" });
  }

  const folio = await nextFolio();

  const [row] = await db
    .insert(estructuras)
    .values({
      folio,
      tipoId: tipo_id,
      descripcion,
      cantidadFabricada: cantidad_fabricada,
      estado: "pendiente",
      fechaInicio: fecha_inicio,
      fechaTermino: typeof fecha_termino === "string" ? fecha_termino : null,
      responsable,
      unidadDestinoId: unidad_destino_id,
      costoEstimado: typeof costo_estimado === "number" ? String(costo_estimado) : null,
      observaciones: typeof observaciones === "string" ? observaciones : null,
      lineaProduccion: typeof linea_produccion === "string" ? linea_produccion : null,
      estacion: typeof estacion === "string" ? estacion : null
    })
    .returning();

  return res.status(201).json(mapEstructura(row));
});

app.put("/api/v1/estructuras/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await db.query.estructuras.findFirst({
    where: eq(estructuras.id, id)
  });

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Estructura no existe" });
  }

  const {
    tipo_id,
    descripcion,
    cantidad_fabricada,
    fecha_inicio,
    fecha_termino,
    responsable,
    unidad_destino_id,
    costo_estimado,
    observaciones,
    linea_produccion,
    estacion
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

  const tipo = await db.query.tiposEstructura.findFirst({
    where: and(eq(tiposEstructura.id, tipo_id), eq(tiposEstructura.activo, true))
  });

  if (!tipo) {
    return res.status(404).json({ error: "TIPO_NOT_FOUND", message: "Tipo no existe" });
  }

  const unidadDestino = await db.query.unidadesNegocio.findFirst({
    where: and(eq(unidadesNegocio.id, unidad_destino_id), eq(unidadesNegocio.activo, true))
  });

  if (!unidadDestino) {
    return res.status(404).json({ error: "UNIDAD_NOT_FOUND", message: "Unidad destino no existe" });
  }

  const [row] = await db
    .update(estructuras)
    .set({
      tipoId: tipo_id,
      descripcion,
      cantidadFabricada: cantidad_fabricada,
      fechaInicio: fecha_inicio,
      fechaTermino: typeof fecha_termino === "string" ? fecha_termino : null,
      responsable,
      unidadDestinoId: unidad_destino_id,
      costoEstimado: typeof costo_estimado === "number" ? String(costo_estimado) : null,
      observaciones: typeof observaciones === "string" ? observaciones : null,
      lineaProduccion: typeof linea_produccion === "string" ? linea_produccion : null,
      estacion: typeof estacion === "string" ? estacion : null
    })
    .where(eq(estructuras.id, id))
    .returning();

  return res.json(mapEstructura(row));
});

app.delete("/api/v1/estructuras/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await db.query.estructuras.findFirst({
    where: eq(estructuras.id, id)
  });

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Estructura no existe" });
  }

  const hasEntregas = await db.query.entregas.findFirst({
    where: eq(entregas.estructuraId, id)
  });

  if (hasEntregas) {
    return res.status(409).json({
      error: "HAS_ENTREGAS",
      message: "No se puede eliminar una estructura con entregas registradas"
    });
  }

  const [removed] = await db
    .delete(estructuras)
    .where(eq(estructuras.id, id))
    .returning();

  return res.json(mapEstructura(removed));
});

app.get("/api/v1/estructuras/:id/entregas", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const allEntregas = await db.select().from(entregas).where(eq(entregas.estructuraId, id));
  const allUnidades = await db.select().from(unidadesNegocio);

  const rows = allEntregas
    .map((row) => ({
      ...mapEntrega(row),
      unidad_nombre: allUnidades.find((item) => item.id === row.unidadId)?.nombre ?? "N/A"
    }))
    .sort((a, b) => b.fecha_entrega.localeCompare(a.fecha_entrega));

  return res.json(rows);
});

app.post("/api/v1/estructuras/:id/entregas", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const estructura = await db.query.estructuras.findFirst({
    where: eq(estructuras.id, id)
  });

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

  const unidad = await db.query.unidadesNegocio.findFirst({
    where: eq(unidadesNegocio.id, unidad_id)
  });

  if (!unidad) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Unidad no existe" });
  }

  const totalActual = await totalEntregado(id);
  if (totalActual + cantidad_entregada > estructura.cantidadFabricada) {
    return res.status(422).json({
      error: "OVER_DELIVERY",
      message: "La entrega excede la cantidad fabricada",
      details: {
        fabricada: estructura.cantidadFabricada,
        entregada_actual: totalActual,
        nuevo_intento: cantidad_entregada
      }
    });
  }

  const [entrega] = await db
    .insert(entregas)
    .values({
      estructuraId: id,
      unidadId: unidad_id,
      cantidadEntregada: cantidad_entregada,
      fechaEntrega: fecha_entrega,
      recibidoPor: recibido_por,
      evidenciaUrl: typeof evidencia_url === "string" ? evidencia_url : null,
      comentarios: typeof comentarios === "string" ? comentarios : null
    })
    .returning();

  await syncEstado(id);
  return res.status(201).json(mapEntrega(entrega));
});

app.delete("/api/v1/entregas/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const existing = await db.query.entregas.findFirst({
    where: eq(entregas.id, id)
  });

  if (!existing) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Entrega no existe" });
  }

  const [removed] = await db
    .delete(entregas)
    .where(eq(entregas.id, id))
    .returning();

  await syncEstado(existing.estructuraId);
  return res.json(mapEntrega(removed));
});

app.get("/api/v1/entregas", async (req: Request, res: Response) => {
  const unidadIdFilter = typeof req.query.unidad_id === "string" ? Number(req.query.unidad_id) : undefined;
  const folioFilter = typeof req.query.folio === "string" ? req.query.folio.toLowerCase() : undefined;

  const allEntregas = await db.select().from(entregas);
  const allEstructuras = await db.select().from(estructuras);
  const allUnidades = await db.select().from(unidadesNegocio);

  const filtered = allEntregas
    .filter((row) => (unidadIdFilter ? row.unidadId === unidadIdFilter : true))
    .filter((row) => {
      if (!folioFilter) {
        return true;
      }
      const estructura = allEstructuras.find((item) => item.id === row.estructuraId);
      return (estructura?.folio.toLowerCase() ?? "").includes(folioFilter);
    });

  const rows = filtered.map((row) => {
    const estructura = allEstructuras.find((item) => item.id === row.estructuraId);
    const unidad = allUnidades.find((item) => item.id === row.unidadId);
    return {
      ...mapEntrega(row),
      folio: estructura?.folio ?? "N/A",
      unidad_nombre: unidad?.nombre ?? "N/A"
    };
  });

  return res.json(rows);
});

function inDateRange(dateValue: string, fechaDesde?: string, fechaHasta?: string): boolean {
  const isAfterStart = fechaDesde ? dateValue >= fechaDesde : true;
  const isBeforeEnd = fechaHasta ? dateValue <= fechaHasta : true;
  return isAfterStart && isBeforeEnd;
}

app.get("/api/v1/dashboard/resumen", async (req: Request, res: Response) => {
  const fechaDesde = typeof req.query.fecha_desde === "string" ? req.query.fecha_desde : undefined;
  const fechaHasta = typeof req.query.fecha_hasta === "string" ? req.query.fecha_hasta : undefined;

  const allEstructuras = await db.select().from(estructuras);
  const allEntregas = await db.select().from(entregas);

  const totalFabricadas = allEstructuras
    .filter((row) => inDateRange(row.fechaInicio, fechaDesde, fechaHasta))
    .reduce((sum, row) => sum + row.cantidadFabricada, 0);

  const totalEntregadas = allEntregas
    .filter((row) => inDateRange(row.fechaEntrega, fechaDesde, fechaHasta))
    .reduce((sum, row) => sum + row.cantidadEntregada, 0);

  const pendientes = Math.max(totalFabricadas - totalEntregadas, 0);
  const cumplimiento = totalFabricadas === 0 ? 0 : Number(((totalEntregadas / totalFabricadas) * 100).toFixed(2));

  res.json({
    total_fabricadas: totalFabricadas,
    total_entregadas: totalEntregadas,
    pendientes,
    cumplimiento_pct: cumplimiento
  });
});

app.get("/api/v1/dashboard/por-tipo", async (req: Request, res: Response) => {
  const fechaDesde = typeof req.query.fecha_desde === "string" ? req.query.fecha_desde : undefined;
  const fechaHasta = typeof req.query.fecha_hasta === "string" ? req.query.fecha_hasta : undefined;

  const allTipos = await db.select().from(tiposEstructura);
  const allEstructuras = await db.select().from(estructuras);

  const rows = allTipos.map((tipo) => {
    const total = allEstructuras
      .filter((row) => row.tipoId === tipo.id)
      .filter((row) => inDateRange(row.fechaInicio, fechaDesde, fechaHasta))
      .reduce((sum, row) => sum + row.cantidadFabricada, 0);
    return { tipo: tipo.nombre, total_fabricada: total };
  });

  res.json(rows);
});

app.get("/api/v1/dashboard/por-unidad", async (req: Request, res: Response) => {
  const fechaDesde = typeof req.query.fecha_desde === "string" ? req.query.fecha_desde : undefined;
  const fechaHasta = typeof req.query.fecha_hasta === "string" ? req.query.fecha_hasta : undefined;

  const allUnidades = await db.select().from(unidadesNegocio);
  const allEntregas = await db.select().from(entregas);

  const rows = allUnidades.map((unidad) => {
    const total = allEntregas
      .filter((row) => row.unidadId === unidad.id)
      .filter((row) => inDateRange(row.fechaEntrega, fechaDesde, fechaHasta))
      .reduce((sum, row) => sum + row.cantidadEntregada, 0);
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

app.get("/api/v1/reportes/entregas.csv", async (_req: Request, res: Response) => {
  const allEntregas = await db.select().from(entregas);
  const allEstructuras = await db.select().from(estructuras);
  const allTipos = await db.select().from(tiposEstructura);
  const allUnidades = await db.select().from(unidadesNegocio);

  const headers = [
    "folio",
    "tipo_estructura",
    "unidad_negocio",
    "cantidad_entregada",
    "fecha_entrega",
    "recibido_por",
    "comentarios"
  ];

  const rows = allEntregas.map((row) => {
    const estructura = allEstructuras.find((item) => item.id === row.estructuraId);
    const tipo = allTipos.find((item) => item.id === estructura?.tipoId);
    const unidad = allUnidades.find((item) => item.id === row.unidadId);
    return [
      escapeCsv(estructura?.folio ?? "N/A"),
      escapeCsv(tipo?.nombre ?? "N/A"),
      escapeCsv(unidad?.nombre ?? "N/A"),
      escapeCsv(row.cantidadEntregada),
      escapeCsv(row.fechaEntrega),
      escapeCsv(row.recibidoPor),
      escapeCsv(row.comentarios ?? "")
    ].join(",");
  });

  const csvContent = `${headers.join(",")}\n${rows.join("\n")}`;
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", "attachment; filename=\"reporte_entregas.csv\"");
  res.send(csvContent);
});

export default app;
