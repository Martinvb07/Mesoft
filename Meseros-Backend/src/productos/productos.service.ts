import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import { IdService } from '../common/db/id.service';
import { Producto } from '../common/db/schemas/producto.schema';

function mapRow(r: any) {
  return {
    id: r.id,
    sku: r.sku || `SKU-${r.id}`,
    nombre: r.nombre,
    categoria: r.categoria || r.descripcion || '',
    costo: Number(r.costo ?? 0),
    precio: Number(r.precio ?? 0),
    stock: Number(r.stock ?? 0),
    minStock: Number(r.min_stock ?? r.minStock ?? 0),
    activo: r.activo == null ? true : Boolean(r.activo),
    createdAt: r.created_at || r.createdAt || null,
    updatedAt: r.updated_at || r.updatedAt || null,
  };
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectModel(Producto.name) private readonly productos: Model<Producto>,
    private readonly ids: IdService,
  ) {}

  async listarProductos(rid: number, query: any) {
    const q = (query.q || '').toString().trim();
    const categoria = (query.categoria || '').toString().trim();
    const estado = (query.estado || 'todos').toString();
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(query.pageSize, 10) || 20));
    const allowedSort = new Set(['nombre', 'precio', 'costo', 'stock', 'min_stock', 'sku', 'categoria', 'updated_at', 'created_at']);
    const sortBy = allowedSort.has((query.sortBy || '').toString()) ? query.sortBy : 'nombre';
    const sortDir = (query.sortDir || 'asc').toString().toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const filter: any = { restaurant_id: rid };
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ nombre: rx }, { sku: rx }, { categoria: rx }, { descripcion: rx }];
    }
    if (categoria) filter.categoria = categoria;
    if (estado === 'activos') filter.activo = true;
    else if (estado === 'inactivos') filter.activo = false;

    const sortFieldMap: Record<string, string> = {
      nombre: 'nombre',
      precio: 'precio',
      costo: 'costo',
      stock: 'stock',
      min_stock: 'min_stock',
      sku: 'sku',
      categoria: 'categoria',
      updated_at: 'updated_at',
      created_at: 'created_at',
    };
    const sortField = sortFieldMap[String(sortBy)] || 'nombre';
    const sortDirNum = sortDir === 'DESC' ? -1 : 1;

    try {
      const total = await this.productos.countDocuments(filter).exec();
      const docs = await this.productos
        .find(filter, { _id: 0, __v: 0 })
        .sort({ [sortField]: sortDirNum, id: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean<any[]>()
        .exec();
      return { items: docs.map(mapRow), meta: { total, page, pageSize } };
    } catch (err: any) {
      throw new HttpException({ error: err?.message || 'DB error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async crearProducto(rid: number, body: any) {
    const { sku, nombre, categoria, costo, precio, stock, minStock, activo, descripcion } = body || {};
    if (!nombre || String(nombre).trim().length === 0) {
      throw new HttpException({ error: 'Nombre es requerido' }, HttpStatus.BAD_REQUEST);
    }
    const p = isNaN(Number(precio)) ? 0 : Number(precio);
    const c = isNaN(Number(costo)) ? 0 : Number(costo);
    const st = Number.isFinite(Number(stock)) ? Number(stock) : 0;
    const ms = Number.isFinite(Number(minStock)) ? Number(minStock) : 0;
    const act = activo == null ? 1 : activo ? 1 : 0;
    const cat = (categoria || '').trim();
    const desc = (descripcion || '').trim();
    if (p < 0 || c < 0) throw new HttpException({ error: 'Precios y costos no pueden ser negativos' }, HttpStatus.BAD_REQUEST);
    if (st < 0 || ms < 0) throw new HttpException({ error: 'Stock y mínimo no pueden ser negativos' }, HttpStatus.BAD_REQUEST);
    if (!sku || String(sku).trim().length === 0) throw new HttpException({ error: 'SKU es requerido' }, HttpStatus.BAD_REQUEST);

    try {
      const id = await this.ids.next('productos');
      await this.productos.create({
        id,
        sku: String(sku).trim(),
        nombre: nombre.trim(),
        categoria: cat,
        costo: c,
        precio: p,
        stock: st,
        min_stock: ms,
        activo: !!act,
        descripcion: desc,
        restaurant_id: rid,
      });
      return { id, sku: String(sku).trim(), nombre: nombre.trim(), categoria: cat, costo: c, precio: p, stock: st, minStock: ms, activo: !!act, descripcion: desc };
    } catch (err: any) {
      if (String(err?.code || '') === '11000') {
        throw new HttpException({ error: 'SKU ya existe para este restaurante' }, HttpStatus.CONFLICT);
      }
      throw new HttpException({ error: err?.message || 'DB error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async actualizarProducto(rid: number, id: string, body: any) {
    const { sku, nombre, categoria, costo, precio, stock, minStock, activo, descripcion } = body || {};
    if (!id) throw new HttpException({ error: 'ID requerido' }, HttpStatus.BAD_REQUEST);

    const values = [
      sku || null,
      nombre?.trim() || '',
      (categoria || '').trim(),
      isNaN(Number(costo)) ? 0 : Number(costo),
      isNaN(Number(precio)) ? 0 : Number(precio),
      Number.isFinite(Number(stock)) ? Number(stock) : 0,
      Number.isFinite(Number(minStock)) ? Number(minStock) : 0,
      activo == null ? 1 : activo ? 1 : 0,
      (descripcion || '').trim(),
    ];
    if (values[3] < 0 || values[4] < 0) throw new HttpException({ error: 'Precios y costos no pueden ser negativos' }, HttpStatus.BAD_REQUEST);
    if (values[5] < 0 || values[6] < 0) throw new HttpException({ error: 'Stock y mínimo no pueden ser negativos' }, HttpStatus.BAD_REQUEST);
    if (!values[0] || String(values[0]).trim().length === 0) throw new HttpException({ error: 'SKU es requerido' }, HttpStatus.BAD_REQUEST);

    try {
      const updated = await this.productos
        .findOneAndUpdate(
          { id: Number(id), restaurant_id: rid },
          {
            $set: {
              sku: String(values[0]).trim(),
              nombre: String(values[1]).trim(),
              categoria: String(values[2]).trim(),
              costo: Number(values[3]),
              precio: Number(values[4]),
              stock: Number(values[5]),
              min_stock: Number(values[6]),
              activo: Boolean(values[7]),
              descripcion: String(values[8]).trim(),
            },
          },
          { new: true },
        )
        .lean<any>()
        .exec();

      if (!updated) throw new HttpException({ error: 'Producto no encontrado' }, HttpStatus.NOT_FOUND);
      return mapRow(updated);
    } catch (err: any) {
      if (String(err?.code || '') === '11000') {
        throw new HttpException({ error: 'SKU ya existe para este restaurante' }, HttpStatus.CONFLICT);
      }
      throw new HttpException({ error: err?.message || 'DB error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async eliminarProducto(rid: number, id: string) {
    if (!id) throw new HttpException({ error: 'ID requerido' }, HttpStatus.BAD_REQUEST);
    try {
      await this.productos.deleteOne({ id: Number(id), restaurant_id: rid }).exec();
      return { success: true };
    } catch (err: any) {
      throw new HttpException({ error: err?.message || 'DB error' }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
