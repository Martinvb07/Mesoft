import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RestauranteDocument = HydratedDocument<Restaurante>;

@Schema({
  collection: 'restaurantes',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Restaurante {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, unique: true, trim: true, index: true })
  nombre!: string;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const RestauranteSchema = SchemaFactory.createForClass(Restaurante);
RestauranteSchema.index({ id: 1 }, { unique: true });
RestauranteSchema.index({ nombre: 1 }, { unique: true });
