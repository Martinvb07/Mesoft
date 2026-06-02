import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Review } from '../common/db/schemas/review.schema';

@Controller(['public/:restaurantId/reviews', 'api/public/:restaurantId/reviews'])
export class ReviewsController {
  constructor(
    @InjectModel(Review.name) private readonly reviews: Model<Review>,
    private readonly ids: IdService,
  ) {}

  @Post()
  async crearReview(
    @Param('restaurantId') restaurantId: string,
    @Body() body: any,
  ) {
    const rid = Number(restaurantId);
    const { producto_id, estrellas, comentario } = body || {};
    if (!producto_id || !estrellas) return { ok: false, error: 'producto_id y estrellas requeridos' };
    const stars = Math.min(5, Math.max(1, Number(estrellas)));
    const id = await this.ids.next('reviews');
    await this.reviews.create({
      id, restaurant_id: rid, producto_id: Number(producto_id),
      estrellas: stars, comentario: comentario || null,
    });
    return { ok: true };
  }

  @Get()
  async listarReviews(
    @Param('restaurantId') restaurantId: string,
    @Query() query: any,
  ) {
    const rid = Number(restaurantId);
    const filter: any = { restaurant_id: rid };
    if (query.producto_id) filter.producto_id = Number(query.producto_id);
    const rows = await this.reviews
      .find(filter, { _id: 0, id: 1, producto_id: 1, estrellas: 1, comentario: 1, fecha: 1 })
      .sort({ fecha: -1 })
      .limit(100)
      .lean()
      .exec();

    // Agrupar por producto_id con promedio
    const grouped: Record<number, { promedio: number; total: number; reviews: any[] }> = {};
    for (const r of rows as any[]) {
      if (!grouped[r.producto_id]) grouped[r.producto_id] = { promedio: 0, total: 0, reviews: [] };
      grouped[r.producto_id].reviews.push(r);
      grouped[r.producto_id].total++;
    }
    for (const pid of Object.keys(grouped)) {
      const g = grouped[Number(pid)];
      g.promedio = g.reviews.reduce((s: number, r: any) => s + r.estrellas, 0) / g.total;
      g.promedio = Math.round(g.promedio * 10) / 10;
    }
    return query.producto_id
      ? grouped[Number(query.producto_id)] ?? { promedio: 0, total: 0, reviews: [] }
      : grouped;
  }
}
