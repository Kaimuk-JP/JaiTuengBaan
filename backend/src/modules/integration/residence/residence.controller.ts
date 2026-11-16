import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Req,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResidenceService } from './residence.service';
import { SearchResidenceDto } from './dto/search-residence.dto';
import { CreateResidenceClaimDto } from './dto/create-residence-claim.dto';

@Controller('residences')
@UseGuards(JwtAuthGuard)
export class ResidenceController {
  constructor(private readonly residenceService: ResidenceService) {}

  @Get('search')
  async search(@Req() req: any, @Query() query: SearchResidenceDto) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const q = { ...query } as any;
    if (req.user?.organizationId) {
      q.municipalityId = req.user.organizationId;
    }
    return this.residenceService.search(userId, q);
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.residenceService.findById(id);
  }

  @Post('select')
  async selectResidence(
    @Req() req: any,
    @Body('residenceId') residenceId: string,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.residenceService.selectResidence(userId, residenceId);
  }
}

@Controller('residence-claims')
@UseGuards(JwtAuthGuard)
export class ResidenceClaimController {
  constructor(private readonly residenceService: ResidenceService) {}

  @Post()
  async submitClaim(
    @Req() req: any,
    @Body() dto: CreateResidenceClaimDto,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    const iamUserId = req.user?.iamUserId || req.user?.iam_user_id || userId;
    const municipalityId = req.user?.organizationId || '';
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.residenceService.submitClaim(userId, iamUserId, municipalityId, dto);
  }

  @Post(':id/evidence')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/webp',
        ];
        if (allowed.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('ไฟล์ต้องเป็น PDF, JPEG, PNG หรือ WEBP เท่านั้น'), false);
        }
      },
    }),
  )
  async uploadEvidence(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('กรุณาแนบไฟล์เอกสาร');
    }
    return this.residenceService.uploadEvidence(id, file);
  }

  @Get(':id')
  async getClaimStatus(@Param('id', ParseIntPipe) id: number) {
    return this.residenceService.getClaimStatus(id);
  }

  @Get()
  async listMyClaims(@Req() req: any) {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) throw new BadRequestException('User not authenticated');
    return this.residenceService.getUserClaims(userId);
  }
}
