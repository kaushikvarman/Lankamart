import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from '@/common/prisma/prisma.module';
import configuration, { AppConfig } from '@/config/configuration';
import { validate } from '@/config/env.validation';
import { AuthModule } from '@/modules/auth/auth.module';
import { UsersModule } from '@/modules/users/users.module';
import { VendorsModule } from '@/modules/vendors/vendors.module';
import { CategoriesModule } from '@/modules/categories/categories.module';
import { ProductsModule } from '@/modules/products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate,
    }),

    PrismaModule,

    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => [
        {
          ttl: configService.get('throttle.ttl', { infer: true }),
          limit: configService.get('throttle.limit', { infer: true }),
        },
      ],
    }),

    AuthModule,
    UsersModule,
    VendorsModule,
    CategoriesModule,
    ProductsModule,
  ],
})
export class AppModule {}
