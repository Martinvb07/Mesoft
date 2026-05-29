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

  @Prop({ default: null })
  nota?: string | null;
}

export const DetallePedidoSchema = SchemaFactory.createForClass(DetallePedido);
DetallePedidoSchema.index({ pedido_id: 1, id: 1 });
