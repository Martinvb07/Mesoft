import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { DatabaseModule } from './common/db/database.module';
import { ResolveTenantMiddleware } from './common/middleware/resolve-tenant.middleware';
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
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ResolveTenantMiddleware).forRoutes('*');
  }
}


