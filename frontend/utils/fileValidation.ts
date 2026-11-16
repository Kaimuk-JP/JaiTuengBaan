
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

export function validateFileType(
  file: File,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES,
  allowedExtensions: string[] = ALLOWED_IMAGE_EXTENSIONS,
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    const typeList = allowedTypes.map(t => t.split('/')[1]?.toUpperCase()).join(', ');
    return {
      valid: false,
      error: `ประเภทไฟล์ไม่ถูกต้อง รองรับเฉพาะ: ${typeList}`,
    };
  }

  const extension = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    const extList = allowedExtensions.join(', ');
    return {
      valid: false,
      error: `นามสกุลไฟล์ไม่ถูกต้อง รองรับเฉพาะ: ${extList}`,
    };
  }

  return { valid: true };
}

export function validateFileSize(
  file: File,
  maxSize: number = DEFAULT_MAX_FILE_SIZE,
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `ไฟล์มีขนาดเกิน ${sizeMB} MB`,
    };
  }

  return { valid: true };
}

export function validateFile(
  file: File,
  options?: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  },
): { valid: boolean; error?: string } {
  const typeValidation = validateFileType(
    file,
    options?.allowedTypes,
    options?.allowedExtensions,
  );

  if (!typeValidation.valid) {
    return typeValidation;
  }

  return validateFileSize(file, options?.maxSize);
}
