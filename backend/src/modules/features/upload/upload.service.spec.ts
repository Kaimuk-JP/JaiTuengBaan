import { UploadService } from './upload.service';
import { ConfigService } from '@nestjs/config';

describe('UploadService – sanitizeFolder()', () => {
    let service: UploadService;

    beforeAll(() => {
        const configStub = {
            get: (key: string) => {
                if (key === 'PORT') return '3001';
                if (key === 'NEXT_PUBLIC_API_URL') return 'http://localhost:3001';
                return undefined;
            },
        } as unknown as ConfigService;

        jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
        jest.spyOn(require('fs'), 'mkdirSync').mockReturnValue(undefined);

        service = new UploadService(configStub);
    });

    afterAll(() => {
        jest.restoreAllMocks();
    });

    it('should accept "profile-pictures"', () => {
        expect(service.sanitizeFolder('profile-pictures')).toBe('profile-pictures');
    });

    it('should accept "reward-images"', () => {
        expect(service.sanitizeFolder('reward-images')).toBe('reward-images');
    });

    it('should accept "appointment-images"', () => {
        expect(service.sanitizeFolder('appointment-images')).toBe('appointment-images');
    });

    it('should accept "general"', () => {
        expect(service.sanitizeFolder('general')).toBe('general');
    });

    it('should extract folder name from path like "volunteer-smart/profile-pictures"', () => {
        expect(service.sanitizeFolder('volunteer-smart/profile-pictures')).toBe('profile-pictures');
    });

    it('should reject "../../etc"', () => {
        expect(() => service.sanitizeFolder('../../etc')).toThrow('Invalid upload folder');
    });

    it('should reject "foo/../../etc"', () => {
        expect(() => service.sanitizeFolder('foo/../../etc')).toThrow('Invalid upload folder');
    });

    it('should reject empty string', () => {
        expect(() => service.sanitizeFolder('')).toThrow('Invalid upload folder');
    });

    it('should reject arbitrary folder names', () => {
        expect(() => service.sanitizeFolder('secrets')).toThrow('Invalid upload folder');
    });

    it('should reject ".."', () => {
        expect(() => service.sanitizeFolder('..')).toThrow('Invalid upload folder');
    });
});
