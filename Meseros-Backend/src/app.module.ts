import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './common/db/database.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { UsuariosModule } from './usuarios/usuarios.module';
import { MesasModule } from './mesas/mesas.module';
import { MeserosModule } from './meseros/meseros.module';
import { ProductosModule } from './productos/productos.module';
import { NominaModule } from './nomina/nomina.module';
import { FinanzasModule } from './finanzas/finanzas.module';
import { PedidosModule } from './pedidos/pedidos.module';
import { SolicitudModule } from './solicitud/solicitud.module';
import { GatewayModule } from './gateway/gateway.module';
import { PublicModule } from './public/public.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RestaurantesModule } from './restaurantes/restaurantes.module';
import { AlegraModule } from './alegra/alegra.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ProveedoresModule } from './proveedores/proveedores.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    AuthModule,
    DatabaseModule,
    GatewayModule,
    PublicModule,
    NotificationsModule,
    UsuariosModule,
    MesasModule,
    MeserosModule,
    ProductosModule,
    NominaModule,
    FinanzasModule,
    PedidosModule,
    SolicitudModule,
    RestaurantesModule,
    AlegraModule,
    ReviewsModule,
    ProveedoresModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
