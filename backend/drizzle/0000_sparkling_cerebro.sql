CREATE TABLE "entregas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"estructura_id" uuid NOT NULL,
	"unidad_id" integer NOT NULL,
	"cantidad_entregada" integer NOT NULL,
	"fecha_entrega" date NOT NULL,
	"recibido_por" varchar(255) NOT NULL,
	"evidencia_url" varchar(500),
	"comentarios" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estructuras" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"folio" varchar(50) NOT NULL,
	"tipo_id" integer NOT NULL,
	"unidad_destino_id" integer NOT NULL,
	"descripcion" varchar(500) NOT NULL,
	"cantidad_fabricada" integer NOT NULL,
	"estado" varchar(20) DEFAULT 'pendiente' NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_termino" date,
	"responsable" varchar(255) NOT NULL,
	"costo_estimado" numeric(12, 2),
	"observaciones" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "estructuras_folio_unique" UNIQUE("folio")
);
--> statement-breakpoint
CREATE TABLE "tipos_estructura" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "tipos_estructura_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
CREATE TABLE "unidades_negocio" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"ubicacion" varchar(255) DEFAULT '' NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	CONSTRAINT "unidades_negocio_nombre_unique" UNIQUE("nombre")
);
--> statement-breakpoint
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_estructura_id_estructuras_id_fk" FOREIGN KEY ("estructura_id") REFERENCES "public"."estructuras"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entregas" ADD CONSTRAINT "entregas_unidad_id_unidades_negocio_id_fk" FOREIGN KEY ("unidad_id") REFERENCES "public"."unidades_negocio"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estructuras" ADD CONSTRAINT "estructuras_tipo_id_tipos_estructura_id_fk" FOREIGN KEY ("tipo_id") REFERENCES "public"."tipos_estructura"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estructuras" ADD CONSTRAINT "estructuras_unidad_destino_id_unidades_negocio_id_fk" FOREIGN KEY ("unidad_destino_id") REFERENCES "public"."unidades_negocio"("id") ON DELETE no action ON UPDATE no action;