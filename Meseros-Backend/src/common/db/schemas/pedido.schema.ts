import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PedidoDocument = HydratedDocument<Pedido>;

@Schema({
  collection: 'pedidos',
  timestamps: false,
})
export class Pedido {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  mesa_id!: number;

  @Prop({ type: Number, index: true, default: null })
  mesero_id?: number | null;

  @Prop({ required: true, index: true })
  restaurant_id!: number;

  @Prop({ required: true, index: true, default: () => new Date() })
  fecha_hora!: Date;

  @Prop({ required: true, index: true, default: 'en proceso' })
  estado!: string;

  @Prop({ default: 0 })
  total?: number;
}

export const PedidoSchema = SchemaFactory.createForClass(Pedido);
PedidoSchema.index({ restaurant_id: 1, estado: 1, fecha_hora: -1 });
