import {
    Controller,
    Post,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    UseGuards,
    ParseFilePipe,
    MaxFileSizeValidator,
    FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_APPOINTMENT_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_FILE_TYPES = /^image\/(jpeg|png|webp|gif)$/;

@ApiTags('Upload')
@ApiBearerAuth('JWT-auth')
@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(private readonly uploadService: UploadService) { }

    @Post()
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'อัพโหลดไฟล์รูปภาพ' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพ (jpeg, png, webp, gif ขนาดไม่เกิน 10MB)' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'อัพโหลดสำเร็จ' })
    @ApiResponse({ status: 400, description: 'ไม่มีไฟล์ หรือประเภทไฟล์ไม่ถูกต้อง' })
    async uploadFile(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE, message: 'ไฟล์ใหญ่เกินไป (สูงสุด 10MB)' }),
                    new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
                ],
            }),
        ) file: any,
    ) {
        const url = await this.uploadService.uploadImage(file);
        return { url };
    }

    @Post('profile-picture')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'อัพโหลดรูปโปรไฟล์' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพโปรไฟล์ (jpeg, png, webp, gif ขนาดไม่เกิน 10MB)' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'อัพโหลดสำเร็จ' })
    @ApiResponse({ status: 400, description: 'ไม่มีไฟล์ หรือประเภทไฟล์ไม่ถูกต้อง' })
    async uploadProfilePicture(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE, message: 'ไฟล์ใหญ่เกินไป (สูงสุด 10MB)' }),
                    new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
                ],
            }),
        ) file: any,
    ) {
        const url = await this.uploadService.uploadImage(file, 'volunteer-smart/profile-pictures');
        return { url };
    }

    @Post('appointment-image')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'อัพโหลดรูปภาพใบนัดแพทย์' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพใบนัดแพทย์ (jpeg, png, webp, gif ขนาดไม่เกิน 15MB)' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'อัพโหลดสำเร็จ' })
    @ApiResponse({ status: 400, description: 'ไม่มีไฟล์ หรือประเภทไฟล์ไม่ถูกต้อง' })
    async uploadAppointmentImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_APPOINTMENT_FILE_SIZE, message: 'ไฟล์ใหญ่เกินไป (สูงสุด 15MB)' }),
                    new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
                ],
            }),
        ) file: any,
    ) {
        const url = await this.uploadService.uploadImage(file, 'appointment-images');
        return { url };
    }

    @Post('reward-image')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'อัพโหลดรูปภาพรางวัล' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพรางวัล (jpeg, png, webp, gif ขนาดไม่เกิน 10MB)' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'อัพโหลดสำเร็จ' })
    @ApiResponse({ status: 400, description: 'ไม่มีไฟล์ หรือประเภทไฟล์ไม่ถูกต้อง' })
    async uploadRewardImage(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE, message: 'ไฟล์ใหญ่เกินไป (สูงสุด 10MB)' }),
                    new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
                ],
            }),
        ) file: any,
    ) {
        const url = await this.uploadService.uploadImage(file, 'volunteer-smart/reward-images');
        return { url };
    }

    @Post('return-evidence')
    @UseInterceptors(FileInterceptor('file'))
    @ApiOperation({ summary: 'อัพโหลดรูปหลักฐานการส่งกลับถึงบ้าน' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary', description: 'ไฟล์รูปภาพหลักฐานการส่งกลับ (jpeg, png, webp, gif ขนาดไม่เกิน 10MB)' },
            },
        },
    })
    @ApiResponse({ status: 201, description: 'อัพโหลดสำเร็จ' })
    @ApiResponse({ status: 400, description: 'ไม่มีไฟล์ หรือประเภทไฟล์ไม่ถูกต้อง' })
    async uploadReturnEvidence(
        @UploadedFile(
            new ParseFilePipe({
                validators: [
                    new MaxFileSizeValidator({ maxSize: MAX_FILE_SIZE, message: 'ไฟล์ใหญ่เกินไป (สูงสุด 10MB)' }),
                    new FileTypeValidator({ fileType: ALLOWED_FILE_TYPES }),
                ],
            }),
        ) file: any,
    ) {
        const url = await this.uploadService.uploadImage(file, 'return-evidence');
        return { url };
    }
}
