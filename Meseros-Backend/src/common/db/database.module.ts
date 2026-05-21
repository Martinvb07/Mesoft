import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdService } from './id.service';
import { Counter, CounterSchema } from './schemas/counter.schema';
import { DetallePedido, DetallePedidoSchema } from './schemas/detallepedido.schema';
import { Mesa, MesaSchema } from './schemas/mesa.schema';
import { Mesero, MeseroSchema } from './schemas/mesero.schema';
import { MovimientoContable, MovimientoContableSchema } from './schemas/movimiento.schema';
import { NominaMovimiento, NominaMovimientoSchema } from './schemas/nomina-movimiento.schema';
import { Pedido, PedidoSchema } from './schemas/pedido.schema';
import { Producto, ProductoSchema } from './schemas/producto.schema';
import { Restaurante, RestauranteSchema } from './schemas/restaurante.schema';
import { Usuario, UsuarioSchema } from './schemas/usuario.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/mesoft'),
    MongooseModule.forFeature([
      { name: Counter.name, schema: CounterSchema },
      { name: Restaurante.name, schema: RestauranteSchema },
      { name: Usuario.name, schema: UsuarioSchema },
      { name: Mesero.name, schema: MeseroSchema },
      { name: Mesa.name, schema: MesaSchema },
      { name: Producto.name, schema: ProductoSchema },
      { name: Pedido.name, schema: PedidoSchema },
      { name: DetallePedido.name, schema: DetallePedidoSchema },
      { name: MovimientoContable.name, schema: MovimientoContableSchema },
      { name: NominaMovimiento.name, schema: NominaMovimientoSchema },
    ]),
  ],
  providers: [IdService],
  exports: [MongooseModule, IdService],
})
export class DatabaseModule {}
