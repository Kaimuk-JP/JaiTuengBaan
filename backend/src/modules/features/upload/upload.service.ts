import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';

@Injectable()
export class UploadService {
    private readonly uploadDir: string;
    private readonly ALLOWED_FOLDERS = [
        'profile-pictures', 'reward-images', 'appointment-images', 'general', 'return-evidence',
    ];

    private readonly MAX_FILE_SIZE = 15 * 1024 * 1024;
    private readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    constructor(private configService: ConfigService) {
        this.uploadDir = path.join(process.cwd(), 'uploads');

        this.ensureDirectories();
    }

    private ensureDirectories() {
        const dirs = [
            this.uploadDir,
            path.join(this.uploadDir, 'profile-pictures'),
            path.join(this.uploadDir, 'reward-images'),
            path.join(this.uploadDir, 'appointment-images'),
            path.join(this.uploadDir, 'general'),
        ];

        for (const dir of dirs) {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    }

        async uploadImage(file: any, folder: string = 'profile-pictures'): Promise<string> {
        try {
            await this.validateImageFile(file.buffer, file.mimetype);

            const folderName = this.sanitizeFolder(folder);
            const targetDir = path.join(this.uploadDir, folderName);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const isAppointmentImage = folderName === 'appointment-images';
            const isProfilePicture = folderName === 'profile-pictures';

            if (isAppointmentImage) {
                const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
                const filePath = path.join(targetDir, uniqueName);
                await sharp(file.buffer)
                    .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 85 })
                    .toFile(filePath);
                return `/uploads/${folderName}/${uniqueName}`;
            }

            const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;
            const filePath = path.join(targetDir, uniqueName);

            const sharpPipeline = sharp(file.buffer);

            if (isProfilePicture) {
                sharpPipeline.resize(500, 500, { fit: 'cover' });
            } else {
                sharpPipeline.resize(1200, 1200, { fit: 'inside', withoutEnlargement: true });
            }

            await sharpPipeline
                .webp({ quality: 80 })
                .toFile(filePath);

            return `/uploads/${folderName}/${uniqueName}`;
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('Upload image error:', error);
            throw new BadRequestException('ไม่สามารถอัพโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

        private getExtensionFromMime(mimetype: string): string {
        const map: Record<string, string> = {
            'image/jpeg': '.jpg',
            'image/png': '.png',
            'image/webp': '.webp',
            'image/gif': '.gif',
        };
        return map[mimetype] || '.jpg';
    }

        async uploadImageFromUrl(imageUrl: string, folder: string = 'profile-pictures'): Promise<string> {
        try {
            const parsed = new URL(imageUrl);
            if (!['http:', 'https:'].includes(parsed.protocol)) {
                throw new Error('อนุญาตเฉพาะ URL แบบ HTTP/HTTPS เท่านั้น');
            }
            const hostname = parsed.hostname;
            if (
                /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.)/.test(hostname) ||
                hostname === '::1' ||
                hostname === '[::1]' ||
                hostname.startsWith('::ffff:')
            ) {
                throw new Error('ไม่อนุญาตให้ใช้ URL ภายใน');
            }

            const response = await fetch(imageUrl);
            if (!response.ok) {
                throw new Error('ไม่สามารถดึงรูปภาพจากลิงก์ได้');
            }
            const buffer = Buffer.from(await response.arrayBuffer());

            await this.validateImageFile(buffer);

            const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.webp`;

            const folderName = this.sanitizeFolder(folder);
            const targetDir = path.join(this.uploadDir, folderName);

            if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
            }

            const filePath = path.join(targetDir, uniqueName);

            await sharp(buffer)
                .resize(500, 500, { fit: 'cover', position: 'attention' })
                .webp({ quality: 80 })
                .toFile(filePath);

            return `/uploads/${folderName}/${uniqueName}`;
        } catch (error) {
            throw new Error('ไม่สามารถอัพโหลดรูปภาพจากลิงก์ได้ กรุณาลองใหม่อีกครั้ง');
        }
    }

        async deleteImage(imageUrl: string): Promise<void> {
        try {
            let relativePath: string;
            if (imageUrl.startsWith('/')) {
                relativePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
            } else {
                const url = new URL(imageUrl);
                relativePath = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
            }
            const filePath = path.join(process.cwd(), relativePath);

            const resolved = path.resolve(filePath);
            if (!resolved.startsWith(path.resolve(this.uploadDir))) {
                throw new Error('เส้นทางไฟล์ไม่ถูกต้อง');
            }

            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting image from local storage:', error);
        }
    }

        sanitizeFolder(folder: string): string {
        const folderName = folder.includes('/') ? folder.split('/').pop()! : folder;
        if (!this.ALLOWED_FOLDERS.includes(folderName)) {
            throw new Error('Invalid upload folder');
        }
        return folderName;
    }

    private async validateImageFile(buffer: Buffer, declaredMimetype?: string): Promise<sharp.Metadata> {
        if (!buffer || buffer.length === 0) {
            throw new BadRequestException('ไม่พบไฟล์ที่อัพโหลด');
        }

        if (buffer.length > this.MAX_FILE_SIZE) {
            throw new BadRequestException(`ไฟล์ใหญ่เกินไป (สูงสุด ${this.MAX_FILE_SIZE / 1024 / 1024}MB)`);
        }

        if (declaredMimetype && !declaredMimetype.startsWith('image/')) {
            throw new BadRequestException('ประเภทไฟล์ไม่ถูกต้อง อนุญาตเฉพาะไฟล์รูปภาพ');
        }

        try {
            const metadata = await sharp(buffer).metadata();
            const allowedFormats = ['jpeg', 'png', 'webp', 'gif'];
            if (!metadata.format || !allowedFormats.includes(metadata.format)) {
                throw new BadRequestException('รูปแบบไฟล์รูปภาพไม่ถูกต้องหรือไฟล์เสียหาย');
            }
            return metadata;
        } catch (err) {
            if (err instanceof BadRequestException) {
                throw err;
            }
            throw new BadRequestException('ไฟล์ที่อัพโหลดไม่ใช่รูปภาพที่ถูกต้อง');
        }
    }
}
