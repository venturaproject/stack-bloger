import { Body, Controller, Delete, Get, Headers, Inject, Post, Param, BadRequestException, NotFoundException, UnauthorizedException, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { randomBytes, randomUUID } from 'crypto';
import { compare, hash } from 'bcryptjs';
import { Throttle } from '@nestjs/throttler';
import { ApiClientEntity } from '../database/entities/api-client.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { UserEntity } from '../../domain/user/entities/user.entity';
import { API_CLIENT_JWT_AUDIENCE, API_CLIENT_JWT_ISSUER, API_CLIENT_JWT_SERVICE } from '../../shared/security/api-client-jwt.constants';

export const AVAILABLE_API_SCOPES = ['posts:read', 'categories:read', 'tags:read'];

@Controller('api/v1/api-clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ApiClientsController {
  constructor(@InjectRepository(ApiClientEntity) private readonly clients: Repository<ApiClientEntity>) {}

  @Get()
  async list() {
    const clients = await this.clients.find({ order: { createdAt: 'DESC' } });
    return clients.map(({ id, name, clientId, scopes, active, lastUsedAt, createdAt }) => ({
      id, name, client_id: clientId, scopes, active,
      last_used_at: lastUsedAt?.toISOString() ?? null,
      created_at: createdAt.toISOString(),
    }));
  }

  @Post()
  async create(@Body() body: { name?: string; scopes?: string[] }, @CurrentUser() user: UserEntity) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const scopes = Array.isArray(body?.scopes) ? body.scopes : [];
    if (!name || name.length > 120) throw new BadRequestException('Client name is required (max 120 characters)');
    if (!scopes.length || scopes.some((scope) => !AVAILABLE_API_SCOPES.includes(scope))) {
      throw new BadRequestException('Select valid API scopes');
    }

    const secret = randomBytes(40).toString('base64url');
    const client = await this.clients.save(this.clients.create({
      clientId: `blog_${randomUUID().replaceAll('-', '')}`,
      name,
      secretHash: await hash(secret, 12),
      scopes,
      createdBy: user.id,
    }));

    return { client: { id: client.id, name: client.name, client_id: client.clientId, scopes: client.scopes, active: client.active, last_used_at: null, created_at: client.createdAt.toISOString() }, secret };
  }

  @Delete(':id')
  async revoke(@Param('id') id: string) {
    const client = await this.clients.findOneBy({ id });
    if (!client) throw new NotFoundException('API client not found');
    client.active = false;
    await this.clients.save(client);
    return { success: true };
  }
}

@Controller('api/v1/oauth')
export class ApiClientTokenController {
  constructor(
    @InjectRepository(ApiClientEntity) private readonly clients: Repository<ApiClientEntity>,
    @Inject(API_CLIENT_JWT_SERVICE) private readonly jwtService: JwtService,
  ) {}

  @Post('token')
  @Throttle({ long: { ttl: 60000, limit: 10 } })
  async issueToken(
    @Body() body: { grant_type?: string; client_id?: string; client_secret?: string },
    @Headers('authorization') authorization: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Pragma', 'no-cache');
    if (body?.grant_type !== 'client_credentials') {
      throw new BadRequestException({ error: 'unsupported_grant_type', error_description: 'grant_type must be client_credentials' });
    }
    const basicCredentials = this.parseBasicCredentials(authorization);
    const clientId = basicCredentials?.clientId ?? body?.client_id;
    const clientSecret = basicCredentials?.clientSecret ?? body?.client_secret;
    const client = clientId ? await this.clients.findOneBy({ clientId, active: true }) : null;
    if (!client || !clientSecret || !(await compare(clientSecret, client.secretHash))) {
      response.setHeader('WWW-Authenticate', 'Basic realm="blog-api"');
      throw new UnauthorizedException({ error: 'invalid_client', error_description: 'Invalid client credentials' });
    }

    client.lastUsedAt = new Date();
    await this.clients.save(client);
    const accessToken = await this.jwtService.signAsync(
      { typ: 'api_client', scopes: client.scopes },
      { subject: client.id, expiresIn: 900, issuer: API_CLIENT_JWT_ISSUER, audience: API_CLIENT_JWT_AUDIENCE, algorithm: 'HS256' },
    );
    return { access_token: accessToken, token_type: 'Bearer', expires_in: 900, scope: client.scopes.join(' ') };
  }

  private parseBasicCredentials(authorization?: string) {
    if (!authorization) return null;
    const match = authorization.match(/^Basic\s+([A-Za-z0-9+/]+=*)$/i);
    if (!match) return null;
    try {
      const decoded = Buffer.from(match[1], 'base64').toString('utf8');
      const separator = decoded.indexOf(':');
      if (separator < 1) return null;
      return {
        clientId: decodeURIComponent(decoded.slice(0, separator)),
        clientSecret: decodeURIComponent(decoded.slice(separator + 1)),
      };
    } catch {
      return null;
    }
  }
}
