import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MesaDocument = HydratedDocument<Mesa>;

@Schema({
  collection: 'mesas',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Mesa {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true })
  numero!: number;

  @Prop({ default: 4 })
  capacidad?: number;

  @Prop({ default: 'libre', index: true })
  estado?: string;

  @Prop({ required: true, index: true })
  restaurant_id!: number;

  @Prop({ type: Number, index: true, default: null })
  mesero_id?: number | null;

  @Prop({ type: Date, default: null })
  reserva_at?: Date | null;

  @Prop({ type: String, default: null })
  reservado_por?: string | null;

  @Prop({ type: String, default: null })
  telefono_reserva?: string | null;

  @Prop({ type: String, default: null })
  categoria?: string | null;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const MesaSchema = SchemaFactory.createForClass(Mesa);
MesaSchema.index({ restaurant_id: 1, numero: 1 }, { unique: true });
