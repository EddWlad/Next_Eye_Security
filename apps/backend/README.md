# NextEyeSecurity Backend (Fase prioritaria)

Backend NestJS para gestión de empresa de seguridad electrónica con PostgreSQL, JWT, roles, cotizaciones con snapshot histórico, mantenimientos, adjuntos, auditoría y PDF empresarial.

## 1) Stack

- NestJS 11
- TypeORM
- PostgreSQL 16
- JWT + Passport
- bcrypt
- PDFKit

## 2) Módulos implementados

- `auth`
- `users`
- `clients`
- `suppliers`
- `product-categories`
- `products`
- `service-categories`
- `services`
- `quotation-settings`
- `quotations`
- `maintenance`
- `maintenance-comments`
- `attachments`
- `audit-logs`

## 3) Reglas de negocio clave implementadas

- Solo dos roles: `ADMINISTRADOR` y `TECNICO`.
- Cotizaciones con fórmula obligatoria: IVA primero, luego ganancia.
- IVA permitido: `0`, `1`, `12`, `15`.
- Márgenes permitidos: `0`, `10`, `12`, `20`, `25`, `30`.
- Snapshot histórico por detalle y cabecera (no recalcula cotizaciones antiguas si cambian parámetros).
- Numeración automática de cotización (`COT-AAAA-000001`).

## 4) Configuración rápida local

### 4.1 Variables de entorno

Crear archivo `.env` a partir de `.env.example`:

```env
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5435
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=nexteye_security
DB_SYNC=true
DB_LOGGING=false
JWT_SECRET=super-secret-dev
JWT_EXPIRES_IN=8h
```

### 4.2 Levantar PostgreSQL con Docker

Desde la raíz del workspace:

```bash
docker compose up -d
```

### 4.3 Instalar dependencias y ejecutar backend

```bash
cd apps/backend
npm install
npm run start:dev
```

API base:

- `http://localhost:3000/api`

Health check:

- `GET /api`

## 5) Seed de datos

Ejecutar:

```bash
npm run seed
```

El seed crea:

- 2 administradores
- 5 técnicos
- 5 clientes
- 5 proveedores
- 10 productos
- 8 servicios
- 10 cotizaciones
- 12 mantenimientos
- comentarios y adjuntos simulados

El seed crea cuentas de prueba para entorno local.

## 6) Endpoints para Postman (resumen)

### Auth

- `POST /api/auth/login`

### Usuarios

- `POST /api/users` (ADMIN)
- `GET /api/users` (ADMIN)
- `GET /api/users/:id` (ADMIN)
- `PATCH /api/users/:id` (ADMIN)
- `DELETE /api/users/:id` (ADMIN)
- `GET /api/users/me` (ADMIN, TECNICO)
- `PATCH /api/users/me/profile` (ADMIN, TECNICO)

### Clientes

- `POST /api/clients` (ADMIN, TECNICO)
- `GET /api/clients` (ADMIN, TECNICO)
- `GET /api/clients/:id` (ADMIN, TECNICO)
- `PATCH /api/clients/:id` (ADMIN, TECNICO)
- `DELETE /api/clients/:id` (ADMIN, TECNICO)

### Proveedores

- `POST /api/suppliers` (ADMIN)
- `GET /api/suppliers` (ADMIN, TECNICO)
- `GET /api/suppliers/:id` (ADMIN, TECNICO)
- `PATCH /api/suppliers/:id` (ADMIN)
- `DELETE /api/suppliers/:id` (ADMIN)

### Categorías y catálogo

- `POST/GET/PATCH/DELETE /api/product-categories` (crear/editar/eliminar: ADMIN, listar: ambos)
- `POST/GET/PATCH/DELETE /api/service-categories` (crear/editar/eliminar: ADMIN, listar: ambos)
- `POST/GET/PATCH/DELETE /api/products` (crear/editar/eliminar: ADMIN, listar: ambos)
- `POST/GET/PATCH/DELETE /api/services` (crear/editar/eliminar: ADMIN, listar: ambos)

### Parámetros de cotización

- `GET /api/quotation-settings` (ADMIN, TECNICO)
- `PATCH /api/quotation-settings` (ADMIN)

### Cotizaciones

- `POST /api/quotations` (ADMIN, TECNICO)
- `GET /api/quotations` (ADMIN, TECNICO)
- `GET /api/quotations/:id` (ADMIN, TECNICO)
- `PATCH /api/quotations/:id/status` (ADMIN, TECNICO)
- `GET /api/quotations/:id/pdf` (ADMIN, TECNICO)

### Mantenimientos

- `POST /api/maintenance` (ADMIN, TECNICO)
- `GET /api/maintenance` (ADMIN, TECNICO)
- `GET /api/maintenance/:id` (ADMIN, TECNICO)
- `PATCH /api/maintenance/:id` (ADMIN, TECNICO)
- `DELETE /api/maintenance/:id` (ADMIN, TECNICO)

### Comentarios técnicos

- `POST /api/maintenance-comments` (ADMIN, TECNICO)
- `GET /api/maintenance-comments/maintenance/:maintenanceId` (ADMIN, TECNICO)

### Adjuntos (metadatos)

- `POST /api/attachments` (ADMIN, TECNICO)
- `GET /api/attachments/:sourceEntity/:sourceEntityId` (ADMIN, TECNICO)

### Auditoría

- `GET /api/audit-logs` (ADMIN)

## 7) Notas de fase prioritaria

- El backend está listo para correr localmente con PostgreSQL Docker.
- DTOs con validación global.
- JWT + guardas por rol implementados.
- PDF de cotización generado por endpoint.
- Seed de negocio completo y coherente.
- Estructura preparada para crecimiento y futura integración Angular.
