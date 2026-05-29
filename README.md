# Registro-estructuras

Aplicacion web movil (MVP) para registrar estructuras metalicas fabricadas, entregas por unidad de negocio y dashboard visual.

## Estructura del proyecto

- `backend/`: API (Node + Express + TypeScript + Drizzle ORM)
- `frontend/`: web app movil (React + Vite + TypeScript)
- `docker-compose.yml`: PostgreSQL 16
- `start-all.sh`: arranque rapido de DB + backend + frontend en un solo comando

## Requisitos

- Node.js 18+
- Docker y Docker Compose (para PostgreSQL)

## Arranque rapido (1 comando)

Desde la raiz del repo:

```bash
./start-all.sh
```

Esto iniciara:

- PostgreSQL: `localhost:5432`
- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

Las migraciones de base de datos se aplican automaticamente al iniciar el backend.

## Configuracion opcional

Puedes cambiar puertos con variables de entorno:

```bash
BACKEND_PORT=3001 FRONTEND_PORT=5174 ./start-all.sh
```

Tambien puedes sobrescribir la URL de API usada por frontend:

```bash
VITE_API_URL=http://localhost:3001/api/v1 ./start-all.sh
```

## Base de datos

### Conexion

La URL de conexion se configura en `backend/.env`:

```
DATABASE_URL=postgres://lean:lean@localhost:5432/leanshop
```

### Migraciones

```bash
cd backend

# Generar nueva migracion (despues de cambiar el schema)
npm run db:generate

# Aplicar migraciones manualmente
npm run db:migrate

# Aplicar schema directamente (sin migraciones)
npm run db:push

# Abrir Drizzle Studio (explorador de datos)
npm run db:studio
```

### Schema

El schema se define en `backend/src/db/schema.ts` usando Drizzle ORM:

- `tipos_estructura`: catalogo de tipos
- `unidades_negocio`: catalogo de unidades de negocio
- `estructuras`: registro de estructuras fabricadas
- `entregas`: registro de entregas por estructura

## Endpoints principales (backend)

- `GET /health`
- `GET /api/v1/tipos-estructura`
- `GET /api/v1/unidades-negocio`
- `GET /api/v1/estructuras`
- `POST /api/v1/estructuras`
- `GET /api/v1/estructuras/:id/entregas`
- `POST /api/v1/estructuras/:id/entregas`
- `GET /api/v1/dashboard/resumen`
- `GET /api/v1/dashboard/por-tipo`
- `GET /api/v1/dashboard/por-unidad`
- `GET /api/v1/reportes/entregas.csv`
