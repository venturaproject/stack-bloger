import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

/**
 * `@nestjs/passport@12` refactorizó `AuthGuard(...)`: el guard generado ahora
 * inyecta `AuthModuleOptions`, que solo existe donde se importa `PassportModule`.
 * Como `JwtAuthGuard` se usa en muchos módulos de feature (post, user, tag, …)
 * que no importan `AuthModule`, exponemos `PassportModule` de forma global.
 */
@Global()
@Module({
  imports: [PassportModule.register({ session: false })],
  exports: [PassportModule],
})
export class PassportGlobalModule {}
