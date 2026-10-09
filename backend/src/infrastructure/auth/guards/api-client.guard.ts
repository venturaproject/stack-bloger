import { CanActivate, ExecutionContext, ForbiddenException, HttpException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Request } from 'express';
import { Repository } from 'typeorm';
import { ApiClientEntity } from '../../database/entities/api-client.entity';
import { API_SCOPES } from '../decorators/api-scopes.decorator';
import { API_CLIENT_JWT_AUDIENCE, API_CLIENT_JWT_ISSUER, API_CLIENT_JWT_SERVICE } from '../security/api-client-jwt.constants';

type ApiClientRequest = Request & { apiClient?: { id: string; scopes: string[] } };

@Injectable()
export class ApiClientGuard implements CanActivate {
  constructor(
    @Inject(API_CLIENT_JWT_SERVICE) private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    @InjectRepository(ApiClientEntity) private readonly clients: Repository<ApiClientEntity>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<ApiClientRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) throw new UnauthorizedException('Missing API bearer token');

    try {
      const payload = await this.jwtService.verifyAsync<{ typ: string; sub: string; scopes: string[] }>(authorization.slice(7), {
        algorithms: ['HS256'],
        issuer: API_CLIENT_JWT_ISSUER,
        audience: API_CLIENT_JWT_AUDIENCE,
      });
      if (payload.typ !== 'api_client' || !payload.sub || !Array.isArray(payload.scopes)) throw new Error('Invalid API client token');
      const client = await this.clients.findOneBy({ id: payload.sub, active: true });
      if (!client) throw new Error('API client is inactive');
      if (!payload.scopes.every((scope) => client.scopes.includes(scope))) {
        throw new ForbiddenException('API client token contains revoked scopes');
      }
      const required = this.reflector.getAllAndOverride<string[]>(API_SCOPES, [context.getHandler(), context.getClass()]) ?? [];
      if (required.some((scope) => !client.scopes.includes(scope))) {
        throw new ForbiddenException('API client lacks the required scope');
      }
      request.apiClient = { id: client.id, scopes: client.scopes };
      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new UnauthorizedException('Invalid or expired API bearer token');
    }
  }
}
