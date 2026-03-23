# Next Eye Security

Aplicación web para gestión operativa y comercial de una empresa de seguridad electrónica:

- usuarios y perfil,
- clientes y proveedores,
- productos y servicios,
- cotizaciones/proformas con PDF,
- parámetros de cotización,
- mantenimientos, comentarios y evidencias,
- auditoría.

## Stack

- Frontend: Angular
- Backend: NestJS + TypeORM
- Base de datos: PostgreSQL
- Contenedores: Docker Compose

## Requisitos previos

- Node.js 20+ (recomendado 22)
- npm 10+
- Docker Desktop

## Estructura del proyecto

- `apps/frontend`: aplicación Angular
- `apps/backend`: API NestJS
- `design`: recursos visuales base

## Variables de entorno

### Backend

1. Ir a `apps/backend`
2. Crear `.env` a partir de `.env.example`

Variables esperadas:

- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `DB_SYNC`
- `DB_LOGGING`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`

### Frontend

El frontend usa archivos de entorno de Angular:

- `apps/frontend/src/environments/environment.ts` (desarrollo)
- `apps/frontend/src/environments/environment.prod.ts` (producción)

## Levantar base de datos (Docker)

Desde la raíz del proyecto:

```bash
docker compose up -d
```

## Ejecutar backend

```bash
cd apps/backend
npm install
npm run start:dev
```

Backend base URL:

- `http://localhost:3000/api`

## Ejecutar frontend

```bash
cd apps/frontend
npm install
npm run start
```

Frontend URL:

- `http://localhost:4200`

## Seed de datos (opcional para pruebas locales)

```bash
cd apps/backend
npm run seed
```

Nota: el seed crea datos demo para pruebas locales. En producción usa usuarios/credenciales administradas por tu equipo.

## Puertos esperados

- Frontend: `4200`
- Backend: `3000`
- PostgreSQL (Docker): `5435` (según `docker-compose.yml`)

## Consideraciones de producción

- No subir archivos `.env` con secretos reales.
- Usar `DB_SYNC=false` en producción.
- Configurar `JWT_SECRET` robusto por entorno.
- Servir frontend compilado con reverse proxy y HTTPS.
