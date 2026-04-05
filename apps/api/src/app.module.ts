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
import { OrdersModule } from '@/modules/orders/orders.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { LogisticsModule } from '@/modules/logistics/logistics.module';
import { MessagingModule } from '@/modules/messaging/messaging.module';
import { ReviewsModule } from '@/modules/reviews/reviews.module';
import { AdminModule } from '@/modules/admin/admin.module';

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
    OrdersModule,
    PaymentsModule,
    LogisticsModule,
    MessagingModule,
    ReviewsModule,
    AdminModule,
  ],
})
export class AppModule {}
