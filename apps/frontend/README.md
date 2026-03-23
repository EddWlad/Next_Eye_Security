# Next Eye Security Frontend (Fase 2)

Frontend administrativo en Angular para el sistema de gestión de seguridad electrónica.

## 1. Objetivo

Este frontend está alineado con el backend NestJS existente y cubre:

- autenticación JWT,
- control visual por roles (`ADMINISTRADOR`, `TECNICO`),
- módulos CRUD principales,
- flujo de cotizaciones con cálculo visual,
- mantenimiento con comentarios y adjuntos,
- auditoría,
- diseño corporativo basado en la marca Next Eye Security.

## 2. Tecnologías

- Angular 20 (standalone)
- TypeScript estricto
- RxJS
- Formularios reactivos
- Routing con guards
- Interceptores HTTP

## 3. Estructura principal

```text
src/
  app/
    core/
      config/
      guards/
      interceptors/
      layout/
      models/
      services/
      utils/
    shared/
      components/
      constants/
    features/
      auth/
      dashboard/
      profile/
      crud/
      quotation-settings/
      quotations/
      maintenance/
      audit-logs/
  environments/
```

## 4. Configuración de entorno

### Desarrollo

Archivo: `src/environments/environment.ts`

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
  appName: 'Next Eye Security',
};
```

### Producción

Archivo: `src/environments/environment.prod.ts`

```ts
export const environment = {
  production: true,
  apiBaseUrl: '/api',
  appName: 'Next Eye Security',
};
```

`angular.json` ya incluye `fileReplacements` para producción.

## 5. Ejecución local

1. Levantar backend y base de datos (ver `apps/backend/README.md`).
2. Ir a frontend:

```bash
cd apps/frontend
npm install
npm start
```

3. Abrir:

- `http://localhost:4200`

## 6. Compilación de producción

```bash
cd apps/frontend
npm run build
```

Salida:

- `apps/frontend/dist/frontend`

## 7. Integración con backend

- URL base centralizada en `environment.apiBaseUrl`.
- `AuthService` maneja sesión (token + usuario) en localStorage.
- `authTokenInterceptor` agrega `Authorization: Bearer <token>`.
- `httpErrorInterceptor` centraliza errores y manejo de `401`.

## 8. Estrategia de roles

### ADMINISTRADOR

Acceso total a:

- usuarios,
- clientes,
- proveedores,
- categorías,
- productos,
- servicios,
- parámetros,
- cotizaciones,
- mantenimientos,
- auditoría.

### TECNICO

Acceso a:

- dashboard,
- perfil,
- clientes,
- consulta de productos/servicios,
- cotizaciones,
- mantenimientos,
- comentarios y adjuntos.

La navegación lateral y las rutas usan `roleGuard` para ocultar/bloquear acciones no permitidas.

## 9. Módulos implementados

- `/login`
- `/dashboard`
- `/profile`
- CRUD base:
  - `/users`
  - `/clients`
  - `/suppliers`
  - `/product-categories`
  - `/products`
  - `/service-categories`
  - `/services`
- `/quotation-settings`
- `/quotations`
  - listado
  - crear
  - editar estado
  - detalle
  - preview PDF
- `/maintenance`
  - listado
  - crear
  - editar
  - detalle
  - comentarios
  - adjuntos
- `/audit-logs`

## 10. Flujo de cotizaciones

El formulario de cotización usa:

- cliente,
- items producto/servicio,
- IVA y margen por ítem,
- descuento,
- resumen visual en tiempo real.

El frontend usa parámetros desde `quotation-settings` y respeta el contrato backend:

- creación por `POST /quotations`,
- actualización de estado por `PATCH /quotations/:id/status`,
- preview PDF por `GET /quotations/:id/pdf`.

## 11. Responsive

- Sidebar colapsable en pantallas pequeñas.
- Tablas con `overflow-x` en móvil.
- Formularios en grids que bajan a una columna.
- Vista PDF con contenedor adaptable.

## 12. Diseño y branding

- Paleta corporativa aplicada (`#7B1E2B`, `#5E1621`, escalas grises).
- Layout empresarial con sidebar + topbar.
- Componentes reusables: header, badges, empty states, loader, toasts.
- Logo de empresa en `public/logo.png` y favicon personalizado en `index.html`.

## 13. Despliegue sugerido en AWS EC2 (Nginx)

1. Compilar frontend (`npm run build`).
2. Copiar `dist/frontend/browser` al servidor.
3. Configurar Nginx para SPA:

- `try_files $uri /index.html;`

4. Configurar proxy o `apiBaseUrl` de producción (`/api`) apuntando al backend NestJS.
5. Habilitar HTTPS (Let's Encrypt o ALB).

## 14. Notas de mantenimiento

- CRUD base reutiliza componentes genéricos para crecimiento ordenado.
- Cotizaciones y mantenimientos tienen componentes dedicados por complejidad.
- Para nuevos módulos, seguir patrón `features/<modulo>/pages + services`.
