import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProveedorDocument = HydratedDocument<Proveedor>;

@Schema({ collection: 'proveedores', timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Proveedor {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, trim: true })
  nombre!: string;

  @Prop({ type: String, default: null })
  contacto?: string | null;

  @Prop({ type: String, default: null })
  telefono?: string | null;

  @Prop({ type: String, default: null })
  email?: string | null;

  @Prop({ type: String, default: null })
  direccion?: string | null;

  @Prop({ type: [Number], default: [] })
  productos_ids?: number[];

  @Prop({ required: true, index: true })
  restaurant_id!: number;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;
}

export const ProveedorSchema = SchemaFactory.createForClass(Proveedor);
ProveedorSchema.index({ restaurant_id: 1, nombre: 1 });
