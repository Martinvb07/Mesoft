import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductoDocument = HydratedDocument<Producto>;

@Schema({
  collection: 'productos',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Producto {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, trim: true })
  sku!: string;

  @Prop({ required: true, trim: true, index: true })
  nombre!: string;

  @Prop({ default: '' })
  categoria?: string;

  @Prop({ default: 0 })
  costo?: number;

  @Prop({ default: 0 })
  precio?: number;

  @Prop({ default: 0 })
  stock?: number;

  @Prop({ default: 0 })
  min_stock?: number;

  @Prop({ default: true })
  activo?: boolean;

  @Prop({ default: '' })
  descripcion?: string;

  @Prop({ type: String, default: null })
  imagen?: string | null;

  @Prop({
    type: [
      {
        nombre: { type: String, required: true },
        cantidad: { type: Number, default: 0 },
        unidad: { type: String, default: '' },
        costo_unitario: { type: Number, default: 0 },
      },
    ],
    default: [],
  })
  ingredientes?: { nombre: string; cantidad: number; unidad: string; costo_unitario: number }[];

  @Prop({ type: Number, default: 0 })
  costo_receta?: number;

  @Prop({ required: true, index: true })
  restaurant_id!: number;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const ProductoSchema = SchemaFactory.createForClass(Producto);
ProductoSchema.index({ restaurant_id: 1, sku: 1 }, { unique: true });
ProductoSchema.index({ restaurant_id: 1, nombre: 1 });
