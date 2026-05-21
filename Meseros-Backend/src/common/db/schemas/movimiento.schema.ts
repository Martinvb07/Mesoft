import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MovimientoContableDocument = HydratedDocument<MovimientoContable>;

@Schema({
  collection: 'movimientoscontables',
  timestamps: false,
})
export class MovimientoContable {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true, default: () => new Date() })
  fecha!: Date;

  @Prop({ required: true, index: true })
  tipo!: 'ingreso' | 'egreso' | string;

  @Prop({ type: String, index: true, default: null })
  categoria?: string | null;

  @Prop({ required: true })
  monto!: number;

  @Prop({ type: String, default: null })
  descripcion?: string | null;

  @Prop({ type: Number, index: true, default: null })
  mesa_id?: number | null;

  @Prop({ type: Number, index: true, default: null })
  pedido_id?: number | null;

  @Prop({ type: Number, index: true, default: null })
  usuario_id?: number | null;

  @Prop({ required: true, index: true })
  restaurant_id!: number;
}

export const MovimientoContableSchema = SchemaFactory.createForClass(MovimientoContable);
MovimientoContableSchema.index({ restaurant_id: 1, tipo: 1, fecha: -1 });
MovimientoContableSchema.index({ pedido_id: 1, tipo: 1, categoria: 1, fecha: -1 });
