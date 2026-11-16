import { Module } from '@nestjs/common';
import { ResidenceController, ResidenceClaimController } from './residence.controller';
import { ResidenceService } from './residence.service';
import { IamGovResidenceClient } from './iam-gov-residence.client';
import { ConfigModule } from '../../../core/config';

@Module({
  imports: [ConfigModule],
  controllers: [ResidenceController, ResidenceClaimController],
  providers: [ResidenceService, IamGovResidenceClient],
  exports: [ResidenceService],
})
export class ResidenceModule {}
