import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NominaMovimientoDocument = HydratedDocument<NominaMovimiento>;

@Schema({
  collection: 'nomina_movimientos',
  timestamps: false,
})
export class NominaMovimiento {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  mesero_id!: number;

  @Prop({ required: true, index: true })
  tipo!: string;

  @Prop({ required: true })
  monto!: number;

  @Prop({ type: String, default: null })
  descripcion?: string | null;

  @Prop({ required: true, index: true, default: () => new Date() })
  fecha!: Date;

  @Prop({ required: true, index: true })
  restaurant_id!: number;
}

export const NominaMovimientoSchema = SchemaFactory.createForClass(NominaMovimiento);
NominaMovimientoSchema.index({ id: 1 }, { unique: true });
NominaMovimientoSchema.index({ restaurant_id: 1, mesero_id: 1, fecha: 1 });
