import {
  Controller,
  BadRequestException,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, join } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { UserSettingsEntity } from '../database/entities/user-settings.entity';
import { buildProtectedAvatarUrl } from '../user/avatar-url';

interface UploadedFileInfo {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const AVATAR_TYPES: Array<{ mime: string; extension: string; bytes: number[] }> = [
  { mime: 'image/jpeg', extension: '.jpg', bytes: [0xFF, 0xD8, 0xFF] },
  { mime: 'image/png', extension: '.png', bytes: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A] },
  { mime: 'image/gif', extension: '.gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', extension: '.webp', bytes: [0x52, 0x49, 0x46, 0x46] },
];

function avatarType(buffer: Buffer) {
  return AVATAR_TYPES.find(({ bytes }) => bytes.every((byte, index) => buffer[index] === byte));
}

@Controller('api/v1/settings')
@UseGuards(JwtAuthGuard)
export class SettingsApiController {
  private readonly avatarDir = join(process.cwd(), 'storage', 'avatars');
  private readonly legacyAvatarDir = join(process.cwd(), 'public', 'avatars');

  constructor(
    @InjectRepository(UserSettingsEntity)
    private readonly settingsRepo: Repository<UserSettingsEntity>,
  ) {}

  @Get()
  async getSettings(@CurrentUser() user: UserEntity) {
    const settings = await this.getOrCreateSettings(user.id);
    if (!settings.id) await this.settingsRepo.save(settings);
    return {
      data: {
        notificationType: settings.notificationType ?? 'all',
        theme: settings.theme ?? 'system',
        font: settings.font,
        communicationEmails: settings.communicationEmails,
        securityEmails: settings.securityEmails,
        mobileNotifications: settings.mobileNotifications,
        displayItems: settings.displayItems ?? ['recents', 'home'],
      },
    };
  }

  @Get('avatar/:filename')
  async showAvatar(@Param('filename') filename: string, @Res() res: Response) {
    const safeFilename = basename(filename);

    if (safeFilename !== filename) {
      throw new NotFoundException();
    }

    const candidates = [
      join(this.avatarDir, safeFilename),
      join(this.legacyAvatarDir, safeFilename),
    ];

    const filePath = candidates.find((candidate) => existsSync(candidate));
    if (!filePath) {
      throw new NotFoundException();
    }

    return res.sendFile(filePath);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('avatar', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async uploadAvatar(
    @UploadedFile() file: UploadedFileInfo,
    @CurrentUser() user: UserEntity,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const type = avatarType(file.buffer);
    if (!type || file.mimetype !== type.mime) {
      throw new BadRequestException('Invalid image file');
    }

    mkdirSync(this.avatarDir, { recursive: true });

    // Delete any existing avatar for this user (handles extension changes)
    this.deleteExistingAvatars(user.id, this.avatarDir);
    this.deleteExistingAvatars(user.id, this.legacyAvatarDir);

    const filename = `avatar-${user.id}${type.extension}`;
    writeFileSync(join(this.avatarDir, filename), file.buffer);

    const avatarUrl = buildProtectedAvatarUrl(filename);

    let settings = await this.settingsRepo.findOne({ where: { userId: user.id } });
    if (!settings) {
      settings = this.settingsRepo.create({ userId: user.id });
    }
    settings.avatar = avatarUrl;
    await this.settingsRepo.save(settings);

    return { avatar: avatarUrl };
  }

  @Put('appearance')
  async updateAppearance(
    @Body() body: { theme?: string; font?: string },
    @CurrentUser() user: UserEntity,
  ) {
    if (body.theme && !['light', 'dark', 'system'].includes(body.theme)) {
      throw new BadRequestException('Invalid theme');
    }
    let settings = await this.settingsRepo.findOne({ where: { userId: user.id } });
    if (!settings) settings = this.settingsRepo.create({ userId: user.id });
    if (body.theme) settings.theme = body.theme;
    if (body.font) settings.font = body.font;
    await this.settingsRepo.save(settings);
    return { success: true };
  }

  @Put('notifications')
  async updateNotifications(
    @Body() body: { type?: 'all' | 'mentions' | 'none'; communication_emails?: boolean; security_emails?: boolean; mobile_notifications?: boolean },
    @CurrentUser() user: UserEntity,
  ) {
    if (body.type && !['all', 'mentions', 'none'].includes(body.type)) {
      throw new BadRequestException('Invalid notification type');
    }
    const settings = await this.getOrCreateSettings(user.id);
    if (body.type !== undefined) settings.notificationType = body.type;
    if (body.communication_emails !== undefined) settings.communicationEmails = body.communication_emails;
    if (body.security_emails !== undefined) settings.securityEmails = body.security_emails;
    if (body.mobile_notifications !== undefined) settings.mobileNotifications = body.mobile_notifications;
    await this.settingsRepo.save(settings);
    return { success: true };
  }

  @Put('display')
  async updateDisplay(@Body() body: { items?: string[] }, @CurrentUser() user: UserEntity) {
    const allowedItems = new Set(['recents', 'home', 'applications', 'desktop', 'downloads', 'documents']);
    if (!body.items?.length || body.items.some((item) => !allowedItems.has(item))) {
      throw new BadRequestException('Invalid display items');
    }
    const settings = await this.getOrCreateSettings(user.id);
    settings.displayItems = body.items;
    await this.settingsRepo.save(settings);
    return { success: true };
  }

  private async getOrCreateSettings(userId: number) {
    const settings = await this.settingsRepo.findOne({ where: { userId } });
    return settings ?? this.settingsRepo.create({ userId });
  }

  private deleteExistingAvatars(userId: number, dir: string) {
    try {
      const prefix = `avatar-${userId}.`;
      readdirSync(dir)
        .filter((file) => file.startsWith(prefix))
        .forEach((file) => unlinkSync(join(dir, file)));
    } catch {}
  }
}
