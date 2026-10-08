import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserModule } from './infrastructure/user/user.module';
import { AuthModule } from './infrastructure/auth/auth.module';
import { PassportGlobalModule } from './infrastructure/auth/passport-global.module';
import { WebAuthMiddleware } from './infrastructure/auth/web-auth.middleware';
import { WebModule } from './infrastructure/web/web.module';
import { PostModule } from './infrastructure/post/post.module';
import { CategoryModule } from './infrastructure/category/category.module';
import { TagModule } from './infrastructure/tag/tag.module';
import { UploadModule } from './infrastructure/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000,  limit: 10 },  // 10 req/min (login, upload)
      { name: 'long',  ttl: 60000,  limit: 100 }, // 100 req/min (general API)
    ]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_DATABASE', 'blog'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/infrastructure/database/migrations/*{.ts,.js}'],
        synchronize: config.get('NODE_ENV') !== 'production',
        logging: config.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    PassportGlobalModule,
    AuthModule,
    UserModule,
    WebModule,
    PostModule,
    CategoryModule,
    TagModule,
    UploadModule,
  ],
  providers: [WebAuthMiddleware],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WebAuthMiddleware).forRoutes('*');
  }
}
