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

  // Pagos
  @Prop({ type: String, default: null })
  wompi_public_key?: string | null;

  @Prop({ type: String, default: null })
  bold_api_key?: string | null;

  // DIAN / Alegra (multi-tenant)
  @Prop({ type: String, default: null })
  alegra_api_key?: string | null;

  @Prop({ type: String, default: null })
  alegra_email?: string | null;

  @Prop({ type: String, default: null })
  alegra_id_empresa?: string | null;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const RestauranteSchema = SchemaFactory.createForClass(Restaurante);
