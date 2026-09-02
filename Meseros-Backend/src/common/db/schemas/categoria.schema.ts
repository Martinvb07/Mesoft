import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoriaDocument = HydratedDocument<Categoria>;

@Schema({ collection: 'categorias', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Categoria {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, trim: true })
  nombre!: string;

  /* Orden en que se muestran en el POS del mesero */
  @Prop({ type: Number, default: 0 })
  orden?: number;

  /* Clave de color de la paleta del panel (no un hex: el front la mapea) */
  @Prop({ type: String, default: 'slate' })
  color?: string;

  /* Ruta o URL de la imagen que se ve en el POS. Las locales viven en
     /public/categorias del frontend y se referencian como /categorias/x.jpg */
  @Prop({ type: String, default: null })
  imagen?: string | null;

  /* Una categoría inactiva no aparece en el POS, pero no borra sus productos */
  @Prop({ type: Boolean, default: true })
  activa?: boolean;

  @Prop({ required: true, index: true })
  restaurant_id!: number;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const CategoriaSchema = SchemaFactory.createForClass(Categoria);
CategoriaSchema.index({ restaurant_id: 1, nombre: 1 }, { unique: true });
CategoriaSchema.index({ restaurant_id: 1, orden: 1 });
