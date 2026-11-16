import { Module } from '@nestjs/common';
import { DiseaseController } from './disease.controller';
import { DiseaseService } from './disease.service';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [DiseaseController],
    providers: [DiseaseService],
    exports: [DiseaseService],
})
export class DiseaseModule { }
