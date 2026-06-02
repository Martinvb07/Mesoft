import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ collection: 'reviews', timestamps: { createdAt: 'fecha' } })
export class Review {
  @Prop({ required: true, unique: true, index: true })
  id!: number;

  @Prop({ required: true, index: true })
  restaurant_id!: number;

  @Prop({ required: true, index: true })
  producto_id!: number;

  @Prop({ required: true, min: 1, max: 5 })
  estrellas!: number;

  @Prop({ type: String, default: null })
  comentario?: string | null;

  @Prop()
  fecha?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ restaurant_id: 1, producto_id: 1 });
