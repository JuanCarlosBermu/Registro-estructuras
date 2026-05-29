import { boolean, date, integer, numeric, pgTable, serial, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  nombre: varchar("nombre", { length: 255 }).notNull(),
  rol: varchar("rol", { length: 20 }).notNull().default("operador"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tiposEstructura = pgTable("tipos_estructura", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  activo: boolean("activo").notNull().default(true),
  modeloUrl: varchar("modelo_url", { length: 500 }),
});

export const unidadesNegocio = pgTable("unidades_negocio", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 255 }).notNull().unique(),
  ubicacion: varchar("ubicacion", { length: 255 }).notNull().default(""),
  activo: boolean("activo").notNull().default(true),
});

export const estructuras = pgTable("estructuras", {
  id: uuid("id").primaryKey().defaultRandom(),
  folio: varchar("folio", { length: 50 }).notNull().unique(),
  tipoId: integer("tipo_id")
    .notNull()
    .references(() => tiposEstructura.id),
  unidadDestinoId: integer("unidad_destino_id")
    .notNull()
    .references(() => unidadesNegocio.id),
  descripcion: varchar("descripcion", { length: 500 }).notNull(),
  cantidadFabricada: integer("cantidad_fabricada").notNull(),
  estado: varchar("estado", { length: 20 }).notNull().default("pendiente"),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaTermino: date("fecha_termino"),
  responsable: varchar("responsable", { length: 255 }).notNull(),
  costoEstimado: numeric("costo_estimado", { precision: 12, scale: 2 }),
  observaciones: text("observaciones"),
  lineaProduccion: varchar("linea_produccion", { length: 255 }),
  estacion: varchar("estacion", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entregas = pgTable("entregas", {
  id: uuid("id").primaryKey().defaultRandom(),
  estructuraId: uuid("estructura_id")
    .notNull()
    .references(() => estructuras.id),
  unidadId: integer("unidad_id")
    .notNull()
    .references(() => unidadesNegocio.id),
  cantidadEntregada: integer("cantidad_entregada").notNull(),
  fechaEntrega: date("fecha_entrega").notNull(),
  recibidoPor: varchar("recibido_por", { length: 255 }).notNull(),
  evidenciaUrl: varchar("evidencia_url", { length: 500 }),
  comentarios: text("comentarios"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
