import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quotation } from './quotation.entity';
import { QuotationDetail } from './quotation-detail.entity';
import {
  CreateQuotationDto,
  CreateQuotationItemDto,
} from './dto/create-quotation.dto';
import { Client } from '../clients/client.entity';
import { User } from '../users/user.entity';
import { Product } from '../products/product.entity';
import { Service } from '../services/service.entity';
import { QuotationSettingsService } from '../quotation-settings/quotation-settings.service';
import {
  QuotationItemType,
  QuotationStatus,
} from '../../common/enums/quotation.enums';
import { UpdateQuotationStatusDto } from './dto/update-quotation-status.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { Role } from '../../common/enums/role.enum';
import PDFDocument from 'pdfkit';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response.interface';
import {
  buildPaginatedResponse,
  resolvePagination,
} from '../../common/utils/pagination.util';

type RequestUser = {
  sub: string;
  email: string;
  role: Role;
};

@Injectable()
export class QuotationsService {
  constructor(
    @InjectRepository(Quotation)
    private readonly quotationsRepository: Repository<Quotation>,
    @InjectRepository(QuotationDetail)
    private readonly quotationDetailsRepository: Repository<QuotationDetail>,
    @InjectRepository(Client)
    private readonly clientsRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    private readonly quotationSettingsService: QuotationSettingsService,
    private readonly auditLogsService: AuditLogsService,
  ) { }

  private toMoney(value: number): string {
    return value.toFixed(2);
  }

  private addDays(date: Date, days: number): Date {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + days);
    return nextDate;
  }

  private async buildQuotationNumber(): Promise<string> {
    const count = await this.quotationsRepository.count();
    const next = String(count + 1).padStart(6, '0');
    const year = new Date().getFullYear();
    return `COT-${year}-${next}`;
  }

  private async resolveSourceItem(item: CreateQuotationItemDto) {
    if (item.itemType === QuotationItemType.PRODUCTO) {
      if (!item.productId) {
        throw new BadRequestException(
          'El item de tipo PRODUCTO requiere productId',
        );
      }
      const product = await this.productsRepository.findOne({
        where: { id: item.productId },
      });
      if (!product) {
        throw new NotFoundException('Producto no encontrado para cotización');
      }
      return {
        referenceId: product.id,
        description: item.description ?? product.description ?? product.name,
        baseCost: Number(product.baseCost),
      };
    }

    if (!item.serviceId) {
      throw new BadRequestException(
        'El item de tipo SERVICIO requiere serviceId',
      );
    }
    const service = await this.servicesRepository.findOne({
      where: { id: item.serviceId },
    });
    if (!service) {
      throw new NotFoundException('Servicio no encontrado para cotización');
    }
    return {
      referenceId: service.id,
      description: item.description ?? service.description ?? service.name,
      baseCost: Number(service.baseCost),
    };
  }

  private parseAllowedPercentValues(rawValues: string[]): number[] {
    return rawValues
      .flatMap((value) => String(value).split(','))
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isFinite(value));
  }

  private async buildDetailsAndTotals(
    items: CreateQuotationItemDto[],
    settings: {
      currentVat: string;
      allowedVatRates: string[];
      allowedMargins: string[];
      defaultMargin: string;
    },
  ): Promise<{
    details: QuotationDetail[];
    subtotalBase: number;
    vatValueTotal: number;
    grossTotal: number;
  }> {
    const allowedVatRates = this.parseAllowedPercentValues(
      settings.allowedVatRates,
    );
    const allowedMargins = this.parseAllowedPercentValues(
      settings.allowedMargins,
    );

    let subtotalBase = 0;
    let vatValueTotal = 0;
    let grossTotal = 0;

    const details: QuotationDetail[] = [];

    for (const item of items) {
      const source = await this.resolveSourceItem(item);
      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException('La cantidad debe ser mayor a 0');
      }

      const vatPercent =
        item.vatPercent !== undefined
          ? Number(item.vatPercent)
          : Number(settings.currentVat);
      const marginPercent =
        item.marginPercent !== undefined
          ? Number(item.marginPercent)
          : Number(settings.defaultMargin);

      if (!allowedVatRates.includes(vatPercent)) {
        throw new BadRequestException(`IVA no permitido: ${vatPercent}%`);
      }
      if (!allowedMargins.includes(marginPercent)) {
        throw new BadRequestException(
          `Margen de ganancia no permitido: ${marginPercent}%`,
        );
      }

      const lineSubtotalBase = source.baseCost * quantity;
      const lineVatValue = source.baseCost * (vatPercent / 100) * quantity;

      // Regla obligatoria: primero IVA y luego ganancia.
      const unitPriceFinal =
        source.baseCost * (1 + vatPercent / 100) * (1 + marginPercent / 100);
      const lineTotal = unitPriceFinal * quantity;

      subtotalBase += lineSubtotalBase;
      vatValueTotal += lineVatValue;
      grossTotal += lineTotal;

      const detail = this.quotationDetailsRepository.create({
        itemType: item.itemType,
        referenceId: source.referenceId,
        descriptionFrozen: source.description,
        quantity: this.toMoney(quantity),
        basePriceHistorical: this.toMoney(source.baseCost),
        vatPercentHistorical: this.toMoney(vatPercent),
        marginPercentHistorical: this.toMoney(marginPercent),
        unitPriceFinal: this.toMoney(unitPriceFinal),
        lineSubtotalBase: this.toMoney(lineSubtotalBase),
        lineVatValue: this.toMoney(lineVatValue),
        lineTotal: this.toMoney(lineTotal),
      });
      details.push(detail);
    }

    return { details, subtotalBase, vatValueTotal, grossTotal };
  }

  async create(
    dto: CreateQuotationDto,
    requestUser: RequestUser,
  ): Promise<Quotation> {
    const client = await this.clientsRepository.findOne({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const user = await this.usersRepository.findOne({
      where: { id: requestUser.sub },
    });
    if (!user) {
      throw new NotFoundException('Usuario creador no encontrado');
    }

    const settings = await this.quotationSettingsService.getCurrentSettings();
    const { details, subtotalBase, vatValueTotal, grossTotal } =
      await this.buildDetailsAndTotals(dto.items, settings);

    const discount = Number(dto.discount ?? '0');
    if (!Number.isFinite(discount) || discount < 0) {
      throw new BadRequestException('Descuento inválido');
    }
    if (discount > grossTotal) {
      throw new BadRequestException('El descuento no puede ser mayor al total');
    }

    const issuedAtDate = dto.issuedAt ? new Date(dto.issuedAt) : new Date();
    const validUntilDate = dto.validUntil
      ? new Date(dto.validUntil)
      : this.addDays(issuedAtDate, settings.defaultValidityDays);

    const quotation = this.quotationsRepository.create({
      quotationNumber: await this.buildQuotationNumber(),
      client,
      createdByUser: user,
      issuedAt: issuedAtDate.toISOString().slice(0, 10),
      validUntil: validUntilDate.toISOString().slice(0, 10),
      status: dto.status ?? QuotationStatus.BORRADOR,
      observations: dto.observations ?? null,
      subtotal: this.toMoney(subtotalBase),
      discount: this.toMoney(discount),
      vatPercentHistorical: settings.currentVat,
      vatValueHistorical: this.toMoney(vatValueTotal),
      total: this.toMoney(grossTotal - discount),
      currency: dto.currency?.toUpperCase() ?? settings.defaultCurrency,
      details,
    });

    const savedQuotation = await this.quotationsRepository.save(quotation);
    await this.auditLogsService.register({
      module: 'quotations',
      entity: 'Quotation',
      entityId: savedQuotation.id,
      action: 'CREATE',
      user: requestUser.email,
      summary: `Cotización creada: ${savedQuotation.quotationNumber}`,
      payloadSummary: {
        clientId: dto.clientId,
        items: dto.items.length,
        total: savedQuotation.total,
      },
    });

    return savedQuotation;
  }

  async findAll(requestUser: RequestUser): Promise<Quotation[]> {
    if (requestUser.role === Role.TECNICO) {
      return this.quotationsRepository.find({
        where: { createdByUser: { id: requestUser.sub } },
        order: { createdAt: 'DESC' },
      });
    }
    return this.quotationsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findAllPaginated(
    requestUser: RequestUser,
    query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Quotation>> {
    const { page, limit, skip } = resolvePagination(query, 10);
    const where =
      requestUser.role === Role.TECNICO
        ? { createdByUser: { id: requestUser.sub } }
        : undefined;

    const [items, total] = await this.quotationsRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return buildPaginatedResponse(items, total, page, limit);
  }

  async findOne(id: string, requestUser: RequestUser): Promise<Quotation> {
    const quotation = await this.quotationsRepository.findOne({
      where: { id },
    });
    if (!quotation) {
      throw new NotFoundException('Cotización no encontrada');
    }
    if (
      requestUser.role === Role.TECNICO &&
      quotation.createdByUser.id !== requestUser.sub
    ) {
      throw new NotFoundException('Cotización no encontrada');
    }
    return quotation;
  }

  async updateDraft(
    id: string,
    dto: CreateQuotationDto,
    requestUser: RequestUser,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id, requestUser);
    if (quotation.status !== QuotationStatus.BORRADOR) {
      throw new BadRequestException(
        'Solo se puede editar una cotización en estado BORRADOR',
      );
    }

    const client = await this.clientsRepository.findOne({
      where: { id: dto.clientId },
    });
    if (!client) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const settings = await this.quotationSettingsService.getCurrentSettings();
    const { details, subtotalBase, vatValueTotal, grossTotal } =
      await this.buildDetailsAndTotals(dto.items, settings);

    const discount = Number(dto.discount ?? '0');
    if (!Number.isFinite(discount) || discount < 0) {
      throw new BadRequestException('Descuento inválido');
    }
    if (discount > grossTotal) {
      throw new BadRequestException('El descuento no puede ser mayor al total');
    }

    const issuedAtDate = dto.issuedAt
      ? new Date(dto.issuedAt)
      : new Date(quotation.issuedAt);
    const validUntilDate = dto.validUntil
      ? new Date(dto.validUntil)
      : this.addDays(issuedAtDate, settings.defaultValidityDays);

    await this.quotationDetailsRepository
      .createQueryBuilder()
      .delete()
      .where('quotation_id = :quotationId', { quotationId: quotation.id })
      .execute();

    quotation.client = client;
    quotation.issuedAt = issuedAtDate.toISOString().slice(0, 10);
    quotation.validUntil = validUntilDate.toISOString().slice(0, 10);
    quotation.status = dto.status ?? quotation.status;
    quotation.observations = dto.observations ?? null;
    quotation.subtotal = this.toMoney(subtotalBase);
    quotation.discount = this.toMoney(discount);
    quotation.vatPercentHistorical = settings.currentVat;
    quotation.vatValueHistorical = this.toMoney(vatValueTotal);
    quotation.total = this.toMoney(grossTotal - discount);
    quotation.currency = dto.currency?.toUpperCase() ?? settings.defaultCurrency;
    quotation.details = details;

    const savedQuotation = await this.quotationsRepository.save(quotation);
    await this.auditLogsService.register({
      module: 'quotations',
      entity: 'Quotation',
      entityId: savedQuotation.id,
      action: 'UPDATE',
      user: requestUser.email,
      summary: `Cotización actualizada: ${savedQuotation.quotationNumber}`,
      payloadSummary: {
        clientId: dto.clientId,
        items: dto.items.length,
        total: savedQuotation.total,
      },
    });

    return savedQuotation;
  }

  async updateStatus(
    id: string,
    dto: UpdateQuotationStatusDto,
    requestUser: RequestUser,
  ): Promise<Quotation> {
    const quotation = await this.findOne(id, requestUser);
    quotation.status = dto.status;
    const savedQuotation = await this.quotationsRepository.save(quotation);
    await this.auditLogsService.register({
      module: 'quotations',
      entity: 'Quotation',
      entityId: savedQuotation.id,
      action: 'UPDATE_STATUS',
      user: requestUser.email,
      summary: `Estado actualizado a ${dto.status} en ${savedQuotation.quotationNumber}`,
      payloadSummary: dto,
    });
    return savedQuotation;
  }

  async buildPdfBuffer(id: string, requestUser: RequestUser): Promise<Buffer> {
    const quotation = await this.findOne(id, requestUser);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 36 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (error: Error) => reject(error));

      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const margin = 36;
      const contentWidth = pageWidth - margin * 2;
      const currency = quotation.currency;
      const linesTotal = quotation.details.reduce(
        (sum, detail) => sum + Number(detail.lineTotal),
        0,
      );
      const subtotalDisplay = linesTotal;
      const discountDisplay = Number(quotation.discount);
      const vatDisplay = Number(quotation.vatValueHistorical);
      const totalDisplay = Number(quotation.total);

      const headerColor = '#5B1126';
      const accentColor = '#9CA3AF';
      const borderColor = '#D9E0EA';
      const textColor = '#1B2430';
      const mutedTextColor = '#5A6472';

      const bundledLogoCandidates = [
        path.resolve(process.cwd(), 'src', 'assets', 'logo-pdf.png'),
        path.resolve(process.cwd(), 'dist', 'assets', 'logo-pdf.png'),
        path.resolve(__dirname, '..', '..', '..', 'assets', 'logo-pdf.png'),
        path.resolve(
          __dirname,
          '..',
          '..',
          '..',
          '..',
          'src',
          'assets',
          'logo-pdf.png',
        ),
      ];
      const bundledLogoPng = bundledLogoCandidates.find((candidate) =>
        fs.existsSync(candidate),
      );

      const designCandidates = [
        path.resolve(process.cwd(), 'design'),
        path.resolve(process.cwd(), '..', 'design'),
        path.resolve(process.cwd(), '..', '..', 'design'),
        path.resolve(__dirname, '..', '..', '..', '..', '..', 'design'),
      ];

      const designDir = designCandidates.find((candidate) =>
        fs.existsSync(candidate),
      );
      const logoPng = bundledLogoPng
        ? bundledLogoPng
        : designDir
          ? path.join(designDir, 'logo.png')
          : null;
      const drawHeader = (isFirstPage: boolean) => {
        doc.save();
        doc.rect(0, 0, pageWidth, 120).fill(headerColor);
        doc.rect(0, 112, pageWidth, 8).fill(accentColor);
        doc.restore();

        const logoBoxX = margin;
        const logoBoxY = 18;
        let logoDrawn = false;

        if (logoPng && fs.existsSync(logoPng)) {
          try {
            doc.image(logoPng, logoBoxX, logoBoxY, {
              fit: [190, 84],
              valign: 'center',
            });
            logoDrawn = true;
          } catch {
            logoDrawn = false;
          }
        }

        if (!logoDrawn) {
          doc
            .font('Helvetica-Bold')
            .fontSize(24)
            .fillColor('white')
            .text('NEXT EYE', logoBoxX, 35)
            .fontSize(12)
            .text('SECURITY', logoBoxX, 63);
        }

        doc
          .font('Helvetica-Bold')
          .fontSize(19)
          .fillColor('white')
          .text('NEXT EYE SECURITY', margin + 156, 45, {
            width: 220,
            align: 'left',
          });

        doc
          .font('Helvetica-Bold')
          .fontSize(24)
          .fillColor('white')
          .text('COTIZACIÓN', margin + 300, 28, { width: 240, align: 'right' })
          .fontSize(11)
          .font('Helvetica')
          .fillColor('#EAF3FF')
          .text('/ PROFORMA', margin + 300, 58, { width: 240, align: 'right' });

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#EAF3FF')
          .text(`No: ${quotation.quotationNumber}`, margin + 300, 78, {
            width: 240,
            align: 'right',
          })
          .text(`Fecha: ${quotation.issuedAt}`, margin + 300, 92, {
            width: 240,
            align: 'right',
          });

        if (!isFirstPage) {
          doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .fillColor(textColor)
            .text(`Cotización ${quotation.quotationNumber}`, margin, 132);
        }
      };

      drawHeader(true);

      let y = 136;
      doc
        .roundedRect(margin, y, contentWidth, 92, 8)
        .lineWidth(1)
        .strokeColor(borderColor)
        .fillColor('#F8FAFC')
        .fillAndStroke('#F8FAFC', borderColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(textColor)
        .text('DATOS DEL CLIENTE', margin + 14, y + 12)
        .font('Helvetica')
        .fontSize(10)
        .fillColor(mutedTextColor)
        .text(quotation.client.nameOrBusinessName, margin + 14, y + 32, {
          width: 280,
        })
        .text(
          `Documento: ${quotation.client.documentNumber}`,
          margin + 14,
          y + 48,
        )
        .text(`Teléfono: ${quotation.client.phone}`, margin + 14, y + 62);

      if (quotation.client.email) {
        doc.text(`Email: ${quotation.client.email}`, margin + 14, y + 76);
      }

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(mutedTextColor)
        .text(`Dirección: ${quotation.client.address}`, margin + 320, y + 32, {
          width: 230,
        })
        .text(`Ciudad: ${quotation.client.city}`, margin + 320, y + 62, {
          width: 230,
        })
        .text(`Vigencia: ${quotation.validUntil}`, margin + 320, y + 76, {
          width: 230,
        });

      y += 112;

      const tableX = margin;
      const qtyW = 52;
      const descW = 298;
      const unitW = 96;
      const totalW = 98;
      const footerReservedHeight = 56;
      const startContentY = 160;
      const summarySectionHeight = 122;
      const observationsSectionHeight = 88;
      const observationsTextMaxHeight = 48;
      const summaryAndObservationBlockHeight =
        16 + summarySectionHeight + observationsSectionHeight;
      const rowBottomLimit = pageHeight - footerReservedHeight - 12;

      const fitTextToHeight = (
        text: string,
        width: number,
        maxHeight: number,
      ): string => {
        const normalized = text.replace(/\s+/g, ' ').trim();
        if (!normalized) {
          return '';
        }

        const words = normalized.split(' ');
        let fitted = '';

        for (const word of words) {
          const candidate = fitted ? `${fitted} ${word}` : word;
          const candidateHeight = doc.heightOfString(candidate, {
            width,
            align: 'left',
          });

          if (candidateHeight > maxHeight) {
            break;
          }

          fitted = candidate;
        }

        return fitted || normalized;
      };

      const drawTableHeader = () => {
        doc.rect(tableX, y, qtyW + descW + unitW + totalW, 24).fill('#E8F4FB');

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor('#103A52')
          .text('CANT.', tableX + 6, y + 7, {
            width: qtyW - 12,
            align: 'center',
          })
          .text('DESCRIPCIÓN', tableX + qtyW + 6, y + 7, { width: descW - 12 })
          .text('P. UNITARIO', tableX + qtyW + descW + 6, y + 7, {
            width: unitW - 12,
            align: 'right',
          })
          .text('TOTAL', tableX + qtyW + descW + unitW + 6, y + 7, {
            width: totalW - 12,
            align: 'right',
          });

        y += 24;
      };

      drawTableHeader();

      quotation.details.forEach((detail, index) => {
        const rowDescription = detail.descriptionFrozen || '-';
        const descriptionHeight = doc.heightOfString(rowDescription, {
          width: descW - 12,
          align: 'left',
        });
        const rowHeight = Math.max(28, descriptionHeight + 10);

        if (y + rowHeight > rowBottomLimit) {
          doc.addPage();
          drawHeader(false);
          y = startContentY;
          drawTableHeader();
        }

        if (index % 2 === 0) {
          doc
            .rect(tableX, y, qtyW + descW + unitW + totalW, rowHeight)
            .fill('#FBFDFF');
        }

        doc
          .rect(tableX, y, qtyW + descW + unitW + totalW, rowHeight)
          .lineWidth(0.5)
          .strokeColor('#E2E8F0')
          .stroke();

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(textColor)
          .text(detail.quantity, tableX + 6, y + 8, {
            width: qtyW - 12,
            align: 'center',
          })
          .text(rowDescription, tableX + qtyW + 6, y + 6, {
            width: descW - 12,
            align: 'left',
          })
          .text(
            `${currency} ${Number(detail.unitPriceFinal).toFixed(2)}`,
            tableX + qtyW + descW + 6,
            y + 8,
            { width: unitW - 12, align: 'right' },
          )
          .text(
            `${currency} ${Number(detail.lineTotal).toFixed(2)}`,
            tableX + qtyW + descW + unitW + 6,
            y + 8,
            { width: totalW - 12, align: 'right' },
          );

        y += rowHeight;
      });

      y += 16;
      if (y + summaryAndObservationBlockHeight > pageHeight - footerReservedHeight) {
        doc.addPage();
        drawHeader(false);
        y = startContentY;
      }

      const summaryBoxW = 255;
      const summaryX = pageWidth - margin - summaryBoxW;

      doc
        .roundedRect(summaryX, y, summaryBoxW, 104, 8)
        .lineWidth(1)
        .strokeColor('#C8D7E6')
        .fillColor('#F7FAFD')
        .fillAndStroke('#F7FAFD', '#C8D7E6');

      const lineY1 = y + 14;
      const labelW = 122;
      const valueW = 120;
      const valueX = summaryX + summaryBoxW - 12 - valueW;

      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(mutedTextColor)
        .text('Subtotal:', summaryX + 12, lineY1, {
          width: labelW,
          align: 'right',
        })
        .text(`${currency} ${subtotalDisplay.toFixed(2)}`, valueX, lineY1, {
          width: valueW,
          align: 'right',
        })
        .text('Descuento:', summaryX + 12, lineY1 + 20, {
          width: labelW,
          align: 'right',
        })
        .text(
          `${currency} ${discountDisplay.toFixed(2)}`,
          valueX,
          lineY1 + 20,
          {
            width: valueW,
            align: 'right',
          },
        )
        .text('IVA:', summaryX + 12, lineY1 + 40, {
          width: labelW,
          align: 'right',
        })
        .text(`${currency} ${vatDisplay.toFixed(2)}`, valueX, lineY1 + 40, {
          width: valueW,
          align: 'right',
        });

      doc
        .moveTo(summaryX + 12, lineY1 + 62)
        .lineTo(summaryX + summaryBoxW - 12, lineY1 + 62)
        .lineWidth(1)
        .strokeColor('#B7C8DA')
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .fillColor('#103A52')
        .text('TOTAL:', summaryX + 12, lineY1 + 72, {
          width: labelW,
          align: 'right',
        })
        .text(`${currency} ${totalDisplay.toFixed(2)}`, valueX, lineY1 + 72, {
          width: valueW,
          align: 'right',
        });

      y += 122;
      if (y + observationsSectionHeight > pageHeight - footerReservedHeight) {
        doc.addPage();
        drawHeader(false);
        y = startContentY;
      }

      doc
        .roundedRect(margin, y, contentWidth, 88, 8)
        .lineWidth(1)
        .strokeColor(borderColor)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(textColor)
        .text('OBSERVACIONES', margin + 12, y + 10)
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(mutedTextColor);

      const observationsSource =
        quotation.observations ??
        'Agradecemos la oportunidad de servirle. Esta cotización se elaboró según los requerimientos levantados y mantiene vigencia según fecha indicada.';
      const observationsText = fitTextToHeight(
        observationsSource,
        contentWidth - 24,
        observationsTextMaxHeight,
      );

      doc.text(observationsText, margin + 12, y + 28, {
        width: contentWidth - 24,
        align: 'left',
      });

      const footerY = pageHeight - margin - 26;
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor('#6B7686')
        .text('NEXT EYE SECURITY - Tu aliado en seguridad', margin, footerY, {
          width: contentWidth,
          align: 'center',
          lineBreak: false,
        })
        .text(
          'Documento generado automáticamente por NextEyeSecurity',
          margin,
          footerY + 12,
          {
            width: contentWidth,
            align: 'center',
            lineBreak: false,
          },
        );

      doc.end();
    });
  }
}
