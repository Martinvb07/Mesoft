import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DetallePedidoDocument = HydratedDocument<DetallePedido>;

@Schema({
  collection: 'detallepedido',
  timestamps: false,
})
export class DetallePedido {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  pedido_id!: number;

  @Prop({ required: true, index: true })
  producto_id!: number;

  @Prop({ required: true })
  cantidad!: number;

  @Prop({ required: true })
  subtotal!: number;

  @Prop({ type: String, default: null })
  nota?: string | null;

  @Prop({ type: Boolean, default: false })
  listo?: boolean;

  /* Momento en que cocina lo marcó listo: sirve para mostrarle al mesero
     cuánto lleva esperando el plato en la barra. */
  @Prop({ type: Date, default: null })
  listo_at?: Date | null;

  /* El mesero ya lo recogió. Sin esto, un aviso perdido se perdía para
     siempre: no había forma de saber qué seguía pendiente. */
  @Prop({ type: Boolean, default: false })
  entregado?: boolean;
}

export const DetallePedidoSchema = SchemaFactory.createForClass(DetallePedido);
DetallePedidoSchema.index({ pedido_id: 1, id: 1 });
DetallePedidoSchema.index({ listo: 1, entregado: 1 });
