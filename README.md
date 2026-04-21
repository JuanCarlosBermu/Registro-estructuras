# Registro-estructuras

Aplicacion web movil (MVP) para registrar estructuras metalicas fabricadas, entregas por unidad de negocio y dashboard visual.

## Estructura del proyecto

- `backend/`: API (Node + Express + TypeScript)
- `frontend/`: web app movil (React + Vite + TypeScript)
- `start-all.sh`: arranque rapido de backend + frontend en un solo comando

## Arranque rapido (1 comando)

Desde la raiz del repo:

```bash
./start-all.sh
```

Esto iniciara:

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## Configuracion opcional

Puedes cambiar puertos con variables de entorno:

```bash
BACKEND_PORT=3001 FRONTEND_PORT=5174 ./start-all.sh
```

Tambien puedes sobrescribir la URL de API usada por frontend:

```bash
VITE_API_URL=http://localhost:3001/api/v1 ./start-all.sh
```

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
