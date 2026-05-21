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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsuariosModule,
    MesasModule,
    MeserosModule,
    ProductosModule,
    NominaModule,
    FinanzasModule,
    PedidosModule,
    SolicitudModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ResolveTenantMiddleware).forRoutes('*');
  }
}


