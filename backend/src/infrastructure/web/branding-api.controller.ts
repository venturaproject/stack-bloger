import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';

const VARIANTS = ['fullLight', 'fullDark', 'compactLight', 'compactDark', 'favicon'] as const;
type BrandingVariant = (typeof VARIANTS)[number];
type BrandingConfig = Partial<Record<BrandingVariant, string>> & { brandName?: string };

const IMAGE_TYPES = [
  { mime: 'image/jpeg', extension: '.jpg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', extension: '.png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif', extension: '.gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/x-icon', extension: '.ico', bytes: [0x00, 0x00, 0x01, 0x00] },
] as const;

function detectImage(buffer: Buffer): { mime: string; extension: string } | null {
  const standardImage = IMAGE_TYPES.find(({ bytes }) => bytes.every((byte, index) => buffer[index] === byte));
  if (standardImage) return standardImage;

  const isWebp = buffer.subarray(0, 4).toString('ascii') === 'RIFF'
    && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  return isWebp ? { mime: 'image/webp', extension: '.webp' } : null;
}

@Controller('api/v1/branding')
export class BrandingApiController {
  private readonly brandingDir = join(process.cwd(), 'public', 'branding');
  private readonly configPath = join(this.brandingDir, 'config.json');

  @Get()
  getConfig(): BrandingConfig {
    return this.readConfig();
  }

  @Post(':variant')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('logo', {
    storage: memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  uploadLogo(
    @Param('variant') variant: string,
    @UploadedFile() file?: Express.Multer.File,
  ): BrandingConfig {
    if (!this.isVariant(variant)) throw new BadRequestException('Invalid logo variant');
    if (!file) throw new BadRequestException('No logo uploaded');

    const image = detectImage(file.buffer);
    const isIco = image?.extension === '.ico' && file.mimetype === 'image/vnd.microsoft.icon';
    if (!image || (file.mimetype !== image.mime && !isIco)) {
      throw new BadRequestException('Sube una imagen PNG, JPEG, GIF, WebP o ICO válida');
    }

    mkdirSync(this.brandingDir, { recursive: true });
    const config = this.readConfig();
    const filename = `${variant}-${randomUUID()}${image.extension}`;
    const filePath = join(this.brandingDir, filename);

    writeFileSync(filePath, file.buffer, { flag: 'wx' });
    try {
      const updatedConfig = { ...config, [variant]: `/branding/${filename}` };
      this.writeConfig(updatedConfig);
      this.deleteConfiguredFile(config[variant]);
      return updatedConfig;
    } catch (error) {
      unlinkSync(filePath);
      throw error;
    }
  }

  @Put('name')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  updateName(@Body() body: { brandName?: string }): BrandingConfig {
    const brandName = body.brandName?.trim();
    if (!brandName || brandName.length > 80) {
      throw new BadRequestException('El nombre de marca debe tener entre 1 y 80 caracteres');
    }

    const updatedConfig = { ...this.readConfig(), brandName };
    this.writeConfig(updatedConfig);
    return updatedConfig;
  }

  private isVariant(value: string): value is BrandingVariant {
    return (VARIANTS as readonly string[]).includes(value);
  }

  private readConfig(): BrandingConfig {
    if (!existsSync(this.configPath)) return {};
    try {
      const config = JSON.parse(readFileSync(this.configPath, 'utf8')) as unknown;
      if (!config || typeof config !== 'object' || Array.isArray(config)) return {};
      const logos = Object.fromEntries(
        VARIANTS.flatMap((variant) => {
          const value = (config as Record<string, unknown>)[variant];
          return typeof value === 'string' && /^\/branding\/[a-z]+-[a-f0-9-]+\.(ico|jpg|png|gif|webp)$/.test(value)
            ? [[variant, value]]
            : [];
        }),
      ) as BrandingConfig;
      const brandName = (config as Record<string, unknown>).brandName;
      return typeof brandName === 'string' && brandName.trim().length > 0 && brandName.length <= 80
        ? { ...logos, brandName: brandName.trim() }
        : logos;
    } catch {
      return {};
    }
  }

  private writeConfig(config: BrandingConfig) {
    const temporaryPath = `${this.configPath}.${randomUUID()}.tmp`;
    writeFileSync(temporaryPath, JSON.stringify(config));
    renameSync(temporaryPath, this.configPath);
  }

  private deleteConfiguredFile(url?: string) {
    if (!url) return;
    const filename = url.replace('/branding/', '');
    const filePath = join(this.brandingDir, filename);
    if (existsSync(filePath)) unlinkSync(filePath);
  }
}
