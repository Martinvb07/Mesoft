import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsuarioDocument = HydratedDocument<Usuario>;

@Schema({
  collection: 'usuarios',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Usuario {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, trim: true, lowercase: true, index: true, unique: true })
  correo!: string;

  @Prop({ required: true })
  contrasena!: string;

  @Prop({ default: 'mesero' })
  rol?: string;

  @Prop({ type: String, default: null })
  nombre?: string | null;

  @Prop({ type: String, default: null })
  restaurante?: string | null;

  @Prop({ type: String, default: null })
  restaurant?: string | null;

  @Prop({ type: Number, index: true, default: null })
  restaurant_id?: number | null;

  @Prop()
  created_at?: Date;

  @Prop()
  updated_at?: Date;

  // allow extra fields without breaking
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}

export const UsuarioSchema = SchemaFactory.createForClass(Usuario);
UsuarioSchema.index({ id: 1 }, { unique: true });
UsuarioSchema.index({ correo: 1 }, { unique: true });
