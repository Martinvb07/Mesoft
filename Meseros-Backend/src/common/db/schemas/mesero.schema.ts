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

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const MeseroSchema = SchemaFactory.createForClass(Mesero);
MeseroSchema.index({ id: 1 }, { unique: true });
MeseroSchema.index({ restaurant_id: 1, nombre: 1 });
