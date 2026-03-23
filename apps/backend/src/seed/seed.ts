import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/user.entity';
import { Role } from '../common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import { Client } from '../modules/clients/client.entity';
import { Supplier } from '../modules/suppliers/supplier.entity';
import { ProductCategory } from '../modules/product-categories/product-category.entity';
import { Product } from '../modules/products/product.entity';
import { ServiceCategory } from '../modules/service-categories/service-category.entity';
import { Service } from '../modules/services/service.entity';
import { QuotationSettingsService } from '../modules/quotation-settings/quotation-settings.service';
import { QuotationsService } from '../modules/quotations/quotations.service';
import {
  QuotationItemType,
  QuotationStatus,
} from '../common/enums/quotation.enums';
import { MaintenanceService } from '../modules/maintenance/maintenance.service';
import {
  MaintenanceStatus,
  MaintenanceType,
} from '../common/enums/maintenance.enums';
import { MaintenanceCommentsService } from '../modules/maintenance-comments/maintenance-comments.service';
import { AttachmentsService } from '../modules/attachments/attachments.service';
import { Maintenance } from '../modules/maintenance/maintenance.entity';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  const usersRepository = dataSource.getRepository(User);
  const clientsRepository = dataSource.getRepository(Client);
  const suppliersRepository = dataSource.getRepository(Supplier);
  const productCategoriesRepository = dataSource.getRepository(ProductCategory);
  const productsRepository = dataSource.getRepository(Product);
  const serviceCategoriesRepository = dataSource.getRepository(ServiceCategory);
  const servicesRepository = dataSource.getRepository(Service);

  const quotationSettingsService = app.get(QuotationSettingsService);
  const quotationsService = app.get(QuotationsService);
  const maintenanceService = app.get(MaintenanceService);
  const maintenanceCommentsService = app.get(MaintenanceCommentsService);
  const attachmentsService = app.get(AttachmentsService);

  await cleanDatabase(dataSource);

  const passwordHash = await bcrypt.hash('Admin123*', 10);

  const admins = await usersRepository.save([
    usersRepository.create({
      email: 'admin1@nexteye.com',
      fullName: 'Administrador Principal',
      password: passwordHash,
      role: Role.ADMINISTRADOR,
      phone: '0990000001',
      active: true,
    }),
    usersRepository.create({
      email: 'admin2@nexteye.com',
      fullName: 'Administrador Operativo',
      password: passwordHash,
      role: Role.ADMINISTRADOR,
      phone: '0990000002',
      active: true,
    }),
  ]);

  const technicians = await usersRepository.save([
    usersRepository.create({
      email: 'tecnico1@nexteye.com',
      fullName: 'Técnico Carlos Mena',
      password: passwordHash,
      role: Role.TECNICO,
      phone: '0981000001',
      active: true,
    }),
    usersRepository.create({
      email: 'tecnico2@nexteye.com',
      fullName: 'Técnico Ana Cedeño',
      password: passwordHash,
      role: Role.TECNICO,
      phone: '0981000002',
      active: true,
    }),
    usersRepository.create({
      email: 'tecnico3@nexteye.com',
      fullName: 'Técnico Luis Vera',
      password: passwordHash,
      role: Role.TECNICO,
      phone: '0981000003',
      active: true,
    }),
    usersRepository.create({
      email: 'tecnico4@nexteye.com',
      fullName: 'Técnico Sofía Romero',
      password: passwordHash,
      role: Role.TECNICO,
      phone: '0981000004',
      active: true,
    }),
    usersRepository.create({
      email: 'tecnico5@nexteye.com',
      fullName: 'Técnico Diego Alarcón',
      password: passwordHash,
      role: Role.TECNICO,
      phone: '0981000005',
      active: true,
    }),
  ]);

  const clients = await clientsRepository.save([
    clientsRepository.create({
      nameOrBusinessName: 'Comercial Andina S.A.',
      documentNumber: '0999999000001',
      phone: '042001001',
      email: 'compras@andina.com',
      address: 'Av. 9 de Octubre y Chile',
      city: 'Guayaquil',
      commercialReference: 'Cliente corporativo recurrente',
      observations: 'Prioridad en soporte fuera de horario',
      active: true,
    }),
    clientsRepository.create({
      nameOrBusinessName: 'Residencial Altavista',
      documentNumber: '1790012345001',
      phone: '022002002',
      email: 'administracion@altavista.ec',
      address: 'Vía Samborondón km 4',
      city: 'Samborondón',
      active: true,
    }),
    clientsRepository.create({
      nameOrBusinessName: 'Hospital San Miguel',
      documentNumber: '0190023456001',
      phone: '072003003',
      email: 'soporte@hsm.ec',
      address: 'Av. Ordóñez Lasso',
      city: 'Cuenca',
      active: true,
    }),
    clientsRepository.create({
      nameOrBusinessName: 'Bodega El Constructor',
      documentNumber: '1290034567001',
      phone: '052004004',
      email: 'gerencia@constructor.ec',
      address: 'Av. Metropolitana',
      city: 'Manta',
      active: true,
    }),
    clientsRepository.create({
      nameOrBusinessName: 'Conjunto Mirador del Sol',
      documentNumber: '0990045678001',
      phone: '042005005',
      email: 'administracion@miradordelsol.ec',
      address: 'Urdesa Central',
      city: 'Guayaquil',
      active: true,
    }),
  ]);

  const suppliers = await suppliersRepository.save([
    suppliersRepository.create({
      businessName: 'Seguritech Importaciones',
      ruc: '0991010101001',
      contact: 'María Zambrano',
      phone: '042111111',
      email: 'ventas@seguritech.ec',
      address: 'Mapasingue Oeste',
      city: 'Guayaquil',
      active: true,
    }),
    suppliersRepository.create({
      businessName: 'Control Access Pro',
      ruc: '1792020202001',
      contact: 'Javier Ulloa',
      phone: '022222222',
      email: 'comercial@controlaccess.ec',
      address: 'Av. América',
      city: 'Quito',
      active: true,
    }),
    suppliersRepository.create({
      businessName: 'Redes y Energía Suministros',
      ruc: '0993030303001',
      contact: 'Liliana Quinto',
      phone: '042333333',
      email: 'pedidos@redesenergia.ec',
      address: 'Durán Industrial',
      city: 'Durán',
      active: true,
    }),
    suppliersRepository.create({
      businessName: 'VisionCam Ecuador',
      ruc: '0194040404001',
      contact: 'Pedro Bermeo',
      phone: '072444444',
      email: 'soporte@visioncam.ec',
      address: 'Terminal Terrestre Norte',
      city: 'Cuenca',
      active: true,
    }),
    suppliersRepository.create({
      businessName: 'Sistemas Integrales del Litoral',
      ruc: '0995050505001',
      contact: 'Valeria Moya',
      phone: '042555555',
      email: 'ventas@silitoral.ec',
      address: 'Av. de las Américas',
      city: 'Guayaquil',
      active: true,
    }),
  ]);

  const productCategories = await productCategoriesRepository.save([
    productCategoriesRepository.create({
      name: 'Cámaras y Video',
      description: 'Equipos CCTV y grabación',
      active: true,
    }),
    productCategoriesRepository.create({
      name: 'Control de Acceso',
      description: 'Equipos biométricos y cerraduras',
      active: true,
    }),
    productCategoriesRepository.create({
      name: 'Red y Energía',
      description: 'Suministros eléctricos y red',
      active: true,
    }),
  ]);

  const products = await productsRepository.save([
    productsRepository.create({
      category: productCategories[0],
      mainSupplier: suppliers[0],
      internalCode: 'PRD-0001',
      name: 'Camara IP 4MP',
      brand: 'Hikvision',
      model: 'DS-2CD1043',
      description: 'Camara IP exterior 4MP con IR',
      baseCost: '68.00',
      stock: '25',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[0],
      mainSupplier: suppliers[0],
      internalCode: 'PRD-0002',
      name: 'NVR 8 Canales',
      brand: 'Dahua',
      model: 'NVR4108HS',
      description: 'Grabador NVR para 8 canales',
      baseCost: '145.00',
      stock: '14',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[1],
      mainSupplier: suppliers[1],
      internalCode: 'PRD-0003',
      name: 'Lector Biometrico',
      brand: 'ZKTeco',
      model: 'K40',
      description: 'Lector biometrico de huella',
      baseCost: '82.00',
      stock: '18',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[1],
      mainSupplier: suppliers[1],
      internalCode: 'PRD-0004',
      name: 'Cerradura Electrica',
      brand: 'YLI',
      model: 'YS-130',
      description: 'Cerradura electrica para puertas',
      baseCost: '36.00',
      stock: '30',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[2],
      mainSupplier: suppliers[2],
      internalCode: 'PRD-0005',
      name: 'Switch 8 Puertos',
      brand: 'TP-Link',
      model: 'TL-SG108',
      description: 'Switch gigabit de 8 puertos',
      baseCost: '44.00',
      stock: '20',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[2],
      mainSupplier: suppliers[2],
      internalCode: 'PRD-0006',
      name: 'Cable UTP Cat6',
      brand: 'Furukawa',
      model: null,
      description: 'Bobina de cable UTP categoría 6',
      baseCost: '112.00',
      stock: '10',
      unit: 'BOBINA',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[2],
      mainSupplier: suppliers[2],
      internalCode: 'PRD-0007',
      name: 'Fuente de Poder 12V',
      brand: 'Genérica',
      model: '12V-10A',
      description: 'Fuente de poder para CCTV',
      baseCost: '22.00',
      stock: '40',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[0],
      mainSupplier: suppliers[3],
      internalCode: 'PRD-0008',
      name: 'Videoportero WiFi',
      brand: 'Ezviz',
      model: 'HP7',
      description: 'Videoportero inteligente con app',
      baseCost: '138.00',
      stock: '12',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[1],
      mainSupplier: suppliers[4],
      internalCode: 'PRD-0009',
      name: 'Control de Acceso RFID',
      brand: 'Rosslare',
      model: 'AY-K12',
      description: 'Lector RFID para control de acceso',
      baseCost: '75.00',
      stock: '22',
      unit: 'UNIDAD',
      active: true,
    }),
    productsRepository.create({
      category: productCategories[2],
      mainSupplier: suppliers[2],
      internalCode: 'PRD-0010',
      name: 'UPS 1000VA',
      brand: 'Forza',
      model: 'NT-1011',
      description: 'UPS para respaldo de equipos',
      baseCost: '98.00',
      stock: '8',
      unit: 'UNIDAD',
      active: true,
    }),
  ]);

  const serviceCategories = await serviceCategoriesRepository.save([
    serviceCategoriesRepository.create({
      name: 'Instalación',
      description: 'Implementación inicial de sistemas',
      active: true,
    }),
    serviceCategoriesRepository.create({
      name: 'Mantenimiento',
      description: 'Mantenimientos preventivos y correctivos',
      active: true,
    }),
    serviceCategoriesRepository.create({
      name: 'Soporte Técnico',
      description: 'Visitas y soporte especializado',
      active: true,
    }),
  ]);

  const services = await servicesRepository.save([
    servicesRepository.create({
      category: serviceCategories[0],
      name: 'Instalación de camara',
      description: 'Instalación física y configuración de cámara',
      baseCost: '35.00',
      active: true,
    }),
    servicesRepository.create({
      category: serviceCategories[0],
      name: 'Configuración de NVR',
      description: 'Configuración completa de grabador',
      baseCost: '45.00',
      active: true,
    }),
    servicesRepository.create({
      category: serviceCategories[1],
      name: 'Mantenimiento Preventivo CCTV',
      description: 'Limpieza, pruebas y ajuste de sistema CCTV',
      baseCost: '85.00',
      active: true,
    }),
    servicesRepository.create({
      category: serviceCategories[1],
      name: 'Mantenimiento Correctivo',
      description: 'Atención correctiva por falla de equipos',
      baseCost: '95.00',
      active: true,
    }),
    servicesRepository.create({
      category: serviceCategories[2],
      name: 'Visita Técnica',
      description: 'Inspección y diagnóstico in situ',
      baseCost: '55.00',
      active: true,
    }),
    servicesRepository.create({
      category: serviceCategories[2],
      name: 'Soporte Remoto',
      description: 'Asistencia remota y parametrización',
      baseCost: '28.00',
      active: true,
    }),
    servicesRepository.create({
      category: serviceCategories[0],
      name: 'Recableado estructurado',
      description: 'Tendido de cableado y etiquetado',
      baseCost: '70.00',
      active: true,
    }),
    servicesRepository.create({
      category: serviceCategories[2],
      name: 'Diagnóstico de red',
      description: 'Análisis de conectividad y rendimiento',
      baseCost: '62.00',
      active: true,
    }),
  ]);

  await quotationSettingsService.getCurrentSettings();

  const allCreators = [admins[0], admins[1], ...technicians];
  for (let i = 0; i < 10; i++) {
    const creator = allCreators[i % allCreators.length];
    const client = clients[i % clients.length];
    const product = products[i % products.length];
    const service = services[i % services.length];

    await quotationsService.create(
      {
        clientId: client.id,
        status:
          i % 4 === 0
            ? QuotationStatus.ENVIADA
            : i % 5 === 0
              ? QuotationStatus.APROBADA
              : QuotationStatus.BORRADOR,
        observations: `Cotización demo #${i + 1}`,
        discount: i % 3 === 0 ? '10.00' : '0.00',
        items: [
          {
            itemType: QuotationItemType.PRODUCTO,
            productId: product.id,
            quantity: `${(i % 3) + 1}`,
            vatPercent: i % 2 === 0 ? '15' : '12',
            marginPercent: i % 2 === 0 ? '20' : '25',
          },
          {
            itemType: QuotationItemType.SERVICIO,
            serviceId: service.id,
            quantity: '1',
            vatPercent: i % 4 === 0 ? '0' : '15',
            marginPercent: '20',
          },
        ],
      },
      {
        sub: creator.id,
        email: creator.email,
        role: creator.role,
      },
    );
  }

  const maintenances: Maintenance[] = [];
  for (let i = 0; i < 12; i++) {
    const technician = technicians[i % technicians.length];
    const createdMaintenance = await maintenanceService.create(
      {
        clientId: clients[i % clients.length].id,
        type:
          i % 2 === 0 ? MaintenanceType.PREVENTIVO : MaintenanceType.CORRECTIVO,
        status:
          i % 3 === 0
            ? MaintenanceStatus.EN_PROCESO
            : MaintenanceStatus.PENDIENTE,
        scheduledDate: new Date(2026, 2, (i % 28) + 1)
          .toISOString()
          .slice(0, 10),
        executionDate:
          i % 3 === 0
            ? new Date(2026, 2, (i % 28) + 2).toISOString().slice(0, 10)
            : undefined,
        technicianId: technician.id,
        intervenedSystem: i % 2 === 0 ? 'Sistema CCTV' : 'Control de acceso',
        diagnosis: `Diagnóstico técnico #${i + 1}`,
        appliedSolution: `Solución aplicada #${i + 1}`,
        observations: 'Registro de mantenimiento seed',
      },
      {
        sub: admins[0].id,
        email: admins[0].email,
        role: admins[0].role,
      },
    );
    maintenances.push(createdMaintenance);
  }

  for (let i = 0; i < maintenances.length; i++) {
    await maintenanceCommentsService.create(
      {
        maintenanceId: maintenances[i].id,
        comment: `Comentario técnico seed #${i + 1}`,
      },
      {
        sub: technicians[i % technicians.length].id,
        email: technicians[i % technicians.length].email,
      },
    );

    await attachmentsService.create(
      {
        sourceEntity: 'maintenance',
        sourceEntityId: maintenances[i].id,
        originalName: `evidencia_${i + 1}.jpg`,
        storedName: `evidencia_seed_${i + 1}.jpg`,
        mimeType: 'image/jpeg',
        storagePath: `/uploads/maintenance/evidencia_seed_${i + 1}.jpg`,
        size: `${(i + 1) * 1024}`,
      },
      { email: technicians[i % technicians.length].email },
    );
  }

  console.log('Seed ejecutado correctamente.');
  console.log('Usuarios: 2 administradores, 5 técnicos.');
  console.log('Clientes: 5 | Proveedores: 5 | Productos: 10 | Servicios: 8');
  console.log(
    'Cotizaciones: 10 | Mantenimientos: 12 | Comentarios y adjuntos generados.',
  );

  await app.close();
}

async function cleanDatabase(dataSource: DataSource) {
  await dataSource.query(`
    TRUNCATE TABLE
      attachments,
      maintenance_comments,
      maintenance,
      quotation_details,
      quotations,
      products,
      product_categories,
      services,
      service_categories,
      suppliers,
      clients,
      users,
      quotation_settings,
      audit_logs
    RESTART IDENTITY CASCADE;
  `);
}

void seed();
