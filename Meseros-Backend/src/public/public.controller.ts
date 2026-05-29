import { Controller, Get, Param } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { Producto } from '../common/db/schemas/producto.schema';
import { Restaurante } from '../common/db/schemas/restaurante.schema';

@Controller(['public', 'api/public'])
export class PublicController {
  constructor(
    @InjectModel(Producto.name) private readonly productos: Model<Producto>,
    @InjectModel(Restaurante.name) private readonly restaurantes: Model<Restaurante>,
  ) {}

  @Get(':restaurantId/menu')
  async getMenu(@Param('restaurantId') restaurantId: string) {
    const rid = Number(restaurantId);

    const restaurante = await this.restaurantes
      .findOne({ id: rid }, { _id: 0, id: 1, nombre: 1 })
      .lean<{ id: number; nombre: string }>()
      .exec();

    const productos = await this.productos
      .find(
        { restaurant_id: rid, activo: true },
        { _id: 0, id: 1, nombre: 1, descripcion: 1, precio: 1, categoria: 1, sku: 1 },
      )
      .sort({ categoria: 1, nombre: 1 })
      .lean<any[]>()
      .exec();

    // Agrupar por categoría
    const catMap = new Map<string, any[]>();
    for (const p of productos) {
      const cat = p.categoria || 'General';
      if (!catMap.has(cat)) catMap.set(cat, []);
      catMap.get(cat)!.push(p);
    }

    const categorias = Array.from(catMap.entries()).map(([nombre, prods]) => ({
      nombre,
      productos: prods,
    }));

    return {
      restaurante: restaurante ?? { id: rid, nombre: 'Restaurante' },
      categorias,
    };
  }
}
