import fs from 'node:fs';
import path from 'node:path';

const collectionVariables = [
  ['baseUrl', 'http://localhost:3000/api'],
  ['admin_email', 'admin1@nexteye.com'],
  ['admin_password', 'Admin123*'],
  ['tecnico_email', 'tecnico1@nexteye.com'],
  ['tecnico_password', 'Admin123*'],
  ['admin_token', ''],
  ['tecnico_token', ''],
  ['admin_user_id', ''],
  ['technician_id', ''],
  ['created_user_id', ''],
  ['client_id', ''],
  ['supplier_id', ''],
  ['product_category_id', ''],
  ['product_id', ''],
  ['service_category_id', ''],
  ['service_id', ''],
  ['quotation_id', ''],
  ['maintenance_id', ''],
  ['source_entity', 'maintenance'],
  ['temp_client_delete_id', ''],
];

function bearer(type) {
  if (!type) return undefined;
  const tokenVar = type === 'tech' ? 'tecnico_token' : 'admin_token';
  return {
    type: 'bearer',
    bearer: [{ key: 'token', value: `{{${tokenVar}}}`, type: 'string' }],
  };
}

function jsonBody(raw) {
  return {
    mode: 'raw',
    raw: JSON.stringify(raw, null, 2),
    options: {
      raw: { language: 'json' },
    },
  };
}

function request({
  name,
  method,
  pathValue,
  auth,
  body,
  description,
  query,
  tests,
}) {
  const queryArray = query
    ? Object.entries(query).map(([key, value]) => ({ key, value: String(value) }))
    : undefined;

  const req = {
    name,
    request: {
      method,
      header: body ? [{ key: 'Content-Type', value: 'application/json' }] : [],
      ...(auth ? { auth: bearer(auth) } : {}),
      url: {
        raw: `{{baseUrl}}${pathValue}`,
        host: ['{{baseUrl}}'],
        path: pathValue.split('/').filter(Boolean),
        ...(queryArray ? { query: queryArray } : {}),
      },
      ...(description ? { description } : {}),
      ...(body ? { body: jsonBody(body) } : {}),
    },
  };

  if (tests && tests.length > 0) {
    req.event = [
      {
        listen: 'test',
        script: { type: 'text/javascript', exec: tests },
      },
    ];
  }

  return req;
}

const setupFolder = {
  name: '00 - Setup',
  item: [
    request({
      name: 'Health Check',
      method: 'GET',
      pathValue: '/',
      description: 'Verifica que la API esté levantada.',
    }),
    request({
      name: 'Login Admin',
      method: 'POST',
      pathValue: '/auth/login',
      body: {
        email: '{{admin_email}}',
        password: '{{admin_password}}',
      },
      tests: [
        'pm.test("Login admin OK", function () { pm.response.to.have.status(201); });',
        'const json = pm.response.json();',
        'pm.collectionVariables.set("admin_token", json.access_token);',
        'pm.collectionVariables.set("admin_user_id", json.user.id);',
      ],
    }),
    request({
      name: 'Login Tecnico',
      method: 'POST',
      pathValue: '/auth/login',
      body: {
        email: '{{tecnico_email}}',
        password: '{{tecnico_password}}',
      },
      tests: [
        'pm.test("Login tecnico OK", function () { pm.response.to.have.status(201); });',
        'const json = pm.response.json();',
        'pm.collectionVariables.set("tecnico_token", json.access_token);',
        'pm.collectionVariables.set("technician_id", json.user.id);',
      ],
    }),
    request({
      name: 'Mi Perfil (Admin)',
      method: 'GET',
      pathValue: '/users/me',
      auth: 'admin',
    }),
    request({
      name: 'Mi Perfil (Tecnico)',
      method: 'GET',
      pathValue: '/users/me',
      auth: 'tech',
    }),
  ],
};

const usersFolder = {
  name: '01 - Users',
  item: [
    request({
      name: 'Crear Usuario',
      method: 'POST',
      pathValue: '/users',
      auth: 'admin',
      body: {
        email: 'nuevo.tecnico@nexteye.com',
        fullName: 'Tecnico Pruebas Postman',
        password: 'Admin123*',
        role: 'TECNICO',
        phone: '0991111111',
        active: true,
      },
      tests: [
        'pm.test("Usuario creado", function () { pm.expect([200,201]).to.include(pm.response.code); });',
        'const json = pm.response.json();',
        'pm.collectionVariables.set("created_user_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Usuarios',
      method: 'GET',
      pathValue: '/users',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Usuario por ID',
      method: 'GET',
      pathValue: '/users/{{created_user_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Usuario',
      method: 'PATCH',
      pathValue: '/users/{{created_user_id}}',
      auth: 'admin',
      body: {
        fullName: 'Tecnico Pruebas Postman Actualizado',
        phone: '0992222222',
      },
    }),
    request({
      name: 'Actualizar Mi Perfil',
      method: 'PATCH',
      pathValue: '/users/me/profile',
      auth: 'tech',
      body: {
        fullName: 'Tecnico 1 Editado desde Postman',
        phone: '0981999999',
      },
    }),
    request({
      name: 'Eliminar Usuario',
      method: 'DELETE',
      pathValue: '/users/{{created_user_id}}',
      auth: 'admin',
    }),
  ],
};

const clientsFolder = {
  name: '02 - Clients',
  item: [
    request({
      name: 'Crear Cliente',
      method: 'POST',
      pathValue: '/clients',
      auth: 'admin',
      body: {
        nameOrBusinessName: 'Cliente Demo Postman',
        documentNumber: '0999999999001',
        phone: '042000111',
        email: 'cliente.postman@demo.com',
        address: 'Av. Principal 123',
        city: 'Guayaquil',
        commercialReference: 'Cliente de pruebas',
        observations: 'Creado desde Postman',
        active: true,
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("client_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Clientes',
      method: 'GET',
      pathValue: '/clients',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Cliente por ID',
      method: 'GET',
      pathValue: '/clients/{{client_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Cliente',
      method: 'PATCH',
      pathValue: '/clients/{{client_id}}',
      auth: 'admin',
      body: {
        city: 'Samborondon',
        observations: 'Cliente actualizado por Postman',
      },
    }),
  ],
};

const suppliersFolder = {
  name: '03 - Suppliers',
  item: [
    request({
      name: 'Crear Proveedor',
      method: 'POST',
      pathValue: '/suppliers',
      auth: 'admin',
      body: {
        businessName: 'Proveedor Demo Postman',
        ruc: '1799999999001',
        contact: 'Ana Compras',
        phone: '022000111',
        email: 'proveedor.postman@demo.com',
        address: 'Av. Industrial',
        city: 'Quito',
        active: true,
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("supplier_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Proveedores',
      method: 'GET',
      pathValue: '/suppliers',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Proveedor por ID',
      method: 'GET',
      pathValue: '/suppliers/{{supplier_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Proveedor',
      method: 'PATCH',
      pathValue: '/suppliers/{{supplier_id}}',
      auth: 'admin',
      body: {
        contact: 'Carlos Compras',
      },
    }),
  ],
};

const productCategoriesFolder = {
  name: '04 - Product Categories',
  item: [
    request({
      name: 'Crear Categoria Producto',
      method: 'POST',
      pathValue: '/product-categories',
      auth: 'admin',
      body: {
        name: 'Categoria Postman Productos',
        description: 'Categoria de pruebas',
        active: true,
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("product_category_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Categorias Producto',
      method: 'GET',
      pathValue: '/product-categories',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Categoria Producto por ID',
      method: 'GET',
      pathValue: '/product-categories/{{product_category_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Categoria Producto',
      method: 'PATCH',
      pathValue: '/product-categories/{{product_category_id}}',
      auth: 'admin',
      body: {
        description: 'Descripcion actualizada',
      },
    }),
  ],
};

const productsFolder = {
  name: '05 - Products',
  item: [
    request({
      name: 'Crear Producto',
      method: 'POST',
      pathValue: '/products',
      auth: 'admin',
      body: {
        categoryId: '{{product_category_id}}',
        mainSupplierId: '{{supplier_id}}',
        internalCode: 'POSTMAN-PRD-001',
        name: 'Producto Demo Postman',
        brand: 'Marca Demo',
        model: 'Modelo Demo',
        description: 'Producto creado para pruebas de API',
        baseCost: '150.00',
        stock: '10',
        unit: 'UNIDAD',
        imageUrl: 'https://example.com/producto.jpg',
        active: true,
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("product_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Productos',
      method: 'GET',
      pathValue: '/products',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Producto por ID',
      method: 'GET',
      pathValue: '/products/{{product_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Producto',
      method: 'PATCH',
      pathValue: '/products/{{product_id}}',
      auth: 'admin',
      body: {
        description: 'Producto actualizado desde Postman',
        stock: '20',
      },
    }),
  ],
};

const serviceCategoriesFolder = {
  name: '06 - Service Categories',
  item: [
    request({
      name: 'Crear Categoria Servicio',
      method: 'POST',
      pathValue: '/service-categories',
      auth: 'admin',
      body: {
        name: 'Categoria Postman Servicios',
        description: 'Categoria de pruebas',
        active: true,
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("service_category_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Categorias Servicio',
      method: 'GET',
      pathValue: '/service-categories',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Categoria Servicio por ID',
      method: 'GET',
      pathValue: '/service-categories/{{service_category_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Categoria Servicio',
      method: 'PATCH',
      pathValue: '/service-categories/{{service_category_id}}',
      auth: 'admin',
      body: {
        description: 'Descripcion actualizada desde Postman',
      },
    }),
  ],
};

const servicesFolder = {
  name: '07 - Services',
  item: [
    request({
      name: 'Crear Servicio',
      method: 'POST',
      pathValue: '/services',
      auth: 'admin',
      body: {
        categoryId: '{{service_category_id}}',
        name: 'Servicio Demo Postman',
        description: 'Servicio creado para pruebas',
        baseCost: '75.00',
        active: true,
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("service_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Servicios',
      method: 'GET',
      pathValue: '/services',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Servicio por ID',
      method: 'GET',
      pathValue: '/services/{{service_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Servicio',
      method: 'PATCH',
      pathValue: '/services/{{service_id}}',
      auth: 'admin',
      body: {
        description: 'Servicio actualizado desde Postman',
        baseCost: '95.00',
      },
    }),
  ],
};

const quotationSettingsFolder = {
  name: '08 - Quotation Settings',
  item: [
    request({
      name: 'Obtener Parametros de Cotizacion',
      method: 'GET',
      pathValue: '/quotation-settings',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Parametros de Cotizacion',
      method: 'PATCH',
      pathValue: '/quotation-settings',
      auth: 'admin',
      body: {
        currentVat: '15',
        allowedVatRates: ['0', '1', '12', '15'],
        allowedMargins: ['10', '12', '20', '25', '30'],
        defaultMargin: '20',
        defaultCurrency: 'USD',
        defaultValidityDays: 20,
      },
    }),
  ],
};

const quotationsFolder = {
  name: '09 - Quotations',
  item: [
    request({
      name: 'Crear Cotizacion',
      method: 'POST',
      pathValue: '/quotations',
      auth: 'admin',
      body: {
        clientId: '{{client_id}}',
        status: 'BORRADOR',
        observations: 'Cotizacion de prueba Postman',
        discount: '10.00',
        currency: 'USD',
        items: [
          {
            itemType: 'PRODUCTO',
            productId: '{{product_id}}',
            quantity: '2',
            vatPercent: '15',
            marginPercent: '20',
          },
          {
            itemType: 'SERVICIO',
            serviceId: '{{service_id}}',
            quantity: '1',
            vatPercent: '0',
            marginPercent: '20',
          },
        ],
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("quotation_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Cotizaciones',
      method: 'GET',
      pathValue: '/quotations',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Cotizacion por ID',
      method: 'GET',
      pathValue: '/quotations/{{quotation_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Estado Cotizacion',
      method: 'PATCH',
      pathValue: '/quotations/{{quotation_id}}/status',
      auth: 'admin',
      body: {
        status: 'ENVIADA',
      },
    }),
    request({
      name: 'Descargar PDF Cotizacion',
      method: 'GET',
      pathValue: '/quotations/{{quotation_id}}/pdf',
      auth: 'admin',
      description:
        'Debe devolver binary PDF con Content-Type application/pdf.',
    }),
  ],
};

const maintenanceFolder = {
  name: '10 - Maintenance',
  item: [
    request({
      name: 'Crear Mantenimiento',
      method: 'POST',
      pathValue: '/maintenance',
      auth: 'admin',
      body: {
        clientId: '{{client_id}}',
        type: 'PREVENTIVO',
        status: 'PENDIENTE',
        scheduledDate: '2026-03-20',
        technicianId: '{{technician_id}}',
        intervenedSystem: 'Sistema CCTV',
        diagnosis: 'Diagnostico inicial desde Postman',
        appliedSolution: 'Ajuste de configuracion',
        observations: 'Registro de prueba',
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("maintenance_id", json.id);',
      ],
    }),
    request({
      name: 'Listar Mantenimientos',
      method: 'GET',
      pathValue: '/maintenance',
      auth: 'admin',
    }),
    request({
      name: 'Obtener Mantenimiento por ID',
      method: 'GET',
      pathValue: '/maintenance/{{maintenance_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Actualizar Mantenimiento',
      method: 'PATCH',
      pathValue: '/maintenance/{{maintenance_id}}',
      auth: 'admin',
      body: {
        status: 'EN_PROCESO',
        executionDate: '2026-03-21',
      },
    }),
  ],
};

const maintenanceCommentsFolder = {
  name: '11 - Maintenance Comments',
  item: [
    request({
      name: 'Crear Comentario de Mantenimiento',
      method: 'POST',
      pathValue: '/maintenance-comments',
      auth: 'admin',
      body: {
        maintenanceId: '{{maintenance_id}}',
        comment: 'Comentario tecnico de prueba desde Postman',
      },
    }),
    request({
      name: 'Listar Comentarios por Mantenimiento',
      method: 'GET',
      pathValue: '/maintenance-comments/maintenance/{{maintenance_id}}',
      auth: 'admin',
    }),
  ],
};

const attachmentsFolder = {
  name: '12 - Attachments',
  item: [
    request({
      name: 'Crear Adjunto (Metadatos)',
      method: 'POST',
      pathValue: '/attachments',
      auth: 'admin',
      body: {
        sourceEntity: '{{source_entity}}',
        sourceEntityId: '{{maintenance_id}}',
        originalName: 'foto_evidencia.jpg',
        storedName: 'foto_evidencia_001.jpg',
        mimeType: 'image/jpeg',
        storagePath: '/uploads/maintenance/foto_evidencia_001.jpg',
        size: '2048',
      },
    }),
    request({
      name: 'Listar Adjuntos por Entidad',
      method: 'GET',
      pathValue: '/attachments/{{source_entity}}/{{maintenance_id}}',
      auth: 'admin',
    }),
  ],
};

const auditFolder = {
  name: '13 - Audit Logs',
  item: [
    request({
      name: 'Listar Auditoria',
      method: 'GET',
      pathValue: '/audit-logs',
      auth: 'admin',
      query: { limit: 100 },
    }),
  ],
};

const cleanupFolder = {
  name: '99 - Cleanup (DELETE Endpoints)',
  item: [
    request({
      name: 'Eliminar Mantenimiento',
      method: 'DELETE',
      pathValue: '/maintenance/{{maintenance_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Eliminar Servicio',
      method: 'DELETE',
      pathValue: '/services/{{service_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Eliminar Categoria Servicio',
      method: 'DELETE',
      pathValue: '/service-categories/{{service_category_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Eliminar Producto',
      method: 'DELETE',
      pathValue: '/products/{{product_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Eliminar Categoria Producto',
      method: 'DELETE',
      pathValue: '/product-categories/{{product_category_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Eliminar Proveedor',
      method: 'DELETE',
      pathValue: '/suppliers/{{supplier_id}}',
      auth: 'admin',
    }),
    request({
      name: 'Crear Cliente Temporal para DELETE',
      method: 'POST',
      pathValue: '/clients',
      auth: 'admin',
      body: {
        nameOrBusinessName: 'Cliente Temporal DELETE',
        documentNumber: '0999999999777',
        phone: '042000777',
        email: 'tmp.delete@nexteye.com',
        address: 'Direccion temporal',
        city: 'Guayaquil',
        active: true,
      },
      tests: [
        'const json = pm.response.json();',
        'pm.collectionVariables.set("temp_client_delete_id", json.id);',
      ],
    }),
    request({
      name: 'Eliminar Cliente (Temporal)',
      method: 'DELETE',
      pathValue: '/clients/{{temp_client_delete_id}}',
      auth: 'admin',
    }),
  ],
};

const collection = {
  info: {
    name: 'NextEyeSecurity Backend - Fase 1',
    schema:
      'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    description:
      'Coleccion Postman para probar todos los endpoints del backend fase prioritaria.',
  },
  variable: collectionVariables.map(([key, value]) => ({ key, value })),
  item: [
    setupFolder,
    usersFolder,
    clientsFolder,
    suppliersFolder,
    productCategoriesFolder,
    productsFolder,
    serviceCategoriesFolder,
    servicesFolder,
    quotationSettingsFolder,
    quotationsFolder,
    maintenanceFolder,
    maintenanceCommentsFolder,
    attachmentsFolder,
    auditFolder,
    cleanupFolder,
  ],
};

const target = path.resolve(
  'apps/backend/postman/NextEyeSecurity.postman_collection.json',
);
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, JSON.stringify(collection, null, 2), 'utf8');
console.log(`Coleccion generada en: ${target}`);
