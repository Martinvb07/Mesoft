import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MeseroDocument = HydratedDocument<Mesero>;

@Schema({
  collection: 'meseros',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Mesero {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ type: Number, index: true, default: null })
  usuario_id?: number | null;

  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ default: 'activo' })
  estado?: string;

  @Prop({ type: Number, default: 0 })
  sueldo_base?: number | null;

  @Prop({ required: true, index: true })
  restaurant_id!: number;

  @Prop({ type: Date, default: null })
  turno_inicio?: Date | null;

  @Prop({ type: Boolean, default: false })
  esta_en_turno?: boolean;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const MeseroSchema = SchemaFactory.createForClass(Mesero);
MeseroSchema.index({ restaurant_id: 1, nombre: 1 });
