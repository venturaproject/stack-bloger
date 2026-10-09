import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { randomUUID } from 'crypto';
import { readFileSync, unlinkSync } from 'fs';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

// Image magic bytes signatures
const IMAGE_SIGNATURES: Array<{ mime: string; bytes: number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png',  bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif',  bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46], offset: 0 },
  { mime: 'image/bmp',  bytes: [0x42, 0x4D] },
  { mime: 'image/tiff', bytes: [0x49, 0x49, 0x2A, 0x00] },
  { mime: 'image/tiff', bytes: [0x4D, 0x4D, 0x00, 0x2A] },
];

function validateImageBytes(filepath: string): boolean {
  const buf = readFileSync(filepath);
  return IMAGE_SIGNATURES.some(({ bytes, offset = 0 }) =>
    bytes.every((b, i) => buf[offset + i] === b)
  );
}

@Controller('api/v1/uploads')
@UseGuards(JwtAuthGuard)
@Throttle({ long: { ttl: 3600000, limit: 20 } })
export class UploadController {
  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'uploads'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname).toLowerCase();
          cb(null, `${randomUUID()}${ext}`);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    if (!validateImageBytes(file.path)) {
      unlinkSync(file.path);
      throw new BadRequestException('Invalid image file');
    }

    return { url: `/api/uploads/${file.filename}` };
  }
}
