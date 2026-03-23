# Guía Detallada de Pruebas en Postman

Este documento explica, paso a paso, cómo probar **cada endpoint** del backend fase prioritaria.

## 1) Archivos entregados

- Colección importable Postman:
  - `apps/backend/postman/NextEyeSecurity.postman_collection.json`
- Generador de colección (opcional, por si deseas regenerarla):
  - `apps/backend/postman/generate-postman-collection.mjs`

## 2) Pre-requisitos

1. Levantar PostgreSQL (puerto host `5435`):
   - Desde raíz del proyecto:
   - `docker compose up -d`
2. Configurar variables de entorno del backend:
   - Crear `apps/backend/.env` desde `apps/backend/.env.example`
3. Instalar dependencias y correr API:
   - `cd apps/backend`
   - `npm install`
   - `npm run start:dev`
4. Cargar datos base:
   - `npm run seed`

## 3) Importar colección en Postman

1. Abrir Postman.
2. `Import` -> `File`.
3. Seleccionar:
   - `apps/backend/postman/NextEyeSecurity.postman_collection.json`
4. (Opcional) Importar environment listo:
   - `apps/backend/postman/NextEyeSecurity.local.postman_environment.json`
   - Luego seleccionarlo en la esquina superior derecha de Postman.
5. Verificar variables de colección:
   - `baseUrl = http://localhost:3000/api`
   - Credenciales seed:
     - `admin_email = admin1@nexteye.com`
     - `admin_password = Admin123*`
     - `tecnico_email = tecnico1@nexteye.com`
     - `tecnico_password = Admin123*`

## 4) Orden recomendado de ejecución

Ejecuta carpetas en este orden para que los IDs se guarden automáticamente:

1. `00 - Setup`
2. `01 - Users`
3. `02 - Clients`
4. `03 - Suppliers`
5. `04 - Product Categories`
6. `05 - Products`
7. `06 - Service Categories`
8. `07 - Services`
9. `08 - Quotation Settings`
10. `09 - Quotations`
11. `10 - Maintenance`
12. `11 - Maintenance Comments`
13. `12 - Attachments`
14. `13 - Audit Logs`
15. `99 - Cleanup (DELETE Endpoints)` (opcional, para probar DELETE)

## 5) Cómo validar respuesta en cada request

- Si es `POST` de creación:
  - Espera `201` (o `200` según endpoint).
  - Revisa que exista `id`.
  - La colección guarda IDs automáticamente.
- Si es `GET`:
  - Espera `200`.
  - Revisa estructura del JSON.
- Si es `PATCH`:
  - Espera `200`.
  - Valida campos actualizados.
- Si es `DELETE`:
  - Espera `200`.
  - Mensaje típico: `... eliminado correctamente`.
- PDF:
  - `GET /quotations/:id/pdf` debe responder `application/pdf`.

## 6) Endpoints y prueba detallada

## 00 - Setup

1. `GET /`
   - Request: `Health Check`
   - Sin token.
   - Esperado: API operativa.
2. `POST /auth/login`
   - Request: `Login Admin`
   - Body:
```json
{
  "email": "{{admin_email}}",
  "password": "{{admin_password}}"
}
```
   - Guarda automáticamente `admin_token` y `admin_user_id`.
3. `POST /auth/login`
   - Request: `Login Tecnico`
   - Body:
```json
{
  "email": "{{tecnico_email}}",
  "password": "{{tecnico_password}}"
}
```
   - Guarda `tecnico_token` y `technician_id`.
4. `GET /users/me`
   - Requests: `Mi Perfil (Admin)`, `Mi Perfil (Tecnico)`.
   - Verifica token y rol.

## 01 - Users

1. `POST /users` (ADMIN)
   - `Crear Usuario`
2. `GET /users` (ADMIN)
   - `Listar Usuarios`
3. `GET /users/:id` (ADMIN)
   - `Obtener Usuario por ID`
4. `PATCH /users/:id` (ADMIN)
   - `Actualizar Usuario`
5. `PATCH /users/me/profile` (ADMIN|TECNICO)
   - `Actualizar Mi Perfil`
6. `DELETE /users/:id` (ADMIN)
   - `Eliminar Usuario`

## 02 - Clients

1. `POST /clients` (ADMIN|TECNICO)
   - `Crear Cliente`
2. `GET /clients` (ADMIN|TECNICO)
   - `Listar Clientes`
3. `GET /clients/:id` (ADMIN|TECNICO)
   - `Obtener Cliente por ID`
4. `PATCH /clients/:id` (ADMIN|TECNICO)
   - `Actualizar Cliente`

## 03 - Suppliers

1. `POST /suppliers` (ADMIN)
2. `GET /suppliers` (ADMIN|TECNICO)
3. `GET /suppliers/:id` (ADMIN|TECNICO)
4. `PATCH /suppliers/:id` (ADMIN)

## 04 - Product Categories

1. `POST /product-categories` (ADMIN)
2. `GET /product-categories` (ADMIN|TECNICO)
3. `GET /product-categories/:id` (ADMIN|TECNICO)
4. `PATCH /product-categories/:id` (ADMIN)

## 05 - Products

1. `POST /products` (ADMIN)
   - Requiere `categoryId` y opcional `mainSupplierId`.
2. `GET /products` (ADMIN|TECNICO)
3. `GET /products/:id` (ADMIN|TECNICO)
4. `PATCH /products/:id` (ADMIN)

## 06 - Service Categories

1. `POST /service-categories` (ADMIN)
2. `GET /service-categories` (ADMIN|TECNICO)
3. `GET /service-categories/:id` (ADMIN|TECNICO)
4. `PATCH /service-categories/:id` (ADMIN)

## 07 - Services

1. `POST /services` (ADMIN)
2. `GET /services` (ADMIN|TECNICO)
3. `GET /services/:id` (ADMIN|TECNICO)
4. `PATCH /services/:id` (ADMIN)

## 08 - Quotation Settings

1. `GET /quotation-settings` (ADMIN|TECNICO)
2. `PATCH /quotation-settings` (ADMIN)
   - Valores válidos:
   - `currentVat`: `0|1|12|15`
   - `allowedMargins`: `10|12|20|25|30`

## 09 - Quotations

1. `POST /quotations` (ADMIN|TECNICO)
   - Request: `Crear Cotizacion`
   - Body ejemplo:
```json
{
  "clientId": "{{client_id}}",
  "status": "BORRADOR",
  "observations": "Cotizacion de prueba Postman",
  "discount": "10.00",
  "currency": "USD",
  "items": [
    {
      "itemType": "PRODUCTO",
      "productId": "{{product_id}}",
      "quantity": "2",
      "vatPercent": "15",
      "marginPercent": "20"
    },
    {
      "itemType": "SERVICIO",
      "serviceId": "{{service_id}}",
      "quantity": "1",
      "vatPercent": "0",
      "marginPercent": "20"
    }
  ]
}
```
2. `GET /quotations` (ADMIN|TECNICO)
3. `GET /quotations/:id` (ADMIN|TECNICO)
4. `PATCH /quotations/:id/status` (ADMIN|TECNICO)
   - Estados válidos: `BORRADOR|ENVIADA|APROBADA|RECHAZADA`
5. `GET /quotations/:id/pdf` (ADMIN|TECNICO)

## 10 - Maintenance

1. `POST /maintenance` (ADMIN|TECNICO)
   - `type`: `PREVENTIVO|CORRECTIVO`
   - `status`: `PENDIENTE|EN_PROCESO|COMPLETADO|CANCELADO`
2. `GET /maintenance` (ADMIN|TECNICO)
3. `GET /maintenance/:id` (ADMIN|TECNICO)
4. `PATCH /maintenance/:id` (ADMIN|TECNICO)

## 11 - Maintenance Comments

1. `POST /maintenance-comments` (ADMIN|TECNICO)
2. `GET /maintenance-comments/maintenance/:maintenanceId` (ADMIN|TECNICO)

## 12 - Attachments

1. `POST /attachments` (ADMIN|TECNICO)
2. `GET /attachments/:sourceEntity/:sourceEntityId` (ADMIN|TECNICO)

## 13 - Audit Logs

1. `GET /audit-logs?limit=100` (ADMIN)

## 99 - Cleanup (DELETE Endpoints)

Esta carpeta prueba endpoints DELETE al final para evitar romper flujo.

1. `DELETE /maintenance/:id`
2. `DELETE /services/:id`
3. `DELETE /service-categories/:id`
4. `DELETE /products/:id`
5. `DELETE /product-categories/:id`
6. `DELETE /suppliers/:id`
7. `POST /clients` (temporal)
8. `DELETE /clients/:id` (temporal)

## 7) Errores comunes y solución rápida

1. `401 Unauthorized`
   - Repite `Login Admin` o `Login Tecnico`.
   - Verifica que `Authorization` esté como `Bearer Token`.
2. `403 Forbidden`
   - Estás usando rol incorrecto. Usa ADMIN para endpoints restringidos.
3. `400 Bad Request`
   - Revisa formato DTO en body (tipos `string`, enums, fechas ISO).
4. Error de DB en conexión
   - Revisa `.env`:
   - `DB_HOST=127.0.0.1`
   - `DB_PORT=5435`
5. Error por IDs vacíos
   - Ejecuta en orden desde `00 - Setup`.

## 8) Recomendación operativa

Para pruebas de regresión:

1. `npm run seed`
2. Ejecutar colección carpeta por carpeta en el orden indicado.
3. Guardar `Postman Test Run` como evidencia de QA.
