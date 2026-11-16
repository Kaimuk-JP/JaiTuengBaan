import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { IamGovResidenceClient } from './iam-gov-residence.client';
import { CreateResidenceClaimDto } from './dto/create-residence-claim.dto';
import { ConfigService } from '../../../core/config';

@Injectable()
export class ResidenceService {
  private readonly logger = new Logger(ResidenceService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly iamClient: IamGovResidenceClient,
    private readonly config: ConfigService,
  ) {}

  async search(userId: string, params: Record<string, any>) {
    const cleanParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key === 'municipalityId') continue;
      if (value !== undefined && value !== null && value !== '') {
        cleanParams[key] = String(value);
      }
    }

    return this.iamClient.search(cleanParams);
  }

  async findById(id: string) {
    return this.iamClient.findById(id);
  }

  async submitClaim(userId: string, incomingIamUserId: string, municipalityId: string, dto: CreateResidenceClaimDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('ไม่พบผู้ใช้ในระบบ');
    }

    let finalMunicipalityId = user.organizationId || municipalityId || this.config.eServiceMunicipalityId || '';
    if (!finalMunicipalityId) {
      throw new BadRequestException('ไม่สามารถดำเนินการได้: ไม่พบ municipalityId สำหรับ e-service');
    }

    const realIamUserId = user.iamUserId || incomingIamUserId;

    const externalRequestId = `volunteer-smart-${Date.now()}`;
    const iamPayload = {
      ...dto,
      submittedByUserId: realIamUserId,
      municipalityId: finalMunicipalityId,
      externalRequestId,
    };

    let iamResponse: any;
    try {
      iamResponse = await this.iamClient.submitClaim(iamPayload);
    } catch (error: any) {
      const status = error?.statusCode || error?.getStatus?.() || error?.status || error?.response?.statusCode;
      this.logger.error(`Claim submit error [${status}]: ${error.message}`);
      if (status === 403) {
        let muniName = 'ไม่ทราบชื่อ';
        try {
          const org = await this.prisma.organization.findUnique({ where: { id: finalMunicipalityId } });
          if (org?.name) muniName = org.name;
        } catch {}
        throw new BadRequestException(`ยังไม่เปิดให้บริการในเทศบาล "${muniName}" กรุณาติดต่อเจ้าหน้าที่`);
      }
      throw new BadRequestException(error.message || 'ไม่สามารถส่งคำขอเพิ่มบ้านได้ กรุณาลองใหม่');
    }

    const claim = await this.prisma.residenceClaim.create({
      data: {
        iamClaimId: iamResponse.id,
        userId,
        externalRequestId,
        houseNo: dto.houseNo,
        moo: dto.moo,
        villageName: dto.villageName,
        provinceId: dto.provinceId,
        districtId: dto.districtId,
        subdistrictId: dto.subdistrictId,
        postalCode: dto.postalCode,
        latitude: dto.latitude,
        longitude: dto.longitude,
        statusSnapshot: 'SUBMITTED',
      },
    });

    this.logger.log(`Residence claim created: ${claim.id} (IAM: ${iamResponse.id}) for user ${userId}`);

    return {
      id: claim.id,
      iamClaimId: iamResponse.id,
      status: 'SUBMITTED',
    };
  }

  async uploadEvidence(claimId: number, file: Express.Multer.File) {
    const claim = await this.prisma.residenceClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('ไม่พบคำขอเพิ่มบ้าน');
    }

    const result = await this.iamClient.uploadEvidence(
      claim.iamClaimId,
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    return result;
  }

  async getClaimStatus(claimId: number) {
    const claim = await this.prisma.residenceClaim.findUnique({
      where: { id: claimId },
    });

    if (!claim) {
      throw new NotFoundException('ไม่พบคำขอเพิ่มบ้าน');
    }

    try {
      const iamStatus = await this.iamClient.getClaimStatus(claim.iamClaimId);

      if (claim.statusSnapshot !== iamStatus.status) {
        await this.prisma.residenceClaim.update({
          where: { id: claim.id },
          data: {
            statusSnapshot: iamStatus.status,
            selectedResidenceId: iamStatus.matchedResidenceId || undefined,
            reviewNote: iamStatus.reviewNote || undefined,
          },
        });
      }

      return {
        ...claim,
        status: iamStatus.status,
        matchedResidenceId: iamStatus.matchedResidenceId,
        reviewNote: iamStatus.reviewNote,
        reviewedAt: iamStatus.reviewedAt,
      };
    } catch (error) {
      this.logger.warn(`Failed to sync claim status from IAM: ${error.message}`);
      return {
        ...claim,
        status: claim.statusSnapshot,
      };
    }
  }

  async getUserClaims(userId: string) {
    return this.prisma.residenceClaim.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async selectResidence(userId: string, residenceId: string) {
    const residence = await this.iamClient.findById(residenceId);

    await this.prisma.user.update({
      where: { id: userId },
      data: { residenceId },
    });

    this.logger.log(`User ${userId} selected residence: ${residenceId}`);

    return { residenceId, title: residence.title };
  }
}
