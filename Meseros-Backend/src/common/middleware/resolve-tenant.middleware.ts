import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Response, NextFunction } from 'express';
import type { Model } from 'mongoose';
import { Restaurante } from '../db/schemas/restaurante.schema';
import type { RequestWithTenant } from '../types/request-with-tenant';

@Injectable()
export class ResolveTenantMiddleware implements NestMiddleware {
  private cacheNameToId = new Map<string, number>();

  constructor(@InjectModel(Restaurante.name) private readonly restaurantes: Model<Restaurante>) {}

  private async getFirstRestaurantId(): Promise<number | null> {
    const doc = await this.restaurantes.findOne({}, { id: 1 }).sort({ id: 1 }).lean<{ id: number }>().exec();
    return doc?.id ?? null;
  }

  private async fetchByName(nombre: string | null | undefined): Promise<number | null> {
    if (!nombre) return null;
    if (this.cacheNameToId.has(nombre)) return this.cacheNameToId.get(nombre) ?? null;
    const doc = await this.restaurantes
      .findOne({ nombre }, { id: 1 })
      .lean<{ id: number }>()
      .exec();
    const id = doc?.id ?? null;
    if (id) this.cacheNameToId.set(nombre, id);
    return id;
  }

  async use(req: RequestWithTenant, res: Response, next: NextFunction) {
    // Resolver usuario actual opcionalmente desde cabecera (simple, sin auth)
    const uid = (req.headers['x-usuario-id'] as string | undefined) || (req.headers['x-user-id'] as string | undefined);
    if (uid && Number(uid) > 0) {
      req.userId = Number(uid);
    }

    const headerId =
      (req.headers['x-restaurant-id'] as string | undefined) ||
      (req.headers['restaurant-id'] as string | undefined);
    if (headerId && Number(headerId) > 0) {
      req.restaurantId = Number(headerId);
      return next();
    }

    // If you later add auth, you may have req.user
    const userRest = (req as any).user?.restaurante || (req as any).user?.restaurant || null;

    try {
      const rid = await this.fetchByName(userRest);
      if (rid) {
        req.restaurantId = rid;
        return next();
      }
      const firstId = await this.getFirstRestaurantId();
      if (firstId) req.restaurantId = firstId;
      return next();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('❌ Error resolviendo restaurante:', err);
      return res.status(500).json({ error: 'Error resolviendo restaurante' });
    }
  }
}
